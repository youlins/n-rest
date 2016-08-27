var CollectionFactory = require('../').CollectionFactory;
var DBFactory = require('../').DBFactory;
var collection = CollectionFactory.createCollection("/v1", "http://restful-demo/");
var mysql = DBFactory.createConnection("mysql://root:123456@localhost:3306/restful-demo"); 

function loadEvent(eventName) {
	var ev = require('./events/' + eventName)
	collection.addModelEvents(eventName, ev.events);
}

//添加模型
collection.addModels(__dirname + "/models/article_model.json", function(result, message) {
	console.log("addModels " + result);
	if(result == 'fail')
		return ;

	loadEvent('article');
	loadEvent('article-type');
});

//创建服务器
var restful = require('../').RestfulServer;
var restServer = new restful();
restServer.bindModelEvents(mysql, collection.getModelEvents());
exports.setApp = function(app) {
  	restServer.bindExpress(app);
    collection.registerRFDL(app);
};