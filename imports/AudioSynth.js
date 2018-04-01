import Tone from 'tone';

let minorScale = ["A1", "B1", "C2", "D2", "E2", "F2", "G2", "A2"];

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
    this.soundsRootUrl = soundsRootUrl;
    this.quantize = quantize;
    this.sound = sound;

    this.fxGainNode = this.audioCtx.createGain();
    this.masterGainNode = this.audioCtx.createGain();
    this.masterGainNode.gain.value = 1.0;

    this.masterGainNode.connect(outputNode);
    this.fxGainNode.connect(fxNode);

    Tone.setContext(audioCtx);

    if (this.sound == 'bass')
    {
      this.synth = new Tone.Synth();
    }
    else
    {
      this.synth = new Tone.Synth();
      /*
      WEIRD ERROR
      this.synth.oscillator.type = "pwm";
      this.synth.oscillator.count = 3;
      this.synth.oscillator.spread = 10;
      */
    }
    this.synth.connect(this.masterGainNode);
    this.synth.connect(this.fxGainNode);
  }

  touchEvent(evt, x, y){
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
};

export { AudioSynth };
