import WebMidi from 'webmidi';
import Tone from 'tone';
import Distance from 'tonal';


let synth;
let polySynth;
let onKeyStationNoteHook = (noteAndOctave) => {};
// let midiDevice="MPKmini2";
let midiDevice="USB Keystation 49e";




function syn(notename,note){
  this.note=notename;

  var feedbackDelay = new Tone.FeedbackDelay("8n", 0.5)

  var filter=new Tone.Filter({
    "frequency":1000,
    "Q":10,
  });
  chorus=new Tone.Chorus ({
          "frequency":0.5});


  var vol = new Tone.Volume(-36).toMaster();
  this.enve = new Tone.AmplitudeEnvelope({
              "attack": 0.5,
              "decay": 0.1,
              "sustain": 1,
              "release": 0.5
    }).chain(chorus,feedbackDelay,filter,vol);


  this.pulse = new Tone.PulseOscillator(this.note,0.4).connect(this.enve);
  this.pulse.start()


  this.saw=new Tone.OmniOscillator({
        "type":"sawtooth",
        "frequency":this.note,
        "detune":0
       }).connect(this.enve)
       this.saw.start();

        this.saw2=new Tone.OmniOscillator({
        "type":"sawtooth",
        "frequency":Distance.transpose(this.note,"P8"),
        "detune":0
       }).connect(this.enve)
       this.saw2.start();

      var lfo3=new Tone.LFO(0.5,-5,5).connect(this.saw.detune);
       var lfo4=new Tone.LFO(0.8,5,-5).connect(this.saw2.detune);

  var lfo=new Tone.LFO(2,0.2,0.8);
  lfo.connect(this.pulse.width);
  //var lfo2=new Tone.LFO(0.1,100,3000).connect(filter.frequency);
}


export const setKeyStationNoteHook = hook => onNoteHook = hook

export const initUsbKeyStationMidi = function () {
  //synth = new Tone.Synth().toMaster();
  //polySynth = new Tone.PolySynth(4, Tone.Synth).toMaster();

  WebMidi.enable(function (err) {

    if (err) {
      console.log("WebMidi could not be enabled.", err);
      return;
    } 

    console.log(WebMidi.inputs);
    console.log(WebMidi.outputs);

    var input = WebMidi.getInputByName(midiDevice);
    synthMidi=new syn("C2","C2");


    if (!input) {
      console.log('no midi input found');
      return;
    }

    input.addListener('pitchbend', "all", function(e) {
      console.log("Pitch value: " + e.value);
    });

    input.addListener('noteon', "all",
      function (e) {

              esy=e.note.name+e.note.octave;

      synthMidi.enve.triggerRelease();
      synthMidi.note=esy;
      synthMidi.pulse.frequency.value=esy;
      synthMidi.saw2.frequency.value=Distance.transpose(esy,"4P");
      synthMidi.saw.frequency.value=Distance.transpose(esy,"8P");
      synthMidi.enve.triggerAttack();
      
        console.log("Received 'noteon' message (" + e.note.name + e.note.octave + ").");

        // onNoteHook(e);
      }
    );

    input.addListener('noteoff', "all",
  
    function (e) {
      
        if (e.note.name+e.note.octave===synthMidi.note){
                synthMidi.enve.triggerRelease();

        }

      console.log("Received 'noteoff' message (" + e.note.name + e.note.octave + ").");
    }
  );


    input.addListener('controlchange', "all",
      function (e) {

        console.log("Received 'controlchange' message.", e);
      }
    );

  });
}

export default {initUsbKeyStationMidi, setKeyStationNoteHook}
