import Tone from 'tone';

let minorScale = ["A1", "B1", "C2", "D2", "E2", "F2", "G2", "A2"];

const synths = {
  bass: {
    create(instance) {
      instance.synth = new Tone.Synth();
    },
    touchEvent(evt, x,y) {
      if (evt == 'start')
      {
        //console.log('click');
        this.fxGainNode.gain.value = 1-y;
        var note = minorScale[Math.floor(x*minorScale.length)];
        
        if (this.quantize != 0)
        {
          var numQuants = this.audioCtx.currentTime * this.quantize;
          var playTime = (Math.floor(numQuants) + 1) / this.quantize;
          this.synth.triggerAttack(note, playTime);
        }
        else
        {
          this.synth.triggerAttack(note, 0);
        }
      }
      else if (evt == 'drag')
      {

      }
      else if (evt == 'stop')
      {
        this.synth.triggerRelease();
      }
    }
  }, 
  square: {
    create(instance) {
      instance.synth = new Tone.Synth({
        oscillator: {
          type: "square"
        }
      });
    },
    touchEvent(evt, x, y) {
      if (evt == 'start')
      {
        //console.log('click');
        this.fxGainNode.gain.value = 1-y;
        var note = minorScale[Math.floor(x*minorScale.length)];
        
        if (this.quantize != 0)
        {
          var numQuants = this.audioCtx.currentTime * this.quantize;
          var playTime = (Math.floor(numQuants) + 1) / this.quantize;
          this.synth.triggerAttack(note, playTime);
        }
        else
        {
          this.synth.triggerAttack(note, 0);
        }
      }
      else if (evt == 'drag')
      {

      }
      else if (evt == 'stop')
      {
        this.synth.triggerRelease();
      }
    }
  },
  tremoloTriangle: {
    create(instance) {
      instance.pitchEffect = new Tone.PitchShift();
      instance.pitchEffect.windowSize = 0.1;

      instance.tremolo = new Tone.Tremolo(2, 0).connect(instance.pitchEffect).start();
      instance.tremolo.spread = 180;

      instance.synth = new Tone.Synth().connect(instance.tremolo);
      return instance.pitchEffect;
    },

    touchEvent(evt, x, y) {
      const scale = 36;

      if (evt == 'start')
      {
        this.tremolo.start();

        if (this.quantize != 0)
        {
          var numQuants = this.audioCtx.currentTime * this.quantize;
          var playTime = (Math.floor(numQuants) + 1) / this.quantize;
          this.synth.triggerAttack('C2', playtime);
        }
        else
        {
          this.synth.triggerAttack('C2', 0);
        }
      }
      else if (evt == 'drag')
      {
        this.pitchEffect.feedback.value = x / 2;
        this.pitchEffect.feedback.rampTo(x / 1.6, 0.1);
        this.tremolo.depth.rampTo(x, 0.1);

        const pitch = Math.floor(scale * (1 - y));
        this.pitchEffect.pitch = pitch;
      }
      else if (evt == 'stop')
      {
        this.synth.triggerRelease();
      }
    }
  }
};

class AudioSynth {
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
    Tone.setContext(audioCtx);
    this.soundsRootUrl = soundsRootUrl;
    this.quantize = quantize;
    this.sound = sound;

    // this.fxGainNode = new Tone.Gain();
    // this.masterGainNode = new Tone.Gain();

    // this.masterGainNode.connect(outputNode);
    // this.fxGainNode.connect(fxNode);

    let synthInfo = synths[this.sound];
    if (!synthInfo) synthInfo = synths['bass'];

    synthInfo.create(this);

    // this.synth.connect(this.masterGainNode);
    // this.synth.connect(this.fxGainNode);
    this.synth.toMaster();

    this.touchEvent = synthInfo.touchEvent.bind(this);
  }
};

export { AudioSynth };
