import { getGameAudioOutput } from './game-audio.js';
// A slow, uneven hinge squeal with wood friction, generated locally.
export function createDoorCreak() {
	let context;
	function unlock() {
		try {
			const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
			if (!Audio) return;
			context ??= new Audio();
			if (context.state === 'suspended') context.resume().catch(() => {});
		} catch { /* Audio support must not interrupt the scene. */ }
	}
	globalThis.addEventListener('pointerdown', unlock, { once: true });
	globalThis.addEventListener('keydown', unlock, { once: true });
	function play(duration) {
		unlock();
		if (!context || context.state !== 'running') return;
		const now = context.currentTime;
		const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
		const samples = buffer.getChannelData(0);
		let phase = 0, friction = 0;
		for (let i = 0; i < samples.length; i++) {
			const t = i / context.sampleRate, progress = t / duration;
			const frequency = 210 - 90 * progress + 32 * Math.sin(t * 8) + 7 * Math.sin(t * 63);
			phase += 2 * Math.PI * frequency / context.sampleRate;
			friction = friction * .8 + (Math.random() * 2 - 1) * .2;
			const pulse = .65 + .35 * Math.sin(t * 29 + 2 * Math.sin(t * 5));
			const envelope = Math.min(1, t / .09, (duration - t) / .25);
			samples[i] = envelope * pulse * (.36 * Math.sin(phase) + .16 * Math.sin(phase * 2) + .08 * Math.sin(phase * 5) + .45 * friction);
		}
		const source = context.createBufferSource();
		source.buffer = buffer;
		const filter = context.createBiquadFilter();
		filter.type = 'lowpass';
		filter.frequency.value = 2400;
		const gain = context.createGain();
		gain.gain.value = .42;
		source.connect(filter).connect(gain).connect(getGameAudioOutput(context));
		source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
		source.start(now);
	}
	return { unlock, play };
}
