var MD = require('./md');
var HTML = require('./html');

function ModelCollection(namespace, baseLink){

	this.FieldType = {
		UUID 	: "uuid",
		String  : "string",
		Number  : "int32",
		Bool    : "int8",
		Int8    : "int8",
		Int16   : "int16",
		Int32   : "int32",
		Int64   : "int64",
		Password : "password"
	};

	var _models = {};
	var _events = {};

	function _contrainsPrimaryKey(fields) {
		for(var fieldName in fields) {
			if(fields[fieldName].isPrimaryKey === true) {
				return true;
			}
		}
		return false;
	}

	function pushModels(newModels, callback) {
		var models = null;

		try{

			if(typeof newModels == 'string') {
				models = JSON.parse(newModels);
			} else if(typeof newModels == 'object') {
				models = newModels;
			}

			for(var key in models) {
				var model = models[key];

				if(!model.fields) {
					callback("fail", "error or undefined fields option in " + key + " model");
					return ;
				} else if(!_contrainsPrimaryKey(model.fields)) {
					callback("fail", "isPrimaryKey should be set in " + key + "'s fields");
					return ;
				}

				if(!model.singular) {
					model.singular = key;
				}

				if(!model.plural) {
					model.plural = model.singular + 's';
				}

				if(!_models[key]) {
					_models[key] = {};
				} else {
					console.warn("model " + key + " is override")
				}

				for(var opt in model) {
					_models[key][opt] = model[opt];
				}
			}

			callback("success");
		} catch(e){
			console.error(e);
	        callback("fail", e);
		}
	}

	function _httpResponse(res, callback){
		var buffers = [], size = 0;
		
		res.on('data', function(buffer) {
			buffers.push(buffer);
			size += buffer.length;
		});
		
		res.on('end', function() {		    		
			var buffer = new Buffer(size), pos = 0;
			for(var i = 0, l = buffers.length; i < l; i++) {
				buffers[i].copy(buffer, pos);
				pos += buffers[i].length;
			}
			if(size == 0){
				callback('fail', 500, res);
				return ;
			}	
			if(res.headers['content-encoding'])
			if(res.headers['content-encoding'].indexOf('gzip') != -1) {
				var zlib = require('zlib');
				// 解压gzip
				zlib.gunzip(buffer, function (err, decoded) {
					pushModels(decoded.toString(), callback)
	            });
				return;
			}

			//console.log(buffer.toString());
			pushModels(buffer.toString(), callback);			
		});
	};

	function loadHttp(url, callback) {
		var op = require('url').parse(url);
		var http = require('http');

		http.get(op, function(res) {
			if(res.statusCode >= 300 && res.statusCode < 400) {
				op.path = res.headers.location;
				http.get(op, function(res){
					if(res.statusCode < 300) {
						_httpResponse(res, callback);
					} else {
						callback("fail", 'get page error', http);
					}
				});
			} else if(res.statusCode < 300) {
				_httpResponse(res, callback);
			} else {
				callback("fail", res.statusCode, null);
			}
	    }).on('error', function(e) {
	        console.log("Got error: " + e.message);
	        callback("fail", e.message, http);
	    });
	}

	this.addModels = function(models, callback) {
		if(typeof models == "object") {
			pushModels(models, callback);
		} else if(typeof models == "string" && (/^http/).test(models)) {
			loadHttp(models, callback);
		} else if(typeof models == "string") {
			try{
				var fs = require('fs');
				var str = fs.readFileSync(models, 'utf-8');  
				pushModels(str, callback);
			} catch(e) {
				callback('fail', e.message);
			}
		}
	}

	this.addModelEvents = function(modelName, modelEvents) {
		modelEvents.setOpts({"namespace" : namespace, "model" : _models[modelName]});
		modelEvents.init&&modelEvents.init();
		_events[modelName] = modelEvents;
	}

	this.getModelEvents = function() {
		return _events;
	}

	this.getModels = function() {
		return _models;
	}

	function _clearTail(str) {
		return str.replace(/,\r\n$/, "\r\n");
	}

	function _getOpt(model, optName) {
		if(typeof model[optName] != 'undefined') {
			return '		"' + optName + '" : ' + JSON.stringify(model[optName]) + ',\r\n';
		}
		return '';
	}

	this.toString = function() {
		var txt = "{\r\n";

		for(var key in _models) {
			txt += '	"' + key + '" : {\r\n';
			var model = _models[key];
			txt += _getOpt(model, "title");
			txt += _getOpt(model, "singular");
			txt += _getOpt(model, "plural");
			txt += _getOpt(model, "table_name");
			txt += _getOpt(model, "description");

			txt += '		"fields" : {\r\n';
			for(var field in model.fields) {
				txt += '			"' + field + '" : ' + JSON.stringify(model.fields[field])  + ',\r\n';
			}
			txt = _clearTail(txt);
			txt += '		}\r\n';

			txt += "	},\r\n";

		}

		txt = _clearTail(txt);
		txt += "}";

		return txt;
	}

	this.getMDObject = function() {
		return new MD(_models, namespace, baseLink);
	}

	this.getNamespace = function() {
		return namespace;
	}

	this.getBaseLink = function() {
		return baseLink;
	}

	this.getModel = function(modelName) {
		return _models[modelName];
	}

	this.getHTML = function() {
		var md = this.getMDObject().toString();
		var html = new HTML(md);
		return html;
	}

	this.registerRFDL = function(app) {
	    var router = namespace;
	    console.log(router);
	    var _this = this;
	    app.get(router, function(req, res){
			if(req.query.rfdl == "html"){
			    res.send(_this.getHTML().render());
			} else if(req.query.rfdl == "md") {
				res.send(_this.getMDObject().toString());
			}  else if(req.query.rfdl == "json") {
				res.send(_this.toString());
			}else {
			    res.status(405);
			}
	    });
	}
}

module.exports = ModelCollection;