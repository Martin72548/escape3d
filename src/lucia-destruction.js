import { stoneFloorHeight } from './stone-floor.js';
﻿import * as THREE from 'three';

import { statueExplosionSound } from './statue-explosion-sound.js';

export function createLuciaDestruction(scene,figure,onExplode){
 let hits=0,exploded=false,smokeClock=0,fireClock=0,explosionAge=0,light=null;
 const particles=[],fragments=[],sound=statueExplosionSound,puffGeometry=new THREE.SphereGeometry(1,10,8),stoneGeometry=new THREE.IcosahedronGeometry(1,0);
 const colors=[0xf41605,0xffd500,0xff7305],stones=[0x315899,0xbab0a0,0xc5a44c].map(color=>new THREE.MeshStandardMaterial({color,roughness:.85}));
 const origin=()=>figure.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0,1.1,0));
 function puff(fire,center=origin(),burst=false){
  const material=new THREE.MeshBasicMaterial({color:fire?colors[particles.length%3]:0x5b5551,transparent:true,opacity:fire?.9:.55,depthWrite:false});
  const mesh=new THREE.Mesh(puffGeometry,material);mesh.name=fire?'Fuego de Santa Lucia':'Humo de Santa Lucia';mesh.position.copy(center).add(new THREE.Vector3((Math.random()-.5)*(burst?1.6:.5),Math.random()*(burst?1.7:.8),(Math.random()-.5)*(burst?1.4:.5)));mesh.raycast=()=>{};scene.add(mesh);
  const size=.1+Math.random()*.2;mesh.scale.setScalar(size);
  particles.push({mesh,fire,size,age:0,life:fire?.6+Math.random():2.4+Math.random(),velocity:new THREE.Vector3((Math.random()-.5)*(burst?3:1),.9+Math.random()*2,(Math.random()-.5)*(burst?3:1))});
 }
 function explode(){
  exploded=true;const center=origin();figure.visible=false;onExplode();sound.play();
  for(let i=0;i<110;i++){
   const mesh=new THREE.Mesh(stoneGeometry,stones[i%3]),radius=.025+Math.random()*.095;mesh.name='Fragmento de Santa Lucia';mesh.position.copy(center).add(new THREE.Vector3((Math.random()-.5)*.9,(Math.random()-.5)*1.8,(Math.random()-.5)*.7));mesh.scale.set(radius,radius*(.7+Math.random()),radius);mesh.castShadow=true;mesh.raycast=()=>{};scene.add(mesh);
   const angle=i*2.39996,speed=3+Math.random()*7;fragments.push({mesh,radius,rest:false,velocity:new THREE.Vector3(Math.sin(angle)*speed,2+Math.random()*7,Math.cos(angle)*speed)});
  }
  for(let i=0;i<100;i++)puff(i<66,center,true);
  if(light){light.removeFromParent();light.dispose();}light=new THREE.PointLight(0xff7105,45,12);light.position.copy(center);scene.add(light);
 }
 function hit(){
  if(exploded)return false;hits++;
  if(hits===2)for(let i=0;i<12;i++)puff(false);
  if(hits===3){for(let i=0;i<15;i++)puff(true);light=new THREE.PointLight(0xff7305,10,5);light.position.copy(origin());scene.add(light);}
  if(hits===4)explode();return true;
 }
 function update(dt){
  if(!exploded&&hits>=2){smokeClock+=dt;while(smokeClock>=.12){smokeClock-=.12;puff(false);}}
  if(!exploded&&hits>=3){fireClock+=dt;while(fireClock>=.075){fireClock-=.075;puff(true);}}
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.age+=dt;p.mesh.position.addScaledVector(p.velocity,dt);const size=p.size*(1+p.age);p.mesh.scale.set(p.fire?size*.6:size,p.fire?size*2.3:size,p.fire?size*.6:size);p.mesh.material.opacity=(p.fire?.9:.55)*Math.max(0,1-p.age/p.life);if(p.age>=p.life){p.mesh.removeFromParent();p.mesh.material.dispose();particles.splice(i,1);}}
  for(const p of fragments){if(p.rest)continue;p.velocity.y-=12*dt;p.mesh.position.addScaledVector(p.velocity,dt);p.mesh.rotation.x+=dt*5;p.mesh.rotation.z+=dt*4;p.mesh.position.x=THREE.MathUtils.clamp(p.mesh.position.x,-9.7,9.7);p.mesh.position.z=THREE.MathUtils.clamp(p.mesh.position.z,-9.7,9.7);
   const center=figure.parent.getWorldPosition(new THREE.Vector3()),onPlinth=Math.abs(p.mesh.position.x-center.x)<.85&&Math.abs(p.mesh.position.z-center.z)<.85,floor=stoneFloorHeight(p.mesh);
   if(p.mesh.position.y<floor){p.mesh.position.y=floor;p.velocity.multiplyScalar(.4);p.velocity.y=Math.abs(p.velocity.y);if(p.velocity.length()<.6)p.rest=true;}
  }
  if(exploded&&light){explosionAge+=dt;light.intensity=45*Math.max(0,1-explosionAge/1.7);if(explosionAge>=1.7){light.removeFromParent();light.dispose();light=null;}}
 }
 return {hit,update,unlockAudio:sound.unlock,particles,fragments,get hits(){return hits;},get exploded(){return exploded;}};
}
