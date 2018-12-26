// Packages
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import $ from 'jquery';
import loadTouchEvents from 'jquery-touch-events';
loadTouchEvents($);

import _ from 'underscore';
import Tone from 'tone';

// Related dependencies
import './main.css';
import '/imports/routes.js';

import {perc2color, hexToRGB} from '/imports/utils.js';

// Libs
import {streamChannel } from '/imports/MainStream.js';
import { colorInfos } from '/imports/MainColorInfos.js';
import { default as FluidApp } from '/imports/Fluid/FluidApp.js';

import { initAudio, createUser } from '/imports/AudioApp.js';
import { initUsbKeyStationMidi } from '/imports/MidiApp.js';

// change simulation ORIGINAL_APP / NEW_APP
let CURRENT_FLUID_APP = FluidApp.FLUID_SIMULATION_APPS_KEY.ORIGINAL_APP;
// let CURRENT_FLUID_APP = FluidApp.FLUID_SIMULATION_APPS_KEY.NEW_APP;

// switch back to old audio system (colorInfos)
const USE_STREAM_COLOR = true;

// Enable base loop number
const ENABLE_KICK_LOOP = false; // 3 ambient
const MS_TEMPO = 3500;

const DEBUG = true;

const ENABLE_OLD_MIDI_FILE = false;

const OCTO_ENABLE_SELECTION = false;

// === FLUID PAGE
const loadUser = (userColor) => (_.extend({
  color: userColor.color
}, createUser(userColor)));

Template.fluid.onCreated(function fluidOnCreated() {
  this.users = {};

  this.backgroundColor = new ReactiveVar('#00ffed');
  this.fluidApp = new FluidApp();

  const drawStream = (streamEvent) => {
    const {
      uuid, 
      eventType, 
      color, 
      xPc, 
      yPc
    } = streamEvent;

    const width = $(window).width();
    const height = $(window).height();

    const { colorCode, voice, fluidParams } = _.find(colorInfos, colorInfo => colorInfo.color === color);

    const goodEventType = voice === 'sampler' ? 'tap' : eventType;

    const fluidControl = fluidParams;

    x = xPc * width;
    y = yPc * height;

    this.fluidApp.handleEvents( x, y, colorCode, goodEventType, uuid, fluidControl, voice );
  }

  const handleStreamEvent = (streamEvent) => {
    const {
      uuid, 
      eventType, 
      color, 
      xPc, 
      yPc
    } = streamEvent;  

    if (DEBUG) console.log(streamEvent);

    let user = this.users[uuid];

    if (!user) {
      const colorInfo = _.find(colorInfos, (colorInfo) => colorInfo.color === color);

      user = loadUser(colorInfo);

      this.users[uuid] = user;
    }

    if(!user) return;

    user.handleEvent(streamEvent);
    drawStream(streamEvent);
  }

  streamChannel.subscribe('streamEvents', (message) => {
    if (DEBUG) console.log('stream event received');
    handleStreamEvent(message);
  })
});


Template.fluid.onRendered(function fluidOnRendered() {
  const onNoteHook = (noteAndOctave, number) => {
    const totalNotes = 120;
    const hexColor = perc2color(100 * number / totalNotes);
    const {red, green, blue} = hexToRGB(hexColor);
    this.fluidApp.setBackgroundColor(red/255, green/255, blue/255);
    this.backgroundColor.set(hexColor);
  };

  ///////////////////
  // LOADING AUDIO //
  ///////////////////
  initAudio('sounds', ENABLE_KICK_LOOP, {
    shouldEnableMidi: !ENABLE_OLD_MIDI_FILE,
    onMidiNotePlayed: onNoteHook,
    msTempo: MS_TEMPO
  });

  ///////////////////
  // LOADING FLUID //
  ///////////////////
  this.fluidApp.init();
  this.fluidApp.run( CURRENT_FLUID_APP );

  if(ENABLE_OLD_MIDI_FILE) initUsbKeyStationMidi();
});

Template.fluid.helpers({
  'backgroundColor'() {
    return Template.instance().backgroundColor.get();
  },
})

