const postgres = require("./postgres");
const common = require("./common");
const fetch = require("node-fetch");
const searchConfig = require("./searchConfig.json");

const viewBox = searchConfig.OSMViewBox;
const useESRIGeocoder = searchConfig.useESRIGeocoder;
const useOSMSearch = searchConfig.useOSMSearch;

const geocodeUrlTemplate = (limit, keywords) =>
  `https://maps.simcoe.ca/arcgis/rest/services/SimcoeUtilities/AddressLocator/GeocodeServer/findAddressCandidates?f=json&countrycodes=ca&maxLocations=${limit}&outFields=House,StreetName,SufType,City&Street=${keywords}`;
const osmUrlTemplateViewBox = (viewBox, limit, keywords) => `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=ca&viewbox=${viewBox}&bounded=1&limit=${limit}&q=${keywords}`;

module.exports = {
  search: async function(keywords, type = undefined, limit = 10, callback) {
    // MINIMUM 1 CHAR
    if (keywords.length < 2) {
      callback([]);
      return;
    }

    // FIRST PART IS NUMBER, ASSUME ADDRESS
    let allValues = [];
    let results = [];
    //run default search
    results = await this._search(keywords, type, limit);
    allValues.push(...results);
    

    // // FILL IN THE SEARCH WITH OSM, ONLY IF NO RESULTS
    if ((useOSMSearch && allValues.length === 0) || type === "Open Street Map" || (allValues.length === 0 && type === "All")) {
      const numRecordsToReturn = limit - allValues.length;
      let osmPlaces = await this._searchOsm(keywords, type, numRecordsToReturn);
      allValues.push(...osmPlaces);
    }

    callback(allValues);
  },

  searchById: function(id, callback) {
    const values = [id];
    const sql = `select *, search.title as name  from web_search.tbl_search_ts_mv search where id = $1;`;
    const pg = new postgres();
    pg.selectAllWithValues(sql, values, result => {
      callback(result[0]);
    });
  },

  getSearchTypes: function(callback) {
    const sql = "select type from web_search.tbl_search_layers order by type";
    const pg = new postgres();
    pg.selectAll(sql, result => {
      let types = [];
      result.forEach(type => {
        types.push(type.type);
      });
      callback(types);
    });
  },

  _search: async function(value,  type = undefined, limit = 10) {
    if (type === "All" || type === "undefined" || type === undefined) type = "ALL";
    const values = [value,type,limit];
    let sqlSelect = `SELECT title as "name", description, type, id, 1 AS rank`;
      let sqlFrom = `FROM web_search.tbl_search_ts_mv`;
      let sqlWhere = `WHERE title ilike $1 || '%'`;
      let sqlOrder = `ORDER BY "name"`;
      let sqlLimit = `LIMIT $3;`;
    //QUICK SEARCH FOR SHORT STRINGS
    if (value.length < 5) {
      sqlSelect = `SELECT title as "name", description, type, id, 1 AS rank`;
      sqlFrom = `FROM web_search.tbl_search_ts_mv`;
      sqlWhere = `WHERE (title ilike $1 || '%')`;
      sqlOrder = `ORDER BY "name"`;
      sqlLimit = `LIMIT $3;`;
    }else{
      sqlSelect = `SELECT title as "name", description, type, id, 
      CASE WHEN title ilike $1 || '%' 
        THEN 1 WHEN title ilike '%' || $1 || '%' 
        THEN 0.9 WHEN description ilike '%' || $1 || '%' 
        THEN 0.8 ELSE ts_rank_cd(ts, query) END AS rank`;
      sqlFrom = `FROM web_search.tbl_search_ts_mv, to_tsquery_partial($1) query`;
      sqlWhere = `WHERE (ts @@ query OR title ilike '%' || $1 || '%' OR description ilike '%' || $1 || '%')`;
      sqlOrder = `ORDER BY rank DESC, "name"`;
      sqlLimit = `LIMIT $3;`;
    }


    if (type !== undefined && type !== "undefined") {
      sqlWhere += " AND (type = $2 OR 'ALL' = $2) ";
    }

    let sql = [sqlSelect, sqlFrom,sqlWhere,sqlOrder,sqlLimit].join(" ");
    //console.log(sql);
    const pg = new postgres();
    const pgResult = await pg.selectAllWithValuesWait(sql, values);
    return pgResult;
  },

  _searchOsm: async function(keywords, type = undefined, limit = 10) {
    if (type === "undefined") type = undefined;
    console.log(type);
    if (type !== "All" && type !== "Open Street Map") return [];

    console.log("in OSM");
    let osmUrl = osmUrlTemplateViewBox(viewBox, limit, keywords);
    let osmResult = await this._getJSON(osmUrl);
    let osmPlaces = [];
    if (osmResult !== undefined && osmResult.length > 0) {
      osmResult.forEach(osm => {
        let city = "";
        if (osm.address.city !== undefined) city = osm.address.city;
        else city = osm.address.town;
        const searchObj = {
          name: osm.display_name,
          type: this._toTitleCase(osm.type + " - Open Street Map"),
          municipality: this._toTitleCase(city),
          location_id: null,
          x: osm.lon,
          y: osm.lat,
          place_id: osm.place_id
        };
        osmPlaces.push(searchObj);
      });
    } 
    return osmPlaces;
  },



  async _getJSON(url, callback) {
    try {
      const response = await fetch(url);
      const json = await response.json();
      return json;
    } catch (error) {
      console.log(error);
    }
  },

  _toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }
};
