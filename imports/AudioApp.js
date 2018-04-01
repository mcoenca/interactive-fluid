import { AudioSampler } from '/imports/AudioSampler.js';
import { AudioSynth } from '/imports/AudioSynth.js';
import Tuna from 'tunajs';
import Tone from 'tone';

let audioCtx;
let tuna;
let soundsRootUrl;
let timeOrigin;
let outputNode;
let fxNode;
let kickPlayer;
let bassPlayer;
let WIDTH;
let HEIGHT;
let beatCount = 0;

export const initAudio = function (audioContext, soundsRoot) {
  // create web audio api context
  audioCtx = audioContext;
  tuna = new Tuna(audioCtx);
  Tone.setContext(audioContext);
  soundsRootUrl = soundsRoot;
  timeOrigin = audioCtx.currentTime;

  console.log(audioCtx.sampleRate);
  // audio setup
  outputNode = audioCtx.createGain();
  outputNode.gain.value = 1.0;
  fxNode = new tuna.Convolver({
      highCut: 20000,                         //20 to 22050
      lowCut: 20,                             //20 to 22050
      dryLevel: 0,                            //0 to 1+
      wetLevel: 1,                            //0 to 1+
      level: 0.5,                               //0 to 1+, adjusts total output of both wet and dry
      impulse: `${soundsRootUrl}/impulse/033.wav`,    //the path to your impulse response
      bypass: 0
    });

  outputNode.connect(audioCtx.destination);
  fxNode.connect(audioCtx.destination);
  kickPlayer = createUser(
    {
      voice: 'sampler',
      sound: '001',
      quantize: 1
    }
  );
  bassPlayer = createUser(
    {
      voice: 'synth',
      sound: 'bass',
      quantize: 1
    }
  );
  setInterval(function(){
    kickPlayer.sampler.touchEvent('start', 0, 0.9);
    if (beatCount % 16 == 0) {
      bassPlayer.sampler.touchEvent('start', 0.99, 0.8);}
    else if (beatCount % 16 == 8){
      bassPlayer.sampler.touchEvent('start', 0.7, 0.8);}
    beatCount = (beatCount+1) % 16;
    }, 1000);
  // create initial window dimensions
  WIDTH = window.innerWidth;
  HEIGHT = window.innerHeight;
}

const random = function(number1,number2) {
  var randomNo = number1 + (Math.floor(Math.random() * (number2 - number1)) + 1);
  return randomNo;
}


const sendClick = function (e) {
    const curX = (window.Event) ? e.pageX : event.clientX + (document.documentElement.scrollLeft ? document.documentElement.scrollLeft : document.body.scrollLeft);
    
    const curY = (window.Event) ? e.pageY : event.clientY + (document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop);
    
    user1.touchEvent(true, CurX/WIDTH, CurY/HEIGHT);
}

const simpleSendClick = (sampler) => (e) => {
  sampler.touchEvent(e.evt, e.clientX/WIDTH, e.clientY/HEIGHT);
}


export const createUser = function(userStruct) {
  var user;

  if (userStruct.voice == 'sampler')
  {
    user = new AudioSampler(audioCtx, tuna, soundsRootUrl, outputNode, fxNode, userStruct.quantize, userStruct.sound);
  }
  else if (userStruct.voice == 'synth')
  {
    user = new AudioSynth(audioCtx, tuna, soundsRootUrl, outputNode, fxNode, userStruct.quantize, userStruct.sound);
  }

  return {
    sampler : user,
    sendClick : simpleSendClick(user)
  }
}

// canvas
/*
var canvas = document.querySelector('.canvas');
canvas.width = WIDTH;
canvas.height = HEIGHT;

var canvasCtx = canvas.getContext('2d');
*/
// Get new mouse pointer coordinates when mouse is moved
// then send the values to the users





// activate for whole screen
// document.onmousedown = sendClick;
export default { initAudio, createUser };
