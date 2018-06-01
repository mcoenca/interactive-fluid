import freenect
import cv2
import numpy as np
import time

# Color labeling
from scipy.spatial import distance as dist
from collections import OrderedDict

# Mask Download
import argparse
import imutils

# Mongo API
import pymongo
"""
Grabs a depth map from the Kinect sensor and creates an image from it.
"""

# Distance from border of upper table
lowerDepth = 929
upperDepth = 949

# Distance for border of lower table
# lowerDepth = 769
# upperDepth = 779

offset = 1

def getDepthMap():  
  depth, timestamp = freenect.sync_get_depth()
  depth = 255 * np.logical_and(depth > lowerDepth, depth < upperDepth)
  # np.clip(depth, 0, 2**10 - 1, depth)
  # depth >>= 2
  depth = depth.astype(np.uint8)
 
  return depth

#function to get RGB image from kinect
def getVideo():
    array, _ = freenect.sync_get_video()
    array = cv2.cvtColor(array,cv2.COLOR_RGB2BGR)
    return array

def getContours(thresh):
  # print "finding contour"
  cnts = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL,
    cv2.CHAIN_APPROX_SIMPLE)
  cnts = cnts[0] if imutils.is_cv2() else cnts[1]
  return cnts

# Color Code
class ColorLabeler:
  def __init__(self):
    # initialize the colors dictionary, containing the color
    # name as the key and the RGB tuple as the value
    colors = OrderedDict({
      "1-vert": (48, 71, 47), # taverne
      "2-orange": (229, 206, 208), #Curie-plus
      # "2-dark-orange": (96, 50, 12),
      # "3-rose": (105, 39, 71),
      "4-jaune": (237, 213, 123), # Curie
      "5-bleu": (64, 98, 137), # Thermes
      "6-rouge": (97, 0, 16), # Temple
      "7-brown": (120, 73, 54), # Atelier
      "8-mauve": (80, 63, 94), # Boucherie
      "9-black": (50, 45, 40),
      "10-black": (138, 120, 120),
      "12-black": (104, 78, 87),
      "13-black": (77, 52, 56)
      # "0-red": (255, 0, 0),
      # "0-green": (0, 255, 0), # Taverne
      # "0-blue": (0, 0, 255)
    })
 
    # allocate memory for the L*a*b* image, then initialize
    # the color names list
    self.lab = np.zeros((len(colors), 1, 3), dtype="uint8")
    self.colorNames = []

    self.deltaMax = 50
 
    # loop over the colors dictionary
    for (i, (name, rgb)) in enumerate(colors.items()):
      # update the L*a*b* array and the color names list
      self.lab[i] = rgb
      self.colorNames.append(name)
 
    # convert the L*a*b* array from the RGB color space
    # to L*a*b*
    self.lab = cv2.cvtColor(self.lab, cv2.COLOR_RGB2LAB)

  def label(self, image, c):
    # construct a mask for the contour, then compute the
    # average L*a*b* value for the masked region
    mask = np.zeros(image.shape[:2], dtype="uint8")
    cv2.drawContours(mask, [c], -1, 255, -1)
    mask = cv2.erode(mask, None, iterations=2)
    mean = cv2.mean(image, mask=mask)[:3]
  
    # initialize the minimum distance found thus far
    minDist = (np.inf, None)
  
    # loop over the known L*a*b* color values
    for (i, row) in enumerate(self.lab):
      # compute the distance between the current L*a*b*
      # color value and the mean of the image
      d = dist.euclidean(row[0], mean)
  
      # if the distance is smaller than the current distance,
      # then update the bookkeeping variable
      if d < minDist[0]:
        minDist = (d, i, mean)
  
    # return the name of the color with the smallest distance
    # print "d:", self.deltaMax - minDist[0]
    if (minDist[0] < self.deltaMax):
      # print "delta for " + self.colorNames[minDist[1]] , minDist[0], " mean: ", minDist[2]
      return self.colorNames[minDist[1]]
    else:
      return "none"

