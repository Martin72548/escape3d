import { getGameAudioOutput } from './game-audio.js';
import { publicAssetBase } from './public-asset-base.js';

const footstepGain = .425;

// The field recording contains six separated impacts. Find each attack in the decoded audio.
function findFootfalls(recording) {
	const samples = recording.getChannelData(0);
	const rate = recording.sampleRate;
	let peak = 0;
	for (const sample of samples) peak = Math.max(peak, Math.abs(sample));

	const offsets = [];
	if (peak === 0) return offsets;
	for (let i = 0; i < samples.length; i++) {
		if (Math.abs(samples[i]) < peak * .06) continue;
		offsets.push(Math.max(0, i / rate - .012));
		i += Math.round(.32 * rate);
	}
	return offsets;
}

export function createRunningFootsteps() {
	let context, recording, filter;
	let offsets = [];
	let nextFootfall = 0;
	const file = fetch(`${publicAssetBase}audio/stone-boot-footsteps.mp3`).then(response => {
		if (!response.ok) throw new Error(`Footstep recording HTTP ${response.status}`);
		return response.arrayBuffer();
	});
	file.catch(error => console.warn('Footstep recording unavailable', error));

	window.addEventListener('keydown', event => {
		if (!['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(event.code)) return;
		try {
			const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
			if (!Audio) return;
			if (!context) {
				context = new Audio();
				filter = context.createBiquadFilter();
				filter.type = 'lowpass';
				filter.frequency.value = 1550;
				filter.Q.value = .7;
				filter.connect(getGameAudioOutput(context));
				file.then(data => context.decodeAudioData(data)).then(decoded => {
					recording = decoded;
					offsets = findFootfalls(decoded);
				}).catch(() => {});
			}
			if (context.state === 'suspended') context.resume().catch(() => {});
		} catch { /* Audio support is optional. */ }
	});

	return function play() {
		if (context?.state !== 'running' || !offsets.length) return;
		const offset = offsets[nextFootfall];
		nextFootfall = (nextFootfall + 1) % offsets.length;

		const source = context.createBufferSource();
		source.buffer = recording;
		source.playbackRate.value = .83;
		const length = Math.min(.18, recording.duration - offset);
		const start = context.currentTime;
		const end = start + length / source.playbackRate.value;
		const envelope = context.createGain();
		envelope.gain.setValueAtTime(footstepGain, start);
		envelope.gain.setValueAtTime(footstepGain, Math.max(start, end - .035));
		envelope.gain.linearRampToValueAtTime(0, end);
		source.connect(envelope).connect(filter);
		source.onended = () => { source.disconnect(); envelope.disconnect(); };
		source.start(start, offset, length);
	};
}
