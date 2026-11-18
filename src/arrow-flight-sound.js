import { getGameAudioOutput } from './game-audio.js';
import { publicAssetBase } from './public-asset-base.js';
﻿// Arrow Flying 2 by Ali_6868 (CC0). See public/audio/SOURCES.md.
export function createArrowFlightSound(){
 let context=null,ready=null;
 const file=fetch(`${publicAssetBase}audio/arrow-flying.mp3`).then(response=>{if(!response.ok)throw Error('Arrow recording HTTP '+response.status);return response.arrayBuffer();});
 file.catch(error=>console.warn('No se pudo cargar el vuelo de la flecha:',error));
 function unlock(){try{const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;context??=new Audio();context.resume()?.catch(()=>{});ready??=file.then(data=>context.decodeAudioData(data));ready.catch(()=>{});}catch{}}
 async function play(){
  unlock();if(!context)return;
  try{const buffer=await ready;if(context.state!=='running')return;const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;gain.gain.value=.85;source.connect(gain).connect(getGameAudioOutput(context));source.onended=()=>{source.disconnect();gain.disconnect();};source.start();}catch{}
 }
 return {unlock,play};
}
