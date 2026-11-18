import { getGameAudioOutput } from './game-audio.js';
import { publicAssetBase } from './public-asset-base.js';
﻿// Real amphibian field recording by Kamix0, CC0. See public/audio/SOURCES.md.
export function createToadCroakLoop(){
 let context=null,ready=null,active=null,wanted=false;
 const file=fetch(`${publicAssetBase}audio/toads-croaking.mp3`).then(response=>{if(!response.ok)throw Error('Croak recording HTTP '+response.status);return response.arrayBuffer();});
 file.catch(error=>console.warn('No se pudo cargar el croar de los sapos:',error));
 function unlock(){
  try{const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;context??=new Audio();context.resume()?.then(()=>{if(wanted)begin();}).catch(()=>{});ready??=file.then(data=>context.decodeAudioData(data));ready.catch(()=>{});}catch{}
 }
 async function begin(){
  try{const buffer=await ready;if(!wanted||active||!context||context.state!=='running'||!buffer)return;const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;source.loop=true;gain.gain.value=1.25;source.connect(gain).connect(getGameAudioOutput(context));active={source,gain};source.start();}catch{}
 }
 function start(){if(wanted)return;wanted=true;unlock();begin();}
 function stop(){wanted=false;if(!active)return;const {source,gain}=active;active=null;try{source.stop();}catch{}source.disconnect();gain.disconnect();}
 return {unlock,start,stop,get playing(){return active!==null;}};
}
