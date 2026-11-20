import * as THREE from 'three';
import { statueExplosionSound } from './statue-explosion-sound.js';

const detourRadius = 2.15;
const bodyClearance = 2.03;
const headClearance = 2.08;
const biteRange = 1.65;

export function createGoldenSerpent(museum, figure, prisoner, pedestalPosition) {
  const rig = figure.userData.georgeRig;
  const gold = new THREE.MeshStandardMaterial({ color: 0xe9b735, metalness: .94, roughness: .25 });
  const root = new THREE.Group(); root.name = 'Serpent enorme en or'; root.visible = false;
  root.userData.goldenSerpent = true; museum.add(root);
  const rings = [];
  const geometry = new THREE.SphereGeometry(1, 20, 14);
  for (let i = 0; i < 65; i++) {
    const mesh = new THREE.Mesh(geometry, gold);
    mesh.castShadow = mesh.receiveShadow = true;
    const radius = .09 + .36 * Math.sin((1 - i / 70) * Math.PI / 2);
    mesh.scale.set(radius, radius, .18); root.add(mesh); rings.push(mesh);
  }
  const head = new THREE.Group(); root.add(head);
  const skull = new THREE.Mesh(geometry, gold); skull.scale.set(.56, .29, .7); skull.position.y = .09; head.add(skull);
  const jaw = new THREE.Group(); jaw.position.set(0, -.12, -.35); head.add(jaw);
  const lowerJaw = new THREE.Mesh(geometry, gold);
  lowerJaw.scale.set(.47, .13, .63); lowerJaw.position.z = .42; jaw.add(lowerJaw);
  const palate = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0x350d13 }));
  palate.scale.set(.43, .055, .56); palate.position.set(0, .09, .43); jaw.add(palate);
  const fangGeometry = new THREE.ConeGeometry(.07, .29, 10);
  const ivory = new THREE.MeshStandardMaterial({ color: 0xffebbc, roughness: .4 });
  const eyes = [];
  for (const side of [-1, 1]) {
    const material = new THREE.MeshStandardMaterial({ color: 0x161309, emissive: 0x000000 });
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.085, 16, 12), material);
    eye.position.set(side * .43, .16, .3); head.add(eye); eyes.push(eye);
    const fang = new THREE.Mesh(fangGeometry, ivory);
    fang.position.set(side * .28, -.2, .49); fang.rotation.z = Math.PI; head.add(fang);
  }
  let state = 'idle', time = 0, age = 0, rise = 0;
  const horseRest = rig.horse.scale.clone(), horseY = rig.horse.position.y;
  const fragments = [];
  const trail = [];
  const center = new THREE.Vector3(pedestalPosition.x, .48, pedestalPosition.z);
  const target = new THREE.Vector3(), goal = new THREE.Vector3(), delta = new THREE.Vector3();
  const radial = new THREE.Vector3(), targetRadial = new THREE.Vector3(), closest = new THREE.Vector3();
  const victimStart = new THREE.Vector3(), victimScale = new THREE.Vector3(), mouth = new THREE.Vector3();

  function crossesPedestal(from, to) {
    delta.subVectors(to, from);
    const lengthSq = delta.lengthSq();
    if (!lengthSq) return false;
    const fraction = THREE.MathUtils.clamp(closest.subVectors(center, from).dot(delta) / lengthSq, 0, 1);
    return closest.copy(from).addScaledVector(delta, fraction).distanceToSquared(center) < bodyClearance ** 2;
  }

  function followPrisoner(dt) {
    goal.copy(target);
    targetRadial.subVectors(goal, center);
    if (targetRadial.lengthSq() < detourRadius ** 2) {
      if (!targetRadial.lengthSq()) targetRadial.subVectors(root.position, center);
      goal.copy(center).addScaledVector(targetRadial.normalize(), detourRadius);
    }
    const detouring = crossesPedestal(root.position, goal);
    if (detouring) {
      radial.subVectors(root.position, center);
      targetRadial.subVectors(goal, center);
      const angle = Math.atan2(radial.z, radial.x);
      const targetAngle = Math.atan2(targetRadial.z, targetRadial.x);
      const turn = Math.atan2(Math.sin(targetAngle - angle), Math.cos(targetAngle - angle));
      const waypointAngle = angle + Math.sign(turn || 1) * .38;
      goal.set(center.x + detourRadius * Math.cos(waypointAngle), center.y, center.z + detourRadius * Math.sin(waypointAngle));
    }
    const distance = delta.subVectors(goal, root.position).length();
    if (!distance) return;
    const step = Math.min(distance, dt * 1.7);
    root.position.addScaledVector(delta, step / distance);
    radial.subVectors(root.position, center);
    if (radial.lengthSq() < headClearance ** 2) root.position.copy(center).addScaledVector(radial.normalize(), headClearance);
    if (!detouring && target.distanceTo(root.position) <= biteRange) {
      state = 'windup'; time = 0;
    }
  }

  function poseBody() {
    // Each ring follows the distance already travelled by the head around the pedestal.
    let distance = 0, segment = 0;
    const position = new THREE.Vector3();
    for (let i = 0; i < rings.length; i++) {
      const offset = i * .125;
      let length = trail[segment].distanceTo(trail[segment + 1]);
      while (distance + length < offset && segment + 2 < trail.length) {
        distance += length;
        segment++;
        length = trail[segment].distanceTo(trail[segment + 1]);
      }
      const front = trail[segment], back = trail[segment + 1];
      const t = length ? Math.min(1, (offset - distance) / length) : 0;
      position.lerpVectors(front, back, t);
      const sway = .13 * Math.sin(i / 5 - age * 5) * Math.min(1, i / 5);
      const yaw = Math.atan2(front.x - back.x, front.z - back.z);
      position.x += Math.cos(yaw) * sway;
      position.z -= Math.sin(yaw) * sway;
      position.y += rise * liftProfile(i);
      rings[i].position.copy(position).sub(root.position);
      rings[i].rotation.y = yaw;
    }
    trail.length = Math.min(trail.length, segment + 2);
    head.position.copy(rings[0].position);
  }

  function liftProfile(index) {
    return 2.4 * Math.max(0, 1 - index / 21) ** 2;
  }
  function trigger() {
    if (state !== 'idle' || prisoner.userData.dead || prisoner.userData.georgeCaptured) return;
    figure.userData.serpentTransformation = true;
    state = 'melting'; time = 0;
    root.position.copy(museum.worldToLocal(figure.getWorldPosition(new THREE.Vector3())));
    root.position.y = .48;
  }
  function explode() {
    state = 'exploded'; root.visible = false; statueExplosionSound.play();
    museum.updateWorldMatrix(true, true);
    const shardGeometry = new THREE.ConeGeometry(1, 1, 3);
    for (let i = 0; i < 100; i++) {
      const source = rings[i % rings.length];
      const mesh = new THREE.Mesh(shardGeometry, gold);
      mesh.name = 'Tesson metallique pointu incruste dans le mur';
      mesh.scale.set(.09 + Math.random() * .14, .35 + Math.random() * .45, .045);
      mesh.position.copy(museum.worldToLocal(source.getWorldPosition(new THREE.Vector3())));
      const start = mesh.position.clone(), wall = i % 4;
      const end = new THREE.Vector3((Math.random() - .5) * 17, .7 + Math.random() * 4.7, (Math.random() - .5) * 17);
      const normal = new THREE.Vector3();
      if (wall < 2) { end.x = wall === 0 ? -9.45 : 9.45; normal.x = wall === 0 ? 1 : -1; }
      else { end.z = wall === 2 ? -9.45 : 9.45; normal.z = wall === 2 ? 1 : -1; }
      const finalRotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      mesh.castShadow = mesh.receiveShadow = true; museum.add(mesh);
      fragments.push({ mesh, start, end, finalRotation, age: 0, duration: .55 + Math.random() * .5 });
    }
  }
  function hit() {
    if (prisoner.userData.dead || !['approaching', 'windup', 'rearing'].includes(state)) return;
    if (state !== 'rearing') {
      state = 'rearing'; time = 0;
      eyes.forEach(eye => { eye.material.color.set(0xff1000); eye.material.emissive.set(0xff0000); eye.material.emissiveIntensity = 4; });
    } else explode();
  }
  function update(dt) {
    fragments.forEach(part => {
      if (part.age >= part.duration) return;
      part.age = Math.min(part.duration, part.age + dt);
      const t = part.age / part.duration;
      part.mesh.position.lerpVectors(part.start, part.end, t);
      part.mesh.position.y += Math.sin(t * Math.PI) * 1.2;
      part.mesh.rotation.x += dt * 16; part.mesh.rotation.z += dt * 11;
      if (t === 1) part.mesh.quaternion.copy(part.finalRotation);
    });
    if (state === 'idle' || state === 'exploded' || prisoner.userData.dead || (prisoner.userData.gameOver && state !== 'swallowing')) return;
    age += dt; time += dt;
    if (state === 'melting') {
      const t = THREE.MathUtils.smoothstep(time, 0, 2.7);
      rig.horse.scale.set(horseRest.x * (1 + t * .85), horseRest.y * (1 - t * .97), horseRest.z * (1 + t * .55));
      rig.horse.position.y = horseY - t * .4;
      if (time >= 2.7) {
        rig.horse.visible = false; root.visible = true; state = 'approaching'; time = 0;
        const behind = root.position.clone().setZ(-9.1);
        trail.push(root.position.clone(), behind, behind.clone().setX(-6.8));
        poseBody();
      }
      return;
    }
    museum.worldToLocal(prisoner.getWorldPosition(target)).setY(center.y);
    if (state === 'approaching') {
      followPrisoner(dt);
      if (root.position.distanceToSquared(trail[0]) > 0) trail.unshift(root.position.clone());
    } else if (state === 'windup') {
      if (target.distanceTo(root.position) > biteRange + .4) {
        state = 'approaching'; time = 0;
      } else if (time >= 1.15) {
        state = 'swallowing'; time = 0;
        victimStart.copy(prisoner.position);
        victimScale.copy(prisoner.scale);
        prisoner.userData.gameOver = true;
        prisoner.userData.fallen = true;
      }
    }

    const raised = state === 'rearing' || state === 'windup' || state === 'swallowing';
    rise = THREE.MathUtils.damp(rise, raised ? (state === 'rearing' ? 1 : .62) : 0, 5, dt);
    poseBody();
    if (state === 'approaching') delta.subVectors(trail[0], trail[1]);
    else delta.subVectors(target, root.position);
    if (state !== 'swallowing' && delta.lengthSq() > 0) head.rotation.y = Math.atan2(delta.x, delta.z);
    head.rotation.x = -.2 * rise;
    let opening = state === 'windup' ? THREE.MathUtils.smoothstep(time, 0, .8) : 0;
    if (state === 'swallowing') {
      const lunge = Math.sin(Math.PI * THREE.MathUtils.smoothstep(time, 0, .8));
      head.position.x += Math.sin(head.rotation.y) * lunge * .48;
      head.position.z += Math.cos(head.rotation.y) * lunge * .48;
      radial.copy(root.position).add(head.position).sub(center).setY(0);
      if (radial.lengthSq() < headClearance ** 2) {
        radial.normalize().multiplyScalar(headClearance).add(center).sub(root.position);
        head.position.x = radial.x;
        head.position.z = radial.z;
      }
      const progress = THREE.MathUtils.smoothstep(time, .12, .75);
      opening = 1 - THREE.MathUtils.smoothstep(time, .43, .88);
      head.localToWorld(mouth.set(0, -.38, .53));
      prisoner.parent?.worldToLocal(mouth);
      prisoner.position.lerpVectors(victimStart, mouth, progress);
      prisoner.scale.copy(victimScale).multiplyScalar(1 - .97 * progress);
      if (time >= .88) {
        prisoner.visible = false;
        prisoner.scale.copy(victimScale);
        prisoner.userData.dead = true;
      }
    }
    jaw.rotation.x = opening * 1.13;
  }
  return { trigger, hit, update, get active() { return state !== 'idle'; }, get exploded() { return state === 'exploded'; } };
}
