import { getGameAudioOutput } from './game-audio.js';
import { publicAssetBase } from './public-asset-base.js';
// Performed male choking vocal by Drkvixn91, CC0. See audio/SOURCES.md.
export function createChokedCrySound(){
 let context=null,ready=null,generation=0;
 const active=new Set();
 const file=fetch(`${publicAssetBase}audio/male-choked-cry.mp3`).then(response=>{if(!response.ok)throw Error('Choked cry HTTP '+response.status);return response.arrayBuffer();});
 file.catch(error=>console.warn('No se pudo cargar el grito ahogado:',error));
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
  stop();const ticket=generation;
  try{
   const clip=await ready;await context.resume();if(context.state!=='running'||ticket!==generation)return;
   const source=context.createBufferSource(),gain=context.createGain();source.buffer=clip.buffer;
   const length=Math.min(clip.duration,4.35),now=context.currentTime;
   gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.85,now+.015);gain.gain.setValueAtTime(.85,now+Math.max(.02,length-.12));gain.gain.linearRampToValueAtTime(0,now+length);
   source.connect(gain).connect(getGameAudioOutput(context));active.add(source);
   source.onended=()=>{active.delete(source);source.disconnect();gain.disconnect();};source.start(now,clip.offset,length);
  }catch(error){console.warn('No se pudo reproducir el grito ahogado:',error);}
 }
 function stop(){generation++;for(const source of active){try{source.stop();}catch{}}active.clear();}
 return {unlock,play,stop};
}
