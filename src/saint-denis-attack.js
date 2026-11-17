import { stoneFloorHeight } from './stone-floor.js';
import { createRecordedMaleScream } from './recorded-male-scream.js';
import { statueExplosionSound } from './statue-explosion-sound.js';
import * as THREE from 'three';

export function createDenisAttack(scene, statue, prisoner) {
 const {head,jaw,mouth,fangs}=statue;
 const scream=createRecordedMaleScream();
 let active=false,age=0,state='held',velocity=0,landed=false,hits=0,bounces=0,bites=0,roamIndex=0,stunAge=0,reaction=null;
 let dropOrigin,dropDirection=new THREE.Vector3(),biteLeg='left-leg';
 const direction=new THREE.Vector3(),target=new THREE.Vector3();
 const roam=[[-8,-7],[8,-7],[8,7],[-8,7]].map(([x,z])=>new THREE.Vector3(x,.24,z));
 const fragments=[],particles=[];let fireLight=null,explosionAge=0,completedHops=0;
 const stoneGeometry=new THREE.IcosahedronGeometry(1,0),puffGeometry=new THREE.SphereGeometry(1,10,8);
 const stoneMaterial=new THREE.MeshStandardMaterial({color:0xb7aa92,roughness:.92});
 const hopDuration=.48;
 const headSpeedScale=.5;
 function trigger(){
  if(active||prisoner.userData.dead)return;
  scream.unlock();
  active=true;scene.updateMatrixWorld(true);scene.attach(head);
  head.name='Cabeza de San Denis que rebota y muerde';head.userData.spellTarget='denis-head';
  dropOrigin=head.position.clone();dropDirection.copy(prisoner.position).sub(head.position).setY(0).normalize();
  if(dropDirection.lengthSq()<.001)dropDirection.set(0,0,1);
  mouth.visible=true;fangs.forEach(fang=>fang.visible=true);state='roaming';
 }
 function footPoint(){
  const leg=prisoner.getObjectByName(biteLeg);
  if(!leg)return prisoner.localToWorld(new THREE.Vector3(.115,.12,.14));
  const foot=new THREE.Vector3(0,-.66,.14);
  if(prisoner.userData.denisLiftedLeg===biteLeg&&prisoner.userData.denisKneeBend){foot.y+=.3;foot.applyAxisAngle(new THREE.Vector3(1,0,0),prisoner.userData.denisKneeBend);foot.y-=.3;}
  return leg.localToWorld(foot);
 }
 function releaseReaction(){
  if(!reaction)return;
  prisoner.position.y=reaction.baseY;
  reaction.leg?.quaternion.copy(reaction.legRest);reaction.support?.quaternion.copy(reaction.supportRest);
  prisoner.userData.denisHopping=false;prisoner.userData.denisLiftedLeg=null;prisoner.userData.denisKneeBend=0;reaction=null;
 }
 function beginBite(){
  releaseReaction();bites++;biteLeg=bites%2?'left-leg':'right-leg';
  const leg=prisoner.getObjectByName(biteLeg),support=prisoner.getObjectByName(biteLeg==='left-leg'?'right-leg':'left-leg');
  reaction={age:0,baseY:prisoner.position.y,leg,support,legRest:leg?.quaternion.clone(),supportRest:support?.quaternion.clone(),hops:0};
  prisoner.userData.denisHopping=true;prisoner.userData.denisBiting=true;prisoner.userData.denisBites=bites;state='biting';
  scream.play();
 }
 function updateReaction(dt){
  if(!reaction)return;
  reaction.age+=dt;
  const raise=THREE.MathUtils.smoothstep(reaction.age,0,.2),time=Math.max(0,reaction.age-.2);
  const hops=Math.min(4,Math.floor((time+1e-7)/hopDuration));
  if(hops>reaction.hops){completedHops+=hops-reaction.hops;reaction.hops=hops;}
  const hopping=time<4*hopDuration;
  const height=hopping?Math.sin((time%hopDuration)/hopDuration*Math.PI)*.32:0;
  const lower=1-THREE.MathUtils.smoothstep(reaction.age,.2+4*hopDuration,.45+4*hopDuration);
  const lift=raise*lower;
  if(reaction.leg)reaction.leg.quaternion.copy(reaction.legRest).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-1.05*lift));
  if(reaction.support)reaction.support.quaternion.copy(reaction.supportRest).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-.09*height/.32));
  prisoner.position.y=reaction.baseY+height;
  prisoner.userData.denisLiftedLeg=biteLeg;prisoner.userData.denisKneeBend=lift*.95;
  if(reaction.age>=.45+4*hopDuration)releaseReaction();
 }
 function explode(){
  statueExplosionSound.play();state='exploded';head.visible=false;releaseReaction();prisoner.userData.denisBiting=false;
  const center=head.position.clone();
  for(let i=0;i<55;i++){
   const block=new THREE.Mesh(stoneGeometry,stoneMaterial);const radius=.025+Math.random()*.055;
   block.scale.set(radius,radius*(.7+Math.random()),radius);block.position.copy(center).add(new THREE.Vector3((Math.random()-.5)*.3,Math.random()*.35,(Math.random()-.5)*.3));block.castShadow=true;block.raycast=()=>{};scene.add(block);
   const angle=i*2.39996,speed=2+Math.random()*5;
   fragments.push({mesh:block,radius,velocity:new THREE.Vector3(Math.sin(angle)*speed,2+Math.random()*5,Math.cos(angle)*speed),rest:false});
  }
  for(let i=0;i<62;i++){
   const fire=i<32;
   const material=new THREE.MeshBasicMaterial({color:fire?(i%2?0xff1608:0xb90014):0x514748,transparent:true,opacity:fire?.95:.6,depthWrite:false,blending:THREE.NormalBlending});
   const mesh=new THREE.Mesh(puffGeometry,material);mesh.position.copy(center).add(new THREE.Vector3((Math.random()-.5)*.5,Math.random()*.4,(Math.random()-.5)*.5));mesh.raycast=()=>{};scene.add(mesh);
   particles.push({mesh,fire,age:0,size:.08+Math.random()*.17,life:fire?.6+Math.random()*.8:2.3+Math.random(),velocity:new THREE.Vector3((Math.random()-.5)*(fire?2.5:1),.7+Math.random()*2,(Math.random()-.5)*(fire?2.5:1))});
  }
  fireLight=new THREE.PointLight(0xff1608,22,6);fireLight.position.copy(center);scene.add(fireLight);
 }
 function hit(){
  if(!active||state==='exploded')return false;
  hits++;
  if(hits===2){explode();return true;}
  releaseReaction();prisoner.userData.denisBiting=false;state='stunned';stunAge=0;velocity=-2;landed=false;
  return true;
 }
 function updateEffects(dt){
  for(const piece of fragments){
   if(piece.rest)continue;piece.velocity.y-=12*dt;piece.mesh.position.addScaledVector(piece.velocity,dt);piece.mesh.rotation.x+=dt*5;piece.mesh.rotation.z+=dt*3;
   piece.mesh.position.x=THREE.MathUtils.clamp(piece.mesh.position.x,-9.7,9.7);piece.mesh.position.z=THREE.MathUtils.clamp(piece.mesh.position.z,-9.7,9.7);
   const floor=stoneFloorHeight(piece.mesh);
   if(piece.mesh.position.y<floor){piece.mesh.position.y=floor;piece.velocity.multiplyScalar(.4);piece.velocity.y=Math.abs(piece.velocity.y);if(piece.velocity.length()<.6)piece.rest=true;}
  }
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.age+=dt;p.mesh.position.addScaledVector(p.velocity,dt);const size=p.size*(1+p.age*(p.fire?1.8:1.1));p.mesh.scale.set(p.fire?size*.55:size,p.fire?size*(2.2+Math.sin(p.age*24)*.3):size,p.fire?size*.55:size);p.mesh.material.opacity=(p.fire?.95:.6)*Math.max(0,1-p.age/p.life);if(p.age>=p.life){p.mesh.removeFromParent();p.mesh.material.dispose();particles.splice(i,1);}}
  if(fireLight){explosionAge+=dt;fireLight.intensity=22*Math.max(0,1-explosionAge/1.4);if(explosionAge>=1.4){fireLight.removeFromParent();fireLight.dispose();fireLight=null;}}
 }
 function update(dt){
  updateEffects(dt);if(!active||state==='exploded')return;
  if(prisoner.userData.dead||prisoner.userData.gameOver){releaseReaction();jaw.rotation.x=0;prisoner.userData.denisBiting=false;return;}
  let remaining=dt*headSpeedScale;
  while(remaining>0){
   const step=Math.min(remaining,1/120);remaining-=step;age+=step;updateReaction(step/headSpeedScale);
   prisoner.updateWorldMatrix(true,true);
   if(state==='biting'){
    head.position.copy(footPoint());head.position.y=Math.max(.24,head.position.y+.1);head.rotation.y=prisoner.rotation.y+Math.PI;
    jaw.rotation.x=.04+(Math.sin(age*18)+1)*.06;continue;
   }
   if(state==='stunned'){
    stunAge+=step;velocity-=14*step;head.position.y=Math.max(.24,head.position.y+velocity*step);head.rotation.z+=step*7;
    if(head.position.y===.24&&stunAge>=.55){state='chasing';velocity=5.8;landed=true;head.rotation.z=0;}
    continue;
   }
   if(state==='roaming'&&age>=4)state='chasing';
   target.copy(state==='roaming'?roam[roamIndex]:footPoint());direction.copy(target).sub(head.position);direction.y=0;
   const distance=direction.length();if(distance>.001)direction.divideScalar(distance);
   if(!landed&&age<.6){const escape=THREE.MathUtils.smoothstep(age,0,.55)*1.65;head.position.x=dropOrigin.x+dropDirection.x*escape;head.position.z=dropOrigin.z+dropDirection.z*escape;}
   else if(state==='roaming'){
    head.position.addScaledVector(direction,Math.min(distance,22*step));if(distance<.25)roamIndex=(roamIndex+1)%roam.length;
   }else if(distance>.3)head.position.addScaledVector(direction,Math.min(distance-.3,7*step));
   velocity-=14*step;head.position.y+=velocity*step;
   if(head.position.y<=.24){head.position.y=.24;velocity=state==='chasing'?3.8:5.8;landed=true;bounces++;}
   if(distance>.001){const yaw=Math.atan2(direction.x,direction.z),delta=Math.atan2(Math.sin(yaw-head.rotation.y),Math.cos(yaw-head.rotation.y));head.rotation.y+=delta*(1-Math.exp(-12*step));}
   head.rotation.x=Math.sin(age*7)*.12;head.rotation.z=Math.sin(age*9)*.1;
   if(state==='chasing'&&landed&&distance<.7&&head.position.y<.85){beginBite();continue;}
   const opening=(Math.sin(age*12)+1)*.5;jaw.rotation.x=.08+opening*.85;mouth.scale.y=.055*(.35+opening*.8);
  }
 }
 return {trigger,hit,update,head,fragments,particles,get state(){return state;},get hits(){return hits;},get active(){return active;},get bounces(){return bounces;},get bites(){return bites;},get completedHops(){return completedHops;}};
}
