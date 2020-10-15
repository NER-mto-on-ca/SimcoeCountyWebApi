var express = require("express");
var router = express.Router();
var routerPromise = require("express-promise-router");
var feedback = require("../helpers/feedback");
var appStats = require("../helpers/appStats");
const fetch = require("node-fetch");
const config = require("../config.json");
const geometry = require("../helpers/geometry");
const lhrs = require("../helpers/lhrs");
const reports = require("../helpers/reports");
const myMaps = require("../helpers/myMaps");
const streetAddresses = require("../helpers/streetAddresses");
const search = require("../helpers/search");
const common = require("../helpers/common");
const weather = require("../helpers/weather");

var request = require("request");

const routeWait = new routerPromise();

/* GET home page. */
router.get("/", function(req, res, next) {
    let reports = [
        {"title": "PAR Report", "preview":"parReportPreview", "report":"parReport"}
    ];
    res.send(JSON.stringify(reports));
   
  });

  // REPORT - PAR
router.post("/parReport", function(req, res, next) {
    if (!common.isHostAllowed(req, res)) return;
  
    // GET PAR REPORT
    reports.getPARReport(req.body, result => {
      res.download(result,'PAR_REPORT.xlsx'); 
    });
  });
  // REPORT SUMMARY - PAR 
router.post("/parReportPreview", function(req, res, next) {
    if (!common.isHostAllowed(req, res)) return;
  
    // GET PAR REPORT SUMMARY
    reports.getPARReportSummary(req.body, result => {
      res.send(JSON.stringify(result));
    });
  });
module.exports = router;
// module.exports = routeWait;