def getColorsInImage(image, thresh, name):
  # image = cv2.imread(args["image"])
  # resized = imutils.resize(image, width=300)
  # ratio = image.shape[0] / float(resized.shape[0])
  ratio = 1
  # blur the resized image slightly, then convert it to both
  # grayscale and the L*a*b* color spaces
  # print "image", image.shape
  blurred = cv2.GaussianBlur(image, (5, 5), 0)
  gray = cv2.cvtColor(blurred, cv2.COLOR_BGR2GRAY)
  lab = cv2.cvtColor(blurred, cv2.COLOR_BGR2LAB)
  # thresh = cv2.threshold(gray, 60, 255, cv2.THRESH_BINARY)[1]
   
  # find contours in the thresholded image
  cnts = getContours(thresh);
   
  # initialize the shape detector and color labeler
  # sd = ShapeDetector()
  cl = ColorLabeler()

  # loop over the contours
  # WE'VE GOT ONLY ONE
  color = None
  # print cnts
  for c in cnts:
    # print "in countours"
    # compute the center of the contour
    M = cv2.moments(c)
    if M["m00"] != 0:
      cX = int((M["m10"] / M["m00"]) * ratio)
      cY = int((M["m01"] / M["m00"]) * ratio)
      # detect the shape of the contour and label the color
      # shape = sd.detect(c)
      color = cl.label(lab, c)
      
      # multiply the contour (x, y)-coordinates by the resize ratio,
      # then draw the contours and the name of the shape and labeled
      # color on the image
      c = c.astype("float")
      c *= ratio
      c = c.astype("int")
      text = "{}".format(color)
      # imageCopy = image.copy()
      imageCopy = image
      cv2.drawContours(imageCopy, [c], -1, (0, 255, 0), 2)
      if text != "none":
        cv2.putText(imageCopy, text, (cX, cY),
          cv2.FONT_HERSHEY_SIMPLEX, 0.3, (255, 255, 255), 2)
  return color
      
      # show the output imageCopy      # cv2.imshow("Label"+name, imageCopy)
      # cv2.waitKey(0)
    # else:
    #   print name, "error M00 = 0"

eras = []

# @app.route("/")
# def hello():
#     return "Hello World!"

# @app.route("/stats")
# def stats():
#     return eras
def getBuildingFromEra(colorValues):
  # TODO: Mean
  color = colorValues.pop()
  if color == "1-vert":
    return "taverne"
  elif color == "2-orange":
    return "curie-plus"
  # elif color == "2-dark-orange":
  #   return "curie-plus"
  # elif color == "3-rose": 
  #   return "atelier"
  elif color == "4-jaune":
    return "curie"
  elif color == "5-bleu":
    return "thermes"
  elif color == "6-rouge":
    return "temple"
  elif color == "7-brown":
    return "atelier"
  elif color == "8-mauve":
    return "boucherie"
  else:
    return False



# ip: false, port: 3001
def insert_eras_in_mongodb(newEras, loopNumbers):
    "Insert the mean result of a calculations cycle into mongo"
    # Connects to Mongo DB and use the collection "components"
    connection = pymongo.Connection('127.0.0.1', 3001)
    database = connection["meteor"]
    statesDb = database.states

    erasToPushToDb = []
    for index, era in enumerate(newEras):
      eraName = era[0]
      eraColorValues = era[1]
      building = getBuildingFromEra(eraColorValues)
      erasToPushToDb.append({"number": eraName, "building": building})

    stateToPush = {"eras": erasToPushToDb, "number": loopNumbers}

    print stateToPush
    statesDb.insert(stateToPush)
    """
    record structure
    {
    params, 
    n_components : 4,
    components : {
        1 : {
            1 : {word, weight}
            2 : {word, weight}
            ...
        }
        ...
    }}
    """

    # same_record = components.find_one(params)

    # record = params

    # if same_record == None:
    #   components.insert(record)
    #   return
    # else:
    #   components.update({"_id":same_record['_id']}, record)
    #   return

if __name__ == "__main__":

  # construct the argument parse and parse the arguments
  ap = argparse.ArgumentParser()
  ap.add_argument("-f", "--filters", action="append", nargs=2,
    metavar=('path','era'), required=False,
    help="path to the era filters image")
  args = vars(ap.parse_args())

  # Getting the frame from kinect
  frame = getVideo()

  print "Printing Context"
  cv2.imwrite('context.jpg', frame)

  # load the image, convert it to grayscale, blur it slightly,
  # and threshold it

  if (args["filters"]):
    # print args["filters"]
    threshs = []
    for flter in args["filters"]:
      image = cv2.imread(flter[0])
      gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
      # print "filter", image.shape
      blur = cv2.GaussianBlur(gray, (5, 5), 0)
      thresh = cv2.threshold(blur, 60, 255, cv2.THRESH_BINARY)[1]
      threshs.append(thresh)
      eras.append([flter[1], ["none"]])

    loop = 0;
    loopNumbers = 0;
    while True:
      frame = getVideo()
      newFrame = frame.copy()
      for idx, flter in enumerate(args["filters"]):
        color = getColorsInImage(newFrame, threshs[idx], flter[0])
        eras[idx][1].append(color)
        if len(eras[idx][1]) > 100:
          eras[idx][1].pop(0)
          



        # print "era: " + flter[1], getColorsInImage(newFrame, threshs[idx], flter[0])
      # print eras
      cv2.imshow('View', newFrame)

      loop = loop + 1
      loop = loop % 200
      if loop == 0:
        loopNumbers = loopNumbers + 1
        insert_eras_in_mongodb(eras, loopNumbers)

      k = cv2.waitKey(5) & 0xFF
      if k == 27:
        break


      # Showing filters after blur and stuff
      # cv2.imshow('filter' + imagePath, thresh)

  print "starting video"
  while True:
    frame = getVideo()
    cv2.imshow('RGB image',frame)

    # blur = cv2.GaussianBlur(depth, (5, 5), 0)

    depth = getDepthMap()
    cv2.imshow('image', depth)

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
