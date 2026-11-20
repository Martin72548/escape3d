import { getGameAudioOutput } from './game-audio.js';

// D, E-flat and A-flat recur over a low D. The last two notes leave the tritone hanging.
const melody = [
	[.24, 74, .85], [.58, 81, .55], [.93, 80, .73], [1.29, 75, .59],
	[1.64, 74, .82], [1.68, 62, .41], [2.32, 86, .58], [2.56, 87, .64],
	[2.92, 81, .52], [3.28, 80, .74], [3.79, 62, .49], [3.84, 80, .69],
];

// A plucked steel tine has widely spaced bending modes, plus a short casing resonance.
const tineModes = [[1, .16, .78], [2.006, .028, .32], [6.27, .037, .11], [17.55, .012, .035]];

export function createRopeMusic() {
	let context;

	function unlock() {
		const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
		if (!Audio) return;
		try {
			context ??= new Audio();
			if (context.state === 'suspended') context.resume().catch(() => {});
		} catch { /* Audio support is optional. */ }
	}

	function play() {
		unlock();
		if (context?.state !== 'running') return;

		const rate = context.sampleRate;
		const cue = context.createBuffer(1, Math.ceil(5 * rate), rate);
		const samples = cue.getChannelData(0);
		for (const [offset, note, strength] of melody) {
			const firstSample = Math.round(offset * rate);
			const frequency = 440 * 2 ** ((note - 69 + .045 * Math.sin(note)) / 12);
			const modes = tineModes.filter(([ratio]) => frequency * ratio < rate / 2);
			let previousNoise = 0;
			for (let i = 0; i < .95 * rate; i++) {
				const t = i / rate;
				let tone = 0;
				for (const [ratio, level, decay] of modes) {
					tone += level * Math.sin(2 * Math.PI * frequency * ratio * t) * Math.exp(-6 * t / decay);
				}
				const noise = Math.random() * 2 - 1;
				const click = .018 * (noise - previousNoise) * Math.exp(-t / .004);
				previousNoise = noise;
				const casing = .021 * Math.sin(2 * Math.PI * 370 * t) * Math.exp(-t / .027);
				const sample = strength * Math.min(1, t / .0015) * (tone + click + casing);
				samples[firstSample + i] += sample;
				// Quiet reflections from the stone corridor.
				samples[firstSample + i + Math.round(.072 * rate)] += sample * .16;
				samples[firstSample + i + Math.round(.138 * rate)] += sample * .08;
			}
		}
		const source = context.createBufferSource();
		source.buffer = cue;
		source.connect(getGameAudioOutput(context));
		source.onended = () => source.disconnect();
		source.start();
	}

	return { unlock, play };
}
