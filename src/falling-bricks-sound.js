import { getGameAudioOutput } from './game-audio.js';
import { publicAssetBase } from './public-asset-base.js';
// Recorded falling debris by iwanPlays, Freesound #567249, CC0. See public/audio/SOURCES.md.
export function createFallingBricksSound() {
 let context, ready;
 const file = fetch((publicAssetBase) + 'audio/falling-bricks-recorded.mp3').then(response => {
  if (!response.ok) throw Error('Falling bricks HTTP ' + response.status);
  return response.arrayBuffer();
 });
 file.catch(error => console.warn('No se pudo cargar la caida de ladrillos:', error));
 function unlock() {
  try {
   const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
   if (!Audio) return;
   context ??= new Audio(); context.resume()?.catch(() => {});
   ready ??= file.then(data => context.decodeAudioData(data)); ready.catch(() => {});
  } catch {}
 }
 async function play() {
  if (!context || !ready) return;
  try {
   const recording = await ready;
   if (context.state !== 'running') return;
   const source = context.createBufferSource(), gain = context.createGain();
   source.buffer = recording;
   const duration = Math.max(.1, recording.duration - 2), now = context.currentTime;
   gain.gain.setValueAtTime(.85, now);
   gain.gain.setValueAtTime(.85, now + Math.max(0, duration - .12));
   gain.gain.linearRampToValueAtTime(0, now + duration);
   source.connect(gain).connect(getGameAudioOutput(context));
   source.onended = () => { source.disconnect(); gain.disconnect(); };
   source.start(now, 0, duration);
  } catch (error) { console.warn('No se pudo reproducir la caida de ladrillos:', error); }
 }
 return { unlock, play };
}

export const wallBricksSound = createFallingBricksSound();
