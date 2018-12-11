# Personal back end socket.io server
import socketio
import eventlet
eventlet.monkey_patch()

from flask import Flask, render_template

# run this to check rabbitmq status of nodes and stuff
# 
# sudo rabbitmqctl cluster_status
# To run server brew services start rabbitmq or rabbitmq-server
urimgr = 'amqp://mcoenca:cristohoger24@localhost:5672/pythonsocket'
# urimgr = 'amqp://guest:guest@localhost:5672/'

mgr = socketio.KombuManager(urimgr)

sio = socketio.Server(client_manager=mgr)

app = Flask(__name__)


channelName = "streamEvents";

@app.route('/')
def index():
    """Serve the client-side application."""
    # return render_template('index.html')
    return '<h1>Hello Python Server</h1';

@sio.on('connect')
def connect(sid, environ):
    print('connect ', sid)

@sio.on(channelName)
def message(sid, data):
    # print ('message received')
    # ('message ', {u'color': u'red', u'eventType': u'startPlaying', u'xPc': 0.7375565610859729, u'uuid': u'76233600-65c2-11e8-bb94-9f72e9fbefb8', u'yPc': 0.6273115220483642})
    # {u'color': u'red', u'eventType': u'stopPlaying', u'xPc': 0.9049773755656109, u'uuid': u'76233600-65c2-11e8-bb94-9f72e9fbefb8', u'yPc': 0.534850640113798}
    # !! no message will be transmitted if there is no client listening !
    # Check rabbit server also
    print('receiving and broadcasting')
    print channelName
    print data
    sio.emit(channelName, data)

@sio.on('disconnect')
def disconnect(sid):
    print('disconnect ', sid)

def runApp():
    # wrap Flask application with socketio's middleware
  fullapp = socketio.Middleware(sio, app)
  # deploy as an eventlet WSGI server
  eventlet.wsgi.server(eventlet.listen(('', 8000)), fullapp)

if __name__ == '__main__':
  runApp()


