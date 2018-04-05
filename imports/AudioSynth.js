import Tone from 'tone';
import Distance from 'tonal';

let minorScale = ["A1", "B1", "C2", "D2", "E2", "F2", "G2", "A2"];


const synths = {
  bass: {
    create(instance) {
      instance.synth = new Tone.Synth();

      instance.filter=new Tone.Filter({
       'frequency':100,
       'Q':10,
        'rolloff':-12
        });
      vol=new Tone.Volume(-24).chain(instance.filter);
      instance.lfo=new Tone.LFO(2,100,400);
      instance.lfo.connect(instance.filter.frequency);


      instance.enve =new Tone.AmplitudeEnvelope({
            "attack": 0.005,
            "decay": 0.1,
            "sustain": 0.3,
            "release": 0.5
        }).connect(vol);

       instance.osci2=new Tone.OmniOscillator({
        "type":"sawtooth",
        "detune":15
       }).connect(instance.enve)
       instance.osci2.start();


      instance.osci3=new Tone.OmniOscillator({
        "type":"sawtooth",
        "detune":-15
       }).connect(instance.enve)
       instance.osci3.start();

       instance.osci=new Tone.OmniOscillator({
        "type":"sine"
       }).connect(instance.enve)
       instance.osci.start();


      instance.output = instance.filter;
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
          this.osci.frequency.value = note;
          this.osci2.frequency.value = note;
          this.osci3.frequency.value = note;
          this.enve.triggerAttack();
          //this.synth.triggerAttack(note, playTime);
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
        //this.synth.triggerRelease();
        this.enve.triggerRelease();

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

      vol=new Tone.Volume(-10).chain(instance.tremolo,instance.pitchEffect);

      instance.synth = new Tone.Synth().connect(vol);



      instance.output = instance.pitchEffect;
      //return instance.pitchEffect;
    },

    touchEvent(evt, x, y) {
      const scale = 24;

      if (evt == 'startPlaying')
      {
        this.tremolo.start();

        if (this.quantize != 0)
        {
          var numQuants = this.audioCtx.currentTime * this.quantize;
          var playTime = (Math.floor(numQuants) + 1) / this.quantize;
          this.synth.triggerAttack('C3', playTime);
        }
        else
        {
          this.synth.triggerAttack('C3', 0);
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

          instance.lfo=new Tone.LFO(0.5,400,800);
                instance.filter=new Tone.Filter({
                  'frequency':500,
                  'Q':20
                }
                );
         instance.lfo.connect(instance.filter.frequency);
         instance.pitchEffect = new Tone.PitchShift();

/*        instance.phaser = new Tone.Phaser ({
          "baseFrequency":200,
          "Q":1} );
*/
        instance.tremolo=new Tone.Tremolo(5, 0.75)
        chorus=new Tone.Chorus ({
          "frequency":0.5});
        

        vol=new Tone.Volume(-34).chain(chorus,instance.filter,instance.tremolo,instance.pitchEffect);


     
        instance.enve =new Tone.AmplitudeEnvelope({
              "attack": 2,
              "decay": 1,
              "sustain": 1,
              "release": 2
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


      instance.output = instance.pitchEffect;


    },
      touchEvent(evt, x, y) {

      if (evt == 'startPlaying')
      {
        //console.log('click');
        this.fxGainNode.gain.rampTo(1-y, 0.1);
        var ind=Math.floor(x*minorScale.length);



        var note = Distance.transpose(minorScale[Math.floor(x*minorScale.length)],'8P');
        
        if (this.quantize != 0)
        {
          var numQuants = this.audioCtx.currentTime * this.quantize;
          var playTime = (Math.floor(numQuants) + 1) / this.quantize;
          var freqb=Math.pow(10,2.2+x);
          var freqh=Math.pow(10,2.5+x);
          var q=Math.pow(10,-0.7+x*2);
          this.lfo.min=freqb;
          this.lfo.max=freqh;
            this.filter.Q=q;
          this.osci.frequency.value = note;
 
          this.osci2.frequency.value= Distance.transpose(note,'3M');
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
            var freqb=Math.pow(10,2.2+x);
          var freqh=Math.pow(10,2.5+x);
                    var q=Math.pow(10,-0.7+x*2);
            this.lfo.min=freqb;
            this.lfo.max=freqh;
            this.filter.Q=q;

      }
      else if (evt == 'stopPlaying')
      {
        this.enve.triggerRelease();
      }
    }
  },
  poly: {
    create(instance) {
      instance.synth = new Tone.PolySynth(4, Tone.Synth);
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
  noise : {
    create(instance) {

      const vol = new Tone.Gain(0.1);

      instance.env = new Tone.AmplitudeEnvelope({
        "attack": 3,
        "decay": 1,
        "sustain": 2,
        "release": 5
      }).connect(vol);

      instance.filter = new Tone.AutoFilter({
        // "frequency" : "4n", 
        "frequency": "3Hz",
        "min" : 800, 
        "max" : 3000
      }).connect(instance.env);

      instance.synth = new Tone.Noise("pink");
      instance.synth.connect(instance.filter);

      instance.output = vol;
    },
    touchEvent(evt, x, y) {

      if (evt == 'startPlaying')
      { 
        this.filter.start();
        this.synth.start();
        this.env.triggerAttack();
      }
      else if (evt == 'stillPlaying')
      {
        // const freqAmp = 800;
        // const note = minorScale[Math.floor(x*minorScale.length)];
        const freq = (2 + 10 *  ( 1- x) ) + "Hz";
        this.filter.frequency.rampTo(freq, 0.1);

        this.filter.depth.rampTo(1 - 0.3 * ( 1 - y) , 0.1);
        this.filter.min = 800 + y * 3000;
        this.filter.max = 3000 + y * 3000;
      }
      else if (evt == 'stopPlaying')
      {
        // this.output.stop();
        // this.synth.stop();
        this.env.triggerRelease();
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

    this.fxGainNode.gain.value = 0.7;
    this.masterGainNode.gain.value = 0.7;


    this.masterGainNode.connect(outputNode);
    this.fxGainNode.connect(fxNode);

    let synthInfo = synths[this.sound];
    if (!synthInfo) synthInfo = synths['bass'];

    synthInfo.create(this);

    this.output.connect(this.masterGainNode);
    this.output.connect(this.fxGainNode);
    // this.synth.toMaster();

    this.touchEvent = synthInfo.touchEvent.bind(this);
  }
};

export { AudioSynth };
