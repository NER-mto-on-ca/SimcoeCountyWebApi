const postgres = require("./postgres");
const common = require("./common");

module.exports = {
  insertAppStat: function(appName, actionType, description) {
    // FORMAT THE DATE
    var dtString = common.getSqlDateString(new Date());

    // BUILD SQL
    var insertSql = `INSERT INTO web_search.tbl_app_stats (app_name,action_type,action_description,action_date) values ($1,$2,$3,$4);`;
    var values = [appName,actionType,description,dtString];
    // INSERT RECORD
    const pg = new postgres({ dbName: "tabular" });
    pg.insert(insertSql,values);
  },

  getAppStats: function(fromDate, toDate, type, callback) {
    //select date_day,total from web_search.get_app_stats('2019-09-01','2019-10-8', 'STARTUP_MAP_LOAD');
    var sql = `select x,y from web_search.get_app_statsxy($1,$2,$3);`;
    var values = [fromDate,toDate,type];
    const pg = new postgres({ dbName: "tabular" });
    pg.selectAllWithValues(sql,values, result => {
      callback(result);
    });
  },

  getAppStatsTypes: function(callback) {
    const sql = "select value as label, value from ((select distinct(action_type) as value from view_app_stats ass where action_type <> '_' order by action_type)) cc";
    const pg = new postgres({ dbName: "tabular" });
    pg.selectAll(sql, result => {
      callback(result);
    });
  }
};
