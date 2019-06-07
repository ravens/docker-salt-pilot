#!/usr/bin/env python2   

import thread
import json
import fnmatch

import socketio
from gevent.pywsgi import WSGIServer

sio = socketio.Server(async_mode='gevent',ping_timeout=30, logger=False, engineio_logger=False)
app = socketio.WSGIApp(sio)

def sio_connect_handler(sid, environ):
    print("connect", sid)

sio.on('connect', sio_connect_handler)

def sio_disconnect_handler(sid):
    print("disconnect", sid)

sio.on('disconnect', sio_disconnect_handler)

def sio_message_handler(sid, msg):
    print('Received message: ', msg)
    sio.send(sid, 'response')

sio.on('event', sio_message_handler)

import salt.config
import salt.utils.event

opts = salt.config.client_config('/etc/salt/master')

sevent = salt.utils.event.get_event(
        'master',
        sock_dir=opts['sock_dir'],
        transport=opts['transport'],
        opts=opts)

SERVER_PORT = 8000

def handle_salt_events(threadName):
  print("Bridge> processing salt events")
  while True:
    ret = sevent.get_event(full=True)
    if ret is None:
        continue
    else:    
      sio.emit('message', json.dumps(ret, separators=(',',':')))


def main():

    print("Bridge> Running Salt API - Websocket Bridge server")

    try:
       thread.start_new_thread( handle_salt_events, ("saltThread",))
    except Exception:
        print("Error: unable to start thread" + Exception)

    server = WSGIServer(("0.0.0.0", SERVER_PORT), app)
    try:
        server.serve_forever()
    except Exception:
        sys.exit(0)

if __name__ == '__main__':
    main()
