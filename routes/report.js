var express = require("express");
var router = express.Router();
var routerPromise = require("express-promise-router");
var feedback = require("../helpers/feedback");
var appStats = require("../helpers/appStats");
const fetch = require("node-fetch");
const config = require("../config.json");
const reports = require("../helpers/reports");
const common = require("../helpers/common");
const reportConfig = require("../helpers/reportsConfig.json");


var request = require("request");

const routeWait = new routerPromise();

/* GET home page. */
router.get("/", function(req, res, next) {
    //let reports = [];  
    let reports = reportConfig.reports.map(item =>{
      return {"title": item.title, "preview":"ReportPreview/"+item.report, "report":"Report/"+item.report};
    });
    res.send(JSON.stringify(reports));
   
  });

  // REPORT - PAR
router.post("/Report/:reportName", function(req, res, next) {
    if (!common.isHostAllowed(req, res)) return;
  
    // GET PAR REPORT
    reports.getReport(req.body,req.params.reportName, result => {
      if (!result){
        res.send(JSON.stringify({error:"Invalid Report Selection!"}));
      } else {
        res.download(result,'REPORT.xlsx'); 
      }
    });
  });
  // REPORT SUMMARY - PAR 
router.post("/ReportPreview/:reportName", function(req, res, next) {
    if (!common.isHostAllowed(req, res)) return;
  
    // GET PAR REPORT SUMMARY
    reports.getReportSummary(req.body, req.params.reportName, result => {
      res.send(JSON.stringify(result));
    });
  });
module.exports = router;
// module.exports = routeWait;