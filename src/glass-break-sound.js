import { getGameAudioOutput } from './game-audio.js';
export function createGlassBreakSound() {
  let context;
  function unlock() {
    const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Audio) return;
    context ??= new Audio(); context.resume().catch(() => {});
  }
  function play() {
    if (!context || context.state !== 'running') return;
    const now = context.currentTime;
    const buffer = context.createBuffer(1, context.sampleRate * .8, context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * Math.exp(-i / context.sampleRate * 9);
    const noise = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain();
    noise.buffer = buffer; filter.type = 'highpass'; filter.frequency.value = 1700; gain.gain.value = .7;
    noise.connect(filter).connect(gain).connect(getGameAudioOutput(context)); noise.start(now);
    noise.onended = () => { noise.disconnect(); filter.disconnect(); gain.disconnect(); };
    for (let i = 0; i < 22; i++) {
      const oscillator = context.createOscillator(), envelope = context.createGain();
      const start = now + Math.random() * .65, duration = .1 + Math.random() * .4;
      oscillator.type = 'sine'; oscillator.frequency.value = 1700 + Math.random() * 9000;
      envelope.gain.setValueAtTime(.025 + Math.random() * .035, start);
      envelope.gain.exponentialRampToValueAtTime(.0001, start + duration);
      oscillator.connect(envelope).connect(getGameAudioOutput(context)); oscillator.start(start); oscillator.stop(start + duration);
      oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
    }
  }
  return { unlock, play };
}
