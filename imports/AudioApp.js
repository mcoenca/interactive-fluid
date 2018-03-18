import { AudioSampler } from '/AudioSampler.js';

// create web audio api context
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioCtx = new AudioContext();
var tuna = new Tuna(audioCtx);
// create user
var user1 = new AudioSampler();
//var user2 = new AudioSampler();
user1.setSample(1);
//user2.setSample(3);

// create initial window dimensions
var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;

// Mouse pointer coordinates

var CurX;
var CurY;

// canvas
/*
var canvas = document.querySelector('.canvas');
canvas.width = WIDTH;
canvas.height = HEIGHT;

var canvasCtx = canvas.getContext('2d');
*/
// Get new mouse pointer coordinates when mouse is moved
// then send the values to the users

document.onmousedown = sendClick;

function sendClick(e) {
    CurX = (window.Event) ? e.pageX : event.clientX + (document.documentElement.scrollLeft ? document.documentElement.scrollLeft : document.body.scrollLeft);
    CurY = (window.Event) ? e.pageY : event.clientY + (document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop);
    user1.touchEvent(true, CurX/WIDTH, CurY/HEIGHT);
}

function random(number1,number2) {
  var randomNo = number1 + (Math.floor(Math.random() * (number2 - number1)) + 1);
  return randomNo;
}
