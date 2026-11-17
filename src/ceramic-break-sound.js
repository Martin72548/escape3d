import { publicAssetBase } from './public-asset-base.js';
﻿// Recorded ceramic tile break by Fission9 (CC0). See public/audio/SOURCES.md.
export function createCeramicBreakSound(){
 let context=null,ready=null;
 const file=fetch(`${publicAssetBase}audio/ceramic-tile-break.mp3`).then(response=>{if(!response.ok)throw Error('Ceramic recording HTTP '+response.status);return response.arrayBuffer();});
 file.catch(error=>console.warn('No se pudo cargar la rotura de ceramica:',error));
 function unlock(){try{const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;context??=new Audio();context.resume()?.catch(()=>{});ready??=file.then(data=>context.decodeAudioData(data));ready.catch(()=>{});}catch{}}
 async function play(){
  unlock();if(!context)return;
  try{const buffer=await ready;if(context.state!=='running')return;const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;gain.gain.value=.85;source.connect(gain).connect(context.destination);source.onended=()=>{source.disconnect();gain.disconnect();};source.start();}catch{}
 }
 return {unlock,play};
}
