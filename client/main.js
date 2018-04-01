// Packages
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import $ from 'jquery';
import loadTouchEvents from 'jquery-touch-events';
loadTouchEvents($);

import _ from 'underscore';

import ably from 'ably'
const realtime = new ably.Realtime('P6TapA.DpvyQg:xpEbBUNQPVRdd9Va');
const channel = realtime.channels.get('shapes');
const streamChannel = realtime.channels.get('streamEvents');

import Tone from 'tone';

// Related dependencies
import 'bootstrap/dist/css/bootstrap.min.css';
import './main.css';

// Templates
import './main.html';
import './color.html';

import {perc2color} from '/imports/utils.js';

// Libs
import { default as FluidApp } from '/imports/Fluid/FluidApp.js';

import { initAudio, createUser } from '/imports/AudioApp.js';

import { initUsbKeyStationMidi, setKeyStationNoteHook } from '/imports/MidiApp.js';


let CURRENT_FLUID_APP = FluidApp.FLUID_SIMULATION_APPS_KEY.NEW_APP;
let audioContext;

Shapes = new Mongo.Collection('shapes');

Shapes.schema = new SimpleSchema({
  name: {type: String},
  events : {type: [Object]},
});


FlowRouter.route('/', {
  name: 'Main',
  action(params, queryParams) {
    BlazeLayout.render('App_body', {main: 'Main_page'});
    BlazeLayout.setRoot('body');
  }
});

const palettes = [
{
  name: 'classic',
  colorInfos: [{
    color: 'red',
    colorCode: 'red',
    id: 1
  }, {
    color: 'green',
    colorCode: 'green',
    id: 2
  }, {
    color: 'blue',
    colorCode: 'blue',
    id: 3
  }, {
    color: 'yellow',
    colorCode: 'yellow',
    id: 4
  }, {
    color: 'turquoise',
    colorCode: '#39e1ff',
    id: 5
  }]
}, 
{
  name: 'perfect-day-1',
  colorInfos : [{
    color: 'pink',
    colorCode: '#f27eba',
    id: 6
  }, {
    color: 'sky',
    colorCode: '#87B2E8',
    id: 7
  }, {
    color: 'purple',
    colorCode: '#6c1ae8',
    id: 8
  }, {
    color: 'orange',
    colorCode: '#e87a1a',
    id: 9
  }, {
    color: 'green',
    colorCode: '#1ae876',
    id: 2
  }, {
    color: 'red',
    colorCode: 'red',
    id: 1
  }, {
    color: 'blue',
    colorCode: 'blue',
    id: 3
  }, {
    color: 'yellow',
    colorCode: 'yellow',
    id: 4
  }, {
    color: 'turquoise',
    colorCode: '#39e1ff',
    id: 5
  }]
}];

const colorInfos = palettes[1].colorInfos;

const streamPalettes = [
{
  name: 'classic',
  colorInfos: [{
    color: 'red',
    colorCode: 'red',
    id: 1,
    voice: 'sampler',
    sound: '001',
    quantize: 4
  }, {
    color: 'green',
    colorCode: '#1ae876',
    id: 2,
    voice: 'sampler',
    sound: '002',
    quantize: 8
  }, {
    color: 'blue',
    colorCode: 'blue',
    id: 3,
    voice: 'sampler',
    sound: '003',
    quantize: 8
  }, {
    color: 'yellow',
    colorCode: 'yellow',
    id: 4,
    voice: 'sampler',
    sound: '004',
    quantize: 8
  }, {
    color: 'turquoise',
    colorCode: '#39e1ff',
    id: 5,
    voice: 'sampler',
    sound: '005',
    quantize: 8
  }, {
    color: 'pink',
    colorCode: '#f27eba',
    id: 6,
    voice: 'synth',
    sound: 'noise',
    quantize: 8
  }, {
    color: 'sky',
    colorCode: '#87B2E8',
    id: 7,
    voice: 'synth',
    sound: '007',
    quantize: 8
  }, {
    color: 'purple',
    colorCode: '#6c1ae8',
    id: 8,
    voice: 'synth',
    sound: '008',
    quantize: 8
  }, {
    color: 'orange',
    colorCode: '#e87a1a',
    id: 9,
    voice: 'synth',
    sound: '009',
    quantize: 8
  }, {
    color: 'violet',
    colorCode: 'purple',
    id : 10,
    voice: 'synth',
    sound: '010',
    quantize: 8
    /*
    generateSynth() {
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
    },*/
  }]
}
];

