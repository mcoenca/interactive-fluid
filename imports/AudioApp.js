import Tone from 'tone';

import { AudioSampler } from '/imports/AudioSampler.js';
import { AudioSynth } from '/imports/AudioSynth.js';
import { enableMidi, WebMidiControl } from '/imports/AudioMidi.js';

let audioCtx;
let tuna;
let soundsRootUrl;
let timeOrigin;
let outputNode;
let fxNode;
let kickPlayer;
let bassPlayer;
let beatCount = 0;
let midiInput = null;

const handleEvent = (user) => ({eventType, xPc, yPc}) => {
  user.touchEvent(eventType, xPc, yPc);
}

export const createUser = function(userStruct) {
  const {
    voice,
    sound,
    quantize,
  } = userStruct;

  let user;

  if (voice == 'sampler')
  {
    user = new AudioSampler(audioCtx, soundsRootUrl, outputNode, fxNode, quantize, sound);
  }
  else if (voice == 'synth')
  {
    user = new AudioSynth(audioCtx, soundsRootUrl, outputNode, fxNode, quantize, sound);
  }

  return {
    sampler : user,
    handleEvent : handleEvent(user),
    onNoteOn: user.onNoteOn,
    onNoteOff: user.onNoteOff,
  };
}

export const initAudio = function (soundsRoot, initLoop = true, {
  onMidiNotePlayed = () =>{}
} = {}) {
  // create web audio api context
  audioCtx = Tone.context;
  //tuna = new Tuna(audioCtx);

  soundsRootUrl = soundsRoot;
  timeOrigin = audioCtx.currentTime;

  // console.log(audioCtx.sampleRate);
  // audio setup
  // 
  fxNode = new Tone.Gain();
  postFxNode = new Tone.Gain();
  outputNode = new Tone.Gain();

  outputNode.gain.value = 0.5;
  postFxNode.gain.value = 0.5;

  outputNode.toMaster();
  postFxNode.toMaster();

  // outputNode.gain.value = 1.0;
  /*fxConvolver = new tuna.Convolver({
      highCut: 20000,                         //20 to 22050
      lowCut: 20,                             //20 to 22050
      dryLevel: 0,                            //0 to 1+
      wetLevel: 1,                            //0 to 1+
      level: 0.5,                               //0 to 1+, adjusts total output of both wet and dry
      impulse: `${soundsRootUrl}/impulse/033.wav`,    //the path to your impulse response
      bypass: 0
    });*/
  let url = `${soundsRootUrl}/impulse/033.wav`;
  console.log(url);
  fxMasterEffect = new Tone.Convolver(url, () => console.log('ir loaded'));

  fxMasterEffect = new Tone.Freeverb (0.9, 1000);

  fxMasterEffect.connect(postFxNode);

  fxNode.gain.value = 0.4;
  fxNode.connect(fxMasterEffect);



  const initKickLoop = () => {
    kickPlayer = createUser(
      {
        voice: 'sampler',
        sound: '001',
        quantize: 1
      }
    );
    // kickPlayer.fxGainNode.value = 0.7;
    kickPlayer.sampler.masterGainNode.gain.value = 0;
    bassPlayer = createUser(
      {
        voice: 'synth',
        sound: 'bass',
        quantize: 1
      }
    );

    setInterval(function(){
    kickPlayer.sampler.touchEvent('startPlaying', 0, 0.8);
    if (beatCount % 16 == 0) {
      bassPlayer.sampler.touchEvent('startPlaying', 0.99, 0.8);
    } else if (beatCount % 16 == 8){
      bassPlayer.sampler.touchEvent('startPlaying', 0.7, 0.8);}
    beatCount = (beatCount+1) % 16;
    }, 1000);
  };

  if (initLoop) {
    initKickLoop();
  }

  enableMidi(() => {
    midiInput = new WebMidiControl('USB Keystation 49e');
    if (midiInput.input) {
      const midiUser = createUser({
        voice: 'synth',
        sound: 'fm',
      });

      midiInput.addValueListener('pitchbend', (value) => {
        midiUser.handleEvent({
          eventType: 'stillPlaying', 
          xPc: value, 
          yPc: null
        });
      });

      midiInput.addNoteListener('noteon', (noteAndOctave, number) => {
        midiUser.onNoteOn(noteAndOctave);
        onMidiNotePlayed(noteAndOctave, number);
      });

      midiInput.addNoteListener('noteoff', (noteAndOctave, number) => {
        midiUser.onNoteOff();
      });
    }
  });
}

export default { initAudio, createUser };
