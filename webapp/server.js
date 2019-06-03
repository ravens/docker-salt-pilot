const express = require('express')
const next = require('next')
const socketIO = require('socket.io')
const http = require('http')
const util = require('util')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

const WS_URL = 'ws://saltmaster:8000/websocket'

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

  var data = JSON.parse(evt.data)

  console.log(util.inspect(data));

};

app.prepare()
.then(() => {
  const expressapp = express()
  const server = http.createServer(expressapp)
  const io = socketIO(server)

  io.on('connection', socket => {
    console.log('Browser connected')

    socket.on('disconnect', () => {
      console.log('Browser disconnected')
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