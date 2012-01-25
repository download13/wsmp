var EventEmitter = require('events').EventEmitter;
var util = require('util');

var PACK = JSON.stringify;
var UNPACK = JSON.parse;

function Multiplexer(ws) {
	// Given a stream that emits `message` and `disconnect` events, attach to it
	// and create a series of virtual streams that can be pulled off
	// ws object must use the interface: emits 'message' on new message, emits 'disconnect' on disconnection, has `send` method
	// ws object must use the interface: emits 'message' on new message, emits 'disconnect' on disconnection, has `send` method
	
	ws.on('message', this._onmessage.bind(this));
	ws.on('disconnect', this._ondisconnect.bind(this));
	
	this._ws = ws;
	this._streams = {};
}
util.inherits(Multiplexer, EventEmitter);

Multiplexer.prototype._onmessage = function(message) {
	console.log(message);
	if(message == null) {
		return;
	}
	try {
		message = UNPACK(message);
	} catch(e) {
		return;
	}
	if(!Array.isArray(message)) {
		return;
	}
	
	var name = message[0];
	var data = message[1];
	var stream = this._streams[name];
	stream._onmessage(data);
}
Multiplexer.prototype._ondisconnect = function() {
	var streams = this._streams;
	for(var i in streams) {
		streams[i]._ondisconnect()
	}
}
Multiplexer.prototype._send = function(name, data) {
	this._ws.send(PACK([name, data]));
}

Multiplexer.prototype.getStream = function(name) {
	var stream = this._streams[name];
	if(stream == null) {
		stream = this._streams[name] = new Stream(name, this);
	}
	return stream;
}

function Stream(name, controller) {
	this._onmessage = this._onmessage.bind(this);
	this._ondisconnect = this._ondisconnect.bind(this);
	
	this.connected = true;
	
	this._name = name;
	this._controller = controller;
}
util.inherits(Stream, EventEmitter);

Stream.prototype._ondisconnect = function() {
	this.connected = false;
	this.emit('disconnect');
}
Stream.prototype._onmessage = function(message) {
	this.emit('message', message);
}

Stream.prototype.send = function(data) {
	this._controller._send(this._name, data);
}

exports.Multiplexer = Multiplexer;