class AudioSampler {
    constructor(){
        this.bufferSource = audioCtx.createBufferSource(); // creates a sound source

        this.fxGainNode = audioCtx.createGain();
        this.masterGainNode = audioCtx.createGain();
        this.masterGainNode.gain.value = 1.0;

        this.buffer = null;
        this.pingPongDelay = new tuna.PingPongDelay({
            wetLevel: 1.0, //0 to 1
            feedback: 0.2, //0 to 1
            delayTimeLeft: 150, //1 to 10000 (milliseconds)
            delayTimeRight: 250 //1 to 10000 (milliseconds)
        });

        this.bufferSource.connect(this.fxGainNode);       // connect the source to the context's destination (the speakers)
        this.bufferSource.connect(this.masterGainNode);       // connect the source to the context's destination (the speakers)
        this.masterGainNode.connect(audioCtx.destination);
        this.fxGainNode.connect(this.pingPongDelay);
        this.pingPongDelay.connect(audioCtx.destination);
    }

    setSample(sample){
        var self = this;
        var request = new XMLHttpRequest();
        //request.open('GET', 'http://localhost:8080/sounds/00' + sample + '.wav', true);
        request.open('GET', 'http://localhost:8080/sounds/audioclip-1521391848.wav', true);
        request.responseType = 'arraybuffer';

        // Decode asynchronously
        request.onload = function() {
            audioCtx.decodeAudioData(request.response, function(buffer) {
                self.buffer = buffer;
                self.bufferSource.buffer = buffer;
                console.log('sample loaded');
            }, null);
        }
        request.send();
    }

    touchEvent(state, x, y){
        if (state)
        {
            console.log('click');
            this.fxGainNode.gain.value = y;
            this.bufferSource.playbackRate.value = 1.0 + x;
            this.bufferSource.start(0);                           // play the source now
        }
    }
};

export { AudioSampler };
