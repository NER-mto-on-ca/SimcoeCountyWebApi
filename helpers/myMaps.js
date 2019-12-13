const postgres = require("./postgres");
const common = require("./common");

module.exports = {
  insertMyMaps: function(json, callback) {
    console.log("Add My Maps");
    // FORMAT THE DATE
    var dtString = common.getSqlDateString(new Date());

    // BUILD SQL
    var insertSql = `INSERT INTO web_search.tbl_mymaps (json,date_created)
    values ('${JSON.stringify(json)}','${dtString}') RETURNING id;`;

    // INSERT RECORD
    const pg = new postgres({ dbName: "tabular" });
    pg.insertWithReturnId(insertSql, id => {
      callback(id);
    });
  },

  getMyMaps: function(id, callback) {
    console.log("Get My Maps");
    var sql = `select * from web_search.tbl_mymaps  where id = '${id}'`;
    const pg = new postgres({ dbName: "tabular" });
    pg.selectFirst(sql, result => {
      callback(result);
    });
  }
};
