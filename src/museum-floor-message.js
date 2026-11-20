import * as THREE from 'three';
import { translate } from './language.js';

export function addMuseumFloorMessage(parent) {
  const lines = translate([
    'Sur le mur au fond lance',
    'un rayon sur la phrase',
    'S - V - OD - OI - CT - CL',
  ], ['En el muro del fondo,', 'lanza un rayo a la frase', 'S - V - OD - OI - CCT - CCL']);
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 768;
  const ctx = canvas.getContext('2d');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '600 85px Georgia, serif';
  lines.forEach((line, i) => {
    const y = 160 + i * 210;
    const flame = ctx.createLinearGradient(0, y - 44, 0, y + 44);
    flame.addColorStop(0, '#fff8bf');
    flame.addColorStop(.4, '#ffc04c');
    flame.addColorStop(.75, '#ff701c');
    flame.addColorStop(1, '#e5320a');

    ctx.fillStyle = '#fa4b10';
    ctx.shadowColor = '#ff430c';
    ctx.shadowBlur = 32;
    ctx.fillText(line, 1024, y, 1900);

    ctx.fillStyle = flame;
    ctx.shadowColor = '#ff9b30';
    ctx.shadowBlur = 10;
    ctx.fillText(line, 1024, y, 1900);
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const material = new THREE.MeshBasicMaterial({
    map: texture, transparent: true, depthWrite: false, toneMapped: false,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
  });
  const inscription = new THREE.Mesh(new THREE.PlaneGeometry(6, 2.25), material);
  inscription.name = 'Consigne du rayon sur les dalles';
  inscription.userData.message = lines.join(' ');
  inscription.rotation.x = -Math.PI / 2;
  // Sit immediately below the front edge of Saint Denis's pedestal at (0, 0, 0).
  inscription.position.set(0, .09, 2.05);
  inscription.raycast = () => {};
  parent.add(inscription);
  return inscription;
}
