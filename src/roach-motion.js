import * as THREE from 'three';

export function killHitRoach(root, hitObject) {
  let roach = hitObject;
  while (roach && roach.parent !== root) roach = roach.parent;
  if (!roach?.userData.roachMotion) return null;
  root.remove(roach);
  const geometries = new Set(), materials = new Set();
  roach.traverse(object => {
    if (object.geometry) geometries.add(object.geometry);
    if (object.material) {
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
    }
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
  return root.children.filter(object => object.userData.roachMotion).length;
}

export function prepareRoach(roach, side) {
  roach.userData.roachDirection = new THREE.Vector3(side, 0, 0);
  roach.userData.roachMotion = { phase: 'floor', elapsed: 0, side };
  for (const wingSide of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(wingSide * .13, .55, .1);
    pivot.userData.flightWing = wingSide;
    const wing = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10),
      new THREE.MeshStandardMaterial({ color: 0xd9b586, transparent: true, opacity: .65, roughness: .4 }));
    wing.scale.set(.48, .018, .62);
    wing.position.set(wingSide * .4, 0, -.22);
    pivot.add(wing);
    pivot.visible = false;
    roach.add(pivot);
  }
}

function orient(roach, forward, normal) {
  const right = new THREE.Vector3().crossVectors(normal, forward).normalize();
  const up = new THREE.Vector3().crossVectors(forward, right).normalize();
  roach.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, forward));
}

export function updateRoaches(root, wandWorld, dt, now, canBite = true) {
  let bitten = false;
  for (const roach of root.children.filter(o => o.userData.roachMotion)) {
    const state = roach.userData.roachMotion;
    const position = root.position.clone().add(roach.position);
    const normal = new THREE.Vector3(0, 1, 0);
    const forward = roach.userData.roachDirection;
    state.elapsed += dt;
    if (state.phase === 'floor') {
      position.x += state.side * 2.8 * dt;
      const wallX = state.side * 6.78;
      if (state.side * position.x >= 6.78) {
        position.x = wallX;
        state.phase = 'wall';
        state.elapsed = 0;
      }
      forward.set(state.side, 0, 0);
    }
    if (state.phase === 'wall') {
      normal.set(-state.side, 0, 0);
      forward.set(0, 1, 0);
      position.y = Math.min(2.6, position.y + dt * 1.6);
      if (position.y >= 2.6) {
        state.phase = 'wall-walk';
        state.elapsed = 0;
      }
    } else if (state.phase === 'wall-walk') {
      normal.set(-state.side, 0, 0);
      forward.set(0, 0, state.side);
      position.z = THREE.MathUtils.clamp(position.z + state.side * dt * 1.5, -8.9, 4.9);
      if (state.elapsed >= 1.2) {
        state.phase = 'takeoff';
        state.elapsed = 0;
      }
    } else if (state.phase === 'takeoff') {
      // Leave the wall and gain height before pursuing the wand.
      forward.set(-state.side, .65, 0).normalize();
      position.addScaledVector(forward, dt * 2.5);
      if (state.elapsed >= .8) {
        state.phase = 'approach';
        state.elapsed = 0;
      }
    } else if (state.phase === 'approach') {
      const facing = wandWorld.clone().sub(position);facing.y = 0;
      if (facing.lengthSq() < .0001) facing.set(0, 0, 1);
      facing.normalize();
      // Place the mouth, rather than the body's center, against the star.
      const destination = wandWorld.clone().addScaledVector(facing, -.59);
      destination.y -= .27;
      const delta = destination.sub(position);
      const distance = delta.length();
      if (distance > .01) {
        forward.copy(delta).normalize();
        position.addScaledVector(forward, Math.min(dt * 3.6, distance));
      }
      if (distance <= .12 && canBite && !bitten) {
        state.phase = 'bite';state.elapsed = 0;
        forward.copy(facing);
      }
    } else if (state.phase === 'bite') {
      // A short lunge closes the jaws against the star, then backs away.
      position.addScaledVector(forward, dt * (state.elapsed < .18 ? .6 : -.6));
      if (state.elapsed >= .18 && !state.biteApplied) {
        bitten = canBite || bitten;state.biteApplied = true;
      }
      if (state.elapsed >= .45) {
        state.phase = 'approach';state.elapsed = 0;state.biteApplied = false;
      }
    }
    orient(roach, forward, normal);
    roach.position.copy(position).sub(root.position);
    const flying = state.phase === 'takeoff' || state.phase === 'approach' || state.phase === 'bite';
    roach.traverse(part => {
      if (part.userData.roachJaw) part.rotation.z = part.userData.side *
        (state.phase === 'bite' ? .15 + Math.abs(Math.sin(state.elapsed * 18)) * .65 : .35);
    });
    for (const wing of roach.children.filter(o => o.userData.flightWing)) {
      wing.visible = flying;
      wing.rotation.z = wing.userData.flightWing * (.35 + Math.sin(now * .075) * .65);
    }
  }
  return bitten;
}
