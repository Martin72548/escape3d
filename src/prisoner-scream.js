import { getGameAudioOutput } from './game-audio.js';
// A short voiced, breathy scream synthesized locally after a user gesture.
export function createPrisonerScream() {
	let context = null;
	function unlock() {
		try {
			const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
			if (!Audio) return;
			context ??= new Audio();
			context.resume().catch(() => {});
		} catch { /* The animation still works when audio is unavailable. */ }
	}
	function play() {
		if (!context || context.state !== 'running') return;
		const now = context.currentTime, duration = 1.65;
		const voice = context.createOscillator(), vibrato = context.createOscillator(), vibratoGain = context.createGain(), envelope = context.createGain();
		voice.type = 'sawtooth'; voice.frequency.setValueAtTime(210, now); voice.frequency.exponentialRampToValueAtTime(490, now + .23); voice.frequency.exponentialRampToValueAtTime(285, now + duration);
		vibrato.frequency.value = 7.5; vibratoGain.gain.value = 22; vibrato.connect(vibratoGain).connect(voice.frequency);
		envelope.gain.setValueAtTime(0, now); envelope.gain.linearRampToValueAtTime(.075, now + .08); envelope.gain.setValueAtTime(.065, now + 1.1); envelope.gain.exponentialRampToValueAtTime(.0001, now + duration);
		const filters = [850, 1250, 2800].map(frequency => { const filter = context.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = frequency; filter.Q.value = 3.5; voice.connect(filter).connect(envelope); return filter; });
		envelope.connect(getGameAudioOutput(context)); voice.start(now); vibrato.start(now); voice.stop(now + duration); vibrato.stop(now + duration);
		voice.onended = () => { voice.disconnect(); vibrato.disconnect(); vibratoGain.disconnect(); filters.forEach(filter => filter.disconnect()); envelope.disconnect(); };
	}
	return { unlock, play };
}
