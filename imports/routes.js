import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

FlowRouter.route('/fluid', {
  name: 'Main',
  action(params, queryParams) {
    BlazeLayout.render('App_body', {main: 'Main_page'});
    BlazeLayout.setRoot('body');
  }
});

FlowRouter.route('/color/:color', {
  name: 'Color',
  action(params, queryParams) {
    BlazeLayout.render('App_body', {main: 'Color_page'});
  }
});

FlowRouter.route('/tone', {
  action(params, queryParams) {
    BlazeLayout.render('App_body', {
      main: 'Tone_page'
    })
  }
})

let isBack = false;

FlowRouter.route('/', {
   triggersEnter: [
    function() {
      console.log('trigger route');
      if (isBack) {
        console.log(isBack);
        location.reload();
      }
    }
  ],
  triggersExit: [
    function() {
      isBack = true;
    }
  ],
  action(params, queryParams) {

    BlazeLayout.render('App_body', {
      main: 'Join_page'
    })
  }
})
