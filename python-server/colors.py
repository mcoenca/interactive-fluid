import utils
import numpy as np

colorsInstruments = {
  'green': 
  {
    'eventName': 'red',
    'l': 28.8,
    'a': -12.37,
    'b': 5.55
  },
  'green-no-lum': {
    'eventName': 'red',
    'l': 0,
    'a': -12.37,
    'b': 5.55
  },
  'violet' : {
    'eventName': 'sky',
    'l': 30,
    'a': 34.89,
    'b': -15.38
  }, 
  'violet-no-lum' : {
    'eventName': 'sky',
    'l': 0,
    'a': 34.89,
    'b': -15.38
  }, 
  'violet-dark-no-lum' : {
    'eventName': 'sky',
    'l': 0,
    'a': 23.27,
    'b': 0.71
  }
}

def prepareColor(color):
  additionalInfo = {
    'lab': np.asarray(
      [color['l'] * 255 / 100, 
       color['a'] +   128, 
       color['b'] + 128]
      , np.uint8
    ),
    'lastPlayed': False,
    'pcX': 0,
    'pcY': 0
  }

  return utils.merge_two_dicts(color, additionalInfo)

def get(colorName):
  global colorsInstruments
  return colorsInstruments[colorName]

def createColorsState(colors):
  global colorsInstruments
  filteredColors = utils.filter_keys(colorsInstruments, colors)
  preparedColors = utils.map_on_dict(filteredColors, prepareColor)

  return preparedColors
