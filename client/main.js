import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import $ from 'jquery';
import './main.html';

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



Template.hello.onCreated(function helloOnCreated() {
  this.autorun(() => {
    console.log('autorunning...');
    this.subscribe('shapes.all');
  });

  this.autorun(() => {
    Shapes.find({}).observe({
      added: function(item){
        console.log('new shape added...');
        console.log(item);
      }
    });
  });
});

Template.Color_page.helpers({
  color() {
    return FlowRouter.getParam('color');
  },
});


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

// Meteor style event : not working atm
Template.Color_page.events({
  'click body'(event, instance) {
    console.log('click body');
    console.log(event);

  },
});
