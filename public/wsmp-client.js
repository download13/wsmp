(function(global) {
	// WebSocket Multiplexer
	var PACK = JSON.stringify;
	var UNPACK = JSON.parse;
	
	
	function MultiplexerClient(ws) { // Pass a WebSocket, or something with a WebSocket interface
		ws.onmessage = this._onmessage.bind(this);
		ws.onclose = this._onclose.bind(this);
		ws.onopen = this._onopen.bind(this);
		ws.onerror = this._onerror.bind(this);
		
		this._ready = false;
		this._buffer = [];
		
		this._ws = ws;
		this._streams = {};
	}
	MultiplexerClient.prototype = {
		_onmessage: function(e) {
			var message = e.data;
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
			
			var stream = this._streams[message[0]];
			stream._onmessage(message[1]);
		},
		_onclose: function() {
			var streams = this._streams;
			for(var i in streams) {
				streams[i]._onclose()
			}
			this._streams = {};
			
			var cb = this.onclose;
			cb && cb();
		},
		_onopen: function() {
			this._ready = true;
			this._triggerSend();
		},
		_onerror: function() {
			var cb = this.onerror;
			cb && cb();
			// TODO Finish error handling
		},
		_send: function(name, data) {
			this._buffer.push(PACK([name, data]));
			this._triggerSend();
		},
		_triggerSend: function() {
			if(this._ready) {
				var buffer = this._buffer;
				for(var i = 0; i < buffer.length; i++) {
					this._ws.send(buffer.shift());
				}
			}
		},
		_close: function(name) {
			var streams = this._streams;
			delete streams[name];
			if(Object.keys(streams).length == 0) {
				this._ws.close();
			}
		},
		
		getStream: function(name) {
			var stream = this._streams[name];
			if(stream == null) {
				stream = this._streams[name] = new Stream(name, this);
			}
			return stream;
		}
	};
	
	function Stream(name, controller) {
		this._onmessage = this._onmessage.bind(this);
		this._onclose = this._onclose.bind(this);
		
		this.connected = true;
		
		this._name = name;
		this._controller = controller;
	}
	Stream.prototype = {
		_onclose: function() {
			this.connected = false;
			var cb = this.onclose;
			cb && cb();
		},
		_onmessage: function(message) {
			var cb = this.onmessage;
			cb && cb(message);
		},
		
		send: function(data) {
			this._controller._send(this._name, data);
		},
		close: function() {
			this._controller._close(this._name);
			this._onclose();
		}
	};
	
	global.MultiplexerClient = MultiplexerClient;
})(this);