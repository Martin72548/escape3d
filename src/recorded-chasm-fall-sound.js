import { getGameAudioOutput } from './game-audio.js';
import { publicAssetBase } from './public-asset-base.js';

// CC0 field recordings listed in public/audio/SOURCES.md.
export function createRecordedChasmFallSound() {
  let context, buffers, voice;
  let voiceRequest = 0;
  const files = ['male-falling-scream.mp3', 'river-body-splash.mp3'].map(async name => {
    const response = await fetch(`${publicAssetBase}audio/${name}`);
    if (!response.ok) throw Error(`${name} HTTP ${response.status}`);
    return response.arrayBuffer();
  });
  for (const file of files) file.catch(error => console.warn('Audio de chute indisponible', error));

  function unlock() {
    const Audio = globalThis.AudioContext ?? globalThis.webkitAudioContext;
    if (!Audio) return;
    try {
      context ??= new Audio();
      if (context.state !== 'running') context.resume().catch(() => {});
      buffers ??= files.map(async file => context.decodeAudioData(await file));
      for (const buffer of buffers) buffer.catch(() => {});
    } catch {}
  }
  globalThis.addEventListener('pointerdown', unlock, { once: true });
  globalThis.addEventListener('keydown', unlock, { once: true });
  unlock();

  function stopScream() {
    voiceRequest++;
    if (!voice) return;
    const { source, gain } = voice;
    voice = undefined;
    const now = context.currentTime;
    const end = now + .12;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, end);
    source.stop(end);
  }

  async function startScream() {
    stopScream();
    const request = voiceRequest;
    unlock();
    try {
      const buffer = await buffers?.[0];
      if (!buffer || request !== voiceRequest || context.state !== 'running') return;
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = buffer;
      gain.gain.value = .85;
      source.connect(gain).connect(getGameAudioOutput(context));
      voice = { source, gain };
      source.onended = () => {
        source.disconnect();
        gain.disconnect();
        if (voice?.source === source) voice = undefined;
      };
      source.start(context.currentTime, .8);
    } catch (error) {
      console.warn('Cri de chute indisponible', error);
    }
  }

  async function playSplash() {
    stopScream();
    try {
      const buffer = await buffers?.[1];
      if (!buffer || context.state !== 'running') return;
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = buffer;
      gain.gain.value = .8;
      source.connect(gain).connect(getGameAudioOutput(context));
      source.onended = () => { source.disconnect(); gain.disconnect(); };
      source.start();
    } catch (error) {
      console.warn('Son de l’impact indisponible', error);
    }
  }

  return { startScream, stopScream, playSplash };
}
