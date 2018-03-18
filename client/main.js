// Packages
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import $ from 'jquery';

// Related dependencies
import 'bootstrap/dist/css/bootstrap.min.css';
import './main.css';

// Templates
import './main.html';
import './color.html';

// Libs
import { initGL, onClick  } from '/imports/FluidApp.js';
const fluidSendClick = onClick;
import { initAudio, simpleSendClick } from '/imports/AudioApp.js';
const audioSendClick = simpleSendClick;

Shapes = new Mongo.Collection('shapes');

Shapes.schema = new SimpleSchema({
  name: {type: String},
  events : {type: [Object]},
});


FlowRouter.route('/', {
  name: 'Main',
  action(params, queryParams) {
    BlazeLayout.render('App_body', {main: 'Main_page'});
  }
});

FlowRouter.route('/color/:color', {
  name: 'Color',
  action(params, queryParams) {
    BlazeLayout.render('App_body', {main: 'Color_page'});
  }
});


// === FLUID PAGE

Template.fluid.onCreated(function fluidOnCreated() {

  const drawCircle = (shape) => {
    const {x, y} = shape.events[0];

    if (!this.fluidCanvas) return;

    const fluidEvent = {
      clientX: x,
      clientY: y,
    };

    fluidSendClick(fluidEvent)

    const audioEvent = {
      clientX: x,
      clientY: y,
    };

    audioSendClick(audioEvent);
  };

  this.autorun(() => {
    console.log('autorunning...');
    this.subscribe('shapes.all');
  });

  this.autorun(() => {
    Shapes.find({}).observe({
      added: (shape) => {
        console.log('new shape added...');
        console.log(shape);
        drawCircle(shape);
      }
    });
  });
});

Template.fluid.onRendered(function fluidOnRendered() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  initAudio(AudioContext, 'sounds');

  this.fluidCanvas = initGL({
    canvasGlId: 'glcanvas', 
    canvas2dId: '2dcanvas'
  });
});

// === COLOR PAGE

Template.Color_page.onRendered(function helloOnRendererd() {
  $('body').on('click', (e) => {
    e.preventDefault()
    console.log('click detected, inserting shape...');
    console.log(e);
    Shapes.insert({
      color: FlowRouter.getParam('color'),
      events: [{ 
        x: e.pageX,
        y: e.pageY,
      }]
    });
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
