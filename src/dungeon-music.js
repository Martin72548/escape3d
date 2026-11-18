// Original 48-second dark ambient score, synthesized locally without downloads.
export function createDungeonMusic() {
  let context, master, started = false, stopped = false;
  const voices = new Set();
  function tone(frequency, at, length, level, type = 'sine', detune = 0) {
    const voice = context.createOscillator(), envelope = context.createGain();
    voice.type = type; voice.frequency.value = frequency; voice.detune.value = detune;
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(level, at + Math.min(1.3, length * .3));
    envelope.gain.exponentialRampToValueAtTime(.0001, at + length);
    voice.connect(envelope).connect(master); voices.add(voice);
    voice.onended = () => { voices.delete(voice); voice.disconnect(); envelope.disconnect(); };
    voice.start(at); voice.stop(at + length);
  }
  async function start() {
    if (started || stopped) return;
    const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Audio) return;
    try {
      context ??= new Audio();
      await context.resume();
      if (started || stopped || context.state !== 'running') return;
      started = true;
      const begin = context.currentTime + .02, end = begin + 48;
      const output = context.createGain(), filter = context.createBiquadFilter();
      master = context.createGain(); master.gain.value = 1;
      filter.type = 'lowpass'; filter.frequency.value = 1800;
      master.connect(filter).connect(output).connect(context.destination);
      output.gain.setValueAtTime(0, begin);
      output.gain.linearRampToValueAtTime(.42, begin + 3);
      output.gain.setValueAtTime(.42, end - 5);
      output.gain.linearRampToValueAtTime(0, end);
      // Low drones, dissonant minor chords and sparse distant bell-like notes.
      tone(55, begin, 48, .12, 'triangle');
      tone(55, begin, 48, .08, 'sine', -13);
      const chords = [[110,130.81,164.81],[103.83,123.47,155.56],[110,130.81,146.83],[98,116.54,138.59]];
      for (let bar = 0; bar < 12; bar++) {
        const at = begin + bar * 4, length = Math.min(6, 48 - bar * 4);
        chords[bar % chords.length].forEach((note, i) => tone(note, at, length, .045, 'triangle', i % 2 ? 9 : -7));
        tone([440,466.16,329.63,415.3][bar % 4], at + .5, Math.min(3.4, end - at - .5), .035);
      }
      const finish = context.createOscillator(), silence = context.createGain();
      silence.gain.value = 0; finish.connect(silence).connect(context.destination);
      finish.onended = () => { finish.disconnect(); silence.disconnect(); output.disconnect(); filter.disconnect(); master.disconnect(); };
      finish.start(begin); finish.stop(end + .01);
    } catch (error) { console.warn('Musique du donjon indisponible :', error); }
  }
  function stop() {
    if (stopped) return;
    stopped = true;
    if (!context || !master) return;
    const now = context.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(0, now, .12);
    voices.forEach(voice => { try { voice.stop(now + .5); } catch {} });
  }
  return { start, stop };
}
