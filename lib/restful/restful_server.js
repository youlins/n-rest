
function RestfulServer() {
	var model_events = {};
	var opts = {};

	this.setAuthorization = function(authType, auth_parameters, auth_handler) {
		opts["authType"] = authType;
		opts["auth_parameters"] = auth_parameters;
		opts["auth_handler"] = auth_handler;
		return opts;
	};

	this.bindApplication = function(application) {
		opts["app"] = application;
		return this;
	};

	this.bindModelEvents = function(db, modelEvents) {
		if(!modelEvents) {
			console.log("error models : " + modelEvents);
		}

		for(var i in modelEvents) {
			var modelEvent = modelEvents[i];
			if(model_events[modelEvent.getListRouter()]) {
				console.log("duplicate router :" + modelEvent.getListRouter());
			}
			model_events[modelEvent.getListRouter()] = modelEvent;
			modelEvent.bindDB(db);
		}
	};

	this.bindExpress = function(app) {
		opts["express"] = app;
		for(var i in model_events) {
			var modelEvent = model_events[i];
			modelEvent.registerRouter(app);
		}
	};
}

module.exports = RestfulServer;
