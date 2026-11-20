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
  ctx.fillStyle = '#e9d9ac';
  ctx.shadowColor = '#211a12';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 3;
  lines.forEach((line, i) => ctx.fillText(line, 1024, 160 + i * 210, 1900));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const material = new THREE.MeshStandardMaterial({
    map: texture, transparent: true, depthWrite: false, roughness: 1,
    emissive: 0x9d7943, emissiveMap: texture, emissiveIntensity: .3,
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
