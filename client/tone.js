import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import $ from 'jquery';
import loadTouchEvents from 'jquery-touch-events';
loadTouchEvents($);

import _ from 'underscore';

import Tone from 'tone';

const generateSynth = () => {
  // Test synth and Tone.js modulation
  const scale = 36;
  const pitchEffect = new Tone.PitchShift().toMaster();
  pitchEffect.windowSize = 0.1;

  const tremolo = new Tone.Tremolo(2, 0).connect(pitchEffect).start();
  tremolo.spread = 180;

  const synth = new Tone.Synth().connect(tremolo);

  return {
    synthStart(xPc, yPc) { 
      synth.triggerAttack('C2');
      tremolo.start();
    },
    synthStop() {
      synth.triggerRelease();
      tremolo.stop();
    },
    onXPc(xPc) {
      // Dynamic effects with ~ must be changed
      // with .value =  or a ramp like
      // pitchEffect.feedback.rampTo(fb / 3);
      pitchEffect.feedback.value = xPc / 2;
      pitchEffect.feedback.rampTo(xPc / 1.6, 0.1);
      tremolo.depth.rampTo(xPc, 0.1);
    },
    onYPc(yPc) {
      const pitch = Math.floor(scale * (1 - yPc));
      pitchEffect.pitch = pitch;
    },
    clearSynth() {
      // remove synth from memory
    }
  }
};

Template.Tone_page.onRendered(function helloOnRendered() {
  ////////////////
  // TONE TEST  //
  ////////////////
  const synth = generateSynth();
  // synth.toMaster();
  // synth.oscillator.type = "pwm";
  // synth.triggerAttackRelease("C4", "8n");


  const uuid = '' + Math.floor(Math.random() * 10);
  // const { colorCode } = _.find(streamColorInfos, colorInfo => colorInfo.color === streamColor);
  
  let mousePos = {};

  function handleMouseMove(event) {
    var dot, eventDoc, doc, body, pageX, pageY;

    event = event || window.event; // IE-ism

    // If pageX/Y aren't available and clientX/Y are,
    // calculate pageX/Y - logic taken from jQuery.
    // (This is to support old IE)
    if (event.pageX == null && event.clientX != null) {
        eventDoc = (event.target && event.target.ownerDocument) || document;
        doc = eventDoc.documentElement;
        body = eventDoc.body;

        event.pageX = event.clientX +
          (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
          (doc && doc.clientLeft || body && body.clientLeft || 0);
        event.pageY = event.clientY +
          (doc && doc.scrollTop  || body && body.scrollTop  || 0) -
          (doc && doc.clientTop  || body && body.clientTop  || 0 );
    }

    const width = $(window).width();
    const height = $(window).height();

    mousePos = {
        x: event.pageX,
        y: event.pageY,
        xPc: event.pageX/width,
        yPc: event.pageY/height,
    };
  }

  document.onmousemove = handleMouseMove;

  const newCircle = (x, y) => {
    const circleDiv = $('<div class="good-circle">')
      .css({
          "left": x - 5 + 'px',
          "top": y - 5 + 'px',
          "background-color": "blue"
      })
      .appendTo(document.getElementById('color-page'));

    setTimeout(() => circleDiv.remove(), 5000);
  };

  let playing = false;

  const stillPlaying = () => {
    const {x, y, xPc, yPc} = mousePos;

    newCircle(x, y);
  }

  const checkPlayInAWhile = () => {
    if (playing) {
      stillPlaying();
      synth.onXPc(mousePos.xPc);
      synth.onYPc(mousePos.yPc);
      setTimeout(checkPlayInAWhile, 100)
      return ;
    }
  }

  const startPlaying = (x, y, xPc, yPc) => {
    playing = true;

     synth.synthStart(xPc, yPc);
    newCircle(x, y);

    checkPlayInAWhile();
  };


  const stopPlaying = (x, y, xPc, yPc) => {
    synth.synthStop();
    playing = false;
  }


  // $('body').on('mousedown', (e) => {
  $('body').on('tapstart', (e) => {
    e.preventDefault()
    //multitouch not supported
    if(e.touches && e.touches.length >= 2) return;
    const width = $(window).width();
    const height = $(window).height();

    const eX = e.pageX;
    const eY = e.pageY;

    startPlaying(eX, eY, eX/width, eY/height);
  });

  $('body').on('tapend', (e) => {
    e.preventDefault();
    const width = $(window).width();
    const height = $(window).height();

    const eX = e.pageX;
    const eY = e.pageY;
    stopPlaying(eX, eY, eX/width, eY/height);
  })

  $(document).mouseleave(function () {
    stopPlaying();
  });
});

