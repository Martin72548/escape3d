import { getGameAudioOutput } from './game-audio.js';
import { publicAssetBase } from './public-asset-base.js';
// Recorded human pain vocal, Christopherderp, CC0; see public/audio/SOURCES.md.
export function createRecordedOuch() {
 let context, ready;
 const file = fetch(`${publicAssetBase}audio/male-ouch.mp3`).then(response => {
  if (!response.ok) throw Error('Ouch recording HTTP ' + response.status);
  return response.arrayBuffer();
 });
 file.catch(() => {});
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
   const buffer = await ready;
   if (context.state !== 'running') return;
   const source = context.createBufferSource(), gain = context.createGain();
   source.buffer = buffer; gain.gain.value = .95;
   source.connect(gain).connect(getGameAudioOutput(context));
   source.onended = () => { source.disconnect(); gain.disconnect(); };
   source.start();
  } catch {}
 }
 return { unlock, play };
}
