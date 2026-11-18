import { getGameAudioOutput } from './game-audio.js';
export function createZombieGrowl() {
	let context=null,active=null;
	function unlock(){
		try{const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;context??=new Audio();context.resume().catch(()=>{});}catch{}
	}
	function stop(){
		if(!active)return;
		const sound=active;active=null;
		for(const source of sound.sources){try{source.stop();}catch{}}
		sound.nodes.forEach(node=>node.disconnect());
	}
	function play(intensity=1){
		if(!context||context.state!=='running')return false;
		stop();
		const now=context.currentTime,duration=2.15;
		const voice=context.createOscillator(),bass=context.createOscillator(),tremolo=context.createOscillator(),tremoloGain=context.createGain();
		voice.type='sawtooth';voice.frequency.setValueAtTime(67,now);voice.frequency.exponentialRampToValueAtTime(44,now+duration);
		bass.type='triangle';bass.frequency.setValueAtTime(34,now);bass.frequency.linearRampToValueAtTime(27,now+duration);
		tremolo.frequency.value=23;tremoloGain.gain.value=8;tremolo.connect(tremoloGain).connect(voice.frequency);
		const voiceGain=context.createGain(),bassGain=context.createGain(),noiseGain=context.createGain();voiceGain.gain.value=.45;bassGain.gain.value=.35;noiseGain.gain.value=.2;
		const buffer=context.createBuffer(1,Math.ceil(context.sampleRate*duration),context.sampleRate),samples=buffer.getChannelData(0);
		for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*(.6+.4*Math.sin(i/context.sampleRate*43));
		const breath=context.createBufferSource();breath.buffer=buffer;
		const throat=context.createBiquadFilter();throat.type='lowpass';throat.frequency.value=950;throat.Q.value=4;
		const resonance=context.createBiquadFilter();resonance.type='peaking';resonance.frequency.value=290;resonance.Q.value=2.5;resonance.gain.value=9;
		const envelope=context.createGain();envelope.gain.setValueAtTime(0,now);envelope.gain.linearRampToValueAtTime(.15*intensity,now+.12);envelope.gain.linearRampToValueAtTime(.11*intensity,now+1.3);envelope.gain.exponentialRampToValueAtTime(.0001,now+duration);
		voice.connect(voiceGain).connect(throat);bass.connect(bassGain).connect(throat);breath.connect(noiseGain).connect(throat);throat.connect(resonance).connect(envelope).connect(getGameAudioOutput(context));
		const sources=[voice,bass,tremolo,breath],nodes=[...sources,voiceGain,bassGain,noiseGain,tremoloGain,throat,resonance,envelope];
		const sound={sources,nodes};active=sound;
		breath.onended=()=>{if(active===sound){active=null;nodes.forEach(node=>node.disconnect());}};
		for(const source of sources){source.start(now);source.stop(now+duration);}
		return true;
	}
	return {unlock,play,stop};
}
