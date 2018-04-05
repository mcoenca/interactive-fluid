const palettes = [
{
  name: 'classic',
  colorInfos: [{
    color: 'red',
    colorCode: 'red',
    id: 1,
    voice: 'sampler',
    sound: '001',
    quantize: 4
  }, {
    color: 'green',
    colorCode: '#1ae876',
    id: 2,
    voice: 'sampler',
    sound: '002',
    quantize: 8
  }, {
    color: 'blue',
    colorCode: 'blue',
    id: 3,
    voice: 'sampler',
    sound: '003',
    quantize: 8
  }, {
    color: 'yellow',
    colorCode: 'yellow',
    id: 4,
    voice: 'sampler',
    sound: '004',
    quantize: 8
  }, {
    color: 'turquoise',
    colorCode: '#39e1ff',
    id: 5,
    voice: 'sampler',
    sound: '005',
    quantize: 8
  }, {
    color: 'pink',
    colorCode: '#f27eba',
    id: 6,
    voice: 'synth',
    sound: 'noise',
    quantize: 8
  }, {
    color: 'sky',
    colorCode: '#87B2E8',
    id: 7,
    voice: 'synth',
    sound: 'pad',
    quantize: 8
  }, {
    color: 'purple',
    colorCode: '#6c1ae8',
    id: 8,
    voice: 'synth',
    sound: 'bass',
    quantize: 8
  }, {
    color: 'orange',
    colorCode: '#e87a1a',
    id: 9,
    voice: 'synth',
    sound: 'square',
    quantize: 8
  }, {
    color: 'violet',
    colorCode: '#9932CC',
    id : 10,
    voice: 'synth',
    sound: 'tremoloTriangle',
    quantize: 8
  }]
}
];

export const colorInfos = palettes[0].colorInfos;

export default { colorInfos };
