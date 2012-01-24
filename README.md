wsmp
====
WebSocket Multiplexer
---------------------

Used to send multiple, independent streams of data across a single WebSocket-compatible object.

Client side
-----------

Simply create the multiplexer.

```javascript
var ws = new WebSocket('ws://echo.websocket.org');
var mp = new MultiplexerClient(ws);
```

Then get some streams from it.

```javascript
var signalStream = mp.getStream('signal');
var dataStream = mp.getStream('data');
```

And send your data.

```javascript
var first = true;

signalStream.onmessage = function(msg) {
	var text = 'signal was echoed back ';
	if(first) {
		first = false;
		text = 'first: ';
	} else {
		text = 'second: ';
	}
	alert(text + msg);
};

dataStream.onmessage = function(msg) {
	var text = 'data was echoed back ';
	if(first) {
		first = false;
		text = 'first: ';
	} else {
		text = 'second: ';
	}
	alert(text + msg);
};

signalStream.send('beep-beep');
dataStream.send('buzz-buzz');
```

You can name the streams whatever you want, but each stream must be unique, and the other side must know the names of the streams as well.
You don't need to wait for the underlying Socket to connect, the Multiplexer will buffer your data until the connection is ready to handle it.
When all the streams are closed, the underlying connection is closed automatically.
The streams use the attributes `onclose` and `onmessage` for event handling. The Multiplexer uses `onerror` for errors and `onclose` for closing.


Server side
-----------

