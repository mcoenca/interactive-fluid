import Tone from 'tone';
import Distance from 'tonal';

let minorScale = ["A1", "B1", "C2", "D2", "E2", "F2", "G2", "A2"];


const synths = {
  bass: {
    create(instance) {
      instance.synth = new Tone.Synth();
      instance.output = instance.synth;
    },
    touchEvent(evt, x,y) {
      if (evt == 'startPlaying')
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
      else if (evt == 'stillPlaying')
      {

      }
      else if (evt == 'stopPlaying')
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
      instance.output = instance.synth;
    },
    touchEvent(evt, x, y) {
      if (evt == 'startPlaying')
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
      else if (evt == 'stillPlaying')
      {

      }
      else if (evt == 'stopPlaying')
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
      instance.output = instance.pitchEffect;
      //return instance.pitchEffect;
    },

    touchEvent(evt, x, y) {
      const scale = 36;

      if (evt == 'startPlaying')
      {
        this.tremolo.start();

        if (this.quantize != 0)
        {
          var numQuants = this.audioCtx.currentTime * this.quantize;
          var playTime = (Math.floor(numQuants) + 1) / this.quantize;
          this.synth.triggerAttack('C2', playTime);
        }
        else
        {
          this.synth.triggerAttack('C2', 0);
        }
      }
      else if (evt == 'stillPlaying')
      {
        this.pitchEffect.feedback.value = x / 2;
        this.pitchEffect.feedback.rampTo(x / 1.6, 0.1);
        this.tremolo.depth.rampTo(x, 0.1);

        const pitch = Math.floor(scale * (1 - y));
        this.pitchEffect.pitch = pitch;
      }
      else if (evt == 'stopPlaying')
      {
        this.synth.triggerRelease();
      }
    }
  },
  pad: {
      create(instance) {

          var lfo=new Tone.LFO(0.5,400,600);
                instance.filter=new Tone.Filter({
                  'frequency':500,
                  'Q':10
                }
                );
         lfo.connect(instance.filter.frequency);

/*        instance.phaser = new Tone.Phaser ({
          "baseFrequency":200,
          "Q":1} );
*/
        instance.tremolo=new Tone.Tremolo(5, 0.75)
        vol=new Tone.Volume(-24).chain(instance.filter,instance.tremolo);


     
        instance.enve =new Tone.AmplitudeEnvelope({
              "attack": 10,
              "decay": 1,
              "sustain": 1,
              "release": 3
          }).connect(vol);

       instance.osci2=new Tone.OmniOscillator({
        "type":"sawtooth",
        "frequency":"G#3"
       }).connect(instance.enve)
       instance.osci2.start();


        instance.osci3=new Tone.OmniOscillator({
        "type":"sawtooth",
        "frequency":"C4"
       }).connect(instance.enve)
       instance.osci3.start();

       instance.osci=new Tone.OmniOscillator({
        "type":"sawtooth"
       }).connect(instance.enve)
       instance.osci.start();


      instance.output = instance.tremolo;


    },
      touchEvent(evt, x, y) {
      if (evt == 'startPlaying')
      {
        //console.log('click');
        this.fxGainNode.gain.value = 1-y;
        var ind=Math.floor(x*minorScale.length);



        var note = Distance.transpose(minorScale[Math.floor(x*minorScale.length)],'8P');
        
        if (this.quantize != 0)
        {
          var numQuants = this.audioCtx.currentTime * this.quantize;
          var playTime = (Math.floor(numQuants) + 1) / this.quantize;
          
          this.osci.frequency.value = note;
 
          this.osci2.frequency.value= Distance.transpose(note,'3m');
          this.osci3.frequency.value= Distance.transpose(note,'5M');


          this.enve.triggerAttack();
        }
        else
        {
          this.enve.triggerAttack(0);

        }
      }
      else if (evt == 'stillPlaying')
      {

      }
      else if (evt == 'stopPlaying')
      {
        this.enve.triggerRelease();
      }
    }


  }
};

class AudioSynth {
  constructor(
    audioCtx,
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

    this.fxGainNode = new Tone.Gain();
    this.masterGainNode = new Tone.Gain();

    this.masterGainNode.connect(outputNode);
    this.fxGainNode.connect(fxNode);

    let synthInfo = synths[this.sound];
    if (!synthInfo) synthInfo = synths['bass'];

    synthInfo.create(this);

    this.output.connect(this.masterGainNode);
    this.output.connect(this.fxGainNode);
    //this.synth.toMaster();

    this.touchEvent = synthInfo.touchEvent.bind(this);
  }
};

export { AudioSynth };
