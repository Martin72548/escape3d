import { getGameAudioOutput } from './game-audio.js';
// Uneven metal squeal and rattling as the iron gate slides up.
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
			const frequency = 360 - 155 * progress + 48 * Math.sin(t * 8) + 12 * Math.sin(t * 63);
			phase += 2 * Math.PI * frequency / context.sampleRate;
			friction = friction * .8 + (Math.random() * 2 - 1) * .2;
			const pulse = .65 + .35 * Math.sin(t * 29 + 2 * Math.sin(t * 5));
			const envelope = Math.min(1, t / .09, (duration - t) / .25);
			const squeal = .28 * Math.sin(phase) + .18 * Math.sin(phase * 2.76) + .1 * Math.sin(phase * 5.4);
			const rattle = .5 * friction * (.4 + .6 * Math.pow(Math.sin(t * 55), 8));
			samples[i] = envelope * pulse * (squeal + rattle);
		}
		const source = context.createBufferSource();
		source.buffer = buffer;
		const filter = context.createBiquadFilter();
		filter.type = 'lowpass';
		filter.frequency.value = 3200;
		const gain = context.createGain();
		gain.gain.value = .42;
		source.connect(filter).connect(gain).connect(getGameAudioOutput(context));
		source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
		source.start(now);
	}
	return { unlock, play };
}
