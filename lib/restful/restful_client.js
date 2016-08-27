//注册所有的Restful web服务接口，包含基本的增删改查。
//注册行为接口
//注册服务描述语言，支持json,md,html等格式, wadl待定
//支持数据库绑定
//支持权限配置，支持ACL或者RBAC模型
//
var Http = require('http');
var Url = require('url');
var Buffer = require('buffer').Buffer;

function RestfulClient(opts) {
	var _opts = {};

	for(var key in opts) {
		_opts[key] = opts[key];
	}

	if(!_opts.listPath) {
		_opts.listPath = _opts.root + _opts.entity + 's'
	}

	function getDefaultOpts(url, method, auth) {
		var defaultOpts = Url.parse(url);
		/*
		default option:
		{ 
			protocol: 'http:',
			slashes: true,
			auth: null,
			host: 'localhost',
			port: null,
			hostname: 'localhost',
			hash: null,
			search: null,
			query: null,
			pathname: '/v1/openapi/connections',
			path: '/v1/openapi/connections',
			href: 'http://localhost/v1/openapi/connections' 
		}*/

		defaultOpts.method = method;
		defaultOpts.headers = {
			"user-agent" : "qdfr restful client",
	        'accept': '*/*',
	        'accept-encoding': 'gzip, deflate'
		};

		if(method == "POST" || method == "PUT") {
			defaultOpts.headers['content-type'] = "application/json";
		}

		if(auth) {
			defaultOpts.headers['authorization'] =  auth;
		}

		return defaultOpts;
	}

	function convert2Json(status, body, callback, isBodyMust) {
		if(status > 299) {
			console.log(body);
			callback(status);
		} else {
			try{
				var obj = body?JSON.parse(body):{};
				callback(status, obj);
			} catch(e) {
				if(isBodyMust) {
					callback(500, "server return error json format");
				} else {
					callback(status, body);
				}
			}
		}
	}

	function submit(options, body, afterLoad) {
		var chunks = [];
		var size = 0;
		var callback = typeof body != "function" ? afterLoad : body;
		var writeBuffer = null;
		if(typeof body == "object") {
			writeBuffer = new Buffer(JSON.stringify(body), "utf-8");
		} else if(typeof body != "function") {
			writeBuffer = new Buffer(body, "utf-8");
		}

		if(writeBuffer) {
			options.headers['Content-Length'] = writeBuffer.length;
		}

		var isBodyMust = options.method == "GET";

		var req = Http.request(options, function(res) { 
			res.setEncoding('utf8');
			res.on('data', function (chunk) {
				chunks.push(chunk);				
				size += chunk.length;
			});

			res.on('end', function() {

				if(size == 0) {
					callback(res.statusCode)
					return ;
				} else if(chunks.length == 1){
					var buffer = chunks[0];
				} else {
					if(typeof chunks[0] == 'string') {
						var buffer = chunks.join("")
					}else {
						var buffer = Buffer.concat(buffers, size);
					}
				}
				
				if(res.headers['content-encoding'])
				if(res.headers['content-encoding'].indexOf('gzip') != -1) {
					var zlib = require('zlib');
					zlib.gunzip(buffer, function (err, decoded) {
		                  convert2Json(res.statusCode, decoded.toString(), callback, isBodyMust);
		            });
					return;
				}
				
				convert2Json(res.statusCode, buffer.toString(), callback, isBodyMust);

			});
		}); 

		req.on('error', function(e) { 
			console.log('problem with request: ' + e.message); 
			callback(404, e);
		}); 

		// write data to request body
		if(writeBuffer) { 
			req.write(writeBuffer);
		}

		req.end();
	}

	

	this.getAll = function(callback) {
		var url = _opts.listPath;
		var reqOpts = getDefaultOpts(url, "GET");

   		submit(reqOpts, callback);
   	}

	this.getAllDetail = function(callback) {
		var url = _opts.listPath + "/detail";
		var reqOpts = getDefaultOpts(url, "GET");

   		submit(reqOpts, callback);

	};

	this.getById = function(id, callback) {
		var url = _opts.listPath + "/" + id;
		var reqOpts = getDefaultOpts(url, "GET");
		submit(reqOpts, callback);
	};

	this.post = function(data, callback) {
		var url = _opts.listPath;
		var reqOpts = getDefaultOpts(url, "POST");
   		submit(reqOpts, data, callback);
	};

	this.put = function(id, data, callback) {
		var url = _opts.listPath + "/" + id;
		var reqOpts = getDefaultOpts(url, "PUT");

   		submit(reqOpts, data, callback);

	};

	this.delete = function(id, data, callback) {
		var url = _opts.listPath + "/" + id;
		var reqOpts = getDefaultOpts(url, "DELETE");
		//var cb = typeof data == "function" ? data : callback;
   		submit(reqOpts, data, callback);
	};

	this.doAction = function(id, actionName, parameters, callback) {
		var url = _opts.listPath + "/" + id + "/action";
		var reqOpts = getDefaultOpts(url, "POST");		
		var data = {};

		console.log(reqOpts);
		
		data[actionName] = parameters;
		submit(reqOpts, data, callback);
	}

}

module.exports = RestfulClient;
