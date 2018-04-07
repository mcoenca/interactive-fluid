import ably from 'ably'

const STREAM_ABLY   = 1;
const STREAM_METOER = 2;

let g_streamSystem = STREAM_ABLY;

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

function GetCreateStreamChannel()
{
    if ( g_streamSystem === STREAM_ABLY )
    {
        return new AblyStreamChannel('streamEvents');
    }
    else
    {
        return new MeteorStreamChannel('streamEvents');
    }

}

const channel = GetCreateStreamChannel();

export { channel as streamChannel }
