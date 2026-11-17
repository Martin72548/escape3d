import { publicAssetBase } from './public-asset-base.js';
// One real husky howl, recorded by simcotter (Freesound #115357, CC0).
// Original source and excerpt details: public/audio/SOURCES.md.
export function createCageReleaseSound(){
 const offset=9.1,duration=2.25;
 let context=null,ready=null,pending=false;
 const file=fetch(`${publicAssetBase}audio/solo-husky-howl.mp3`).then(response=>{
  if(!response.ok)throw Error('Wolf recording HTTP '+response.status);
  return response.arrayBuffer();
 });
 file.catch(error=>console.warn('No se pudo cargar el aullido real:',error));
 function unlock(){
  try{
   const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;
   context??=new Audio();context.resume()?.catch(()=>{});
   ready??=file.then(data=>context.decodeAudioData(data));ready.catch(()=>{});
  }catch{}
 }
 function play(onFinished=()=>{}){
  if(!context||context.state!=='running'||!ready)return false;
  if(pending)return true;
  pending=true;
  ready.then(recording=>{
   const source=context.createBufferSource(),gain=context.createGain();
   source.buffer=recording;
   const now=context.currentTime;
   gain.gain.setValueAtTime(0,now);
   gain.gain.linearRampToValueAtTime(.95,now+.06);
   gain.gain.setValueAtTime(.95,now+duration-.25);
   gain.gain.linearRampToValueAtTime(0,now+duration);
   source.connect(gain).connect(context.destination);
   source.onended=()=>{source.disconnect();gain.disconnect();pending=false;onFinished();};
   source.start(now,offset,duration);
  }).catch(error=>{
   pending=false;console.warn('No se pudo reproducir el aullido real:',error);onFinished();
  });
  return true;
 }
 return {unlock,play,duration};
}
