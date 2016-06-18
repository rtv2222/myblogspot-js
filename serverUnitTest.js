/**
 * Created by rtv on 6/12/16.
 */
var TestSuite = require("vertx-unit-js/test_suite");
var suite = TestSuite.create("user-mgmt-test-suite");



suite.before(function (context) {
    vertx.deployVerticle("server.js", context.asyncAssertSuccess());
}).beforeEach(function (context) {
    var s = "value";
    context.assertEquals("value", s);
}).after(function (context) {
    var s = "value";
    context.assertEquals("value", s);
}).afterEach(function (context) {
    var eventBus = vertx.eventBus();
    eventBus.send("news.uk.sport", "Yay! Someone kicked a ball across a patch of grass", function (ar, ar_err) {
        if (ar_err == null) {
            console.log("Received reply: " + ar.body());
        }
    });
}).test("user-validation", function (context) {
    var async = context.async();
    var eventBus = vertx.eventBus();
    eventBus.send("com.cisco.cmad.user", "hi", function (ar, ar_err) {
        if (ar_err == null) {
            console.log("Received reply: " + ar.body());
            async.complete();
        }
        else {
            async.fail();
        }
    });
});


suite.run({
    "reporters" : [
        {
            "to" : "console"
        }
    ]
});