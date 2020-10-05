var express = require("express");
var router = express.Router();

/* GET users listing. */
router.get("/", function(req, res, next) {
  res.send("respond with a resource");
});

router.get("/test", function(req, res, next) {
  console.log("test");
  res.send("respond with a resource");
});
//Get user - accepts ID, returns user object (id, username, email)
//Save Map - accept json object, return true/false for success or fail
//Get Map - accepts user id, returns json object
module.exports = router;
