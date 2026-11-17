import * as THREE from 'three';

export function createDevilDestruction(scene, figure, knives) {
 let hits=0,exploded=false,smokeClock=0;
 const smoke=[],pieces=[];
 const puffGeometry=new THREE.SphereGeometry(1,10,8);
 const chunkGeometry=new THREE.IcosahedronGeometry(1,0);
 const chunkMaterial=new THREE.MeshStandardMaterial({color:0x9e352f,roughness:.95});
 const center=new THREE.Vector3();
 function puff(){
  const material=new THREE.MeshBasicMaterial({color:0x69615d,transparent:true,opacity:.4,depthWrite:false});
  const mesh=new THREE.Mesh(puffGeometry,material);figure.getWorldPosition(center);
  mesh.position.copy(center).add(new THREE.Vector3((Math.random()-.5)*.45,1+Math.random(),(Math.random()-.5)*.45));mesh.scale.setScalar(.2);mesh.raycast=()=>{};scene.add(mesh);
  smoke.push({mesh,age:0,drift:new THREE.Vector3((Math.random()-.5)*.3,.7,(Math.random()-.5)*.3)});
 }
 function explode(){
  exploded=true;knives.stopLaunching();
  const bounds=new THREE.Box3().setFromObject(figure);bounds.getCenter(center);
  figure.visible=false;
  for(let i=0;i<42;i++){
   const mesh=new THREE.Mesh(chunkGeometry,chunkMaterial);mesh.name='Fragmento del diablo';
   mesh.position.set(THREE.MathUtils.lerp(bounds.min.x,bounds.max.x,Math.random()),THREE.MathUtils.lerp(bounds.min.y,bounds.max.y,Math.random()),THREE.MathUtils.lerp(bounds.min.z,bounds.max.z,Math.random()));
   const radius=.08+Math.random()*.12;mesh.scale.set(radius,radius*(.8+Math.random()),radius);mesh.castShadow=mesh.receiveShadow=true;mesh.raycast=()=>{};scene.add(mesh);
   const velocity=mesh.position.clone().sub(center).normalize().multiplyScalar(1.5+Math.random()*2);velocity.y=1.5+Math.random()*2.5;
   pieces.push({mesh,velocity,radius,rest:false,spin:new THREE.Vector3(Math.random()*5,Math.random()*4,Math.random()*5)});
  }
  for(let i=0;i<12;i++)puff();
 }
 function hit(){
  if(exploded)return;
  hits++;
  if(hits===1)knives.trigger();
  if(hits===2){smokeClock=0;puff();}
  if(hits===3)explode();
 }
 function update(dt){
  if(hits===2){smokeClock+=dt;while(smokeClock>=.12){smokeClock-=.12;puff();}}
  for(let i=smoke.length-1;i>=0;i--){const p=smoke[i];p.age+=dt;p.mesh.position.addScaledVector(p.drift,dt);p.mesh.scale.setScalar(.2+p.age*.4);p.mesh.material.opacity=.4*Math.max(0,1-p.age/2.5);if(p.age>=2.5){p.mesh.removeFromParent();p.mesh.material.dispose();smoke.splice(i,1);}}
  for(const p of pieces){if(p.rest)continue;p.velocity.y-=9.8*dt;p.mesh.position.addScaledVector(p.velocity,dt);p.mesh.rotation.x+=p.spin.x*dt;p.mesh.rotation.y+=p.spin.y*dt;
   // Scatter away from the pedestal and settle on the floor.
   const pedestal=Math.abs(p.mesh.position.x+5)<.85&&Math.abs(p.mesh.position.z-3)<.85;
   const floor=(pedestal?1.23:0)+p.radius;
   if(p.mesh.position.y<floor&&p.velocity.y<0){p.mesh.position.y=floor;p.velocity.x*=.65;p.velocity.z*=.65;p.velocity.y=-p.velocity.y*.18;if(p.velocity.length()<.45){p.rest=true;}}
  }
 }
 return {hit,update,pieces,smoke,get hits(){return hits;},get exploded(){return exploded;}};
}
