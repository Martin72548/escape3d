// Handle restart buttons before encounter-specific reload/reset listeners.
export function enableDungeonRestart() {
 document.addEventListener('click', event => {
  const button = event.target.closest?.('button');
  if (!button || !button.dataset.dungeonRestart) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const destination = new URL('vr.html', window.location.href);
  destination.searchParams.set('restart', '1');
  const language = new URLSearchParams(window.location.search).get('lang');
  if (language) destination.searchParams.set('lang', language);
  window.location.assign(destination.href);
 }, { capture: true });
}
