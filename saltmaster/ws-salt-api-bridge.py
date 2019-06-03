#!/usr/bin/env python2

from gevent.pywsgi import WSGIServer
from geventwebsocket import WebSocketError
from geventwebsocket.handler import WebSocketHandler

from bottle import request, Bottle, abort, static_file

import thread
import json

import fnmatch

import salt.config
import salt.utils.event

opts = salt.config.client_config('/etc/salt/master')

sevent = salt.utils.event.get_event(
        'master',
        sock_dir=opts['sock_dir'],
        transport=opts['transport'],
        opts=opts)

WS_PORT = 8000

app = Bottle()
connections = set()

# handle a single websocket endpoint coming from the pilot interface
@app.route('/websocket')
def handle_websocket():
    wsock = request.environ.get('wsgi.websocket')
    if not wsock:
        abort(400, 'Expected WebSocket request.')

    connections.add(wsock)

    
    #wsock.send(json.dumps(opts))

    print "PILOT> processing websocket events"
    while True:
        try:
        	# receive event from websocket
            wsock.receive()
            # TODO propagate to salt bus (with filtering)
        except WebSocketError:
            break

    if wsock:
        try: 
            connections.remove(wsock)
        except Exception:
            return

def handle_salt_events(threadName):
  print "PILOT> processing salt events"
  while True:
    ret = sevent.get_event(full=True)
    if ret is None:
        continue

    for c in connections.copy():
        try:
          c.send(json.dumps(ret, separators=(',',':')))
        except Exception:
          if c:
            connections.remove(c)

    #if fnmatch.fnmatch(ret['tag'], 'salt/job/*/ret/*'):
    #    do_something_with_job_return(ret['data'])


def main():

    print "PILOT> Running Salt API - Websocket Bridge server on port " + str(WS_PORT)

    try:
       thread.start_new_thread( handle_salt_events, ("saltThread",))
    except Exception:
        print "Error: unable to start thread" + Exception

    server = WSGIServer(("0.0.0.0", WS_PORT), app,
                        handler_class=WebSocketHandler)
    try:
        server.serve_forever()
    except Exception:
        sys.exit(0)


if __name__ == '__main__':
    main()