var ModelEvent = require('../../').ModelEvent;
var ev = new ModelEvent();

ev.init = function(){
	ev.enableBasic();
}

exports.events = ev;
