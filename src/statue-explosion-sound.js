import { getGameAudioOutput } from './game-audio.js';
function createExplosionSound(){
 let context=null;
 function unlock(){try{const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;context??=new Audio();context.resume()?.catch(()=>{});}catch{}}
 function play(){
  if(!context||context.state!=='running')return;
  const now=context.currentTime,duration=3.2,buffer=context.createBuffer(1,Math.ceil(context.sampleRate*duration),context.sampleRate),data=buffer.getChannelData(0);
  let low=0;for(let i=0;i<data.length;i++){low=.94*low+.06*(Math.random()*2-1);data[i]=(Math.random()*2-1)*.45+low*2.5;}
  const source=context.createBufferSource();source.buffer=buffer;
  const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.setValueAtTime(2400,now);filter.frequency.exponentialRampToValueAtTime(90,now+duration);
  const envelope=context.createGain();envelope.gain.setValueAtTime(0,now);envelope.gain.linearRampToValueAtTime(.7,now+.012);envelope.gain.exponentialRampToValueAtTime(.0001,now+duration);
  const compressor=context.createDynamicsCompressor();compressor.threshold.value=-10;compressor.ratio.value=8;compressor.connect(getGameAudioOutput(context));
  source.connect(filter).connect(envelope).connect(compressor);
  const delay=context.createDelay(1);delay.delayTime.value=.24;const echo=context.createGain();echo.gain.value=.3;envelope.connect(delay).connect(echo).connect(compressor);
  const rumble=context.createOscillator(),bass=context.createGain();rumble.frequency.setValueAtTime(62,now);rumble.frequency.exponentialRampToValueAtTime(22,now+1.5);bass.gain.setValueAtTime(.4,now);bass.gain.exponentialRampToValueAtTime(.0001,now+2);rumble.connect(bass).connect(compressor);
  source.start(now);rumble.start(now);rumble.stop(now+2.1);source.onended=()=>{source.disconnect();filter.disconnect();envelope.disconnect();delay.disconnect();echo.disconnect();bass.disconnect();rumble.disconnect();compressor.disconnect();};
 }
 return {unlock,play};
}

export const statueExplosionSound=createExplosionSound();
