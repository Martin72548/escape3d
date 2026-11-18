import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function addMuseumBackWall(parent, stoneMaterial) {
  const wall = new THREE.Group();
  wall.name = 'Mur du fond en six grands blocs de pierre';
  parent.add(wall);
  const mortar = new THREE.Mesh(new THREE.BoxGeometry(20, 6, .8), new THREE.MeshStandardMaterial({ color: 0x302d26, roughness: 1 }));
  mortar.position.set(0, 3, -10.12); wall.add(mortar);
  let seed = 751;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  for (let row = 0; row < 2; row++) for (let col = 0; col < 3; col++) {
    const material = stoneMaterial.clone();
    for (const key of ['map', 'bumpMap', 'roughnessMap']) {
      material[key] = stoneMaterial[key].clone();
      material[key].repeat.set(3.3, 1.5);
      material[key].offset.set(col * .31 + row * .19, row * .37 + col * .13);
      material[key].needsUpdate = true;
    }
    material.color.setHSL(.10, .12, .66 + random() * .16);
    material.bumpScale = .13;
    material.roughness = 1;
    const geometry = new RoundedBoxGeometry(20 / 3 - .075, 2.925, .85, 8, .11);
    const positions = geometry.attributes.position;
    // Broken edges and broad irregular relief give the blocks a raw quarried face.
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
      const edge = Math.max(Math.abs(x) / (10 / 3), Math.abs(y) / 1.5);
      const wear = Math.sin(x * 19 + y * 7) * Math.sin(y * 23 - x * 3);
      const crag = Math.sin(x * 3.3 + y * 2.7 + row) * Math.cos(y * 5.2 - x * 1.6 + col);
      positions.setZ(i, z + wear * (edge > .90 ? .045 : .013) + crag * .045);
      if (edge > .9) {
        positions.setX(i, x + Math.sin(y * 17 + z * 8) * .022);
        positions.setY(i, y + Math.sin(x * 11 - z * 7) * .022);
      }
    }
    geometry.computeVertexNormals();
    const block = new THREE.Mesh(geometry, material);
    block.name = `Grand bloc de pierre ${row * 3 + col + 1}`;
    block.position.set(-20 / 3 + col * 20 / 3, 1.5 + row * 3, -10);
    block.castShadow = block.receiveShadow = true;
    wall.add(block);
  }
  return wall;
}
