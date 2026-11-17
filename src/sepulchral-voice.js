import { publicAssetBase } from './public-asset-base.js';
export function createSepulchralVoice(){
 let context,buffer,ready,output,convolver;
 const voices=new Set();
 const file=fetch(`${publicAssetBase}audio/male-falling-scream.mp3`).then(r=>{if(!r.ok)throw Error('Scream unavailable');return r.arrayBuffer();});file.catch(()=>{});
 function unlock(){
  try{
   const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;
   if(!context){
    context=new Audio();
    output=context.createDynamicsCompressor();output.threshold.value=-24;output.ratio.value=8;output.connect(context.destination);
    convolver=context.createConvolver();const impulse=context.createBuffer(2,context.sampleRate*3.8,context.sampleRate);
    for(let c=0;c<2;c++){const data=impulse.getChannelData(c);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,3);}
    convolver.buffer=impulse;const wet=context.createGain();wet.gain.value=.42;convolver.connect(wet).connect(output);
    ready=file.then(data=>context.decodeAudioData(data)).then(decoded=>buffer=decoded);ready.catch(()=>{});
   }
   context.resume()?.catch(()=>{});
  }catch{}
 }
 async function play(){
  unlock();if(!context)return;
  try{await ready;if(context.state!=='running')return;
   for(const [rate,volume,delay]of [[.61,.52,0],[.43,.2,.12]]){
    const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
    source.buffer=buffer;source.playbackRate.value=rate;filter.type='lowpass';filter.frequency.value=rate<.5?620:1900;
    const now=context.currentTime+delay,duration=Math.min(2.6,buffer.duration-.5)/rate;
    gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(volume,now+.09);gain.gain.setValueAtTime(volume,now+duration-.3);gain.gain.linearRampToValueAtTime(0,now+duration);
    source.connect(filter).connect(gain);gain.connect(output);gain.connect(convolver);voices.add(source);
    source.onended=()=>{voices.delete(source);source.disconnect();filter.disconnect();gain.disconnect();};source.start(now,.5,Math.min(2.6,buffer.duration-.5));
   }
  }catch{}
 }
 function stop(){for(const source of voices){try{source.stop();}catch{}}voices.clear();}
 return {unlock,play,stop};
}
