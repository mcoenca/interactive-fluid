import freenect
import numpy as np
import cv2

# Size of kinect in pixels
largeur = 640
hauteur = 480

def getInRangeDepthMap(lowerDepth, upperDepth):
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
