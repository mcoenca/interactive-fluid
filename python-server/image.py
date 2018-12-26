import cv2
import imutils
import numpy as np

# thresh is a white over black frame
# defining a form
def getContours(thresh):
    cnts = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cnts = cnts[0] if imutils.is_cv2() else cnts[1]
    return cnts

def getMatrixFromVec(vec, rowsNumber, colNumber):
  return np.tile(vec, (rowsNumber*colNumber, 1)).reshape((rowsNumber,colNumber, 3))

def getBlurred(frame, blurDistance=27, blurIntensity=10):
  return cv2.GaussianBlur(frame, (blurDistance, blurDistance), blurIntensity)

def getLabFromBGR(frame):
  return cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)

# @profile
def getColorInRange(labframe, in_range_depth, colorMatrix, multiplicator=[], maxLabDist=20):
    if (np.any(multiplicator != False)):
      lab = cv2.multiply(labframe, multiplicator)

    absdiff = np.array(cv2.absdiff(lab, colorMatrix), dtype='float')
    
    power = cv2.pow(absdiff, 2)

    summed = np.add.reduce(power, 2)

    # !! These np.array conversions are weird
    distance = np.array(cv2.sqrt(summed), dtype='uint8')
    
    colorThresh = cv2.threshold(distance, maxLabDist, 255, cv2.THRESH_BINARY_INV)[1]

    onlyColorInRange = cv2.multiply(colorThresh, in_range_depth)

    return onlyColorInRange, distance, colorThresh

def oldstuff():
  #   # luminosity filter gets gray
  # gray = cv2.cvtColor(blurred, cv2.COLOR_BGR2GRAY)

  # # luminosity threshold
  # thresh = cv2.threshold(gray, 60, 255, cv2.THRESH_BINARY)[1]

  # l,a,b = cv2.split(lab)
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
  return ''




