var mysql = require('mysql');
var sqlConverter = require('./converter');

exports.connect = function(connectionStr) {
	
	var _db = null;

	function handleError (err) {
		if (err) {
			// reconnect if error
			if (err.code === 'PROTOCOL_CONNECTION_LOST') {
				_db = null;
				reconnect();
			} else {
				console.error(err.stack || err);
			}
		}
	}

	function execSqlError(sql, err) {
		console.error("exec sql: " + sql + " : " + err);
	}

	function reconnect() {
		_db = mysql.createConnection(connectionStr);
		_db.connect(handleError);
		_db.on('error', handleError);
	}

	reconnect();

	this.query = function(sql, values, callback) {
		_db.query(sql, values, function(err, result) {
			err&&execSqlError(sql, err);
			callback(err, result);
		});
	}

	this.select = function(table, cases, callback) {
		if(_db == null) {
			callcack("mysql connection is null");
			return ;
		}

		var sqlCount = sqlConverter.cases2CountSql(table, cases);
		var sql = sqlConverter.cases2Sql(table, cases);
		var values = cases && cases.values ? cases.values : [];

		_db.query(sqlCount, values, function(err, countResult) {
			if(err || !countResult){
				execSqlError(sqlCount, err);
				return callback(null, [], 0);
			}

			var count = countResult[0].c;
			_db.query(sql, values,
				function(err, results, fields) {  
			    	if (err) { 
						execSqlError(sql, err);
			      		callback(err);
			      		return ;  
			    	}
			      	callback(null, results, count);
				}  
			); 

		});
		
	};

	this.selectByKey = function(table, keys, callback) {

		var values = [];

		for(var key in keys) {
			values.push(keys[key]);
		}
		
		var sql = sqlConverter.keys2Sql(table, keys);
		_db.query(sql, values, function(err, results) {
			if(err){
				execSqlError(sql, err);
				callback(err);
				return;
			}
			callback(null, results[0]);
		})
	};

	this.insert = function(table, data, callback) {
		if(_db == null) {
			callcack("mysql connection is null");
			return ;
		}

		var values = [];
		var keys   = "";
		var values2 = "";
		for(var key in data) {
			keys += key + ",";
			values2 += "?,";
			values.push(data[key]);
		}

		keys = keys.replace(/,$/,"");
		values2 = values2.replace(/,$/,"");


		var sql = "INSERT INTO " + table + "(" + keys + ") Value (" + values2 + ")";

		_db.query(sql, values,
			function(err, results) {  
		    	if (err) {
		    		execSqlError(sql, err);
		      		callback(err);
		      		return ;  
		    	}
		    	/*{ fieldCount: 0,
					affectedRows: 1,
					insertId: 3,
					serverStatus: 2,
					warningCount: 0,
					message: '',
					protocol41: true,
					changedRows: 0 }
				*/
				var id = results.insertId;
				if(data.id && !results.insertId) {
					id = data.id;
				}

		      	callback(null, {id:id});
			}  
		); 
	};

	this.update = function(table, id, data, callback) {
		if(_db == null) {
			callcack("mysql connection is null");
			return ;
		}

		var values = [];
		var pears   = "";
		for(var key in data) {
			pears += key + " = ?,";
			values.push(data[key]);
		}
		values.push(id);

		var sql = "UPDATE " + table + " SET " + pears.replace(/,$/,"") + " WHERE id = ?";
		var _this = this;

		_db.query(sql, values,
			function(err, results) {  
		    	if (err || results.affectedRows == 0) {
		    		err&&execSqlError(sql, err);
		      		callback(err || "not found");
		      		return ;  
		    	}
		    	/*
		    	{ fieldCount: 0,
				  affectedRows: 1,
				  insertId: 0,
				  serverStatus: 2,
				  warningCount: 0,
				  message: '(Rows matched: 1  Changed: 1  Warnings: 0',
				  protocol41: true,
				  changedRows: 1 }
				*/
				_this.selectByKey(table, {id:id}, callback);
			}  
		); 
	};

	this.delete = function(table, id, callback) {
		if(_db == null) {
			callcack("mysql connection is null");
			return ;
		}
		
		var sql = "DELETE FROM " + table + " WHERE id = ?";
		console.log(sql);

		_db.query(sql, [id],
			function(err, results) {		    	 
		    	if (err || results.affectedRows == 0) { 
		    		err&&execSqlError(sql, err);
		      		callback(err || "not found");
		      		return ;  
		    	}
		      	callback(null, {id:id});
			}  
		); 
	};
}