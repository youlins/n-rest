
var modelSet = {};
var uuid = require('node-uuid');
var moment = require('moment');
var sqlConverter = require('../db/converter');

var ServiceUnavailable = 503;
var BadRequest = 400; 
var Unauthorized = 401; 
var Forbidden = 403; 
var BadMethod = 405; 
var ItemNotFound = 404;

function NodelEvent() {

	var _model = {}, _namespace = '', _version = "";
	var _table = '';//_model.tableName;
	var _baseRouter = '';// + _version + '/' + _namespace;
	var _extendRouter = '';
	var _routers = {get:{}, put:{}, post:{}, delete:{}, action:{}, listAction:{}};
	var length = 100;
	var _db;

	var getListRouter = function(){
		return _baseRouter + _extendRouter + "/" + _model.plural;
	};

	var getSingleRouter = function(){
		return _baseRouter + _extendRouter + "/" + _model.plural + "/:id";
	};

	function getLinks(entityName, id) {
		return [{
			href : _baseRouter + _extendRouter + "/" + entityName + "/" + id,
			rel : "self"
		}];
	}

	function getTitle(data) {
		var item = {};

		for(var key in _model.fields) {
			var col = _model.fields[key];
			if(col.isTitle || col.isPrimaryKey) {
				item[key] = data[key];
			}

			if(col.isPrimaryKey) {
				item["links"] = getLinks(_model.plural, data[key]);
			}
		}

		return item;
	}

	function getDetail(data) {
		var item = {};

		for(var key in _model.fields) {
			var col = _model.fields[key];

			if(col.ignore !== true) {
				item[key] = data[key];
			}

			if(col.isPrimaryKey) {
				item["links"] = getLinks(_model.plural, data[key]);
			} else if(col.isForeignKey) {
				var ref = col.references.split(".");
				var refName = ref[0];
				var idName = ref[1];
				item[refName] = {links : getLinks(refName + "s", data[key])};
				item[refName][idName] = data[key];
				continue;
			}
		}

		return item;
	}

	var _getList = function(req, res, next, callback) {

		if(!_db) {
			res.status(500).send("db config error");
			return;
		}

		var cases= sqlConverter.convert2Cases(req.query);

		_db.select(_table, cases, function(err, datas, totalsize) {
			if(err) {
				res.send({err:err});	
			} else {
				var items = [];
				var filterData = req.path.endsWith("detail") ? getDetail : getTitle;

				for(var i in datas) {
					var data = filterData(datas[i]);
					items.push(data);
				}

				callback(items, totalsize);
				var result = {};
				result[_model.plural] = items;
				result["count"] = totalsize; 
				res.send(result);
			}			
		});
	};

	var _getItemById = function(req, res, next, callback) {

		if(req.params.id == "detail") {
			return next();
		}
		if(!_db) {
			res.status(500).send("db config error");
			return;
		}
		_db.selectByKey(_table, {id:req.params.id}, function(err, data) {
			if(err || !data) {
				res.status(404).send({error:"Not found."});
			} else {
				callback(err, data[0]);
				var result = {};
				result[_model.singular] = data;
				res.send(result);
			}
		});
	};

	var _onAction = function(req, res) {

		if(!_db) {
			res.status(500).send("db config error");
			return;
		}

		for(var action in req.body) {
			if(typeof _routers.action[action] != 'function') {
				return res.status(404).send({error:"error action name"});
			}
		}

		_db.selectByKey(_table, {id:req.params.id}, function(err, data) {
			if(err || !data) {
				return res.status(404).send({err:"Not found record."});
			}

			for(var action in req.body) {
				_routers.action[action](data, req.body[action], res);
				break;
			}
		});
	}

	var _onListAction = function(req, res) {

		if(!_db) {
			res.status(500).send("db config error");
			return;
		}

		for(var action in req.body) {
			if(typeof _routers.listAction[action] != 'function') {
				return res.status(404).send({error:"error action name"});
			}
		}

		for(var action in req.body) {
			if(typeof _routers.action[action] == 'function') {
				_routers.listAction[action](req.body[action], res);
			}
			break;
		}
	}

	this.selectByKey = function(keys, callback) {
		_db.selectByKey(_table, keys, callback);
	}
	
	this.select = function(query, callback) {
		_db.select(_table, query, callback);
	}

	this.insert = function(data, callback) {
		_db.insert(_table, data, callback);
	}

	this.update = function(id, data, callback) {
		_db.update(_table, id, data, callback);
	}

	this.getUUID = function() {
		return uuid.v1();
	}

	this.getTime = function() {
		return new moment().format("YYMMDDHHmmss");
	}
	
	var _delegateHandle = function(handle) {
		var onBeforeLoad = function(){};

		this.on = function(beforeLoad){

			if(typeof beforeLoad == 'function') {
				onBeforeLoad = beforeLoad;
			}

			return this;
		}

		this.httpHandle = function(req, res, next) {			
			handle(req, res, next, onBeforeLoad);
		}
	};

	var delegateGetInstance = new _delegateHandle(_getItemById);
	var delegateGetList = new _delegateHandle(_getList);
	var delegateGetDetail = new _delegateHandle(_getList);

	this.getListRouter = getListRouter;

	this.enableGetter = function(type, callback) {

		var beforeLoad = typeof callback == "function" ? callback : 
						(typeof type == "function" ? type : null);

		if(type === "list") {
			_routers.get[getListRouter()] = delegateGetList.on(beforeLoad).httpHandle;
		} else if(type === "instance"){
			_routers.get[getSingleRouter()] = delegateGetInstance.on(beforeLoad).httpHandle;
		} else if(type === "list_detail"){
			_routers.get[getListRouter() + "/detail"] = delegateGetDetail.on(beforeLoad).httpHandle;
		} else {
			_routers.get[getListRouter()] = delegateGetList.on(beforeLoad).httpHandle;
			_routers.get[getSingleRouter()] = delegateGetInstance.on(beforeLoad).httpHandle;
			_routers.get[getListRouter() + "/detail"] = delegateGetDetail.on(beforeLoad).httpHandle;
		}

		return this;
	};

	this.callPost = function(req, res) {
		var cb = _routers.post[getListRouter()];
		cb&&cb(req, res);
	}

	this.callPut = function(req, res) {
		var cb = _routers.put[getSingleRouter()];
		cb&&cb(req, res);
	}

	this.enablePoster = function(beforeSave, beforeResp) {
		function checkPostData (data) {
			if(typeof data[_model.singular] != 'object') {
				return false;
			}

			if(_model.fields.id.type == "uuid" && data[_model.singular].id == undefined) {
				data[_model.singular].id = uuid.v1();
			}

			for(var key in _model.fields) {
				if(_model.fields[key].type == 'datetime'){
					data[_model.singular][key] = data[_model.singular][key] == undefined ? new moment().format("YYMMDDHHmmss") : data[_model.singular][key];
				}
			}
			return true;
		}

		var _this = this;

		_routers.post[getListRouter()] = function(req, res) {
			if(!_db) {
				res.status(500).send("db config error");
				return;
			}

			if(checkPostData(req.body) == false) {
				res.status(BadRequest).send("unexpected value");
				return;
			}

			function save(isContinue) {

				if(isContinue == false) {
					res.status(Forbidden).send("Forbidden");
					return ;
				}
				_this.insert(req.body[_model.singular], function(err, data) {
					if(err){
						console.log("error " + err);
					}
					beforeResp&&beforeResp(err, data, req.body);

					var result = {};
					result[_model.singular] = data;
					res.send(result);
				});
			}

			if(typeof beforeSave == 'function') {
				beforeSave(req, res, save);
			} else {
				save(true);
			}
		};
		return this;
	};

	this.enablePutter = function(beforeSave, beforeResp) {

		_routers.put[getSingleRouter()] = function(req, res) {
			function save(isContinue) {
				if(isContinue == false) {
					res.status(Forbidden).send("Forbidden");
					return ;
				}
				_db.update(_table, req.params.id, req.body[_model.singular], function(err, data) {
					if(!_db) {
						res.status(500).send("db config error");
						return;
					}
					_db.selectByKey(_table, {id:req.params.id}, function(err, item) {
						if(err || !item) {
							res.status(404).send({error:"Not found."});
						} else {							
							beforeResp&&beforeResp(req.params.id, item, req.body);

							var result = {};
							result[_model.singular] = item;
							res.send(result);
						}
					});
				});
			}

			if(typeof beforeSave == 'function') {
				beforeSave(req, res, save);
			} else {
				save(true);
			}

		};

		return this;
	};

	this.enableDeleter = function(beforeDelete, beforeResp) {
		_routers.delete[getSingleRouter()] = function(req, res) {
			if(!_db) {
				res.status(500).send("db config error");
				return;
			}
			console.log("id " + req.params.id );
			beforeDelete&&beforeDelete(req.params.id, req);
			_db.delete(_table, req.params.id, function(err) {

				if(err) {
					res.status(402).send({error:err});	
				} else {
					beforeResp&&beforeResp(req.params.id);
					res.status(204).send();
				}
			});
		};
		return this;
	};

	this.enableBasic = function() {
		this.enableGetter();
		this.enablePoster();
		this.enablePutter();
		this.enableDeleter();		
		return this;
	};

	this.enableAction = function(actionName, callback) {
		if(typeof callback != "function") {
			console.log("action callback parameter must be function");
			return this;
		}

		_routers.action[actionName] = callback;
		return this;
	};

	this.enableListAction = function(actionName, callback) {
		if(typeof callback != "function") {
			console.log("action callback parameter must be function");
			return this;
		}

		_routers.listAction[actionName] = callback;
	};
	
	this.bindDB = function(db){
		_db = db;
		return this;
	}

	this.getDB = function() {
		return _db;
	}

	this.setOpts = function(opts) {
		_model = opts["model"] ? opts["model"] : _model;
		_namespace = opts["namespace"] ? opts["namespace"] : _namespace;
		//_version = opts["version"] ? opts["version"] : _model;
		_table = _model.table_name;
		_baseRouter = _namespace;///' + _version + '/' + 
	}

	this.extendBaseRouter = function(extRouter) {
		_extendRouter =  extRouter;
		return this;
	}

	this.registerRouter = function(app) {

		for(var router in _routers.get) {
			console.log("register router get " + router);
			app.get(router, _routers.get[router]);
		}

		for(var router in _routers.post) {
			console.log("register router post " + router);
			app.post(router, _routers.post[router]);
		}

		for(var router in _routers.put) {			
			console.log("register router put " + router);
			app.put(router, _routers.put[router]);
		}

		for(var router in _routers.delete) {
			console.log("register router delete " + router);
			app.delete(router, _routers.delete[router]);
		}

		function isObjectEmpty(obj) { for(var key in obj) return false; return true;}

		if(!isObjectEmpty(_routers.action)) {
			console.log("register router action " + getSingleRouter() + "/action");
			app.post(getSingleRouter() + "/action", _onAction);
		}

		if(!isObjectEmpty(_routers.listAction)) {
			console.log("register router list action " + getListRouter() + "/action");
			app.post(getListRouter() + "/action", _onListAction);
		}

		return this;
	}	

	//return _this;
}

module.exports = NodelEvent;
