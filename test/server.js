var expect = require('./files/expect');
var ws = require('ws');
// TODO Need a WebSocket client module

var MultiplexerServer = require('../').MultiplexerServer;

var mp;
var wss = ws.createServer(function(req, connection) {
	mp = new MultiplexerServer(connection);
	
	test1();
}).listen(80);

function test1() {
	var stream = mp.getStream('stream1');
	stream.on('message', function(msg) {
		console.log('msg', msg);
		expect(msg).to.be('test');
		console.log('test 1 passed');
		test2();
	});
	stream.send('test');
	console.log('test 1 started');
}

function test2() {
	
}