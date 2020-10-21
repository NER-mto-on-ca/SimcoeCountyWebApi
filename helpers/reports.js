const postgres = require("./postgres");
const Excel = require('exceljs');
const uuidv4 = require("uuid/v4");
const reportConfig = require("./reportsConfig.json");


module.exports = {
  getReport:function(obj,reportName,callback) {
    const geoJSON = obj.geoJSON;
    const srid = obj.srid;
    const buffer = obj.buffer === undefined ? 0 : obj.buffer;
    const reports = reportConfig.reports;
    let report = reports.filter(item => {return item.report === reportName})[0];
    if (!report){
      callback();
      return;
    } 
    let sqlSelect = `SELECT target.*`;
    let sqlFrom =`FROM table as target`;
    let sqlWhere = `WHERE ST_Intersects(target.geom, ST_Buffer(ST_SetSRID(ST_GeomFromGeoJSON($1), $2),$3))`;
    let sqlOrder = `;`;
    const items = report.layers;
    const excludedColumns=reportConfig.excludedColumns;
    let workbook = new Excel.Workbook();
    let processed=0;
    items.forEach(item => {
        sqlFrom = ['FROM', item.table, 'as target'].join(" ");
        sqlWhere = ['WHERE ST_Intersects(st_transform(target.',item.geom_field,', $2::INTEGER), ST_Buffer(ST_SetSRID(ST_GeomFromGeoJSON($1), $2::INTEGER),$3))' ].join("");
        sqlOrder = ['ORDER BY', item.order_field, ';'].join(" ");
        let sql = [sqlSelect, sqlFrom, sqlWhere, sqlOrder].join(" ");
        var values = [geoJSON, parseInt(srid), parseInt(buffer)];
        const pg = new postgres();
        let worksheet = workbook.addWorksheet(item.tab.substr(0, 30),{'orderNo':item.sheet_order});
        pg.selectAllWithValues(sql, values, (result) => {
            //console.log(result);
            if (result.error === undefined && Array.isArray(result)){
              const firstRecord = result[0];
              if (firstRecord !== undefined){
                excludedColumns.forEach(exclude =>{
                  delete firstRecord[exclude];
                });
                worksheet.addRow(Object.keys(firstRecord),1).commit();
              }
              
              //console.log('returned results', result.length);
              result.forEach((data, index) => {
                excludedColumns.forEach(exclude =>{
                  delete data[exclude];
                });
                worksheet.addRow(Object.values(data),index+1).commit();
              });
              //worksheet.addRows(result,'n');
            }
            processed++;
            if (processed === items.length){
              let report_name = uuidv4();
              workbook.xlsx.writeFile( `${__dirname}/../reports/${report_name}.xlsx`).then(()=>{
                callback( `${__dirname}/../reports/${report_name}.xlsx`);
              });
            }
          });
    });
    
  },
  getReportSummary:function(obj,reportName,callback) {
    let output = [];
    const geoJSON = obj.geoJSON;
    const srid = obj.srid;
    const buffer = obj.buffer === undefined ? 0 : obj.buffer;
    const reports = reportConfig.reports;
    let report = reports.filter(item => {return item.report === reportName})[0];
    if (!report){
      callback();
      return;
    } 
    let sqlSelect = `SELECT COUNT(*) as record_count`;
    let sqlFrom =`FROM table as target`;
    let sqlWhere = `WHERE ST_Intersects(target.geom, ST_SetSRID(ST_GeomFromGeoJSON($1), $2))`;
    let sqlOrder = `;`;
    const items = report.layers;

    let processed=0;
    items.forEach(item => {
        sqlFrom = ['FROM', item.table, 'as target'].join(" ");
        sqlWhere = ['WHERE ST_Intersects(st_transform(target.',item.geom_field,', $2::INTEGER), ST_Buffer(ST_SetSRID(ST_GeomFromGeoJSON($1), $2::INTEGER),$3))' ].join("");
        let sql = [sqlSelect, sqlFrom, sqlWhere, sqlOrder].join(" ");
        var values = [geoJSON, parseInt(srid),parseInt(buffer)];
        const pg = new postgres();
        //console.log(sql);
        pg.selectAllWithValues(sql, values, (result) => {
            
            if (result.error === undefined && Array.isArray(result)){
              const firstRecord = result[0];
              if (firstRecord !== undefined){
                output.push({section:item.tab, record_count:firstRecord.record_count, order:item.sheet_order})
              }
            }
            processed++;
            if (processed === items.length){
              callback(output.sort((a,b)=>{
                const orderA = a.order;
                const orderB = b.order;
              
                let comparison = 0;
                if (orderA > orderB) {
                  comparison = 1;
                } else if (orderA < orderB) {
                  comparison = -1;
                }
                return comparison;}));
            }
          });
    });
    
  },


};
