import ably from 'ably';
import http from 'http';
import socketio from 'socket.io';
import socketioClient from 'socket.io-client';

const STREAM_ABLY   = 1;
const STREAM_METOER = 2;
const STREAM_SOCKET_IO =3;

let g_streamSystem = STREAM_SOCKET_IO;


class StreamChannel
{
    constructor( iChannelName )
    {
        this.channelName = iChannelName;
    }

    subscribe()
    {

    }

    publish()
    {

    }

    onMessage( iMessage )
{

}
}

class AblyStreamChannel extends StreamChannel
{
    constructor( iChannelName )
    {
        super( iChannelName );
        let client = new ably.Realtime('Pc7xqg.jcx1DA:Xbz2vUi-mKgnVBFn');
        this.channel = client.channels.get( this.channelName );
    }

    publish( iEventName, iEvent)
    {
        this.channel.publish( iEventName, iEvent );
    }

    subscribe( iEventName, iCb)
    {
        this.channel.subscribe( iEventName, this.onMessage.bind(this, iCb) );
    }

    onMessage( iCb, iMessage )
    {
        if ( iMessage )
            iCb(  iMessage.data );
    }
}

class MeteorStreamChannel extends StreamChannel
{
    constructor(iChannelName)
    {
        super(iChannelName);
        this.channel = new Meteor.Streamer(this.channelName);
        if (Meteor.isServer)

        {
            this.channel.allowRead('all');
            this.channel.allowWrite('all');
        }
    }

    publish( iEventName, iEvent)
    {
        if(Meteor.isClient)
        {
            console.log( "using meteor");
            this.channel.emit(iEventName, iEvent);
        }
    }

    subscribe( iEventName, iCb)
    {
        if(Meteor.isClient)
        {
            this.channel.on(iEventName, this.onMessage.bind(this, iCb));
        }
    }

    onMessage( iCb, iMessage )
    {
        iCb( iMessage );
    }
}

class SocketIoStreamChannel extends StreamChannel
{
    constructor(iChannelName)
    {
        super(iChannelName);
        
        this.channelName = iChannelName;

        this.port = 8080;
        // Connect client socket to meteor socket server
        // this.clientPort = 8080;
        
        // Connect client to external python socketIo Server
        this.clientPort = 8000;

        console.log( "streaming using socket io");

        if (Meteor.isServer)
        {

            // setting up alternate http server for socketio
            const server = http.createServer();
            this.io = socketio(server);

            try {
                server.listen(this.port);

                this.io.on('connection', (socket) => {
                    console.log('a user connected');
                    
                    // broadcasting
                    socket.on(this.channelName, (msg) => {
                        // socket.broadcast.emit(msg);
                        this.io.emit(this.channelName, msg);
                    });

                    socket.on('disconnect', () => {
                        console.log('user disconnected');
                    });
                });
            } catch (e) {
                console.error(e);
            }
        }

        if (Meteor.isClient) {
            this.socket = socketioClient(window.location.hostname + ":" + this.clientPort);
        }
    }

    publish( iEventName, iEvent)
    {
        console.log( "streaming using socket io");
        if (Meteor.isServer) {
            // on the server, this will broadcast to all clients
            this.io.emit(iEventName, iEvent);
        }

        if (Meteor.isClient) {
            this.socket.emit(iEventName, iEvent);
        }
    }

    subscribe( iEventName, iCb)
    {
        if(Meteor.isClient)
        {
            this.socket.on(this.channelName, this.onMessage.bind(this, iCb));
        }
    }

    onMessage( iCb, iMessage )
    {   
        iCb( iMessage );
    }
}

function GetCreateStreamChannel()
{
    if ( g_streamSystem === STREAM_ABLY )
    {
        return new AblyStreamChannel('streamEvents');
    }
    else if( g_streamSystem === STREAM_SOCKET_IO) 
    {
        return new SocketIoStreamChannel('streamEvents');
    }
    else
    {
        return new MeteorStreamChannel('streamEvents');
    }

}

const channel = GetCreateStreamChannel();

export { channel as streamChannel }
