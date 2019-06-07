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
const EVENT_SALT_DISCONNECT = "salt_disconnect";
const EVENT_SALT_CONNECT = "salt_connect";
const EVENT_SALT_MESSAGE = "salt_message";

const SALT_MASTER="http://saltmaster:8000"

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

      case EVENT_SALT_DISCONNECT:
      console.log("Salt client just disconnected");
      break;

      case EVENT_SALT_CONNECT:
      console.log("Salt client just connected");
      break ;

      case EVENT_SALT_MESSAGE:
      console.log("Salt event " + event.data.tag + " with data " + util.inspect(event.data.data));
      break;

      default:

    }

  }

})

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

var sioclient = require('socket.io-client');
var saltsocket = new sioclient(SALT_MASTER);

saltsocket.on('connect', function(){

  main_events_loop.emit("event",{type : EVENT_SALT_CONNECT, data : saltsocket.id});

  saltsocket.on('message', function(data){
    main_events_loop.emit("event",{type : EVENT_SALT_MESSAGE, data : JSON.parse(data)});
  });
  saltsocket.on('disconnect', function(){
    main_events_loop.emit("event",{type : EVENT_SALT_DISCONNECT, data : saltsocket.id});
  });
});

app.prepare()
.then(() => {
  const expressapp = express();
  const server = http.createServer(expressapp);
  const io = socketIO(server);

  io.on('connection', socket => {
   main_events_loop.emit("event",{type : EVENT_BROWSER_CONNECT, data : { id : socket.id }});


   // repeating event to each browser
   main_events_loop.on("event", function(event){

    if (event && event.type == EVENT_SALT_MESSAGE)
    {
      socket.emit('message',event.data)
    }

   })

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