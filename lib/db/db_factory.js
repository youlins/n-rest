var mysql = require("./mysql_connection");
var localCache = require("./local_cache");

var connections = {};

exports.createConnection = function(conncectStr) {
	if(connections[conncectStr]) {
		return connections[conncectStr];
	}
	if(conncectStr.indexOf("mysql") == "0") {
		return connections[conncectStr] = new mysql.connect(conncectStr);
	} else if(conncectStr.indexOf("localcache") == "0"){
		return connections[conncectStr] = new localCache.connect(conncectStr);
	} else {
		throw("error db config : " + conncectStr);
	}
};
