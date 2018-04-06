import $ from 'jquery';
import loadTouchEvents from 'jquery-touch-events';
loadTouchEvents($);

import { streamChannel } from '/imports/MainStream.js';

import { colorInfos } from '/imports/MainColorInfos.js';
Template.Color_page.onCreated( function () {
  const color = FlowRouter.getParam('color');
  const { colorCode, name } = _.find(colorInfos, colorInfo => colorInfo.color === color);

  this.color = color;
  this.colorCode = colorCode;
  this.name = name;
})
Template.Color_page.onRendered(function onRendered() {
  const uuid = '' + Math.floor(Math.random() * 10);
  const color = this.color;
  
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
  $(document).on('touchmove', handleMouseMove);

  const newCircle = (x, y) => {
    const circleDiv = $('<div class="good-circle">')
      .css({
          "left": x - 5 + 'px',
          "top": y - 5 + 'px',
          "background-color": color
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
      color,
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
      color,
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
      color,
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


Template.Color_page.helpers({
  color() {
    return FlowRouter.getParam('color');
  },
  colorCode() {
    return Template.instance().colorCode;
  },
  name() {
    return Template.instance().name;
  }
});
