const postgres = require("./postgres");

module.exports = {
  getLHRSVersions: function(callback) {

    const sql = `select lhrs_version_title, lhrs_version, "current" from lhrs.lhrs_version order by "current" desc, lhrs_version_title desc;`;
    
    const pg = new postgres();
    pg.selectAll(sql, result => {
      callback(result);
    });
  },
  getLHRSByXY: function(obj, callback) {
    const lhrsVersion = obj.version;
    const snappingDistance = obj.snappingDistance;
    const long = obj.long;
    const lat = obj.lat;

    const sql = `SELECT * FROM postgisftw.lhrs_by_xy($1,$2,$3,$4);`;
    var values = [lhrsVersion,snappingDistance,long,lat];

    const pg = new postgres();
    pg.selectFirstWithValues(sql,values, result => {
      callback(result);
    });
  },
  getLHRSByBPoint: function(obj, callback) {
    const lhrsVersion = obj.version;
    const snappingDistance = obj.snappingDistance;
    const basepoint = obj.basepoint;
    const offset = obj.offset;

    const sql = `SELECT * FROM postgisftw.lhrs_by_bpoint($1,$2,$3,$4);`;
    var values = [lhrsVersion,snappingDistance,basepoint,offset];

    const pg = new postgres();
    pg.selectFirstWithValues(sql,values, result => {
      callback(result);
    });
  },
  getLHRSByMDistance: function(obj, callback) {
    const lhrsVersion = obj.version;
    const snappingDistance = obj.snappingDistance;
    const hwy = obj.hwy;
    const distance = obj.distance;

    const sql = `SELECT * FROM postgisftw.lhrs_by_m_distance($1,$2,$3,$4);`;
    var values = [lhrsVersion,snappingDistance,hwy,distance];

    const pg = new postgres();
    pg.selectFirstWithValues(sql,values, result => {
      callback(result);
    });
  },
  getLHRSLinearByMDistance: function(obj, callback) {
    const lhrsVersion = obj.version;
    const snappingDistance = obj.snappingDistance;
    const hwy = obj.hwy;
    const fromDistance = obj.fromDistance;
    const toDistance = obj.toDistance;

    const sql = `SELECT * FROM postgisftw.lhrs_linear_by_m_distance($1,$2,$3,$4,$5);`;
    var values = [lhrsVersion,snappingDistance,hwy,fromDistance,toDistance];

    const pg = new postgres();
    pg.selectFirstWithValues(sql,values, result => {
      callback(result);
    });
  },
};
