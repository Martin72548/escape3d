import * as THREE from 'three';

const scenes = new WeakMap();
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 });
const dummy = new THREE.Object3D();

export function spawnWallFragments(scene, point) {
 const batches = scenes.get(scene) ?? [];
 scenes.set(scene, batches);
 const origin = point.clone();
 // Keep the new rubble on the room side of the broken wall.
 const normal = Math.abs(origin.x) > Math.abs(origin.z) ? new THREE.Vector3(-Math.sign(origin.x),0,0) : new THREE.Vector3(0,0,-Math.sign(origin.z));
 origin.x = THREE.MathUtils.clamp(origin.x,-9.6,9.6);
 origin.z = THREE.MathUtils.clamp(origin.z,-9.6,9.6);
 const mesh = new THREE.InstancedMesh(geometry,material,120);
 mesh.name = 'Fragmentos de ladrillo durante la caida de escombros';
 mesh.castShadow = mesh.receiveShadow = true;
 mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.frustumCulled = false;
 mesh.raycast = () => {};
 const pieces = Array.from({length:120},(_,i) => {
  const size = .07 + Math.random() * .16;
  const position = origin.clone().add(new THREE.Vector3(normal.z,0,-normal.x).multiplyScalar((Math.random()-.5)*2.3));
  position.y = THREE.MathUtils.clamp(origin.y+(Math.random()-.5)*2.4,.7,4.5);
  // Release all fragments within .55 seconds; falling and bouncing then end
  // around 2.2 seconds, leaving the final two seconds of the recording.
  const delay = i < 45 ? Math.random()*.08 : .08 + (i-45)/74*.47;
  const velocity = normal.clone().multiplyScalar(.6+Math.random()*1.5);
  velocity.y = .2+Math.random()*.8;
  const piece = {position,velocity,size,delay,rotation:new THREE.Euler(Math.random()*3,Math.random()*3,Math.random()*3),settled:false,bounces:0};
  dummy.scale.setScalar(0); dummy.updateMatrix(); mesh.setMatrixAt(i,dummy.matrix);
  mesh.setColorAt(i,new THREE.Color().setHSL(.09,.08,.25+Math.random()*.2));
  return piece;
 });
 scene.add(mesh); batches.push({mesh,pieces,age:0});
}

export function updateWallFragments(scene,dt) {
 const batches = scenes.get(scene);
 if (!batches) return;
 for(let batchIndex=batches.length-1;batchIndex>=0;batchIndex--){
  const batch=batches[batchIndex],previous=batch.age;batch.age+=dt;
  batch.pieces.forEach((p,i)=>{
   if(batch.age<p.delay || p.settled)return;
   const step=Math.min(dt,batch.age-Math.max(previous,p.delay));
   p.velocity.y-=9.8*step;p.position.addScaledVector(p.velocity,step);
   p.rotation.x+=step*5;p.rotation.z+=step*3;
   if(p.position.y<p.size*.3+.025){
    p.position.y=p.size*.3+.025;p.rotation.set(0,p.rotation.y,0);
    if(p.bounces++===0&&Math.abs(p.velocity.y)>1){p.velocity.multiplyScalar(.28);p.velocity.y=Math.abs(p.velocity.y);}
    else p.settled=true;
   }
   dummy.position.copy(p.position);dummy.rotation.copy(p.rotation);dummy.scale.set(p.size*1.5,p.size*.6,p.size);dummy.updateMatrix();batch.mesh.setMatrixAt(i,dummy.matrix);
  });
  batch.mesh.instanceMatrix.needsUpdate=true;
  if(batch.pieces.every(p=>p.settled))batches.splice(batchIndex,1);
 }
}
