import * as THREE from 'three';
import { translate } from './language.js';
import { loadTrunkFont } from './trunk-words.js';

const categories = translate([
  { prompt: 'Prends un adjectif', words: ['agile', 'sombre', 'léger', 'brave'] },
  { prompt: 'Prends un verbe', words: ['courir', 'sauter', 'monter', 'fuir'] },
  { prompt: 'Prends un nom', words: ['dragon', 'rivière', 'corde', 'château'] },
  { prompt: 'Prends un article', words: ['le', 'une', 'les', 'des'] },
  { prompt: 'Prends une préposition', words: ['pendant', 'de', 'contre', 'avec', 'pour', 'par', 'depuis'] },
], [
  { prompt: 'Toma un adjetivo', words: ['ágil', 'oscuro', 'ligero', 'valiente'] },
  { prompt: 'Toma un verbo', words: ['correr', 'saltar', 'subir', 'huir'] },
  { prompt: 'Toma un sustantivo', words: ['dragón', 'río', 'cuerda', 'castillo'] },
  { prompt: 'Toma un artículo', words: ['el', 'una', 'los', 'las'] },
  { prompt: 'Toma una preposición', words: ['durante', 'de', 'contra', 'con', 'para', 'por', 'desde'] },
]);
const descentDuration = 22;

function label(text, width, height, framed = true) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = Math.round(512 * height / width);
  const ctx = canvas.getContext('2d');
  if (framed) {
    ctx.beginPath();
    ctx.roundRect(4, 4, 504, canvas.height - 8, 32);
    ctx.fillStyle = '#211c2c';
    ctx.fill();
    ctx.strokeStyle = '#ffc77d';
    ctx.lineWidth = 6;
    ctx.stroke();
  }
  ctx.fillStyle = '#fff4d6';
  ctx.font = `bold ${Math.round(canvas.height * .52)}px system-ui`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, canvas.height / 2, 470);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map, transparent: true, side: THREE.DoubleSide }),
  );
}

function makeWordGeometry(word, font) {
  const size = .34;
  const letters = Array.from(word.toUpperCase(), letter => letter.normalize('NFD'));
  const shapes = font.generateShapes(letters.map(letter => letter[0]).join(''), size);
  let offset = 0;
  for (const [letter, accent] of letters) {
    const glyph = font.data.glyphs[letter];
    const units = size / font.data.resolution;
    if (accent) {
      const x = offset + (glyph.x_min + glyph.x_max) * units / 2;
      const y = size + .035;
      const mark = new THREE.Shape();
      mark.moveTo(x - .065, y);
      if (accent === '\u0302') {
        mark.lineTo(x, y + .06); mark.lineTo(x + .065, y);
        mark.lineTo(x + .032, y); mark.lineTo(x, y + .029); mark.lineTo(x - .032, y);
      } else {
        const slant = accent === '\u0300' ? -.05 : .05;
        mark.lineTo(x - .037 + slant, y + .055);
        mark.lineTo(x - .007 + slant, y + .055);
        mark.lineTo(x - .03, y);
      }
      mark.closePath();
      shapes.push(mark);
    }
    offset += glyph.ha * units;
  }
  const geometry = new THREE.ExtrudeGeometry(shapes, {
    depth: .076, curveSegments: 10, bevelEnabled: true,
    bevelThickness: .014, bevelSize: .012, bevelSegments: 3,
  });
  geometry.computeBoundingBox();
  const width = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
  geometry.center();
  const scale = Math.min(1, 1.7 / width);
  geometry.scale(scale, scale, scale);
  return geometry;
}

