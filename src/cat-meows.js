import { publicAssetBase } from './public-asset-base.js';
﻿// Two real cat recordings, CC0. See public/audio/SOURCES.md.
export function createCatMeows(){
 let context=null,ready=null;const wanted=[false,false],active=[null,null],loops=[null,null];
 const files=Promise.all([1,2].map(i=>fetch(`${publicAssetBase}audio/cat-meow-${i}.mp3`).then(response=>{if(!response.ok)throw Error('Cat recording HTTP '+response.status);return response.arrayBuffer();})));
 files.catch(error=>console.warn('No se pudieron cargar los maullidos:',error));
 function unlock(){try{const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;context??=new Audio();context.resume()?.then(()=>wanted.forEach((value,i)=>{if(value)begin(i);})).catch(()=>{});ready??=files.then(bytes=>Promise.all(bytes.map(data=>context.decodeAudioData(data))));ready.catch(()=>{});}catch{}}
 async function begin(i){
  try{const recordings=await ready;if(!wanted[i]||active[i]||!context||context.state!=='running')return;
   if(!loops[i]){const recording=recordings[i],rate=recording.sampleRate,duration=i===0?4.2:5.2,limit=Math.min(recording.length,Math.floor(rate*(i===0?recording.duration:2.6))),loop=context.createBuffer(recording.numberOfChannels,Math.ceil(rate*duration),rate);
    for(let channel=0;channel<recording.numberOfChannels;channel++){const input=recording.getChannelData(channel),output=loop.getChannelData(channel);for(let j=0;j<limit;j++)output[j]=input[j]*Math.min(1,(limit-j)/(rate*.04),j/(rate*.01));}loops[i]=loop;
   }
   const source=context.createBufferSource(),gain=context.createGain();source.buffer=loops[i];source.loop=true;gain.gain.value=.75;source.connect(gain).connect(context.destination);active[i]={source,gain};source.start(context.currentTime+(i===1?.45:0));
  }catch{}
 }
 function stopVoice(i){if(!active[i])return;const {source,gain}=active[i];active[i]=null;try{source.stop();}catch{}source.disconnect();gain.disconnect();}
 function sync(live){live.forEach((value,i)=>{if(wanted[i]===value)return;wanted[i]=value;if(value){unlock();begin(i);}else stopVoice(i);});}
 function stop(){wanted.fill(false);active.forEach((_,i)=>stopVoice(i));}
 return {unlock,sync,stop,get playing(){return active.filter(Boolean).length;}};
}
