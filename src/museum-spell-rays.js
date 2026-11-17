import * as THREE from 'three';
import { syncHandSpellRay } from './hand-spell-ray.js';

export function createMuseumSpellRays(scene, prisoner) {
  const active = [];
  const geometry = new THREE.CylinderGeometry(.012, .045, 1, 8, 1, true);
  function emit(point) {
    prisoner.userData.castWand?.(point);
    const material = new THREE.MeshBasicMaterial({
      color: 0x8cecff, transparent: true, opacity: .92,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    const ray = new THREE.Mesh(geometry, material);
    ray.name = 'Rayon magique de la chapelle';
    ray.frustumCulled = false;
    ray.raycast = () => {};
    syncHandSpellRay(ray, prisoner, point);
    const flash = new THREE.PointLight(0x62dfff, 4, 1.8);
    flash.position.copy(point);
    scene.add(ray, flash);
    active.push({ ray, flash, target: point.clone(), life: .18 });
  }
  function update(dt) {
    for (let i = active.length - 1; i >= 0; i--) {
      const effect = active[i];
      effect.life -= dt;
      if (effect.life <= 0) {
        scene.remove(effect.ray, effect.flash);
        effect.ray.material.dispose();
        effect.flash.dispose();
        active.splice(i, 1);
        continue;
      }
      syncHandSpellRay(effect.ray, prisoner, effect.target);
      effect.ray.material.opacity = .92 * effect.life / .18;
      effect.flash.intensity = 4 * effect.life / .18;
    }
  }
  return { emit, update };
}
