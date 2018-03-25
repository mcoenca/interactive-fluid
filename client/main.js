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

// Related dependencies
import 'bootstrap/dist/css/bootstrap.min.css';
import './main.css';

// Templates
import './main.html';
import './color.html';

import {perc2color} from '/imports/utils.js';

// Libs
import { initGL, handleEvents  } from '/imports/FluidApp.js';

import { initAudio, createUser } from '/imports/AudioApp.js';

import { initUsbKeyStationMidi, setKeyStationNoteHook } from '/imports/MidiApp.js';

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

const colorInfos = [{
  color: 'red',
  colorCode: 'red',
  sample: 1
}, {
  color: 'green',
  colorCode: 'green',
  sample: 2
}, {
  color: 'blue',
  colorCode: 'blue',
  sample: 3
}, {
  color: 'yellow',
  colorCode: 'yellow',
  sample: 4
}, {
  color: 'turquoise',
  colorCode: '#39e1ff',
  sample: 5
}];

FlowRouter.route('/color/:color', {
  name: 'Color',
  action(params, queryParams) {
    BlazeLayout.render('App_body', {main: 'Color_page'});
  }
});


// === FLUID PAGE

Template.fluid.onCreated(function fluidOnCreated() {
  this.usersLoaded = []; 
  this.backgroundColor = new ReactiveVar('#00ffed');

  const drawCircle = (shape) => {
      const { color } = shape;
      const {xPc, yPc} = shape.events[0];
      const width = $(window).width();
      const height = $(window).height();

      x = xPc * width;
      y = yPc * height;

      const { colorCode } = _.find(colorInfos, colorInfo => colorInfo.color === color);
      

      handleEvents( x, y, colorCode );
  };

  const playSound = (shape) => {
    const goodUser = _.find(this.loadedUsers, ({color}) => color === shape.color);

    if(!goodUser) return;

    const {xPc, yPc} = shape.events[0];

    x = xPc * $(window).width();
    y = yPc * $(window).height();

    const audioEvent = {
      clientX: x,
      clientY: y,
    };

    goodUser.sendClick(audioEvent)
  };

  // this.autorun(() => {
  //   console.log('autorunning...');
  //   this.subscribe('shapes.all');
  // });


  // this.autorun(() => {
  //   Shapes.find({}).observe({
  //     added: (shape) => {
  //       console.log(`New ${shape.color} shape`);
  //       drawCircle(shape);
  //       playSound(shape);
  //     }
  //   });
  // });


  channel.subscribe('shapes', ({data: shape}) => {
    drawCircle(shape);
    playSound(shape);
  })
  
});

Template.fluid.onRendered(function fluidOnRendered() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  initAudio(AudioContext, 'sounds');

  const loadUser = (color) => (_.extend({color: color.color}, createUser(color.sample)));

  this.loadedUsers = colorInfos.map(loadUser);

  console.log(this.loadedUsers);

  this.fluidCanvas = initGL({
    canvasGlId: 'glcanvas', 
    canvas2dId: '2dcanvas'
  });

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
  $('body').on('tapstart', (e) => {
    const width = $(window).width();
    const height = $(window).height();

    e.preventDefault()
    console.log('click detected, inserting shape...');
    console.log(e);

    const eX = e.pageX;
    const eY = e.pageY;

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
