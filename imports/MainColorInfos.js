const palettes = [
{
  name: 'classic',
  colorInfos: [{
    color: 'red',
    name: 'Kick',
    colorCode: '#ff0000',
    id: 1,
    voice: 'sampler',
    sound: '001',
    quantize: 4
  }, {
    color: 'green',
    name: 'Snare',
    colorCode: '#1ae876',
    id: 2,
    voice: 'sampler',
    sound: '002',
    quantize: 8
  }, {
    color: 'blue',
    name: 'Closed Hi-Hat',
    colorCode: '#0000ff',
    id: 3,
    voice: 'sampler',
    sound: '003',
    quantize: 8
  }, {
    color: 'yellow',
    name: 'Open Hi-Hat',
    colorCode: 'yellow',
    id: 4,
    voice: 'sampler',
    sound: '004',
    quantize: 8
  }, {
    color: 'turquoise',
    name: 'Rimshot',
    colorCode: '#39e1ff',
    id: 5,
    voice: 'sampler',
    sound: '005',
    quantize: 8
  }, {
    color: 'pink',
    name: 'Noise',
    colorCode: '#f27eba',
    id: 6,
    voice: 'synth',
    sound: 'noise',
    quantize: 8,
    fluidParams: {
        lineVibratoType: 'pulse',
        lineMaxPointsNumber: 20,
    }
  }, {
    color: 'sky',
    name: 'Pads',
    colorCode: '#87B2E8',
    id: 7,
    voice: 'synth',
    sound: 'pad',
    quantize: 8,
    fluidParams: {
        lineVibratoType: 'pulse',
        lineMaxPointsNumber: 12
    }
  }, {
    color: 'purple',
    name: 'Bass',
    colorCode: '#6c1ae8',
    id: 8,
    voice: 'synth',
    sound: 'bass',
    quantize: 8
  }, {
    color: 'orange',
    name: 'Square Synth',
    colorCode: '#e87a1a',
    id: 9,
    voice: 'synth',
    sound: 'square',
    quantize: 8
  }, {
    color: 'violet',
    name: 'Tremolo Synth',
    colorCode: '#9932CC',
    id : 10,
    voice: 'synth',
    sound: 'tremoloTriangle',
    quantize: 8,
    fluidParams: {
        lineVibratoType: 'random',
        lineMaxPointsNumber: 5
    }
  }, {
    color: 'brown',
    name: 'Simple Polysynth',
    colorCode: 'brown',
    id : 11,
    voice: 'synth',
    sound: 'poly',
    quantize: 8,
    fluidParams: {
        lineVibratoType: 'random',
        lineMaxPointsNumber: 6
    }
  }, {
    color: 'aqua',
    name: 'Click',
    colorCode: '#99ccff',
    id: 12,
    voice: 'sampler',
    sound: '006',
    quantize: 8,
  }, {
    color: 'emerald',
    name: 'Lazer',
    colorCode: '#339966',
    id: 13,
    voice: 'sampler',
    sound: '012',
    quantize: 8,
  }, {
    color: 'gold',
    name: 'Crush',
    colorCode: '#ffcc00',
    id: 14,
    voice: 'sampler',
    sound: '009',
    quantize: 8,
  },]
}
];

export const colorInfos = palettes[0].colorInfos;

export default { colorInfos };
