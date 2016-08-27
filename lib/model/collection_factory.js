var collection = require('./collection')

var _collections = {};

exports.createCollection = function(namespace, baseLink) {
	var key = baseLink + namespace;
	if(!_collections[key]) {
		_collections[key] = new collection(namespace, baseLink);
	}

	return _collections[key];
}

exports.getCollection = function(namespace, baseLink) {
	var key = baseLink + namespace;
	return _collections[key];
}