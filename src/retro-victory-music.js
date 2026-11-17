export function createRetroVictoryMusic(){
 let context=null,requested=false,played=false;
 function unlock(){try{const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;context??=new Audio();context.resume()?.then(()=>{if(requested)play();}).catch(()=>{});}catch{}}
 function play(){
  requested=true;if(played||!context||context.state!=='running')return false;played=true;
  const start=context.currentTime+.04,beat=.145,master=context.createGain();master.gain.value=.17;master.connect(context.destination);
  const sequence=[[72,1],[76,1],[79,1],[84,3],[79,1],[84,1],[88,2],[86,1],[84,1],[83,1],[79,1],[81,2],[83,2],[84,5],[88,1],[91,1],[96,6]];
  let cursor=0,voices=0;
  function note(midi,time,duration,type,volume){
   const oscillator=context.createOscillator(),gain=context.createGain();oscillator.type=type;oscillator.frequency.value=440*Math.pow(2,(midi-69)/12);
   gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(volume,time+.006);gain.gain.setValueAtTime(volume,time+Math.max(.01,duration-.045));gain.gain.linearRampToValueAtTime(0,time+duration);
   oscillator.connect(gain).connect(master);oscillator.start(time);oscillator.stop(time+duration+.01);voices++;oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();if(--voices===0)master.disconnect();};
  }
  for(const [pitch,length]of sequence){note(pitch,start+cursor*beat,length*beat*.92,'square',.46);cursor+=length;}
  for(let i=0;i<cursor;i++){const chord=i<8?[48,55,60,64]:i<16?[53,60,65,69]:i<24?[55,62,67,71]:[48,55,60,64];note(chord[i%4]+12,start+i*beat,beat*.75,'triangle',.35);if(i%4===0)note(chord[0]-12,start+i*beat,beat*3.5,'triangle',.65);}
  for(const pitch of [60,64,67,72])note(pitch,start+cursor*beat,1.1,'square',.16);
  document.removeEventListener('pointerdown',unlock);document.removeEventListener('keydown',unlock);return true;
 }
 document.addEventListener('pointerdown',unlock);document.addEventListener('keydown',unlock);unlock();
 return {unlock,play,get played(){return played;}};
}
