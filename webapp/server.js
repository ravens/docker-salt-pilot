const express = require('express')
const next = require('next')
const socketIO = require('socket.io')
const http = require('http')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

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