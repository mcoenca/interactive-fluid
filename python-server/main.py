import freenect
import cv2
import numpy as np

import imutils

from collections import OrderedDict

import socketio

import eventlet
eventlet.monkey_patch()

sio = socketio.KombuManager('amqp://mcoenca:cristohoger24@localhost:5672/pythonsocket', write_only=True)

channelName = "streamEvents";

# working because we use rabbitmq for inter thread messaging
def emit(data):
  global channelName
  print('emitting')
  print channelName
  print data
  sio.emit(channelName, data)


# Size of kinect in pixels
largeur = 640
hauteur = 480

# Detection distance and control
lowerDepth = 650
upperDepth = 780

offset = 1

def getInRangeDepthMap():
  depth, timestamp = freenect.sync_get_depth()
  in_range_depth = 255 * np.logical_and(depth > lowerDepth, depth < upperDepth)

  # np.clip(depth, 0, 2**10 - 1, depth)
  # depth >>= 2
  in_range_depth = in_range_depth.astype(np.uint8)
  
  return in_range_depth

def getDepthMap():  
  depth, timestamp = freenect.sync_get_depth()
  # np.clip(depth, 0, 2**10 - 1, depth)
  # depth >>= 2
  depth = depth.astype(np.uint8)
 
  return depth

#function to get RGB image from kinect
def getVideo():
    array, _ = freenect.sync_get_video()
    array = cv2.cvtColor(array,cv2.COLOR_RGB2BGR)
    return array

# thresh is a white over black frame
# defining a form
def getContours(thresh):
  # print "finding contour"
  cnts = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL,
    cv2.CHAIN_APPROX_SIMPLE)
  cnts = cnts[0] if imutils.is_cv2() else cnts[1]
  return cnts

 
def showScreens(callback=False):
  global lowerDepth, upperDepth, offset
  print ('launching screens')

  # use http://colorizer.org/
  
  # true orange
  # orangeLab = np.asarray([16 * 255 / 100, 34.55 + 128, 21.44 + 128], np.uint8)

  # green 
  orangeLab = np.asarray([28.8 * 255 / 100, -12.37 + 128, 5.55 + 128], np.uint8)

  orangeMaxtrix = np.tile(orangeLab, (640*480, 1)).reshape((480,640,3))


  orangeInstrument = {
    "lastplayed": False,
    "pcX": 0,
    "pcY": 0
  }

  while True:
    orangeDetected = False
    movedEnough = False
    #get a frame from RGB camera
    frame = getVideo()
    depth = getDepthMap()
    in_range_depth = getInRangeDepthMap()
    # blur = cv2.GaussianBlur(depth, (5, 5), 0)
    # 
    blurred = cv2.GaussianBlur(frame, (27, 27), 10)
    # luminosity filter gets gray
    gray = cv2.cvtColor(blurred, cv2.COLOR_BGR2GRAY)

    # luminosity threshold
    thresh = cv2.threshold(gray, 60, 255, cv2.THRESH_BINARY)[1]

    lab = cv2.cvtColor(blurred, cv2.COLOR_BGR2LAB)
    l,a,b = cv2.split(lab)
    # light 0 black a 100 white
    # a - 100 green
    # a + 100 red
    # b - 100 blue
    # b + 100 yellow
    # 
    # For open cv
    # l > 0 a 255
    # a et b font + 128 28 < a,b < 228

    # print lab
    # print lab.shape
    # print type(lab)
    # print lab.dtype
    distance = np.array(cv2.absdiff(lab, orangeMaxtrix), dtype='float')
    power = cv2.pow(distance, 2)
    # print power

    summed = np.add.reduce(power, 2)
    # print summed
    squaroot = np.array(cv2.sqrt(summed), dtype='uint8')
    # similarity threshold
    maxLabDist = 20
    colorthresh = cv2.threshold(squaroot,maxLabDist, 255, cv2.THRESH_BINARY_INV)[1]
    onlyOrangeInRange = cv2.multiply(colorthresh, in_range_depth)


    contours = getContours(onlyOrangeInRange)

    ratio = 1

    minArea = 200

    for c in contours:
      # compute the center of the contour
      M = cv2.moments(c)
      areaSize = cv2.contourArea(c)

      if M["m00"] != 0 and areaSize > minArea:
        
        cX = int((M["m10"] / M["m00"]) * ratio)
        cY = int((M["m01"] / M["m00"]) * ratio)
        pcX = float(cX) / largeur
        pcY = float(cY) / hauteur

        orangeDetected = True

        if orangeInstrument['lastplayed']:
          if abs(orangeInstrument['pcX'] - pcX) > 0.02 and abs(orangeInstrument['pcY'] - pcY) > 0.02:
            orangeInstrument['pcX'] = pcX
            orangeInstrument['pcY'] = pcY
            movedEnough = True
        else:
          orangeDetected = True
          orangeInstrument['pcX'] = pcX
          orangeInstrument['pcY'] = pcY

        label = areaSize

        c = c.astype("float")
        c *= ratio
        c = c.astype("int")
        text = "sz: {} Pos: {}, {}  Pc: {}, {}".format(label, cX, cY, pcX, pcY)
        # imageCopy = image.copy()
        frameCopy = frame
        cv2.drawContours(frameCopy, [c], -1, (0, 255, 0), 2)
        if text != "none":
          cv2.putText(frameCopy, text, (cX, cY),
            cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 2)


    if orangeDetected:
      if orangeInstrument['lastplayed'] and movedEnough:
        emit({
          'color': 'red',
          'eventType': 'stillPlaying',
          'xPc': orangeInstrument['pcX'],
          'yPc': orangeInstrument['pcY'],
          'uuid': 'red'
        })
      elif not orangeInstrument['lastplayed']:
        emit({
          'color': 'red',
          'eventType': 'startPlaying',
          'xPc': orangeInstrument['pcX'],
          'yPc': orangeInstrument['pcY'],
          'uuid': 'red'
        })
        orangeInstrument['lastplayed'] = True
    else:
      if (orangeInstrument['lastplayed']):
        emit({
          'color': 'red',
          'eventType': 'stopPlaying',
          'xPc': orangeInstrument['pcX'],
          'yPc': orangeInstrument['pcY'],
          'uuid': 'red'
        })
        orangeInstrument['lastplayed'] = False

    
    # needs floating point conversion for sqrt
    # euclidianDistance = cv2.sqrt(distance)
    
   
    # cv2.imshow('Depth frame', depth)
    # cv2.imshow('In Range Frame', in_range_depth)
    cv2.imshow('RGB image',frame)
    cv2.imshow('Blur', blurred)
    # cv2.imshow('Thresh', thresh)
    cv2.imshow('Disance ', squaroot)
    cv2.imshow('Color Thresh', colorthresh)
    cv2.imshow('Both Thresh', onlyOrangeInRange)

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

# eventlet.spawn(showScreens)

if __name__ == '__main__': 
  # should see a red thing
  emit({u'color': u'red', u'eventType': u'startPlaying', u'xPc': 0.7375565610859729, u'uuid': u'76233600-65c2-11e8-bb94-9f72e9fbefb8', u'yPc': 0.6273115220483642})
  showScreens()     