const streamColorInfos = streamPalettes[0].colorInfos;

FlowRouter.route('/color/:color', {
  name: 'Color',
  action(params, queryParams) {
    BlazeLayout.render('App_body', {main: 'Color_page'});
  }
});

FlowRouter.route('/stream-color/:streamColor', {
  name: 'ColorStream',
  action(params, queryParams) {
    BlazeLayout.render('App_body', {main: 'Color_stream_page'});
  }
});


// === FLUID PAGE

Template.fluid.onCreated(function fluidOnCreated() {
  this.usersLoaded = []; 
  this.streamUsers = {};
  this.backgroundColor = new ReactiveVar('#00ffed');
  this.fluidApp = new FluidApp();

  const drawCircle = (shape) => {
      const { color } = shape;
      const {xPc, yPc} = shape.events[0];
      const width = $(window).width();
      const height = $(window).height();

      x = xPc * width;
      y = yPc * height;

      const { colorCode } = _.find(colorInfos, colorInfo => colorInfo.color === color);

      this.fluidApp.handleEvents( x, y, colorCode );
  };

  const playSound = (shape) => {
    const goodUser = _.find(this.loadedUsers, ({color}) => color === shape.color);

    if(!goodUser) return;

    const {xPc, yPc} = shape.events[0];

    x = xPc * $(window).width();
    y = yPc * $(window).height();

    const audioEvent = {
      evt: 'start',
      clientX: x,
      clientY: y,
    };

    goodUser.sendClick(audioEvent)
  };

  const drawStream = (streamEvent) => {
    const {
      uuid, 
      eventType, 
      streamColor, 
      xPc, 
      yPc
    } = streamEvent;

    const width = $(window).width();
    const height = $(window).height();

    const { colorCode } = _.find(streamColorInfos, colorInfo => colorInfo.color === streamColor);
    

    x = xPc * width;
    y = yPc * height;

    this.fluidApp.handleEvents( x, y, colorCode, eventType );
  }

const handleStreamDrawing = (streamEvent) =>
{
  this.fluidApp.handleEvents(streamEvent.x,streamEvent.y,streamEvent.colorCode, streamEvent.str)
}

  const handleStreamEvent = (streamEvent) => {
    const {
      uuid, 
      eventType, 
      streamColor, 
      xPc, 
      yPc
    } = streamEvent;  


    const goodUser = _.find(this.loadedUsers, ({color}) => color === streamColor);

    if(!goodUser) return;

    x = xPc * $(window).width();
    y = yPc * $(window).height();

    const audioEvent = {
      evt: 'start',
      clientX: x,
      clientY: y,
    };


    if (eventType === 'startPlaying') {
      goodUser.sendClick(audioEvent);
    }

    if (eventType === 'stillPlaying') {
      audioEvent.evt = 'drag';
      goodUser.sendClick(audioEvent);
    }

    if (eventType === 'stopPlaying') {
      audioEvent.evt = 'stop';
      goodUser.sendClick(audioEvent);
    }

    /*
    let streamUser = this.streamUsers[uuid];

    if (!streamUser) {
      const streamColorInfo = _.find(streamColorInfos, (streamColorInfo) => streamColorInfo.color === streamColor);

      const synth = streamColorInfo.generateSynth();

      this.streamUsers[uuid] = synth;
      streamUser = this.streamUsers[uuid];
    }

    if (eventType === 'startPlaying') {
      streamUser.onXPc(xPc);
      streamUser.onYPc(yPc);
      streamUser.synthStart(xPc, yPc);
    }

    if (eventType === 'stillPlaying') {
      streamUser.onXPc(xPc);
      streamUser.onYPc(yPc);
    }

    if (eventType === 'stopPlaying') {
      streamUser.synthStop();
    }
*/

    drawStream(streamEvent);
  }

  channel.subscribe('shapes', ({data: shape}) => {
    drawCircle(shape);
    playSound(shape);
  })

  streamChannel.subscribe('streamEvents', ({data: streamEvent}) => {
    console.log('stream event received');

    handleStreamEvent(streamEvent);
    handleStreamDrawing(streamEvent);
  })
});
/////////////////////////////////////////
// CANT MIX BOTH TYPES OF SOUND ATM !! //
const USE_STREAM_COLOR = true;
/////////////////////////////////////////
Template.fluid.onRendered(function fluidOnRendered() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioContext = new AudioContext();

  initAudio(audioContext, 'sounds');

  const loadUser = (color) => (_.extend({color: color.color}, createUser(color)));

  if (!USE_STREAM_COLOR) this.loadedUsers = colorInfos.map(loadUser);
  else this.loadedUsers = streamColorInfos.map(loadUser);

  console.log(this.loadedUsers);
  this.fluidApp.init();
  this.fluidApp.run( CURRENT_FLUID_APP );

  const onNoteHook = (note) => {
    const {note : {name, number, octave}} = note;
    const totalNotes = 120;

    this.backgroundColor.set(perc2color(100 * number / totalNotes));
  };

  setKeyStationNoteHook(onNoteHook);
  initUsbKeyStationMidi();
});

