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

configs = {
  '1': {
    # 2m10 a 3m10
    # largeur de 2m
    'lowerDepth': 900,
    'upperDepth' : 973,
    'offset': 1,
    'multiplicatorVec': [0, 1, 1],
    'activeColors': [
      'green-no-lum'
    ],
    'maxLabDist': 10,
    'blurDistance': 21,
    'blurIntensity': 10,
    'minArea': 120,
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
  }
}

def emitEvent(colState, colorDetected, movedEnough):
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

  lowerDepth=params['lowerDepth']
  upperDepth=params['upperDepth']
  offset=params['offset']

  while True:
    frame = kinect.getVideo()
    in_range_depth = kinect.getInRangeDepthMap(lowerDepth, upperDepth)

    for key, colState in colorsState.iteritems():
      colorDetected = False
      movedEnough = False

      onlyColorInRange, blurred, distance, colorThresh = im.getColorInRange(
        frame=frame,
        in_range_depth=in_range_depth,
        colorMatrix=colState['labMatrix'],
        multiplicator=multiplicator,
        maxLabDist=params['maxLabDist'],
        blurDistance=params['blurDistance'],
        blurIntensity=params['blurIntensity']
      )

      contours = im.getContours(onlyColorInRange)

      for c in contours:
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
          frameCopy = frame
          cv2.drawContours(frameCopy, [c], -1, (0, 255, 0), 2)
          if text != "none":
            cv2.putText(frameCopy, text, (cX, cY),
              cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 2)

      # cv2.imshow('In Range Frame', in_range_depth)
    
      # cv2.imshow('Blur', blurred)
      # cv2.imshow('Distance ', distance)
      # cv2.imshow('Color Thresh', colorThresh)
      # cv2.imshow('Both Thresh', onlyColorInRange)
      emitEvent(colState, colorDetected, movedEnough)

    cv2.imshow('RGB image',frame)

    k = cv2.waitKey(5) & 0xFF
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
  global configs
  # construct the argument parse and parse the arguments
  ap = argparse.ArgumentParser()

  ap.add_argument("-c", "--config", action="append", nargs=1,
    metavar=('config'), required=True,
    help="name of the config to launch")

  args = vars(ap.parse_args())

  if args['config'][0]:
    config = args['config'][0][0]

    # should see a red thing
    sio.emit({u'color': u'red', u'eventType': u'startPlaying', u'xPc': 0.7375565610859729, u'uuid': u'76233600-65c2-11e8-bb94-9f72e9fbefb8', u'yPc': 0.6273115220483642})

    params = configs[config]

    colorsState = colors.createColorsState(params['activeColors'])
    for color in colorsState.itervalues():
      color['labMatrix'] = im.getMatrixFromVec(color['lab'], kinect.hauteur, kinect.largeur)

    multiplicator = im.getMatrixFromVec(
      np.asarray(params['multiplicatorVec'], np.uint8), 
      kinect.hauteur, kinect.largeur)

    emitOnColorsDetection(colorsState, multiplicator, params=params)     
