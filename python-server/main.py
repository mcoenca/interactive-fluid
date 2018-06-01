# Same code than in Meteor.isServer
# of MainStream.js
import socketio
import eventlet
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
    sio.emit(channelName, data)

@sio.on('disconnect')
def disconnect(sid):
    print('disconnect ', sid)

if __name__ == '__main__':
    # wrap Flask application with socketio's middleware
    app = socketio.Middleware(sio, app)

    # deploy as an eventlet WSGI server
    eventlet.wsgi.server(eventlet.listen(('', 8000)), app)
