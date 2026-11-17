// Handle restart buttons before encounter-specific reload/reset listeners.
export function enableDungeonRestart() {
 document.addEventListener('click', event => {
  const button = event.target.closest?.('button');
  if (!button || button.textContent.trim() !== 'Recomenzar') return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const destination = new URL('vr.html', window.location.href);
  destination.searchParams.set('restart', '1');
  window.location.assign(destination.href);
 }, { capture: true });
}
