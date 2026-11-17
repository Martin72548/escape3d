/** Adjust only desktop resolution; WebXR owns its framebuffer and frame rate. */
export function createAdaptiveResolution(renderer, { maxRatio = 1.75, minRatio = 1 } = {}) {
 // Keep at least one rendered pixel per CSS pixel to avoid a blurry canvas.
 let ratio = Math.min(window.devicePixelRatio || 1, maxRatio);
 let previous = 0, elapsed = 0, frames = 0, settling = 20;
 renderer.setPixelRatio(ratio);
 document.addEventListener('visibilitychange', () => { previous = 0; settling = 20; });
 return function updateResolution(now) {
  if (renderer.xr?.isPresenting || document.hidden) { previous = 0; return; }
  const dt = previous ? now - previous : 0;
  previous = now;
  if (settling > 0) { settling--; return; }
  // Ignore tab switches and loading stalls; use sustained frame times.
  if (dt <= 0 || dt > 250) return;
  elapsed += dt; frames++;
  if (elapsed < 1200) return;
  const average = elapsed / frames;
  elapsed = 0; frames = 0;
  const ceiling = Math.min(window.devicePixelRatio || 1, maxRatio);
  const floor = Math.min(minRatio, ceiling);
  const next = average > 24 ? Math.max(floor, ratio - 0.1)
   : average < 17.5 ? Math.min(ceiling, ratio + 0.1) : ratio;
  if (Math.abs(next - ratio) < 0.01) return;
  ratio = next;
  renderer.setPixelRatio(ratio);
  settling = 30;
 };
}
