import WebMidi from 'webmidi';
import Tone from 'tone';


let synth;
let polySynth;
let onKeyStationNoteHook = (noteAndOctave) => {};

export const setKeyStationNoteHook = hook => onNoteHook = hook

export const initUsbKeyStationMidi = function () {
  synth = new Tone.Synth().toMaster();
  polySynth = new Tone.PolySynth(4, Tone.Synth).toMaster();

  WebMidi.enable(function (err) {

    if (err) {
      console.log("WebMidi could not be enabled.", err);
      return;
    } 

    console.log(WebMidi.inputs);
    console.log(WebMidi.outputs);

    var input = WebMidi.getInputByName("USB Keystation 49e");

    if (!input) {
      console.log('no midi input found');
      return;
    }

    input.addListener('pitchbend', "all", function(e) {
      console.log("Pitch value: " + e.value);
    });

    input.addListener('noteon', "all",
      function (e) {
        synth.triggerAttackRelease( e.note.name+e.note.octave , "16n");
        console.log("Received 'noteon' message (" + e.note.name + e.note.octave + ").");

        onNoteHook(e);
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
