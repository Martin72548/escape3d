export function showFireMessage(message, { title, duration = 6, verticalPosition = .34, centered = false, multiline = false, action, onComplete } = {}) {
  const canvas = document.createElement('canvas');
  canvas.className = 'smoke-title';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', title ? `${title}\n${message}` : message);
  document.body.appendChild(canvas);
  if (action) {
    action.hidden = true;
    document.body.appendChild(action);
  }
  const ctx = canvas.getContext('2d');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width, height, mask, sparks;
  function resize() {
    width = innerWidth;
    height = innerHeight;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    mask = document.createElement('canvas');
    mask.width = Math.round(multiline ? Math.min(width * .88, 850) : Math.min(width < 600 ? width * .72 : width * .36, 560));
    let size = Math.max(16, Math.min(27, mask.width / 17));
    const ink = mask.getContext('2d');
    const centerX = width * (centered ? .5 : width < 600 ? .41 : .23);
    const centerY = height * verticalPosition;
    const maxTextHeight = action
      ? Math.min(height * .78, 2 * (height - centerY - 48))
      : height * .78;
    function wrap(text, fontSize, weight) {
      const font = `${weight} ${fontSize}px Georgia, serif`;
      ink.font = font;
      const lines = [];
      for (const paragraph of text.split('\n')) {
        let line = '';
        for (const word of paragraph.split(' ')) {
          const next = line ? `${line} ${word}` : word;
          if (line && ink.measureText(next).width > mask.width - 16) {
            lines.push({ text: line, font, height: fontSize * 1.5 });
            line = word;
          } else line = next;
        }
        lines.push({ text: line, font, height: fontSize * 1.5 });
      }
      return lines;
    }
    let lines, textHeight;
    do {
      const titleLines = title ? wrap(title, size * 1.65, 700) : [];
      lines = [...titleLines, ...wrap(message, size, 600)];
      textHeight = lines.reduce((total, line) => total + line.height, 0) + 12;
      if (!multiline || textHeight <= maxTextHeight || size <= 10) break;
      size -= 1;
    } while (true);
    mask.height = Math.ceil(textHeight);
    if (action) {
      action.style.left = `${centerX}px`;
      action.style.top = `${centerY + mask.height / 2}px`;
    }
    ink.textAlign = 'center';
    ink.textBaseline = 'middle';
    const fire = ink.createLinearGradient(0, 0, 0, mask.height);
    fire.addColorStop(0, '#fff2b5');
    fire.addColorStop(.5, '#ffc25d');
    fire.addColorStop(1, '#ff651c');
    ink.fillStyle = fire;
    let y = 6;
    for (const line of lines) {
      ink.font = line.font;
      ink.fillText(line.text, mask.width / 2, y + line.height / 2);
      y += line.height;
    }
    const pixels = ink.getImageData(0, 0, mask.width, mask.height).data;
    sparks = [];
    for (let y = 0; y < mask.height; y += 3) {
      for (let x = 0; x < mask.width; x += 3) {
        if (pixels[(y * mask.width + x) * 4 + 3] > 100) {
          sparks.push({ x: x - mask.width / 2, y: y - mask.height / 2,
            seed: Math.random() * 6.28, speed: .5 + Math.random(), lift: 45 + Math.random() * 110 });
        }
      }
    }
  }
  resize();
  addEventListener('resize', resize);
  const soot = document.createElement('canvas');
  soot.width = soot.height = 64;
  const smoke = soot.getContext('2d');
  const density = smoke.createRadialGradient(30, 28, 2, 32, 32, 32);
  density.addColorStop(0, 'rgba(4,3,3,.65)');
  density.addColorStop(.4, 'rgba(12,10,9,.35)');
  density.addColorStop(1, 'rgba(18,16,15,0)');
  smoke.fillStyle = density;
  smoke.fillRect(0, 0, 64, 64);
  const start = performance.now();
  let frame;
  let finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(frame);
    removeEventListener('resize', resize);
    canvas.remove();
    action?.remove();
    onComplete?.();
  }
  function draw(now) {
    const time = (now - start) / 1000;
    if (time >= duration + 3) {
      finish();
      return;
    }
    const extinguish = Math.max(0, Math.min(1, (time - duration) / 3));
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width * (centered ? .5 : width < 600 ? .41 : .23), height * verticalPosition);
    const flicker = still ? 1 : .9 + .1 * Math.sin(time * 19);
    ctx.globalAlpha = Math.min(1, time / .45) * Math.max(0, 1 - extinguish * 4);
    ctx.shadowColor = '#ff5e12';
    ctx.shadowBlur = 14 * flicker;
    ctx.drawImage(mask, -mask.width / 2, -mask.height / 2);
    ctx.shadowBlur = 0;
    if (!still && time < duration + .6) {
      ctx.globalCompositeOperation = 'lighter';
      for (const p of sparks) {
        const age = (time * p.speed + p.seed) % 1;
        ctx.globalAlpha = (1 - age) * .5 * Math.max(0, 1 - extinguish * 5);
        ctx.fillStyle = age < .3 ? '#ffdc7b' : '#e94c0b';
        const x = p.x + Math.sin(age * 7 + p.seed) * age * 7;
        const y = p.y - age * 24;
        ctx.fillRect(x, y, 1.3, 2 + age * 3);
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    if (extinguish > 0) {
      for (const p of sparks) {
        const radius = 4 + extinguish * 23;
        const drift = still ? 0 : extinguish;
        const x = p.x + Math.sin(time * p.speed + p.seed) * drift * 35;
        const y = p.y - p.lift * drift;
        ctx.globalAlpha = Math.sin(extinguish * Math.PI) * .28;
        ctx.drawImage(soot, x - radius, y - radius, radius * 2, radius * 2);
      }
    }
    ctx.restore();
    if (action?.hidden && time > 0) action.hidden = false;
    frame = requestAnimationFrame(draw);
  }
  frame = requestAnimationFrame(draw);
  return finish;
}
