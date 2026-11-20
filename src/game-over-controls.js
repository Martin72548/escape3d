import { translate } from './language.js';
// Keep every defeat screen operable, including deaths without a custom screen.
export function createGameOverControls(prisoner) {
 const prepared = new WeakSet();
 let deadAge = 0;
 function prepare(panel) {
  if (prepared.has(panel)) return;
  prepared.add(panel);
  panel.style.pointerEvents = 'auto';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  let button = panel.querySelector('button');
  if (!button) {
   const card = document.createElement('div');
   while (panel.firstChild) card.append(panel.firstChild);
   button = document.createElement('button');
   const actions = document.createElement('div');
   actions.style.marginTop = '24px';
   button.addEventListener('click', () => window.location.reload());
   actions.append(button); card.append(actions); panel.append(card);
  }
  button.type = 'button';
  button.dataset.dungeonRestart = 'true';
  button.textContent = translate('Recommencer', 'Recomenzar');
  button.focus();
 }
 return { update(dt) {
  const panels = document.querySelectorAll('[id$="-game-over"]');
  panels.forEach(prepare);
  deadAge = prisoner.userData.dead ? deadAge + dt : 0;
  // These encounters display their own screen after the death animation ends.
  if (deadAge < 2 || panels.length || prisoner.userData.wolfVictim || prisoner.userData.chasmFalling || prisoner.userData.gameWon) return;
  const panel = document.createElement('div');
  panel.id = 'prisoner-game-over';
  panel.className = 'defeat-screen';
  const title = document.createElement('h1');
  title.textContent = translate('Fin de la partie', 'Fin del juego');
  panel.append(title); document.body.append(panel); prepare(panel);
 } };
}
