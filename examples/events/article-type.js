var ModelEvent = require('../../').ModelEvent;
var ev = new ModelEvent();

ev.init = function(){
	ev.enableGetter();
}

exports.events = ev;
