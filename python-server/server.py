# Same code than in Meteor.isServer
# of MainStream.js
import socketio
import eventlet
import threading
import kinect
from flask import Flask, render_template

sio = socketio.Server()
app = Flask(__name__)

channelName = "streamEvents";

@app.route('/')
def index():
    """Serve the client-side application."""
    # return render_template('index.html')
    return '<h1>Hello</h1';

@sio.on('connect')
def connect(sid, environ):
    print('connect ', sid)

@sio.on(channelName)
def message(sid, data):
    # print ('message received')
    # ('message ', {u'color': u'red', u'eventType': u'startPlaying', u'xPc': 0.7375565610859729, u'uuid': u'76233600-65c2-11e8-bb94-9f72e9fbefb8', u'yPc': 0.6273115220483642})
    # {u'color': u'red', u'eventType': u'stopPlaying', u'xPc': 0.9049773755656109, u'uuid': u'76233600-65c2-11e8-bb94-9f72e9fbefb8', u'yPc': 0.534850640113798}
    sio.emit(channelName, data)

def emit(data):
  print('emitting')
  sio.emit(channelName, data)

def configKinect():
  kinect.showScreens(emit)

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


