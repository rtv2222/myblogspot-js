/**
 * Created by rtv on 5/21/16.
 */
var MongoAuth = require("vertx-auth-mongo-js/mongo_auth"),
    Router = require("vertx-web-js/router"),
    MongoClient = require("vertx-mongo-js/mongo_client"),
    BodyHandler = require("vertx-web-js/body_handler"),

    USERNAME_FIELD = "userName",
    PASSWORD_FIELD = "password",
    COMPANY_FIELD = "companyName",
    DEPT_FIELD = "deptName",
    SITE_FIELD = "siteName",
    SUBDOMAIN_FIELD = "subDomainName",


    DEFAULT_HTTP_PORT = 8123,
    DB_NAME = "users_db",


    router = Router.router(vertx),
    client = MongoClient.createShared(vertx, {db_name: DB_NAME}),
    eventBus = vertx.eventBus(),
    authProperties = {
    },
    authProvider = MongoAuth.create(client, authProperties);

var CONFIGURED_PORT = java.lang.System.getProperty("LISTEN_PORT");
    console.log("Configured port is : "+ CONFIGURED_PORT);
if (CONFIGURED_PORT != undefined && CONFIGURED_PORT != '') {
    console.log("Starting verticle on port "+ CONFIGURED_PORT);
    DEFAULT_HTTP_PORT = parseInt(CONFIGURED_PORT, 10);
}

//Remove salt for now thanks to broken JS Mongo Auth
//https://groups.google.com/forum/?fromgroups#!topic/vertx/AfjHVJy4wtk
authProvider.getHashStrategy().setSaltStyle("NO_SALT");

//Ensure userInfo has the required attribs.
//Username password policy goes in here
function isValidUser(userInfo) {
    if (userInfo !== undefined &&
        userInfo[USERNAME_FIELD] !== undefined && userInfo[USERNAME_FIELD].length != 0 &&
        userInfo[PASSWORD_FIELD] !== undefined && userInfo[PASSWORD_FIELD].length != 0)   {
        return true;
    }
    return false;
}

router.route().handler(BodyHandler.create().handle);

//Does not yet work and hence commented
/*
 authProvider.authenticate(authInfo, function (res, res_err) {
 if (res_err == null) {
 var user = res;
 console.log("Successfully authenticated");
 } else {
 console.log("Failed authentication");
 }
 });
 */


router.post("/Services/rest/user/auth").handler(function (ctx) {
    var response = ctx.response();
    if (ctx.getBodyAsString() === undefined || ctx.getBodyAsString().length == 0) {
        response.setStatusCode(400).end();
        return;
    }

    var jsonRequest = ctx.getBodyAsJson();
    if (!isValidUser(jsonRequest)) {
        response.setStatusCode(400).end();
        return;
    }

    var lookFor = {username: jsonRequest.userName, password: jsonRequest.password};

    client.find("user", lookFor, function (res, res_err) {
        if (res_err == null) {
            var found = false;
            Array.prototype.forEach.call(res, function(json) {
                if (lookFor[PASSWORD_FIELD] === json[PASSWORD_FIELD]) {
                    found = true;
                }
            });
            if (found) {
                response.setStatusCode(201).end();
                return;
            }
        }
        response.setStatusCode(401).end();
    });
});


router.post("/Services/rest/user/register").handler(function (ctx) {

    var response = ctx.response();

    var jsonRequest = ctx.getBodyAsJson();
    if (!isValidUser(jsonRequest)) {
        response.setStatusCode(400);
    }

    authProvider.insertUser(jsonRequest[USERNAME_FIELD], jsonRequest[PASSWORD_FIELD], [], [], function(mongoRes, err) {
        if (mongoRes) {
            eventBus.send("com.cisco.cmad.register.company",
                { companyName: jsonRequest[COMPANY_FIELD], deptName: jsonRequest[DEPT_FIELD], siteName: jsonRequest[SITE_FIELD], subDomain: jsonRequest[SUBDOMAIN_FIELD] },
                function (ar, ar_err) {
                    if (ar_err == null) {
                        console.log("Received reply: " + ar.body());
                        var eventRes = ar.body();
                        var query = {
                            USERNAME_FIELD: jsonRequest[USERNAME_FIELD]
                        };

                        /*
                         {userId: "id", userName: "name", firstName: "name", lastName: "name", companyId: "id", siteId: "id", deptId: "id"}
                         */

                        // Set the author field
                        var update = {
                            "$set": {
                                "company_id": eventRes.companyId,
                                "dept_id": eventRes.deptId,
                                "site_id": eventRes.siteId,
                                "first_name": jsonRequest[ "firstName"],
                                "last_name": jsonRequest["lastName"],
                                "username": jsonRequest["userName"],
                                "email": jsonRequest["email"]
                            }
                        };

                        client.update("users_collection", query, update, function (res, res_err) {
                            if (res_err == null) {
                                // Write to the response and end it
                                response.setStatusCode(201).end();
                            } else {
                                response.setStatusCode(500).end(err);
                            }
                        });
                    }
                })
        }
        else {
            response.setStatusCode(500).end(err);
        }
    });
});


eventBus.consumer("com.cisco.cmad.user.authenticate", function (message) {
    var userInfo = {};
    userInfo.username = message.body()[USERNAME_FIELD];
    userInfo.password = message.body()[PASSWORD_FIELD];

    if (!isValidUser(message.body())) {
        message.reply({errorCode: -2, errorMessage: "Authentication failed"});
    }
    else {
        client.find("user", userInfo, function (res, res_err) {
            if (res_err == null) {
                var found = false,
                    dbResp = undefined;
                Array.prototype.forEach.call(res, function(json) {
                    if (userInfo[PASSWORD_FIELD] === json[PASSWORD_FIELD]) {
                        found = true;
                        dbResp = json;
                    }
                });
                if (found) {
                    var responseEv = {};
                    responseEv[USERNAME_FIELD] = userInfo.username;
                    responseEv["firstName"] = dbResp["first_name"];
                    responseEv["lastName"] = dbResp["last_name"];
                    responseEv["email"] = dbResp["email"];
                    responseEv["userName"] = dbResp["username"];
                    console.log("responding with message: " + JSON.stringify(responseEv));
                    message.reply(responseEv);
                    return;
                }
            }
            message.reply({errorCode: -2, errorMessage: "Authentication failed"});
        });
    }
});

vertx.createHttpServer().requestHandler(router.accept).listen(DEFAULT_HTTP_PORT);

