
function MD(models, namespace, baseLink) {

	var mdTxt = "";

	var swithLine = "\r\n";
		
	var first = 0;
	var second = 0;

	function incrFirst() {
		first += 1;
		second = 0;
		return first + ' ';
	}

	function incrSecond() {
		second += 1;
		return first + '.' + second + ' ';
	}

	function printText(txt) {
		mdTxt += txt;
	}

	function printTitle(model) {
		var txt = swithLine + swithLine + "### " + incrFirst() + model.title + swithLine;
		if(model.description) {
			txt += model.description + swithLine;
		}
		printText(txt);
	}

	var basePath = namespace;
	var linkPath = baseLink + namespace;


	function getParentPath(model) {
		var txt = "";

		function getParantTxt(parent) {
			if(parent) {
				return '/' + parent.plural + '/{' + model.parents + '_id}';
			} else {
				return '';
			}
		}
		return txt;
	}

	function getDefaultValue(field) {
		if(typeof field.defaultValue != 'undefined')
			return field.defaultValue;

		if(typeof field.type == 'undefined') {
			return "";
		} else if(field.type == 'uuid') {
			return "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
		} else if(field.type == 'string') {
			return "string";
		} else if(field.type.indexOf("int") > -1) {
			return 0;
		} else if(field.type == 'float') {
			return 0.0;
		} else {
			return "";
		}
	}

	function printGetList(model) {
		var txt = '#### ' + incrSecond();
		txt += 'GET ' + basePath + getParentPath(model) + '/' + model.plural;
		txt += '		获取' + model.title + '列表' + swithLine;

		txt += 'response:' + swithLine;
		txt += '```' + swithLine;
		txt += '{' + swithLine;
		txt += '  "' + model.plural + '" : [' + swithLine;	
		txt += '    {' + swithLine;

		for(var key in model.fields) {
			var field = model.fields[key];
			if(field.isPrimaryKey !== true) {
				continue;
			}	
			txt += '    "' + key + '" : "' 
				+ getDefaultValue(field)
				+ '",' + swithLine;
		}

		txt += '    "links" : [{' + swithLine
			+  '      "href" : "' + linkPath + getParentPath(model) + '/' + model.plural + '/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",' + swithLine
			+  '      "rel": "self"' + swithLine
			+  '    }] ' + swithLine;

		txt += '  }]' + swithLine
			+  '}' + swithLine;
		txt +=  '```' + swithLine + swithLine;
		printText(txt);
	}

	function printGetSingle(model) {
		var txt = '#### ' + incrSecond();
		txt += 'GET ' + basePath + getParentPath(model) + '/' + model.plural 
			+ '/{' + model.singular + '_id}';
		txt += ' 获取' + model.title + swithLine;

		txt += 'response:' + swithLine;
		txt += '```' + swithLine;
		txt += '{' + swithLine;
		txt += '  "' + model.singular + '" : {' + swithLine;	
		//txt += '    {' + swithLine;

		for(var key in model.fields) {
			var field = model.fields[key];
			txt += '    "' + key + '" : "' 
				+ getDefaultValue(field)
				+ '",' + swithLine;
		}

		txt += '    "links" : [{' + swithLine
			+  '      "href" : "' + linkPath + getParentPath(model) + '/' + model.plural + '/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",' + swithLine
			+  '      "rel": "self"' + swithLine
			+  '    }] ' + swithLine;

		txt += '  }' + swithLine
			+  '}' + swithLine;
		txt +=  '```' + swithLine + swithLine;
		printText(txt);
	}

	function printPost(model) {
		var txt = '#### ' + incrSecond();
		txt += 'POST ' + basePath + getParentPath(model) + '/' + model.plural;
		txt += ' 创建' + model.title + swithLine;


		txt += 'request:' + swithLine;
		txt += '```' + swithLine;
		txt += '{' + swithLine;
		txt += '  "' + model.singular + '" : {' + swithLine;	
		//txt += '    {' + swithLine;

		for(var key in model.fields) {
			var field = model.fields[key];
			if(field.autoCreate === true) {
				continue;
			}
			txt += '    "' + key + '" : "' 
				+ getDefaultValue(field)
				+ '",' + swithLine;
		}

		txt += '  }' + swithLine
			+  '}' + swithLine;	
		txt += '```' + swithLine;

		txt += 'response:' + swithLine;
		txt += '```' + swithLine;
		txt += '{' + swithLine;
		txt += '  "' + model.singular + '" : {' + swithLine;	
		//txt += '    {' + swithLine;

		for(var key in model.fields) {
			var field = model.fields[key];

			if(field.autoCreate !== true) {
				continue;
			}

			txt += '    "' + key + '" : "' 
				+ (field.defaultValue ? field.defaultValue : field.type)
				+ '",' + swithLine;
		}

		txt += '    "links" : [{' + swithLine
			+  '      "href" : "' + linkPath + getParentPath(model) + '/' + model.plural + '/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",' + swithLine
			+  '      "rel": "self"' + swithLine
			+  '    }] ' + swithLine;

		txt += '  }' + swithLine
			+  '}' + swithLine;
		txt +=  '```' + swithLine + swithLine;
		printText(txt);
	}

	function printPut(model) {	
		var txt = '#### ' + incrSecond();
		txt += 'PUT ' + basePath + getParentPath(model) + '/' + model.plural 
			+ '/{' + model.singular + '_id}';
		txt += ' 修改' + model.title + swithLine;


		txt += 'request:' + swithLine;
		txt += '```' + swithLine;
		txt += '{' + swithLine;
		txt += '  "' + model.singular + '" : {' + swithLine;	
		//txt += '    {' + swithLine;

		for(var key in model.fields) {
			var field = model.fields[key];
			if(field.autoCreate === true) {
				continue;
			}

			txt += '    "' + key + '" : "' 
				+ getDefaultValue(field)
				+ '",' + swithLine;
		}

		txt += '  }' + swithLine
			+  '}' + swithLine;	
		txt += '```' + swithLine;

		txt += 'response:' + swithLine;
		txt += '```' + swithLine;
		txt += '{' + swithLine;
		txt += '  "' + model.singular + '" : {' + swithLine;	
		//txt += '    {' + swithLine;

		for(var key in model.fields) {
			var field = model.fields[key];
			txt += '    "' + key + '" : "' 
				+ getDefaultValue(field)
				+ '",' + swithLine;
		}

		txt += '    "links" : [{' + swithLine
			+  '      "href" : "' + linkPath + getParentPath(model) + '/' + model.plural + '/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",' + swithLine
			+  '      "rel": "self"' + swithLine
			+  '    }] ' + swithLine;

		txt += '  }' + swithLine
			+  '}' + swithLine;
		txt +=  '```' + swithLine + swithLine;
		printText(txt);
	}

	function printDelete(model) {
		
		var txt = '#### ' + incrSecond();
		txt += 'DELETE ' + basePath + getParentPath(model) + '/' + model.plural 
			+ '/{' + model.singular + '_id}';
		txt += ' 删除' + model.title + swithLine;

		txt += '正常响应码：204' + swithLine;
		txt += '错误响应码：computeFault (400, 500, …), serviceUnavailable (503), badRequest (400), unauthorized (401), forbidden (403), badMethod (405), itemNotFound (404)' + swithLine;	
		printText(txt);
	}

	this.toString = function(refresh){

		if(refresh !== true && mdTxt.length > 0){
			return mdTxt;
		}
		mdTxt = "";

		for(var key in models) {
		
			if(!models[key].singular) {
				models[key].singular = key;
			}
			printTitle(models[key]);
			printGetList(models[key]);
			printGetSingle(models[key]);
			printPost(models[key]);
			printPut(models[key]);
			printDelete(models[key]);	
		}
		return mdTxt;
	};

	this.save = function(filePath, refresh){
		var fs = require('fs');
		var data = this.toString(refresh);
		if(data.length > 0) {
			fs.writeFile(filePath, data, 'utf8', function (err) {
				if (err) console.log('Save error:' + err);
				console.log('It\'s saved!');
			});
		}
	}

	//return this;
}

module.exports = MD;