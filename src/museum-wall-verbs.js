import * as THREE from 'three';
import { translate } from './language.js';

export function addMuseumWallVerbs(stones) {
  const phrases = translate(['Il va', 'il vient', 'il entre', 'il sort', 'il monte',
    'il descend', 'il meurt', 'il na\u00eet', 'il retourne', 'il passe',
    'il arrive', 'il part', 'il reste'],
    ['Va', 'viene', 'entra', 'sale', 'sube', 'baja', 'muere', 'nace', 'regresa', 'pasa', 'llega', 'se va', 'se queda']);
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const rotation = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const candidates = [];
  for (let id = 0; id < stones.count; id++) {
    stones.getMatrixAt(id, matrix);
    matrix.decompose(position, rotation, scale);
    if (scale.x > .78 && Math.abs(position.x) < 4.8 && position.y > .75 && position.y < 2.7) {
      candidates.push({ id, x: position.x, y: position.y });
    }
  }
  // Three compact rows above the statues, each phrase on a separate brick.
  const targets = [
    ...[-3.8, -1.9, 0, 1.9, 3.8].map(x => ({ x, y: 2.565 })),
    ...[-3, -1, 1, 3].map(x => ({ x, y: 2.035 })),
    ...[-3, -1, 1, 3].map(x => ({ x, y: 1.505 })),
  ];
  const geometry = new THREE.PlaneGeometry(1, 1);
  phrases.forEach((phrase, index) => {
    const target = targets[index];
    candidates.sort((a, b) =>
      (a.x - target.x) ** 2 + 12 * (a.y - target.y) ** 2 -
      ((b.x - target.x) ** 2 + 12 * (b.y - target.y) ** 2));
    const chosen = candidates.shift();
    if (!chosen) return;
    const { id } = chosen;
    stones.getMatrixAt(id, matrix);
    matrix.decompose(position, rotation, scale);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = '700 100px Arial, sans-serif';
    canvas.width = Math.ceil(ctx.measureText(phrase).width + 24);
    canvas.height = 140;
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 100px Arial, sans-serif';
    ctx.fillText(phrase, canvas.width / 2, 72);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    const material = new THREE.MeshStandardMaterial({
      map: texture, transparent: true, depthWrite: false, roughness: 1,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    });
    const inscription = new THREE.Mesh(geometry, material);
    inscription.name = `Verbe sur brique : ${phrase}`;
    inscription.userData.brickInstance = id;
    inscription.position.set(0, 0, .53).applyMatrix4(matrix);
    inscription.quaternion.copy(rotation);
    const aspect = canvas.width / canvas.height;
    const h = Math.min(scale.y * .85, scale.x * .94 / aspect);
    inscription.scale.set(h * aspect, h, 1);
    inscription.raycast = () => {};
    stones.add(inscription);
  });
}
