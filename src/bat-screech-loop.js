import { publicAssetBase } from './public-asset-base.js';
﻿// Real bats recorded by Felix Blume, CC0. Source and excerpt in public/audio/SOURCES.md.
export function createBatScreechLoop(){
 let context=null,ready=null,active=null,wanted=false;
 const file=fetch(`${publicAssetBase}audio/bats-colony-loop.wav`).then(response=>{if(!response.ok)throw Error('Bat recording HTTP '+response.status);return response.arrayBuffer();});
 file.catch(error=>console.warn('No se pudo cargar el sonido de murcielagos:',error));
 function unlock(){
  try{const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;context??=new Audio();context.resume()?.then(()=>{if(wanted)begin();}).catch(()=>{});ready??=file.then(data=>context.decodeAudioData(data));ready.catch(()=>{});}catch{}
 }
 async function begin(){
  try{const buffer=await ready;if(!wanted||active||!context||context.state!=='running'||!buffer)return;const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;source.loop=true;gain.gain.value=1.25;source.connect(gain).connect(context.destination);active={source,gain};source.start();}catch{}
 }
 function start(){if(wanted)return;wanted=true;unlock();begin();}
 function stop(){wanted=false;if(!active)return;const {source,gain}=active;active=null;try{source.stop();}catch{}source.disconnect();gain.disconnect();}
 return {unlock,start,stop,get playing(){return active!==null;}};
}
