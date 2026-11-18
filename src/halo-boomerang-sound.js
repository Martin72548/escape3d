import { getGameAudioOutput } from './game-audio.js';
import { publicAssetBase } from './public-asset-base.js';
// Recorded boomerang effect by juanricardom, CC0. See audio/SOURCES.md.
export function createHaloBoomerangSound(){
 let context=null,ready=null;
 const active=new Set();
 const file=fetch(`${publicAssetBase}audio/halo-boomerang.mp3`).then(response=>{if(!response.ok)throw Error('Boomerang HTTP '+response.status);return response.arrayBuffer();});
 file.catch(error=>console.warn('No se pudo cargar el sonido del halo:',error));
 function unlock(){
  try{
   const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;
   context??=new Audio();context.resume()?.catch(()=>{});
   ready??=file.then(data=>context.decodeAudioData(data)).then(buffer=>{
    // Normalize the recording so it remains audible over the scene ambience.
    let peak=0;
    for(let c=0;c<buffer.numberOfChannels;c++){
     const samples=buffer.getChannelData(c);
     for(let i=0;i<samples.length;i++)peak=Math.max(peak,Math.abs(samples[i]));
    }
    if(peak>0){
     const level=Math.min(12,.94/peak);
     for(let c=0;c<buffer.numberOfChannels;c++){
      const samples=buffer.getChannelData(c);for(let i=0;i<samples.length;i++)samples[i]*=level;
     }
    }
    const channel=buffer.getChannelData(0);let first=0,last=channel.length-1;
    while(first<last&&Math.abs(channel[first])<.006)first++;
    while(last>first&&Math.abs(channel[last])<.006)last--;
    return {buffer,offset:Math.max(0,first/buffer.sampleRate-.015),duration:Math.max(.1,(last-first)/buffer.sampleRate+.03)};
   });ready.catch(()=>{});
  }catch{}
 }
 async function play(){
  unlock();if(!context)return;
  try{
   const clip=await ready;await context.resume();if(context.state!=='running')return;
   stop();
   const source=context.createBufferSource(),gain=context.createGain();source.buffer=clip.buffer;
   const length=Math.min(clip.duration,2.2),now=context.currentTime;
   gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(2.4,now+.015);gain.gain.setValueAtTime(2.4,now+Math.max(.02,length-.12));gain.gain.linearRampToValueAtTime(0,now+length);
   source.connect(gain).connect(getGameAudioOutput(context));active.add(source);
   source.onended=()=>{active.delete(source);source.disconnect();gain.disconnect();};source.start(now,clip.offset,length);
  }catch(error){console.warn('No se pudo reproducir el boomerang:',error);}
 }
 function stop(){for(const source of active){try{source.stop();}catch{}}active.clear();}
 return {unlock,play,stop};
}
