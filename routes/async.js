var express = require("express");
//var router = express.Router();
var routerPromise = require("express-promise-router");
const common = require("../helpers/common");
const search = require("../helpers/search");

const routeWait = new routerPromise();

/* GET users listing. */
routeWait.get("/", function(req, res, next) {
  res.send("respond with a resource");
});

// SEARCH
routeWait.get("/search", async function(req, res, next) {
  const keywords = req.query.q;
  const limit = req.query.limit;
  const type = req.query.type;

  if (!common.isHostAllowed(req, res)) return;
  await search.search(keywords, type, limit, async result => {
    if (result === undefined) await res.send(JSON.stringify([]));
    res.send(JSON.stringify(result));
  });
});


module.exports = routeWait;
