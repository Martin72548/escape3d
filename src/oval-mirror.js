import * as THREE from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { createGlassBreakSound } from './glass-break-sound.js';

export function addOvalMirror(scene) {
 const root = new THREE.Group();
 root.name = 'Espejo oval en la pared izquierda mirando la puerta';
 root.position.set(-9.65, 2.3, -8);
 root.rotation.y = Math.PI / 2;
 scene.add(root);

 const backing = new THREE.Mesh(
  new THREE.CylinderGeometry(1, 1, .09, 80),
  new THREE.MeshStandardMaterial({ color: 0x302820, roughness: .8 })
 );
 backing.rotation.x = Math.PI / 2;
 backing.scale.set(.86, 1, 1.31);
 backing.position.z = -.06;
 backing.castShadow = true;
 root.add(backing);

 const glass = new Reflector(new THREE.CircleGeometry(1, 96).scale(.77, 1.22, 1), {
  color: 0xc7cccf,
  textureWidth: 768,
  textureHeight: 1024,
  clipBias: .003,
  multisample: 0,
 });
 glass.name = 'Superficie oval con reflejo de la escena';
 glass.userData.spellTarget = 'oval-mirror';
 root.add(glass);

 const bronze = new THREE.MeshStandardMaterial({ color: 0x796044, metalness: .72, roughness: .38 });
 const rim = new THREE.Mesh(new THREE.TorusGeometry(1, .065, 12, 96), bronze);
 rim.scale.set(.82, 1.27, 1);
 rim.position.z = .012;
 rim.castShadow = true;
 root.add(rim);
 const sound = createGlassBreakSound(), shards = [];
 let hits = 0, falling = false, broken = false, time = 0, onBreak;
 const restPosition = root.position.clone(), restRotation = root.quaternion.clone();
 const floorRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
 root.userData.hitMirror = callback => {
  if (falling || broken) return;
  sound.unlock();
  if (++hits < 2) return;
  falling = true; onBreak = callback; delete glass.userData.spellTarget;
 };
 root.userData.updateMirror = dt => {
  if (falling) {
   time += dt;
   const t = Math.min(1, time / .9);
   root.position.lerpVectors(restPosition, new THREE.Vector3(-8.2, .08, -8), t * t);
   root.quaternion.copy(restRotation).slerp(floorRotation, t);
   if (t === 1) {
    falling = false; broken = true; root.visible = false; sound.play();
    const material = new THREE.MeshStandardMaterial({ color: 0xc3d8df, metalness: .95, roughness: .16, side: THREE.DoubleSide });
    for (let i = 0; i < 55; i++) {
     const geometry = new THREE.BufferGeometry();
     geometry.setAttribute('position', new THREE.Float32BufferAttribute([-.12,0,-.08,.16,0,-.04,0,0,.23], 3)); geometry.computeVertexNormals();
     const mesh = new THREE.Mesh(geometry, material); mesh.name = 'Eclat de verre du miroir';
     mesh.position.copy(root.position).add(new THREE.Vector3((Math.random()-.5)*1.5,.05,(Math.random()-.5)*2));
     mesh.rotation.y = Math.random()*Math.PI*2; scene.add(mesh);
     shards.push({mesh,velocity:new THREE.Vector3((Math.random()-.5)*3,1+Math.random()*2,(Math.random()-.5)*3)});
    }
    onBreak?.(); onBreak = null;
   }
  }
  shards.forEach(shard => {
   if (shard.mesh.position.y <= .035 && shard.velocity.y <= 0) return;
   shard.velocity.y -= dt * 9.8; shard.mesh.position.addScaledVector(shard.velocity, dt);
   shard.mesh.rotation.y += dt * 4;
   if (shard.mesh.position.y < .035) { shard.mesh.position.y = .035; shard.velocity.set(0,0,0); }
  });
 };
 return root;
}
