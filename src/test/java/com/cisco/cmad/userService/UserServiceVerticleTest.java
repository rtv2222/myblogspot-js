package com.cisco.cmad.userService;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

import io.vertx.core.Vertx;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.eventbus.MessageConsumer;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.unit.Async;
import io.vertx.ext.unit.TestContext;
import io.vertx.ext.unit.junit.VertxUnitRunner;

@RunWith(VertxUnitRunner.class)
public class UserServiceVerticleTest {

  private Vertx vertx;

  @Before
  public void setUp(TestContext context) {
    vertx = Vertx.vertx();
    vertx.deployVerticle("js:./server.js",
        context.asyncAssertSuccess());
    System.out.println("Verticle deployed");
  }
  
  

  @After
  public void tearDown(TestContext context) {
    vertx.close(context.asyncAssertSuccess());
  }
 

  //@Test
  public void testAuthWithoutPayload(TestContext context) {
    final Async async = context.async();
    
    vertx.createHttpClient().post(8123, "localhost", "/Services/rest/user/auth",
		response -> {
			System.out.println(response.statusCode());
			context.assertTrue(response.statusCode() == 400);
			
			async.complete();
		}
    )
    .setChunked(true)
    .end();
  }
  
  //@Test
  public void testAuthWithInvalidPayload(TestContext context) {
    final Async async = context.async();
    
    vertx.createHttpClient().post(8123, "localhost", "/Services/rest/user/auth",
		response -> {
			System.out.println(response.statusCode());
			context.assertTrue(response.statusCode() == 400);
			
			async.complete();
		}
    )
    .setChunked(true)
    .write("{\"userName\":\"\", \"password\":\"passwd\"}")
    .end();
  }
  
  //@Test
  public void testAuthWithNonExistentUser(TestContext context) {
    final Async async = context.async();
    
    vertx.createHttpClient().post(8123, "localhost", "/Services/rest/user/auth",
		response -> {
			System.out.println(response.statusCode());
			context.assertTrue(response.statusCode() == 401);
			
			async.complete();
		}
    )
    .setChunked(true)
    .write("{\"userName\":\"nouser\", \"password\":\"passwd\"}")
    .end();
  }
  
  //@Test
  public void testAuthWithNonExistentUserOverEventBus(TestContext context) {
    final Async async = context.async();
    EventBus eventBus = vertx.eventBus();
    
    JsonObject nonExistentUser = new JsonObject().put("userName", "user").put("password", "pass");
    
    eventBus.send("com.cisco.cmad.user.authenticate", nonExistentUser, ar -> {
	  if (ar.succeeded()) {
		JsonObject response = new JsonObject(ar.result().body().toString());
		context.assertTrue(response.getInteger("errorCode") == -2);
		async.complete();
	  }
    });
  }
  
  //@Test
  public void testAuthWithInvalidUserOverEventBus(TestContext context) {
    final Async async = context.async();
    EventBus eventBus = vertx.eventBus();
    
    JsonObject nonExistentUser = new JsonObject().put("userName", "").put("password", "pass");
    
    eventBus.send("com.cisco.cmad.user.authenticate", nonExistentUser, ar -> {
	  if (ar.succeeded()) {
		JsonObject response = new JsonObject(ar.result().body().toString());
		context.assertTrue(response.getInteger("errorCode") == -2);
		async.complete();
	  }
    });
  }
  
  @Test
  public void testCreateNewUserAndAuthenticate(TestContext context) {
    final Async async = context.async();
    EventBus eventBus = vertx.eventBus();
    final JsonObject someUser = new JsonObject("{\"userName\":\"bhanush\", \"username\": \"oneuser\", \"password\":\"passwd\",\"firstName\":\"name\", \"lastName\":\"name\"}");
    
    //Create mock event response for dept verticle
    MessageConsumer<String> consumer = eventBus.consumer("com.cisco.cmad.register.company");
    consumer.handler(message -> {
      JsonObject response = new JsonObject().put("companyId", 1).put("deptId", 2).put("siteId", 3);
      message.reply(response);
    });
    
    vertx.createHttpClient().post(8123, "localhost", "/Services/rest/user/register",
		response -> {
			context.assertTrue(response.statusCode() == 201);
			
			//Validate that the auth rest url authenticates with this user and password
			vertx.createHttpClient().post(8123, "localhost", "/Services/rest/user/auth",
				res -> {
					System.out.println(res.statusCode());
					context.assertTrue(res.statusCode() == 201);	
					//Also validate that the event bus says true for this user
					eventBus.send("com.cisco.cmad.user.authenticate", someUser, ar -> {
						  if (ar.succeeded()) {
							JsonObject eventRes = new JsonObject(ar.result().body().toString());
							context.assertEquals(eventRes.getString("userName"), someUser.getString("userName"));
							async.complete();
						  }
					    });
				}
		    )
		    .setChunked(true)
		    .write(someUser.encode())
		    .end();
		}
    )
    .setChunked(true)
    .write(someUser.encode())
    .end();
  }
  
  
}
