import { cuticleTexture, detailScorpion } from './arthropod-detail.js';
import { createRecordedMaleScream } from './recorded-male-scream.js';
import * as THREE from 'three';

export function createScorpionEncounter(scene, prisoner) {
 const scream=createRecordedMaleScream();
 const root=new THREE.Group();root.name='Escorpion rojo';root.userData.spellTarget='scorpion';root.visible=false;scene.add(root);
 const shell=new THREE.MeshStandardMaterial({color:0x3b211b,roughness:.46,metalness:.03});
 const dark=new THREE.MeshStandardMaterial({color:0x171312,roughness:.72});
 const tipMaterial=new THREE.MeshStandardMaterial({color:0x261410,roughness:.3});
 const cuticle=cuticleTexture(219);for(const material of [shell,dark]){material.map=cuticle;material.bumpMap=cuticle;material.bumpScale=.012;}
 function oval(parent,material,x,y,z,sx,sy,sz){const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,18,12),material);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 function segment(parent,a,b,r,material=shell){const d=b.clone().sub(a);const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r*.7,r,d.length(),8),material);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());mesh.castShadow=true;parent.add(mesh);return mesh;}
 oval(root,shell,0,.23,0,.27,.17,.48);
 for(let i=0;i<5;i++)oval(root,i%2?shell:dark,0,.26,-.26+i*.115,.275,.15,.075);
 oval(root,shell,0,.25,.42,.25,.14,.18);
 for(const side of [-1,1])oval(root,tipMaterial,side*.09,.36,.53,.025,.025,.025);
 const legs=[],claws=[];
 for(const side of [-1,1]){
  for(let i=0;i<4;i++){
   const leg=new THREE.Group();leg.position.set(side*.2,.22,-.3+i*.19);root.add(leg);
   const joint=new THREE.Vector3(side*.33,.06,(i-1.5)*.1);
   segment(leg,new THREE.Vector3(),joint,.035);segment(leg,joint,new THREE.Vector3(side*.55,-.19,(i-1.5)*.15),.025,dark);
   legs.push({leg,side,phase:i*Math.PI/2+(side<0?Math.PI:0)});
  }
  const claw=new THREE.Group();claw.position.set(side*.22,.27,.42);root.add(claw);
  segment(claw,new THREE.Vector3(),new THREE.Vector3(side*.25,0,.25),.055);
  oval(claw,shell,side*.28,0,.38,.12,.08,.2);
  const fingers=[];
  for(const jaw of [-1,1]){
   const pivot=new THREE.Group();pivot.position.set(side*.28,0,.48);claw.add(pivot);
   segment(pivot,new THREE.Vector3(jaw*.055,0,0),new THREE.Vector3(jaw*.09,0,.21),.045);
   segment(pivot,new THREE.Vector3(jaw*.09,0,.21),new THREE.Vector3(jaw*.015,0,.28),.025,tipMaterial);fingers.push({pivot,jaw});
  }
  claws.push(fingers);
 }
 const tail=new THREE.Group();tail.name='Cola con aguijon';tail.position.set(0,.25,-.43);root.add(tail);
 const tailPoints=[[0,0,0],[0,.16,-.18],[0,.42,-.3],[0,.68,-.28],[0,.88,-.08],[0,.94,.18],[0,.79,.36]].map(p=>new THREE.Vector3(...p));
 for(let i=0;i<tailPoints.length-1;i++){segment(tail,tailPoints[i],tailPoints[i+1],.09-i*.009);oval(tail,shell,...tailPoints[i].toArray(),.095-i*.008,.095-i*.008,.095-i*.008);}
 const stinger=new THREE.Mesh(new THREE.ConeGeometry(.07,.25,10),tipMaterial);stinger.position.set(0,.68,.4);stinger.rotation.x=Math.PI-.3;tail.add(stinger);
 stinger.visible=false;detailScorpion(root,tail,claws,{shell,dark,tipMaterial});
 const route=[[-7,-7],[7,7],[-7,7],[7,-7],[0,0],[-7,0],[7,0],[0,7],[0,-7]];
 let spawned=false,defeated=false,targeted=false,age=0,index=0;
 const goal=new THREE.Vector3(),direction=new THREE.Vector3();
 let reaction=null,strikeAge=1,cooldown=0,stung=false;
 const tailRest=tail.quaternion.clone(),tailAim=new THREE.Quaternion();
 function finishReaction(){
  if(!reaction)return;
  prisoner.position.y=reaction.baseY;
  reaction.leg?.quaternion.copy(reaction.legRest);
  reaction.support?.quaternion.copy(reaction.supportRest);
  prisoner.userData.scorpionHopping=false;prisoner.userData.scorpionKneeBend=0;prisoner.userData.scorpionLiftedLeg=null;
  reaction=null;
 }
 function beginReaction(){
  const local=prisoner.worldToLocal(root.getWorldPosition(new THREE.Vector3()));
  const name=local.x<0?'right-leg':'left-leg',leg=prisoner.getObjectByName(name),support=prisoner.getObjectByName(name==='right-leg'?'left-leg':'right-leg');
  const away=prisoner.position.clone().sub(root.position).setY(0);
  if(away.lengthSq()<.001)away.set(0,0,1);away.normalize();
  const destination=prisoner.position.clone().addScaledVector(away,2.8);
  if(Math.abs(destination.x)>8.7||Math.abs(destination.z)>8.7)away.copy(prisoner.position).negate().setY(0).normalize();
  reaction={age:0,baseY:prisoner.position.y,leg,support,legRest:leg?.quaternion.clone(),supportRest:support?.quaternion.clone(),away};
  prisoner.userData.scorpionHopping=true;prisoner.userData.scorpionLiftedLeg=name;scream.play();
 }
 function updateReaction(dt){
  if(!reaction)return;
  if(prisoner.userData.dead||prisoner.userData.waistGrabOwner||prisoner.userData.levelTransition){finishReaction();return;}
  reaction.age+=dt;const age=reaction.age;
  const lift=THREE.MathUtils.smoothstep(age,0,.18)*(1-THREE.MathUtils.smoothstep(age,2.35,2.65));
  const hopTime=Math.max(0,age-.18),hopping=age>.18&&hopTime<2.1;
  const bounce=hopping?Math.sin((hopTime%.42)/.42*Math.PI)*.28:0;
  reaction.leg?.quaternion.copy(reaction.legRest).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-1.05*lift));
  reaction.support?.quaternion.copy(reaction.supportRest).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-.12*bounce/.28));
  prisoner.userData.scorpionKneeBend=.95*lift;prisoner.position.y=reaction.baseY+bounce;
  if(hopping){
   prisoner.position.addScaledVector(reaction.away,dt*1.2);
   prisoner.position.x=THREE.MathUtils.clamp(prisoner.position.x,-8.7,8.7);prisoner.position.z=THREE.MathUtils.clamp(prisoner.position.z,-8.7,8.7);
   const yaw=Math.atan2(reaction.away.x,reaction.away.z);prisoner.rotation.y+=Math.atan2(Math.sin(yaw-prisoner.rotation.y),Math.cos(yaw-prisoner.rotation.y))*(1-Math.exp(-dt*10));
  }
  if(age>=2.65)finishReaction();
 }
 function nextGoal(){const p=route[index++%route.length];goal.set(p[0],.06,p[1]);}
 function spawn(point){if(spawned)return;spawned=true;root.position.set(point.x,-.85,point.z);root.visible=true;nextGoal();}
 function update(dt){
  updateReaction(dt);
  cooldown=Math.max(0,cooldown-dt);
  if(!spawned||defeated||targeted)return;age+=dt;
  if(age<1.3){root.position.y=THREE.MathUtils.lerp(-.85,.06,THREE.MathUtils.smoothstep(age,0,1.3));return;}
  const blocked=prisoner.userData.dead||prisoner.userData.fallen||prisoner.userData.waistGrabOwner||prisoner.userData.snakeHopping||prisoner.userData.levelTransition;
  const near=Math.hypot(root.position.x-prisoner.position.x,root.position.z-prisoner.position.z);
  if(strikeAge>=.55&&!reaction&&!blocked&&cooldown===0&&near<1.35){
   strikeAge=0;stung=false;cooldown=5;
   root.rotation.y=Math.atan2(prisoner.position.x-root.position.x,prisoner.position.z-root.position.z);
   root.updateWorldMatrix(true,true);
   const legPoint=prisoner.localToWorld(new THREE.Vector3(0,.38,0));
   const aim=root.worldToLocal(legPoint).sub(tail.position).normalize();
   tailAim.setFromUnitVectors(new THREE.Vector3(0,.56,.4).normalize(),aim);
  }
  if(strikeAge<.55){
   strikeAge+=dt;
   const t=strikeAge<.18?THREE.MathUtils.smoothstep(strikeAge,0,.18):1-THREE.MathUtils.smoothstep(strikeAge,.24,.55);
   tail.quaternion.copy(tailRest).slerp(tailAim,t);
   if(strikeAge>=.18&&!stung){stung=true;if(!blocked)beginReaction();}
   return;
  }
  root.position.y=.06;
  const chasing=!blocked&&!reaction&&cooldown===0&&near<3;
  direction.subVectors(chasing?prisoner.position:goal,root.position).setY(0);const distance=direction.length();
  if(distance<.1)nextGoal();
  else{direction.normalize();root.position.addScaledVector(direction,Math.min(distance,dt*1.65));root.rotation.y=Math.atan2(direction.x,direction.z);}
  for(const {leg,side,phase} of legs){leg.rotation.y=Math.sin(age*13+phase)*.3;leg.rotation.z=side*Math.max(0,Math.cos(age*13+phase))*.2;}
  const strike=Math.pow(Math.max(0,Math.sin(age*2.6)),5);tail.rotation.x=.08+strike*.85;
  for(const fingers of claws)for(const {pivot,jaw} of fingers)pivot.rotation.y=jaw*(.1+strike*.25);
 }
 function target(object){if(object!==root||!spawned||defeated||targeted)return false;targeted=true;return true;}
 function release(object){if(object===root&&!defeated)targeted=false;}
 function defeat(object){if(object!==root||defeated)return;defeated=true;targeted=false;root.visible=false;strikeAge=1;tail.quaternion.copy(tailRest);finishReaction();}
 return {spawn,update,target,release,defeat,root,unlockAudio:scream.unlock};
}
