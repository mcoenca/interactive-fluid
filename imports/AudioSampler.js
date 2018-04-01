class AudioSampler {
    constructor(
        audioCtx, 
        tuna,
        soundsRootUrl,
        outputNode,
        fxNode,
        quantize,
        sound
    ){
        this.audioCtx = audioCtx;
        this.tuna = tuna;
        this.soundsRootUrl = soundsRootUrl;
        this.quantize = quantize;

        this.fxGainNode = this.audioCtx.createGain();
        this.masterGainNode = this.audioCtx.createGain();
        this.masterGainNode.gain.value = 1.0;
        this.buffer = null;
        this.bufferSource = null;
        this.setSample(sound);

        // this.bufferSource = this.createBufferSource(); // creates a sound source

        this.masterGainNode.connect(outputNode);
        this.fxGainNode.connect(fxNode);
    }

    createBufferSource() {
        const bufferSource = this.audioCtx.createBufferSource();
        bufferSource.connect(this.fxGainNode);       // connect the source to the context's destination (the speakers)
        bufferSource.connect(this.masterGainNode);       // connect the source to the context's destination (the speakers)
        bufferSource.buffer = this.buffer;

        return bufferSource;
    }

    setSample(sample){
        var self = this;
        var request = new XMLHttpRequest();
        //request.open('GET', 'http://localhost:3000/sounds/00' + sample + '.wav', true);
        // http://localhost:3000/sounds/audioclip-1521391848.wav
        let url = `${self.soundsRootUrl}/${sample}.wav`;
        console.log(url);

        request.open('GET', url, true);
        request.responseType = 'arraybuffer';

        // Decode asynchronously
        request.onload = function() {
            self.audioCtx.decodeAudioData(request.response, function(buffer) {
                self.buffer = buffer;
                // self.bufferSource.buffer = buffer;
                console.log('sample loaded');
            }, null);
        }
        request.send();
    }

    touchEvent(evt, x, y){
        if (evt == 'start')
        {
            // console.log('click');
            this.fxGainNode.gain.value = 1-y;

            // I added this because replauying the original source did not work
            this.bufferSource = this.createBufferSource();

            this.bufferSource.playbackRate.value = 1.0 + x;
            if (this.quantize != 0)
            {
                var numQuants = this.audioCtx.currentTime * this.quantize;
                /*
                if (numQuants % 1 < 0.1)

                {
                  newSource.start(0);
                  console.log(numQuants % 1);
                }
                else
                */
                {
                  var playTime = (Math.floor(numQuants) + 1) / this.quantize;
                  this.bufferSource.start(playTime);
                }
            }
            else
            {
              this.bufferSource.start(0);                           // play the source now
            }
        }
        else if (evt == 'drag')
        {
          this.fxGainNode.gain.value = 1-y;
          this.bufferSource.playbackRate.value = 1.0 + x;

        }
    }
};

export { AudioSampler };
