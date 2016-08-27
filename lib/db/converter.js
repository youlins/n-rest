
function convertSortQuery2Sql(sortQuery) {

	if(!sortQuery) return "";

	var sortSql = "";
	sortQuery.replace(/([-+]?)(\w+)/g, function(match, seq, col) {
		sortSql += "`" + col + "` " + (seq == "-" ? "desc" : "asc") + ",";
	});

	sortSql&&(sortSql = "order by " + sortSql.replace(/,$/, ""));

	return sortSql;
}

function convertFieldsQuery2Sql(fields) {
	var val = fields.replace(/,/g,"`,`");
	if(!val || val == "*") {
		return "*";
	} else {
		return "`" + val + "`";
	}
}

function convertStr2Cases(str) {
	var cases = {sort:"", where:"", values:[], fields: "*", limit: 20, offset:0};

	if(typeof str != "string") return cases;

	str.replace(/([^<>=& ]+)([<>=]+)([^&]*)/g, function(match, opt, op, val) {
		if(opt == "sort") {
			cases.sort = convertSortQuery2Sql(val);
		} else if(opt == "fields"){			
			cases.fields = convertFieldsQuery2Sql(val);
		} else if(opt == "limit") {
			cases.limit = parseInt(val);
		} else if(opt == "offset"){			
			cases.offset = parseInt(val);
		} else {
			var q = "`" +  opt +  "` " + op + ' ?';
			cases.where += cases.where ? (" and " +  q): q;
			cases.values.push(val);
		}
	})

	cases.where && (cases.where = "where " +  cases.where);

	return cases;
}

/*
{ sort: '-type, name',
  'name>': '554',
  type: 'shop',
  fields: 'type,name,id',
  offset: '10',
  limit: '5' }
  */
function convertQuery2Cases(query) {
	var cases = {sort:"", where:"", values:[], fields: "*", limit: 10, offset:0};

	for(var key in query){
		if(key == "sort") {
			cases.sort = convertSortQuery2Sql(query.sort);
		} else if(key == "fields"){			
			cases.fields = convertFieldsQuery2Sql(query.fields);
		} else if(key == "limit") {
			cases.limit = parseInt(query.limit);
		} else if(key == "offset"){			
			cases.offset = parseInt(query.offset);
		} else {

			function appendWhere(k, v) {
				var op = k.replace(/[^<>!*]+/g, "");

				//op = op.replace("*", "like") not support like ,smaller and bigger
				var q = "`" +  k.replace(/[<>!*]+/g, "") +  "` " + op + "= ?";
				cases.where += cases.where ? (" and " +  q): q;
				cases.values.push(v);
			}
			if(typeof query[key] == "object") {
				for(var i in  query[key]) {
					appendWhere(i, query[key][i]);
				}
			} else {
				appendWhere(key, query[key]);
			}
		}
	}

	cases.where && (cases.where = "where " +  cases.where);

	return cases;
}

/*
	{ 
		sort: 'order by `type` desc,`name` asc',
		where: 'where `name` >= ? and `type` = ?',
		values: [ '554', 'shop' ],
		fields: '`type`,`name`,`id`',
		limit: 5,
		offset: 10 
	}
	*/

function cases2Sql(table, cases) {

	if(!cases) {
		return "select * from " + table;
	}

	if(typeof cases == "object") {
		var fields = cases.fields ? cases.fields : "*";
		var sort = cases.sort ? cases.sort : "";
		var where = cases.where ? cases.where : "";
		var limit = cases.limit ? ("limit " + cases.offset + "," + cases.limit) : "";

		return "select " + fields + ' from ' + table + " " + where + " " + sort + " " + limit;
	} else {
		return "select * from " + table + " " + cases;
	}
}


function cases2CountSql(table, cases) {

	if(!cases) {
		return "select count(*) as c from " + table;
	}

	if(typeof cases == "object") {
		var where = cases.where ? cases.where : "";
		return "select count(*) as c from " + table + " " + where;
	} else {
		return "select count(*) as c from " + table + " " + cases;
	}
}

function keys2Sql(table, keys){
	var sql = "select * from " + table;
	var where = "";

	for(var key in keys) {
		where += key + " = ? and ";
	}

	if(where.length > 0) {
		return sql + " where " + where.replace(/and $/, "");
	} else {
		return sql;
	}
}


module.exports = {
	convert2Cases : function(str) {
		if(typeof str == "string") {
			return convertStr2Cases(str);
		} else {
			return convertQuery2Cases(str);
		}
	},
	cases2Sql : cases2Sql,
	cases2CountSql : cases2CountSql,
	keys2Sql : keys2Sql
}
