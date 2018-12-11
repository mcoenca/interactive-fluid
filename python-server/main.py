import cv2
import numpy as np
import imutils

import argparse

import internal_sio as sio
import kinect
import colors
import image as im
import utils

from collections import OrderedDict

Debug = False

configs = {
  '1': {
    # 2m10 a 3m10
    # largeur de 2m
    'lowerDepth': 900,
    'upperDepth' : 973,
    'offset': 1,
    'multiplicatorVec': [0, 1, 1],
    'activeColors': [
      'green-no-lum',
      'violet-dark-no-lum',
      'dorange-red-paper-no-lum',
      'dorange-bag-no-lum',
      'dyellow-bag-no-lum',
      'dli-green-bk-no-lum'
    ],
    'maxLabDist': 5,
    'blurDistance': 27,
    'blurIntensity': 10,
    'minArea': 150,
    'minMovPc': 0.02
  },
  '2' : {
    # proche ~1m <> 1m50
    'lowerDepth': 650,
    'upperDepth' : 780,
    'offset' : 1,
    'multiplicatorVec': [0, 1, 1],
    'activeColors': [
      'green-no-lum'
    ]
  },
  'noColor' :{
    'lowerDepth': 780,
    'upperDepth' : 860,
    'offset': 1,
    'multiplicatorVec': [0, 1, 1],
    'activeColors': [
      'grey-orange-lum',
    ],
    'maxLabDist': 150,
    'blurDistance': 27,
    'blurIntensity': 10,
    'minArea': 100,
    'minMovPc': 0.01
  }
}

def emitEvent(colState, colorDetected, movedEnough):
  global Debug
  if colorDetected:
    if colState['lastPlayed'] and movedEnough:
      sio.emit({
        'color': colState['eventName'],
        'eventType': 'stillPlaying',
        'xPc': colState['pcX'],
        'yPc': colState['pcY'],
        'uuid': colState['eventName']
      })
    elif not colState['lastPlayed']:
      sio.emit({
        'color': colState['eventName'],
        'eventType': 'startPlaying',
        'xPc': colState['pcX'],
        'yPc': colState['pcY'],
        'uuid': colState['eventName']
      })
      colState['lastPlayed'] = True
  else:
    if (colState['lastPlayed']):
      sio.emit({
        'color': colState['eventName'],
        'eventType': 'stopPlaying',
        'xPc': colState['pcX'],
        'yPc': colState['pcY'],
        'uuid': colState['eventName']
      })
      colState['lastPlayed'] = False

def emitOnColorsDetection(colorsState, multiplicator, params):
  global Debug
  lowerDepth=params['lowerDepth']
  upperDepth=params['upperDepth']
  offset=params['offset']

  while True:
    if Debug:
      print "kinect"
    frame = kinect.getVideo()
    if Debug:
      print "kinect 1"
    in_range_depth = kinect.getInRangeDepthMap(lowerDepth, upperDepth)
    blurred = im.getBlurred(frame, 
      blurDistance=params['blurDistance'],
      blurIntensity=params['blurIntensity'])
    lab = im.getLabFromBGR(blurred)

    # print "kinect 2"
    for key, colState in colorsState.iteritems():
      colorDetected = False
      movedEnough = False

      onlyColorInRange, distance, colorThresh = im.getColorInRange(
        labframe=lab,
        in_range_depth=in_range_depth,
        colorMatrix=colState['labMatrix'],
        multiplicator=multiplicator,
        maxLabDist=params['maxLabDist']
      )

      contours = im.getContours(onlyColorInRange)

      if Debug:
        print "kinect 3"
      for c in contours:
        if Debug:
          print "kinect 4"
        M = cv2.moments(c)
        areaSize = cv2.contourArea(c)

        if M["m00"] != 0 and areaSize > params['minArea']:
          ratio = 1
          cX = int((M["m10"] / M["m00"]) * ratio)
          cY = int((M["m01"] / M["m00"]) * ratio)
          pcX = float(cX) / kinect.largeur
          pcY = float(cY) / kinect.hauteur

          colorDetected = True

          if colState['lastPlayed']:
            if abs(colState['pcX'] - pcX) > params['minMovPc'] and abs(colState['pcY'] - pcY) > params['minMovPc']:
              colState['pcX'] = pcX
              colState['pcY'] = pcY
              movedEnough = True
          else:
            colorDetected = True
            colState['pcX'] = pcX
            colState['pcY'] = pcY

          label = areaSize

          c = c.astype("float")
          c *= ratio
          c = c.astype("int")
          text = "c: {} sz: {} Pos: {}, {}  Pc: {}, {}".format(key, label, cX, cY, pcX, pcY)
          # imageCopy = image.copy()
          frameCopy = blurred
          cv2.drawContours(frameCopy, [c], -1, (0, 255, 0), 2)
          if text != "none":
            cv2.putText(frameCopy, text, (cX, cY),
              cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 2)
      if Debug:
        print "kinect 5"

      cv2.imshow('In Range Frame', in_range_depth)
    
      # cv2.imshow('Blur', blurred)
      # cv2.imshow('Distance ', distance)
      # cv2.imshow('Color Thresh', colorThresh)
      cv2.imshow('Both Thresh', onlyColorInRange)
      emitEvent(colState, colorDetected, movedEnough)

    if Debug:
      print "kinect 6"
    cv2.imshow('RGB image',frame)
    cv2.imshow('Blurred', blurred)

    k = cv2.waitKey(5) & 0xFF
    if Debug:
      "kinect end"
    if k == 27:
      break
    elif k == ord('a'):
      lowerDepth = lowerDepth + offset
      upperDepth = upperDepth + offset
      print lowerDepth, upperDepth
    elif k == ord('b'):
      lowerDepth = lowerDepth - offset
      upperDepth = upperDepth - offset
      print lowerDepth, upperDepth


if __name__ == '__main__': 
  global configs, Debug
  # construct the argument parse and parse the arguments
  ap = argparse.ArgumentParser()

  ap.add_argument("-c", "--config", action="append", nargs=1,
    metavar=('config'), required=True,
    help="name of the config to launch")

  args = vars(ap.parse_args())

  if Debug:
    print "test"

  if args['config'][0]:
    if Debug:
      print "test 2"
    config = args['config'][0][0]

    # should see a red thing
    sio.emit({u'color': u'red', u'eventType': u'startPlaying', u'xPc': 0.7375565610859729, u'uuid': u'76233600-65c2-11e8-bb94-9f72e9fbefb8', u'yPc': 0.6273115220483642})
    # If not printed you need to check rabbitmq server
    # Brew services
    if Debug:
      print "test 4"

    params = configs[config]

    colorsState = colors.createColorsState(params['activeColors'])
    for color in colorsState.itervalues():
      color['labMatrix'] = im.getMatrixFromVec(color['lab'], kinect.hauteur, kinect.largeur)

    multiplicator = im.getMatrixFromVec(
      np.asarray(params['multiplicatorVec'], np.uint8), 
      kinect.hauteur, kinect.largeur)

    if Debug:
      print "test 3"
    emitOnColorsDetection(colorsState, multiplicator, params=params)     
