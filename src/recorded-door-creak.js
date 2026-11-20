import { getGameAudioOutput } from './game-audio.js';
import { publicAssetBase } from './public-asset-base.js';
﻿// Real field recording: adharca, Freesound #275471, CC0. See public/audio/SOURCES.md.
export function createRecordedDoorCreak({ volume = .85, filename = 'old-door-recording.mp3', excerptDuration } = {}){
 let context=null,ready=null,buffer=null,active=null;
 const file=fetch(`${publicAssetBase}audio/${filename}`).then(response=>{if(!response.ok)throw new Error('Door recording HTTP '+response.status);return response.arrayBuffer();});
 // Retain the promise for decoding, and handle a failed preload without interrupting gameplay.
 file.catch(error=>console.warn('No se pudo cargar el chirrido grabado:',error));
 function unlock(){
  try{
   const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;
   context??=new Audio();context.resume()?.catch(()=>{});
   ready??=file.then(data=>context.decodeAudioData(data)).then(decoded=>{buffer=decoded;return decoded;});
   ready.catch(()=>{});
  }catch{}
 }
 function stop(){if(active){try{active.stop();}catch{}active=null;}}
 async function play(){
  unlock();if(!context)return false;
  try{
   const recording=await ready;
   if(context.state!=='running')await context.resume();
   if(context.state!=='running')return false;
   stop();
   const source=context.createBufferSource(),gain=context.createGain();source.buffer=recording;gain.gain.value=volume;source.connect(gain).connect(getGameAudioOutput(context));active=source;
   source.onended=()=>{source.disconnect();gain.disconnect();if(active===source)active=null;};
   if (excerptDuration === undefined) source.start();
   else {
    const start = context.currentTime;
    const length = Math.min(excerptDuration, recording.duration);
    gain.gain.setValueAtTime(volume, start + Math.max(0, length - .08));
    gain.gain.linearRampToValueAtTime(0, start + length);
    source.start(start, 0, length);
   }
   return true;
  }catch(error){console.error('No se pudo reproducir el chirrido grabado:',error);return false;}
 }
 return {unlock,play,stop,get duration(){return buffer?.duration??4.57;}};
}
