import socketio

import eventlet
eventlet.monkey_patch()

internal_sio = socketio.KombuManager('amqp://mcoenca:cristohoger24@localhost:5672/pythonsocket', write_only=True)

channelName = "streamEvents";

# working because we use rabbitmq for inter thread messaging
def emit(data):
  global channelName
  print 'emitting to ' + channelName + ' '
  print data
  internal_sio.emit(channelName, data)

