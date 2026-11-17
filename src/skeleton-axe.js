import * as THREE from 'three';

export function equipSkeletonAxe(root) {
  let hand;
  root.traverse(part => {
    if ((part.userData.skeletonArm || part.userData.lanternArm) && part.userData.side === 1) hand = part;
  });
  if (!hand) return;
  hand.userData.axeArm = true;
  const axe = new THREE.Group();
  axe.position.set(0, hand.userData.lanternArm ? .55 : -.56, .02);
  // The skeleton raises its arm by half a turn; keep the blade above the grip.
  axe.rotation.x = hand.userData.lanternArm ? 0 : Math.PI;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.035, .045, 1.15, 10),
    new THREE.MeshStandardMaterial({ color: 0x674229, roughness: .8 }));
  shaft.position.y = .3;
  axe.add(shaft);
  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(0, .65);
  bladeShape.lineTo(.25, .84);
  bladeShape.quadraticCurveTo(.6, .7, .6, .35);
  bladeShape.lineTo(.25, .44);
  bladeShape.lineTo(0, .49);
  bladeShape.closePath();
  const blade = new THREE.Mesh(new THREE.ExtrudeGeometry(bladeShape, { depth: .065, bevelEnabled: false }),
    new THREE.MeshStandardMaterial({ color: 0xb9c4cd, metalness: .85, roughness: .25 }));
  blade.position.z = -.0325;
  axe.add(blade);
  axe.traverse(part => { if (part.isMesh) part.castShadow = true; });
  hand.add(axe);
}

export function animateSkeletonAxe(root, dt, now, inReach, wandPosition) {
  const previous = root.userData.axeStrikeTime || 0;
  const elapsed = inReach ? previous + dt : 0;
  root.userData.axeStrikeTime = elapsed;
  root.traverse(arm => {
    if (!arm.userData.axeArm) return;
    arm.rotation.z = -.5;
    arm.rotation.x = (arm.userData.lanternArm ? 0 : Math.PI) +
      (inReach ? -.8 + Math.min(elapsed / .35, 1) * 1.8 : Math.sin(now * .009) * .75);
    if (inReach && wandPosition) {
      // Aim the swing at the wand in the shoulder's own coordinate system.
      root.updateWorldMatrix(true, true);
      const direction = arm.parent.worldToLocal(wandPosition.clone()).sub(arm.position).normalize();
      const axis = new THREE.Vector3(0, arm.userData.lanternArm ? 1 : -1, 0);
      const impact = new THREE.Quaternion().setFromUnitVectors(axis, direction);
      const windup = impact.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -1.1));
      arm.quaternion.slerpQuaternions(windup, impact, THREE.MathUtils.smoothstep(elapsed, 0, .35));
    }
  });
  return inReach && previous < .35 && elapsed >= .35;
}

export function createSplitStar(starShape, material) {
  const vertices = starShape.getPoints().slice(0, -1);
  const halves = new THREE.Group();
  for (const side of [-1, 1]) {
    const points = [];
    for (let i = 0; i < vertices.length; i++) {
      const a = vertices[i], b = vertices[(i + 1) % vertices.length];
      const insideA = side * a.x >= -1e-10, insideB = side * b.x >= -1e-10;
      if (insideA) points.push(a.clone());
      if (insideA !== insideB) points.push(new THREE.Vector2(0, a.y + (b.y - a.y) * (-a.x / (b.x - a.x))));
    }
    const shape = new THREE.Shape(points);
    shape.closePath();
    const half = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: .018, bevelEnabled: false }), material.clone());
    half.userData.side = side;
    halves.add(half);
  }
  halves.visible = false;
  return halves;
}
