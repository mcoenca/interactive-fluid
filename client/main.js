// Packages
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import $ from 'jquery';
import _ from 'underscore';

// Related dependencies
import 'bootstrap/dist/css/bootstrap.min.css';
import './main.css';

// Templates
import './main.html';
import './color.html';

// Libs
import { initGL, onClick  } from '/imports/FluidApp.js';
const fluidSendClick = onClick;
import { initAudio, createUser } from '/imports/AudioApp.js';

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

const colors = [{
  color: 'red',
  sample: 1
}, {
  color: 'green',
  sample: 2
}, {
  color: 'blue',
  sample: 3
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

  const drawCircle = (shape) => {
    const {x, y} = shape.events[0];

    if (!this.fluidCanvas) return;

    const fluidEvent = {
      clientX: x,
      clientY: y,
    };

    fluidSendClick(fluidEvent);
  };

  const playSound = (shape) => {
    const goodUser = _.find(this.loadedUsers, ({color}) => color === shape.color);

    if(!goodUser) return;

    const {x, y} = shape.events[0];

    const audioEvent = {
      clientX: x,
      clientY: y,
    };

    goodUser.sendClick(audioEvent)
  }

  this.autorun(() => {
    console.log('autorunning...');
    this.subscribe('shapes.all');
  });

  this.autorun(() => {
    Shapes.find({}).observe({
      added: (shape) => {
        console.log(`New ${shape.color} shape`);
        drawCircle(shape);
        playSound(shape);
      }
    });
  });
});

Template.fluid.onRendered(function fluidOnRendered() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  initAudio(AudioContext, 'sounds');

  const loadUser = (color) => (_.extend({color: color.color}, createUser(color.sample)));

  this.loadedUsers = colors.map(loadUser);

  console.log(this.loadedUsers);

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
