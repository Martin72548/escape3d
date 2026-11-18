import { getGameAudioOutput } from './game-audio.js';
import { publicAssetBase } from './public-asset-base.js';
﻿// Real CC0 field recordings. Full sources are listed in public/audio/SOURCES.md.
export function createRecordedChasmFallSound(){
 let context=null,ready=null,played=false;
 const base=publicAssetBase;
 const files=Promise.all(['male-falling-scream.mp3','river-body-splash.mp3'].map(name=>fetch(`${base}audio/${name}`).then(response=>{if(!response.ok)throw Error(name+' HTTP '+response.status);return response.arrayBuffer();})));
 files.catch(error=>console.warn('No se pudieron cargar las grabaciones de la caida:',error));
 function unlock(){try{const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;context??=new Audio();context.resume()?.catch(()=>{});ready??=files.then(data=>Promise.all(data.map(bytes=>context.decodeAudioData(bytes))));ready.catch(()=>{});}catch{}}
 globalThis.addEventListener('pointerdown',unlock);globalThis.addEventListener('keydown',unlock);unlock();
 async function play(){
  if(played)return;played=true;unlock();if(!context)return;
  try{
   const [scream,splash]=await ready;if(context.state!=='running')return;const now=context.currentTime;
   const voice=context.createBufferSource(),distance=context.createGain();voice.buffer=scream;
   distance.gain.setValueAtTime(.85,now);distance.gain.exponentialRampToValueAtTime(.008,now+3);voice.connect(distance).connect(getGameAudioOutput(context));
   voice.start(now,.8,3);voice.onended=()=>{voice.disconnect();distance.disconnect();};
   const impact=context.createBufferSource(),volume=context.createGain();impact.buffer=splash;volume.gain.value=.8;impact.connect(volume).connect(getGameAudioOutput(context));impact.start(now+3);impact.onended=()=>{impact.disconnect();volume.disconnect();};
   globalThis.removeEventListener('pointerdown',unlock);globalThis.removeEventListener('keydown',unlock);
  }catch(error){console.warn('No se pudo reproducir la caida grabada:',error);}
 }
 return {unlock,play,get played(){return played;}};
}
