import * as THREE from 'three';
import { statueExplosionSound } from './statue-explosion-sound.js';

export function createGoldenSerpent(museum, figure, prisoner) {
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
  const skull = new THREE.Mesh(geometry, gold); skull.scale.set(.56, .35, .7); head.add(skull);
  const eyes = [];
  for (const side of [-1, 1]) {
    const material = new THREE.MeshStandardMaterial({ color: 0x161309, emissive: 0x000000 });
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.085, 16, 12), material);
    eye.position.set(side * .43, .16, .3); head.add(eye); eyes.push(eye);
  }
  let state = 'idle', time = 0, age = 0, rise = 0;
  const horseRest = rig.horse.scale.clone(), horseY = rig.horse.position.y;
  const fragments = [];
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
    if (prisoner.userData.dead || state === 'idle' || state === 'melting' || state === 'exploded') return;
    if (state === 'approaching') {
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
    if (state === 'idle' || state === 'exploded' || prisoner.userData.dead) return;
    age += dt; time += dt;
    if (state === 'melting') {
      const t = THREE.MathUtils.smoothstep(time, 0, 2.7);
      rig.horse.scale.set(horseRest.x * (1 + t * .85), horseRest.y * (1 - t * .97), horseRest.z * (1 + t * .55));
      rig.horse.position.y = horseY - t * .4;
      if (time >= 2.7) { rig.horse.visible = false; root.visible = true; state = 'approaching'; time = 0; }
      return;
    }
    const target = museum.worldToLocal(prisoner.getWorldPosition(new THREE.Vector3()));
    const direction = target.sub(root.position); direction.y = 0;
    root.rotation.y = Math.atan2(direction.x, direction.z);
    const distance = direction.length();
    if (state === 'approaching' && distance > 2.3) root.position.addScaledVector(direction.normalize(), Math.min(1.5 * dt, distance - 2.3));
    rise = THREE.MathUtils.damp(rise, state === 'rearing' ? 1 : 0, 4, dt);
    rings.forEach((part, i) => {
      const t = i / (rings.length - 1), lift = Math.max(0, 1 - t * 3);
      part.position.set(Math.sin(t * 15 - age * 3) * .5 * Math.sin(t * Math.PI), rise * lift * lift * 2.8, -t * 8);
    });
    head.position.copy(rings[0].position); head.rotation.x = -.25 * rise;
  }
  return { trigger, hit, update, get active() { return state !== 'idle'; }, get exploded() { return state === 'exploded'; } };
}