Template.octogon.onCreated(function octogonOnCreated() {
  // single user
  this.users = {};

  this.backgroundColor = new ReactiveVar('black');

  this.$previousElSelected = null
  this.$elSelected = null
  this.clickTimer = null

  const reclickBeforeFadeDelay = 800

  const self = this;


  this.startClickTimer = () => {
    self.clickTimer = setInterval(() => {
      if (self.$elSelected === null) {
        clearInterval(self.clickTimer)
        return;
      }
      console.log('reclicking automatically')
      self.$elSelected.click()
    }, reclickBeforeFadeDelay) 
  }

  this.stopClickTimer = () => {
    // self.clickTimer = null;
    clearInterval(self.clickTimer)
  }

  const newCircle = (x, y) => {
    const circleDiv = $('<div class="good-circle">')
      .css({
      "left": x - 5 + 'px',
      "top": y - 5 + 'px',
      "background-color": 'red',
    })
    .appendTo(document.getElementById('octogon-page'));

    setTimeout(() => circleDiv.remove(), 500);
  };

  const drawStream = (streamEvent) => {
    const {
      uuid, 
      eventType, 
      color, 
      xPc, 
      yPc
    } = streamEvent;

    const width = $(window).width();
    const height = $(window).height();

    const { colorCode, voice, fluidParams } = _.find(colorInfos, colorInfo => colorInfo.color === color);

    const goodEventType = voice === 'sampler' ? 'tap' : eventType;

    const fluidControl = fluidParams;

    const xRatio = 0.5;

    let x = xPc * width;
    let y = yPc * height;

    // x symetry with 1175 px of page lenght
    // let pageWidth =  1175;
    // pageWidth = 1874;
    x = width / 2 + ( width / 2 - x) * xRatio


    
    const $el = $(document.elementFromPoint(x, y));

    if (DEBUG) {
      console.log('event');
      console.log(width, height);
      console.log(xPc, yPc);
      console.log(x, y);

      const windowTop = document.documentElement.scrollTop || document.body.scrollTop;
      const windowLeft = document.documentElement.scrollLeft || document.body.scrollLeft;

      newCircle(windowLeft + x,windowTop+ y);
    }


    if (!$el) {
      return
    }

    if ( goodEventType === "startPlaying" )
    {
      $el.click();

      this.$elSelected = $el;
      this.$previousElSelected = $el;

      this.startClickTimer();
      // this._onEventStart( x, y, color, iUUID, fluidControl, voice );
    }
    else if ( eventType === "stillPlaying" )
    {
      // this._onEventMove( x, y, color, iUUID, fluidControl, voice );
      // $el.click();
      this.$elSelected = $el;

      if (!this.$elSelected.is(this.$previousElSelected)) {
        this.$elSelected.click();
        this.$previousElSelected = $el;
      }
      
    }
    else if ( eventType === "stopPlaying" )
    {
      // this._onEventEnd( x, y, color, iUUID, fluidControl,voice );
      this.stopClickTimer();
      this.$elSelected = null;
      this.$previousElSelected = null;
    }
    else if ( eventType === "tap" )
    {
      // $el.click();
    }

    // $(document.elementFromPoint(x, y)).click();
  }

  const handleStreamEvent = (streamEvent) => {
    const {
      uuid, 
      eventType, 
      color, 
      xPc, 
      yPc
    } = streamEvent;  

    if (DEBUG) console.log(streamEvent);

    let user = this.users[uuid];

    if (!user) {
      const colorInfo = _.find(colorInfos, (colorInfo) => colorInfo.color === color);

      user = loadUser(colorInfo);

      this.users[uuid] = user;
    }

    if(!user) return;

    user.handleEvent(streamEvent);
    drawStream(streamEvent);
  }

  streamChannel.subscribe('streamEvents', (message) => {
    if (DEBUG) console.log('stream event received');
    handleStreamEvent(message);
  })
});


Template.octogon.onRendered(function fluidOnRendered() {
  const onNoteHook = (noteAndOctave, number) => {
    const totalNotes = 120;
    const hexColor = perc2color(100 * number / totalNotes);
    const {red, green, blue} = hexToRGB(hexColor);
    // this.fluidApp.setBackgroundColor(red/255, green/255, blue/255);
    this.backgroundColor.set(hexColor);
  };

  ///////////////////
  // LOADING AUDIO //
  ///////////////////
  initAudio('sounds', ENABLE_KICK_LOOP, {
    shouldEnableMidi: !ENABLE_OLD_MIDI_FILE,
    onMidiNotePlayed: onNoteHook,
    msTempo: MS_TEMPO
  });

  if(ENABLE_OLD_MIDI_FILE) initUsbKeyStationMidi();
});

Template.octogon.helpers({
  'backgroundColor'() {
    return Template.instance().backgroundColor.get();
  },
});

Template.triangle.onCreated(function() {
  const fadeDelay = 1500;
  this.animateTriangle = new ReactiveVar(false);
  this.timeout = null;

  this.resetTimeOut = () =>{
    // if (this.timeout === null) {
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        clearTimeout(this.timeout);
        // this.timeout = null;
        if (DEBUG) console.log('end animate');
        this.animateTriangle.set(false);
      }, fadeDelay);
    // } else {

    // }
  }
});

Template.triangle.events({
  'click'() {
    const inst = Template.instance();

    if (DEBUG) console.log('click detected in triangle');
    inst.resetTimeOut();

    inst.animateTriangle.set(true);
    // to trigger use $(document.elementFromPoint(1008, 660)).click();
  }
});

Template.triangle.helpers({
  triangleAnimateClass(){
    const res = Template.instance().animateTriangle.get() ? 'animate': '';
    if (DEBUG) console.log(res);
    return res; 
  }
});
