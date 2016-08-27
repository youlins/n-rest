
exports.connect = function(key) {

	var opts = {};
	var database = {};
	var autoIncrNumber = 0;

	function handleError (err) {
		if (err) {			
			
		}
	}

	function reconnect() {

	}

	reconnect();

	this.select = function(table, cases, callback) {
		var output = [];
		var tableData  = database[table];

		for(var item in tableData) {
			output.push(tableData[item]);
		}

		callback(null, output);
	};

	this.selectByKey = function(table, keys, callback) {
		
		function isMatch(item, keys) {
			for(var key in keys) {
				if(keys[key] != item[key])
					return false; 
			}

			return true;
		}

		var output = [];
		var tableData = database[table];
		for(var item in tableData) {
			if(isMatch(tableData[item], keys))
				output.push(tableData[item])
		}
		
		callback(null, output);
	};

	this.insert = function(table, data, callback) {

		if(!database[table]) {
			database[table] = {};
		}

		var id = data.id;
		if(!id) {
			autoIncrNumber++;
			id = autoIncrNumber;
		}
		database[table][id] = data;

		callback(null, {id:id});
	};

	this.update = function(table, id, data, callback) {

		function copyData(dst, src) {
			if(typeof dst != 'object') {
				return false;
			}

			for(var key in src) {
				src[key] = dst[key];
			}
		}

		if(!database[table]) {
			callback("not found"); 
		} else {
			copyData(database[table][id], data);
			callback(null, database[table][id]);
		}
	};

	this.delete = function(table, id, callback) {

		if(!database[table] || !database[table][id]) {
			callback("not found"); 
		} else {
			delete database[table][id];
			callback(null);
		}
	};
};