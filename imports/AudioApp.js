import { AudioSampler } from '/imports/AudioSampler.js';
import Tuna from 'tunajs';

let audioCtx;
let tuna;
let soundsRootUrl;

let WIDTH;
let HEIGHT;

export const initAudio = function (AudioContext, soundsRoot) {
  // create web audio api context
  audioCtx = new AudioContext();
  tuna = new Tuna(audioCtx);
  soundsRootUrl = soundsRoot;

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
  sampler.touchEvent(true, e.clientX/WIDTH, e.clientY/HEIGHT);
}


export const createUser = function(sample) {

  const userSampler = new AudioSampler(audioCtx, tuna, soundsRootUrl);

  //var user2 = new AudioSampler();
  userSampler.setSample(sample);
  //user2.setSample(3);
  //
  return {
    sampler : userSampler,
    sendClick : simpleSendClick(userSampler)
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