Template.fluid.helpers({
  'backgroundColor'() {
    return Template.instance().backgroundColor.get();
  },
})

// === COLOR PAGE

Template.Color_page.onRendered(function helloOnRendererd() {
  const color = FlowRouter.getParam('color');
  const { colorCode } = _.find(colorInfos, colorInfo => colorInfo.color === color);

  // $('body').on('mousedown', (e) => {
  $('body').on('tapstart', (e, jQueryTouchEvent ) => {
    const width = $(window).width();
    const height = $(window).height();

    e.preventDefault();
    console.log('click detected, inserting shape...');
    console.log(e);

    let eX = e.pageX;
    let eY = e.pageY;

    if ( e.touches && e.touches.length )
    {
        eX = e.touches[0].pageX;
        eY = e.touches[0].pageY;
    }

    const circleDiv = $('<div class="good-circle">')
      .css({
          "left": eX - 5 + 'px',
          "top": eY - 5 + 'px',
          "background-color": colorCode
      })
      .appendTo(document.getElementById('color-page'));

      setTimeout(() => circleDiv.remove(),5000);

    const shape = {
      color: FlowRouter.getParam('color'),
      events: [{ 
        xPc: eX / width,
        yPc: eY / height,
      }]
    };
    channel.publish('shapes', shape)
    // Shapes.insert(shape);
    return false;
  })
});

Template.Color_page.helpers({
  color() {
    return FlowRouter.getParam('color');
  },
});

// ! Meteor style event : not working atm
Template.Color_page.events({
  'click body'(event, instance) {
    console.log('click body');
    console.log(event);
  },
});

Template.Color_stream_page.onRendered(function helloOnRendered() {
  const uuid = '' + Math.floor(Math.random() * 10);
  const streamColor = FlowRouter.getParam('streamColor');
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

    streamChannel.publish('streamEvents', {
      uuid,
      eventType: 'stillPlaying',
      streamColor,
      xPc,
      yPc,
    });

    newCircle(x, y);
  }

  const checkPlayInAWhile = () => {
    if (playing) {
      stillPlaying();
      setTimeout(checkPlayInAWhile, 100)
      return ;
    }
  }

  const startPlaying = (x, y, xPc, yPc) => {
    playing = true;

    streamChannel.publish('streamEvents', {
      uuid,
      eventType: 'startPlaying',
      streamColor,
      xPc,
      yPc,
    });

    newCircle(x, y);

    checkPlayInAWhile();
  };


  const stopPlaying = (x, y, xPc, yPc) => {
    playing = false;

    streamChannel.publish('streamEvents', {
      uuid,
      eventType: 'stopPlaying',
      streamColor,
      xPc,
      yPc,
    });
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


Template.Color_stream_page.helpers({
  streamColor() {
    return FlowRouter.getParam('streamColor');
  },
});
