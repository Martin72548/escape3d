import { getGameAudioOutput } from './game-audio.js';
import { publicAssetBase } from './public-asset-base.js';

let context;

export function unlockHarpyWingAudio() {
  const Audio = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  if (!Audio) return;
  try {
    context ??= new Audio();
    if (context.state !== 'running') context.resume().catch(() => {});
  } catch {}
}

export function createHarpyWingAudio() {
  let source, volume, pan, recording, decoding;
  const file = fetch(`${publicAssetBase}audio/harpy-wing-flaps.mp3`).then(response => {
    if (!response.ok) throw Error(`Harpy wing audio HTTP ${response.status}`);
    return response.arrayBuffer();
  });
  file.catch(error => console.warn('Son des ailes indisponible', error));

  function stop() {
    if (!source) return;
    source.stop();
    source.disconnect();
    source = undefined;
  }

  function update(x, audible) {
    if (context && !decoding) {
      decoding = file.then(data => context.decodeAudioData(data)).then(buffer => { recording = buffer; });
      decoding.catch(() => {});
    }
    if (!audible || context?.state !== 'running') {
      stop();
      return;
    }
    if (!recording) return;
    if (!volume) {
      volume = context.createGain();
      pan = context.createStereoPanner();
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2200;
      filter.Q.value = .5;
      volume.connect(filter).connect(pan).connect(getGameAudioOutput(context));
    }
    pan.pan.value = Math.max(-.85, Math.min(.85, x / 20));
    const distance = Math.min(1, Math.abs(x) / 17.5);
    volume.gain.value = .11 + .30 * (1 - distance ** 2);
    if (source) return;
    source = context.createBufferSource();
    source.buffer = recording;
    source.playbackRate.value = .82;
    source.loop = true;
    source.connect(volume);
    source.start();
  }

  return { update, stop };
}
