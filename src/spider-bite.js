import * as THREE from 'three';

export function animateSpiderBite(root, starWorld, dt, canBite) {
  let state = root.userData.spiderBite;
  if (!state) {
    const distance = Math.hypot(starWorld.x - root.position.x, starWorld.z - root.position.z);
    if (!canBite || distance > 1.9) return false;
    state = root.userData.spiderBite = { elapsed: 0, start: root.position.clone(), applied: false };
  }
  state.elapsed += dt;
  const direction = starWorld.clone().sub(state.start);direction.y = 0;
  if (direction.lengthSq() < .0001) direction.set(0, 0, 1);
  direction.normalize();
  root.rotation.set(0, Math.atan2(direction.x, direction.z), 0);
  const destination = starWorld.clone().addScaledVector(direction, -.49);
  destination.y -= .27;
  const progress = state.elapsed <= .3
    ? THREE.MathUtils.smoothstep(state.elapsed, 0, .3)
    : 1 - THREE.MathUtils.smoothstep(state.elapsed, .4, .8);
  root.position.lerpVectors(state.start, destination, progress);
  root.position.y += Math.sin(progress * Math.PI) * .3;
  root.traverse(part => {
    if (part.userData.spiderFang) part.rotation.z = part.userData.side * (.5 * (1 - progress));
    if (part.userData.spiderPalp) part.rotation.x = -.6 * progress;
  });
  let bitten = false;
  if (state.elapsed >= .3 && !state.applied) {
    bitten = canBite;state.applied = true;
  }
  if (state.elapsed >= .8) delete root.userData.spiderBite;
  return bitten;
}
