import { publicAssetBase } from './public-asset-base.js';
// Real male scream by alexaxy, CC0. See public/audio/SOURCES.md.
export function createRecordedMaleScream({fileName='male-falling-scream.mp3',offset=.8,duration=1.7}={}){
 let context=null,ready=null;
 const file=fetch(`${publicAssetBase}audio/${fileName}`).then(response=>{if(!response.ok)throw Error('Scream recording HTTP '+response.status);return response.arrayBuffer();});
 file.catch(error=>console.warn('No se pudo cargar la grito grabado:',error));
 function unlock(){try{const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;context??=new Audio();context.resume()?.catch(()=>{});ready??=file.then(data=>context.decodeAudioData(data));ready.catch(()=>{});}catch{}}
 async function play(){
  unlock();if(!context)return;
  try{const buffer=await ready;if(context.state!=='running')return;const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;gain.gain.value=.8;source.connect(gain).connect(context.destination);source.onended=()=>{source.disconnect();gain.disconnect();};source.start(context.currentTime,offset,Math.min(duration,buffer.duration-offset));}catch{}
 }
 return {unlock,play};
}
