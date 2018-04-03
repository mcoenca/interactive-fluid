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

import {perc2color} from '/imports/utils.js';

// Libs
import {streamChannel } from '/imports/MainStream.js';
import {colorInfos, streamColorInfos } from '/imports/MainColorInfos.js';
import { default as FluidApp } from '/imports/Fluid/FluidApp.js';

import { initAudio, createUser } from '/imports/AudioApp.js';

import { initUsbKeyStationMidi, setKeyStationNoteHook } from '/imports/MidiApp.js';

// change simulation
let CURRENT_FLUID_APP = FluidApp.FLUID_SIMULATION_APPS_KEY.ORIGINAL_APP;

// switch back to old audio system (colorInfos)
const USE_STREAM_COLOR = true;

// Enable kick and bass base loop
const ENABLE_KICK_LOOP = true;

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

    const { colorCode, voice } = _.find(colorInfos, colorInfo => colorInfo.color === color);

    const goodEventType = voice === 'sampler' ? 'tap' : eventType;

    x = xPc * width;
    y = yPc * height;

    this.fluidApp.handleEvents( x, y, colorCode, goodEventType );
  }

  const handleStreamEvent = (streamEvent) => {
    const {
      uuid, 
      eventType, 
      color, 
      xPc, 
      yPc
    } = streamEvent;  

    console.log(streamEvent);

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

  streamChannel.subscribe('streamEvents', ({data: streamEvent}) => {
    console.log('stream event received');
    handleStreamEvent(streamEvent);
  })
});


Template.fluid.onRendered(function fluidOnRendered() {
  ///////////////////
  // LOADING AUDIO //
  ///////////////////
  initAudio('sounds', ENABLE_KICK_LOOP);

  ///////////////////
  // LOADING FLUID //
  ///////////////////
  this.fluidApp.init();
  this.fluidApp.run( CURRENT_FLUID_APP );


  //////////////////
  // LOADING MIDI //
  //////////////////
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
