import { AudioSampler } from '/imports/AudioSampler.js';
import Tuna from 'tunajs';

let audioCtx;
let tuna;
let user1;

let WIDTH;
let HEIGHT;

export const initAudio = function (AudioContext, soundsRootUrl) {
  // create web audio api context
  var audioCtx = new AudioContext();
  tuna = new Tuna(audioCtx);
  // create user
  user1 = new AudioSampler(audioCtx, tuna, soundsRootUrl);
  //var user2 = new AudioSampler();
  user1.setSample(1);
  //user2.setSample(3);

  // create initial window dimensions
  WIDTH = window.innerWidth;
  HEIGHT = window.innerHeight;
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

const random = function(number1,number2) {
  var randomNo = number1 + (Math.floor(Math.random() * (number2 - number1)) + 1);
  return randomNo;
}


export const sendClick = function (e) {
    const curX = (window.Event) ? e.pageX : event.clientX + (document.documentElement.scrollLeft ? document.documentElement.scrollLeft : document.body.scrollLeft);
    
    const curY = (window.Event) ? e.pageY : event.clientY + (document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop);
    
    user1.touchEvent(true, CurX/WIDTH, CurY/HEIGHT);
}

export const simpleSendClick = function (e) {
  user1.touchEvent(true, e.clientX/WIDTH, e.clientY/HEIGHT);
}

// activate for whole screen
// document.onmousedown = sendClick;
export default { initAudio, sendClick, simpleSendClick };
