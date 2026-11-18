const preferenceKey = 'escape3d-sound-muted';
let muted = false;
try {
	muted = globalThis.localStorage?.getItem(preferenceKey) === 'true';
} catch {}

const outputs = new WeakMap();
const gains = new Set();
const players = new Set();
const buttons = new Set();

function updateButton(button) {
	button.setAttribute('aria-pressed', String(muted));
	button.title = muted ? 'Activar sonido' : 'Silenciar sonido';
}

function applyMute(value) {
	muted = value;
	for (const output of gains) output.gain.setValueAtTime(muted ? 0 : 1, output.context.currentTime);
	for (const player of players) player.muted = muted;
	for (const button of buttons) updateButton(button);
}

globalThis.addEventListener?.('storage', event => {
	if (event.key === preferenceKey) applyMute(event.newValue === 'true');
});

export function getGameAudioOutput(context) {
	let output = outputs.get(context);
	if (!output) {
		output = context.createGain();
		output.gain.value = muted ? 0 : 1;
		output.connect(context.destination);
		outputs.set(context, output);
		gains.add(output);
	}
	return output;
}

export function createGameAudio(source) {
	const player = new Audio(source);
	player.muted = muted;
	players.add(player);
	return player;
}

export function bindSoundToggle(button) {
	if (!button || button.dataset.soundBound) return;
	button.dataset.soundBound = 'true';
	buttons.add(button);
	button.addEventListener('click', () => {
		applyMute(!muted);
		try {
			globalThis.localStorage?.setItem(preferenceKey, String(muted));
		} catch {}
	});
	updateButton(button);
}