export function createChasmWordRescue(parent, prisoner, groundY, depth, onMiss, barkMaterial) {
  const branches = new THREE.Group();
  parent.add(branches);
  branches.visible = false;
  const wood = barkMaterial.clone();
  wood.bumpScale = .024;
  const cord = new THREE.MeshStandardMaterial({ color: 0xa58b6c, roughness: .95 });
  const wordMaterials = [
    new THREE.MeshStandardMaterial({ color: 0xf0e3c9, roughness: .78, emissive: 0x665338, emissiveIntensity: .35 }),
    new THREE.MeshStandardMaterial({ color: 0xcaaf86, roughness: .84, emissive: 0x54432e, emissiveIntensity: .27 }),
  ];
  const prompts = categories.map(({ prompt }) => {
    const mesh = label(prompt, 2.6, .46);
    mesh.raycast = () => {};
    mesh.visible = false;
    parent.add(mesh);
    return mesh;
  });
  const notice = document.createElement('div');
  notice.setAttribute('role', 'status');
  notice.style.cssText = 'position:fixed;top:12%;left:50%;transform:translateX(-50%);z-index:20;padding:.55em 1em;border-radius:.5em;background:#211c2c;color:#fff4d6;font:bold clamp(17px,3vw,28px) system-ui;text-align:center;pointer-events:none';
  notice.hidden = true;
  document.body.append(notice);

  const particleCount = 1800;
  const positions = new THREE.BufferAttribute(new Float32Array(particleCount * 3), 3);
  positions.setUsage(THREE.DynamicDrawUsage);
  const geometry = new THREE.BufferGeometry().setAttribute('position', positions);
  const glow = document.createElement('canvas');
  glow.width = glow.height = 64;
  const ctx = glow.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, '#fffac4');
  gradient.addColorStop(.22, '#ffe272');
  gradient.addColorStop(.48, '#ffb528a8');
  gradient.addColorStop(1, '#ff9a1000');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const goldMap = new THREE.CanvasTexture(glow);
  goldMap.colorSpace = THREE.SRGBColorSpace;
  const cloud = new THREE.Points(geometry, new THREE.PointsMaterial({
    map: goldMap, size: .072, transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
  }));
  cloud.visible = false;
  cloud.frustumCulled = false;
  cloud.raycast = () => {};
  parent.add(cloud);

  function hangingBranch(points, baseRadius, tipRadius, material) {
    const curve = new THREE.CatmullRomCurve3(points);
    const lengthSegments = 12, radialSegments = 8;
    const geometry = new THREE.TubeGeometry(curve, lengthSegments, baseRadius, radialSegments);
    const position = geometry.attributes.position;
    const vertex = new THREE.Vector3();
    for (let ring = 0; ring <= lengthSegments; ring++) {
      const t = ring / lengthSegments;
      const center = curve.getPointAt(t);
      const taper = THREE.MathUtils.lerp(1, tipRadius / baseRadius, t);
      for (let side = 0; side <= radialSegments; side++) {
        const index = ring * (radialSegments + 1) + side;
        const ridge = 1 + .09 * Math.sin(side / radialSegments * Math.PI * 6 + t * 4);
        vertex.fromBufferAttribute(position, index).sub(center).multiplyScalar(taper * ridge).add(center);
        position.setXYZ(index, vertex.x, vertex.y, vertex.z);
      }
    }
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.raycast = () => {};
    return mesh;
  }
  const words = new Map();
  for (let row = 0; row < 28; row++) {
    for (let column = 0; column < 2; column++) {
      const slot = row * 2 + column;
      const category = slot % categories.length;
      const options = categories[category].words;
      const word = options[Math.floor(slot / categories.length) % options.length];
      const mesh = new THREE.Group();
      mesh.add(label(word.toUpperCase(), 1.45, .46, false));
      const side = column === 0 ? -1 : 1;
      const variation = Math.sin(slot * 2.17);
      const x = side * (1.48 + variation * .075);
      const y = THREE.MathUtils.lerp(groundY - .62, -depth + 1, row / 27) + variation * .19;
      const z = 1.21 + variation * .075;
      mesh.position.set(x, y, z);
      mesh.rotation.set(0, -side * .13, variation * .075);
      mesh.userData.spellTarget = 'rescue-word';
      mesh.userData.category = category;
      const base = new THREE.Vector3(side * .66, y + .31, .20);
      const elbow = new THREE.Vector3(side * .90, y + .45 + variation * .09, .50);
      const bend = new THREE.Vector3(side * 1.20, y + .61, .88);
      const tip = new THREE.Vector3(x, y + .55, z);
      branches.add(
        hangingBranch([base, elbow, bend, tip], .092, .013, wood),
        hangingBranch([elbow, new THREE.Vector3(side * 1.04, y + .72, .57),
          new THREE.Vector3(side * 1.13, y + .83 + variation * .12, .59)], .041, .005, wood),
        hangingBranch([tip, new THREE.Vector3(x, y + .33, z),
          new THREE.Vector3(x, y + .13, z)], .009, .008, cord),
        mesh,
      );
      words.set(mesh, word);
    }
  }
  const hitGeometry = new THREE.BoxGeometry(1.7, .48, .15);
  const hitMaterial = new THREE.MeshBasicMaterial({ visible: false });
  loadTrunkFont().then(font => {
    const geometries = new Map();
    for (const [group, word] of words) {
      if (!geometries.has(word)) geometries.set(word, makeWordGeometry(word, font));
      const [fallback] = group.children;
      fallback.geometry.dispose();
      fallback.material.map.dispose();
      fallback.material.dispose();
      fallback.removeFromParent();
      const letters = new THREE.Mesh(geometries.get(word), wordMaterials);
      letters.raycast = () => {};
      group.add(letters, new THREE.Mesh(hitGeometry, hitMaterial));
    }
  }).catch(error => console.warn('Lettres en volume indisponibles', error));

  const start = new THREE.Vector3(), launch = new THREE.Vector3(), landing = new THREE.Vector3();
  let phase = 'idle', elapsed = 0, attempt = 0, category = 0, wrongUntil = 0, viewSide = 1;

  function hideWords() {
    branches.visible = false;
    prompts[category].visible = false;
    notice.hidden = true;
  }

  function begin(post, next) {
    start.copy(prisoner.position);
    landing.set(next.x, groundY, next.z);
    branches.position.set(post.x, 0, post.z);
    viewSide = post.z > 0 ? -1 : 1;
    branches.rotation.y = viewSide === 1 ? 0 : Math.PI;
    branches.visible = true;
    category = attempt++ % categories.length;
    notice.textContent = categories[category].prompt;
    wrongUntil = 0;
    elapsed = 0;
    phase = 'falling';
    prisoner.userData.fallen = true;
    prisoner.userData.chasmRescueView = 'falling';
    prisoner.userData.chasmRescueViewSide = viewSide;
  }

  function take(word) {
    if (phase !== 'falling') return false;
    while (word && !words.has(word)) word = word.parent;
    if (!word) return false;
    if (Math.abs(word.position.y - prisoner.position.y - .8) > 2.5) return false;
    if (word.userData.category !== category) {
      wrongUntil = elapsed + 1;
      notice.textContent = translate('Essaie un autre mot', 'Prueba con otra palabra');
      return false;
    }
    launch.copy(prisoner.position);
    hideWords();
    cloud.visible = true;
    phase = 'rising';
    prisoner.userData.chasmRescueView = 'rising';
    elapsed = 0;
    return true;
  }

  function update(dt, inXR) {
    if (phase === 'idle') return;
    elapsed += dt;
    if (phase === 'falling') {
      const t = Math.min(1, elapsed / descentDuration);
      const align = THREE.MathUtils.smoothstep(elapsed, 0, .55);
      prisoner.position.set(
        THREE.MathUtils.lerp(start.x, branches.position.x, align),
        THREE.MathUtils.lerp(start.y, -depth + .45, t ** 1.25),
        THREE.MathUtils.lerp(start.z, branches.position.z + viewSide * 1.06, align),
      );
      prisoner.rotation.set(.15 * Math.sin(elapsed * 5), branches.rotation.y, .24 * Math.sin(elapsed * 4));
      const prompt = prompts[category];
      prompt.visible = inXR;
      prompt.rotation.y = branches.rotation.y;
      prompt.position.set(prisoner.position.x, prisoner.position.y + 2.1, prisoner.position.z + viewSide * .5);
      notice.hidden = inXR;
      if (wrongUntil && elapsed >= wrongUntil) {
        wrongUntil = 0;
        notice.textContent = categories[category].prompt;
      }
      if (t === 1) {
        hideWords();
        phase = 'idle';
        prisoner.userData.chasmRescueView = false;
        onMiss();
      }
      return;
    }
    const t = Math.min(1, elapsed / 3.2);
    const lift = THREE.MathUtils.smoothstep(t, 0, .7);
    const settle = THREE.MathUtils.smoothstep(t, .88, 1);
    prisoner.position.lerpVectors(launch, landing, THREE.MathUtils.smoothstep(t, .7, .93));
    prisoner.position.y = THREE.MathUtils.lerp(launch.y, groundY + 1.5, lift) - 1.5 * settle;
    prisoner.rotation.set(0, Math.PI, Math.sin(elapsed * 6) * .2 * (1 - t));
    cloud.position.copy(prisoner.position);
    cloud.material.opacity = 1 - THREE.MathUtils.smoothstep(t, .8, 1);
    for (let i = 0; i < particleCount; i++) {
      const height = ((i * .618034 + elapsed * (.72 + (i % 7) * .034)) % 1) * 3.35 - .35;
      const ribbon = (i % 3) * (2 * Math.PI / 3);
      const spread = (((i * .754878) % 1) - .5) * 1.5;
      const angle = ribbon + spread + elapsed * 8.4 + height * 3.1;
      const radius = .42 + ((i * .56984) % 1) * .78 + .09 * Math.sin(elapsed * 9 + i);
      positions.setXYZ(i, Math.cos(angle) * radius, height, Math.sin(angle) * radius);
    }
    positions.needsUpdate = true;
    if (t === 1) {
      prisoner.position.copy(landing);
      cloud.visible = false;
      phase = 'idle';
      prisoner.userData.fallen = false;
      prisoner.userData.chasmRescueView = false;
    }
  }

  return { begin, take, update, get active() { return phase !== 'idle'; } };
}
