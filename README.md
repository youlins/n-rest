# node-restful

## What,s node-restful.
Using node-restful, you can develop a REST server easily and rapidly.
Node-rest is only a framework for developing restful service, it also dependents on express , mysql and so on;

## How to develop  restful rapidly?

### Step 1 Design your entities.
sql language:
```
CREATE TABLE `tb_article` (
  `id` varchar(64) NOT NULL,
  `title` varchar(128) NOT NULL,
  `author` varchar(20) default NULL,
  `click_times` bigint(10) NOT NULL,
  `type_id` varchar(64) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `tb_article_type` (
  `id` varchar(64) NOT NULL,
  `type_name` varchar(20) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

```

### Step 2 Create models map entities and create events.

Model support keys:
* isPrimaryKey
* type
* isTitle
* name

model demo:

./models/demo.json
```
{
	"article-type" : {
		"title":"article-type",
		"singular":"article-type",
		"plural":"article-types",
		"table_name":"tb_article_type",
		"fields": {
			"id":{ "type": "uuid", "autoCreate": true, "isPrimaryKey" : true},
			"type_name":{ "type": "string", "nullable" : false, "maxSize" : 20, "title":"article type name"}
		}
	},
	"article" : {
		"title":"article",
		"singular":"article",
		"plural":"articles",
		"table_name":"tb_article",
		"fields": {
			"id": { "type": "uuid", "autoCreate": true, "isPrimaryKey" : true},
			"title": { "type": "string", "nullable" : false, "maxSize" : 126, "title":"article title"},
			"click_times": { "type": "int64", "nullable" : false,  "defaultValue" : 0,"maxSize" : 10, "title":"click-times"},
			"type_id ": { "type": "string", "nullable" : false, "maxSize" : 64, "title":"article type id"},
			"content": { "type": "string", "nullable" : false, "defaultValue" : "", "title":"article content"}
		}
	}
}
```
events:

./events/article-type.js
```
var ModelEvent = require('../../').ModelEvent;
var ev = new ModelEvent();

ev.init = function(){
	ev.enableGetter();//Only support GET request
}

exports.events = ev;
```

./events/article.js
```
var ModelEvent = require('../../').ModelEvent;
var ev = new ModelEvent();

ev.init = function(){
	ev.enableBasic();//support GET,PUT,DELETE,POST
}

exports.events = ev;
```

### Step 3 Bind database(mysql) and express app.

```
var CollectionFactory = require('../').CollectionFactory;
var DBFactory = require('../').DBFactory;
var collection = CollectionFactory.createCollection("/v1", "http://restful-demo/");
var mysql = DBFactory.createConnection("mysql://root:123456@localhost:3306/restful-demo"); 

function loadEvent(eventName) {
	var ev = require('./events/' + eventName)
	collection.addModelEvents(eventName, ev.events);
}

//add models
collection.addModels(__dirname + "/models/article_model.json", function(result, message) {
	console.log("addModels " + result);
	if(result == 'fail')
		return ;
	
	//load events
	loadEvent('article');
	loadEvent('article-type');
});

//init server, bind models and events
var restful = require('../').RestfulServer;
var restServer = new restful();
restServer.bindModelEvents(mysql, collection.getModelEvents());
exports.setApp = function(app) {
    restServer.bindExpress(app);
    collection.registerRFDL(app);
};
```

app.js
```
var express = require('express');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.json({limit: '1mb'}));
app.use(bodyParser.urlencoded({
  extended: true
}));

var controller = require('./controller');
controller.setApp(app);//bind app

app.listen(3000);

```

## How to use the restful service?

### Get List
#### get list with id, title and link
```
GET http://localhost:3000/v1/{resource-plural-name}
```
demo:
```
GET http://localhost:3000/v1/article

response:
{"articles":[{"id":"b7ffe2b0-67c4-11e6-a314-6b4b89471461","links":[{"href":"/v1/articles/b7ffe2b0-67c4-11e6-a314-6b4b89471461","rel":"self"}]}],"count":1}
```

#### get detail list
```
GET http://localhost:3000/v1/{resource-plural-name}/detail
```
demo:
```
GET http://localhost:3000/v1/articles/detail

response:
{"articles":[{"id":"b7ffe2b0-67c4-11e6-a314-6b4b89471461","links":[{"href":"/v1/articles/b7ffe2b0-67c4-11e6-a314-6b4b89471461","rel":"self"}],"title":"This guy is a good man.","click_times":1}],"count":1}
```

### Get Instance

```
GET http://localhost:3000/v1/{resource-plural-name}/{id}
```
demo:
```
GET http://localhost:3000/v1/articles/b7ffe2b0-67c4-11e6-a314-6b4b89471461

response:
{"article":{"id":"b7ffe2b0-67c4-11e6-a314-6b4b89471461","title":"This guy is a good man.","author":"youlins","click_times":1,"type_id":"d4de53d0-67c4-11e6-a314-6b4b89471461"}}
```

### Create instance
```
POST http://localhost:3000/v1/{resource-plural-name}
```
demo:
```
POST http://localhost:3000/v1/articles

{"article":{"id":"b7ffe2b0-67c4-11e6-a314-6b4b89471461","title":"This guy is a good man.","author":"youlins","click_times":0,"type_id":"d4de53d0-67c4-11e6-a314-6b4b89471461"}}

response:
{"article":{"id":"b7ffe2b0-67c4-11e6-a314-6b4b89471461","title":"This guy is a good man.","author":"youlins","click_times":0,"type_id":"d4de53d0-67c4-11e6-a314-6b4b89471461"}}
```

### Modify instance
```
PUT http://localhost:3000/v1/{resource-plural-name}/{id}
```
demo:
```
PUT http://localhost:3000/v1/articles/b7ffe2b0-67c4-11e6-a314-6b4b89471461

{"article":{"click_times":1}}

response:
{"article":{"click_times":1}}
```


### Delete instance
```
DELETE http://localhost:3000/v1/{resource-plural-name}/{id}
```
demo
```
DELETE http://localhost:3000/v1/articles/b7ffe2b0-67c4-11e6-a314-6b4b89471461
```

### Take a action width one instance
```
POST http://localhost:3000/v1/{resource-plural-name}/{id}/action
```
demo:
```
POST http://localhost:3000/v1/articles/b7ffe2b0-67c4-11e6-a314-6b4b89471461/action

{"newclick":null}
```

## Auto create service description language

### html
```
GET http://rest-demo:3000/v1?rfdl=html
```

### md
```
GET http://rest-demo:3000/v1?rfdl=md
```
