const express = require('express');
const next = require('next');
const socketIO = require('socket.io');
const http = require('http');
const util = require('util');
const events = require('events');

// we maintain an event loop to process the various event and control the flow between the control logic, the webui clients and the saltmaster(s) we control.
const EVENT_BROWSER_DISCONNECT  = "browser_disconnect";
const EVENT_BROWSER_CONNECT   = "browser_connect";
const EVENT_BROWSER_MESSAGE = "browser_message";
const EVENT_SALT_MESSAGE = "salt_message";

var main_events_loop = new events.EventEmitter();

main_events_loop.on("event", function(event){

  if (event && event.type)
  {
    switch(event.type)
    {

      case EVENT_BROWSER_DISCONNECT:
      console.log("Browser " + event.data.id + " just disconnected");
      break;
      case EVENT_BROWSER_CONNECT:
      console.log("Browser " + event.data.id + " just connected");
      break ;

      case EVENT_BROWSER_MESSAGE:
      console.log("Browser " + event.data.id + " just sent " + event.data.data);
      break;

      case EVENT_SALT_MESSAGE:
      console.log("Salt event " + event.data.tag + " with data " + event.data.data);
      break;

      default:

    }

  }

})

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const WS_URL = 'ws://saltmaster:8000/websocket';

var W3CWebSocket = require('websocket').w3cwebsocket;
var saltclient = new W3CWebSocket(WS_URL);
var keepalive;

saltclient.onerror = function() {
  console.log('Connection error, retrying');
  saltclient = new W3CWebSocket(WS_URL);
};

saltclient.onopen = function() {
  console.log('Salt client connected');

};

saltclient.onclose = function() {
  console.log('Salt client closed');
  saltclient = new W3CWebSocket(WS_URL);
};



saltclient.onmessage = function(evt) {

  var data = JSON.parse(evt.data);

  main_events_loop.emit("event",{type : EVENT_SALT_MESSAGE, data : data});

};

app.prepare()
.then(() => {
  const expressapp = express();
  const server = http.createServer(expressapp);
  const io = socketIO(server);

  io.on('connection', socket => {
   main_events_loop.emit("event",{type : EVENT_BROWSER_CONNECT, data : { id : socket.id }});

   socket.on('message', function (data) {
    main_events_loop.emit("event",{type : EVENT_BROWSER_MESSAGE, data : { id : socket.id, data : data }})
   })

   socket.on('disconnect', () => {
     main_events_loop.emit("event",{type : EVENT_BROWSER_DISCONNECT, data : { id : socket.id }})
   })
 })

  expressapp.get('*', (req, res) => {
    return handle(req, res)
  })

  server.listen(3000, (err) => {
    if (err) throw err
      console.log('> Listening on port 3000')
  })
})
.catch((ex) => {
  console.error(ex.stack)
  process.exit(1)
})