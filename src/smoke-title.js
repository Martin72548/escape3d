import { translate } from './language.js';
import { showFireMessage } from './fire-message.js';

const introduction = translate(`Aide le magicien prisonnier à échapper de ce sombre cachot.

La clé qui ouvre la porte est cachée sous une dalle ou une brique. Détruis tout ce qui peut mettre sa vie en danger, ouvre la porte et passe au niveau suivant.

Pour te déplacer dans le cachot, utilise les touches W, A, S et D.

Que la chance t’accompagne !`, `Ayuda al mago prisionero a escapar de este oscuro calabozo.

La llave que abre la puerta está escondida bajo una losa o un ladrillo. Destruye todo lo que ponga en peligro al mago, abre la puerta y pasa al siguiente nivel.

Usa las teclas W, A, S y D para moverte por el calabozo.

¡Buena suerte!`);

// A brief, transparent title made from drifting smoke particles.
const canvas = document.createElement('canvas');
canvas.className = 'smoke-title';
canvas.setAttribute('role', 'img');
canvas.setAttribute('aria-label', translate('Le magicien', 'El mago'));
document.body.appendChild(canvas);
const context = canvas.getContext('2d');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let width, height, particles;

function resize() {
  width = innerWidth;
  height = innerHeight;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  const mask = document.createElement('canvas');
  mask.width = Math.ceil(Math.min(width < 600 ? width * .72 : width * .36, 560));
  mask.height = 200;
  const ink = mask.getContext('2d');
  const size = Math.min(132, mask.width / 6.3);
  ink.font = `italic ${size}px Georgia, serif`;
  ink.textAlign = 'center';
  ink.textBaseline = 'middle';
  ink.fillText(translate('Le magicien', 'El mago'), mask.width / 2, 100);
  const pixels = ink.getImageData(0, 0, mask.width, 200).data;
  particles = [];
  const step = width < 600 ? 2 : 3;
  for (let y = 0; y < 200; y += step) {
    for (let x = 0; x < mask.width; x += step) {
      if (pixels[(y * mask.width + x) * 4 + 3] < 80) continue;
      particles.push({ x: x - mask.width / 2, y: y - 100,
        seed: Math.random() * Math.PI * 2, drift: (Math.random() - .5) * 180,
        lift: 45 + Math.random() * 150, radius: 1 + Math.random() * 1.5, depth: Math.random(), speed: .6 + Math.random(), birth: Math.random() * 1.4, originX: (Math.random() - .5) * 160, originY: (Math.random() - .5) * 90 });
    }
  }
}
resize();
addEventListener('resize', resize);
const puff = document.createElement('canvas');
// Layered, irregular density gives each wisp illuminated edges and a soft core.
puff.width = puff.height = 96;
const smoke = puff.getContext('2d');
for (let i = 0; i < 45; i++) {
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.random() * 24;
  const x = 48 + Math.cos(angle) * distance;
  const y = 48 + Math.sin(angle) * distance;
  const radius = 10 + Math.random() * 21;
  const gradient = smoke.createRadialGradient(x - 3, y - 5, 0, x, y, radius);
  gradient.addColorStop(0, 'rgba(244,239,225,.075)');
  gradient.addColorStop(.4, 'rgba(181,192,202,.045)');
  gradient.addColorStop(1, 'rgba(120,137,154,0)');
  smoke.fillStyle = gradient;
  smoke.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}
const start = performance.now() + 2000;
function draw(now) {
  const time = (now - start) / 1000;
  if (time < 0) {
    requestAnimationFrame(draw);
    return;
  }
  if (time >= 8.5) {
    removeEventListener('resize', resize);
    canvas.remove();
    showFireMessage(introduction, { duration: 15, verticalPosition: .5, centered: true, multiline: true,
      onComplete: () => window.dispatchEvent(new Event('dungeon-introduction-complete')) });
    return;
  }
  context.clearRect(0, 0, width, height);
  const entrance = Math.min(time / 2.2, 1);
  const ease = entrance * entrance * (3 - 2 * entrance);
  const dissolve = Math.max(0, (time - 5) / 3.5);
  context.save();
  // Arrive on the opposite side, clear of the score and bottom controls.
  const targetX = width < 600 ? width * .41 : width * .23;
  const targetY = height * .34;
  const floatX = reducedMotion ? 0 : Math.sin(time * .65) * 7 * ease;
  const floatY = reducedMotion ? 0 : Math.sin(time * 1.1) * 9 * ease;
  // Keep a single vanishing point so the title emerges from the wall.
  context.translate(targetX + floatX, targetY + 22 * (1 - ease) + floatY);
  const scale = reducedMotion ? 1 : 1 / (1 + 13 * (1 - ease));
  context.scale(scale, scale * (reducedMotion ? 1 : .65 + .35 * ease));
  const opacity = Math.min(time / .9, 1) * (.2 + .8 * ease) * Math.pow(1 - dissolve, 1.5);
  for (const p of particles) {
    const formation = reducedMotion ? 1 : Math.max(0, Math.min(1, (time - p.birth) / 1.6));
    if (formation <= 0) continue;
    const gather = 1 - formation * formation * (3 - 2 * formation);
    const spread = reducedMotion ? 0 : dissolve * dissolve;
    const flow = reducedMotion ? 0 : time * p.speed;
    const curlX = Math.sin(flow + p.seed) + .5 * Math.sin(flow * 2.3 + p.y * .04);
    const curlY = Math.cos(flow * .8 + p.seed) + .5 * Math.sin(p.x * .045 + flow);
    const x = p.x + p.originX * gather + p.drift * spread + curlX * (1 + gather * 12 + spread * 30);
    const y = p.y + p.originY * gather - p.lift * spread + curlY * (1 + gather * 10 + spread * 18);
    const radius = p.radius * (3 + dissolve * 15 + gather * 10);
    // Dense lettering plus a wider, translucent plume rising from each stroke.
    context.globalAlpha = opacity * formation * (.6 + p.depth * .4);
    context.drawImage(puff, x - radius, y - radius, radius * 2, radius * 2);
    if (!reducedMotion && p.depth > .68) {
      const cycle = (time * .28 * p.speed + p.depth) % 1;
      const trail = radius * (2 + cycle * 3);
      const tx = x + Math.sin(flow + cycle * 5 + p.seed) * cycle * 23;
      const ty = y - cycle * (30 + p.lift * .25);
      context.globalAlpha = opacity * formation * .17 * (1 - cycle);
      context.drawImage(puff, tx - trail, ty - trail, trail * 2, trail * 2);
    }
  }
  context.restore();
  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);

