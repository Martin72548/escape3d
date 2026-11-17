import { publicAssetBase } from './public-asset-base.js';
import * as THREE from 'three';

export function createToadTongueAttack(scene, prisoner) {
 const anchor=prisoner.getObjectByName('head-anchor');
 const audio=new Audio(`${publicAssetBase}audio/male-ouch.mp3`);
 audio.preload='auto';audio.volume=.95;
 const tongues=new Map(),up=new THREE.Vector3(0,1,0);
 let recoilAge=1,attackCooldown=0,recoilSide=1;
 const pivot=new THREE.Group();pivot.name='Reaccion de cabeza al golpe del sapo';
 const torso=prisoner.getObjectByName('prisoner-torso');
 pivot.position.set(0,.47,0);torso.add(pivot);prisoner.updateMatrixWorld(true);
 for(const part of prisoner.userData.headParts)pivot.attach(part);
 const cheeks=new Map();
 for(const side of [-1,1]){
  const contact=new THREE.Object3D();contact.name=side<0?'Mejilla derecha':'Mejilla izquierda';
  contact.position.copy(pivot.worldToLocal(anchor.localToWorld(new THREE.Vector3(side*.082,-.045,.09))));pivot.add(contact);cheeks.set(side,contact);
 }
 function unlock(){
  // Prime recorded audio during the player's click without an audible cry.
  audio.muted=true;
  const ready=audio.play();
  ready?.then(()=>{audio.pause();audio.currentTime=0;audio.muted=false;}).catch(()=>{audio.muted=false;});
 }
 function cheek(side){
  prisoner.updateWorldMatrix(true,true);
  return cheeks.get(side).getWorldPosition(new THREE.Vector3());
 }
 function impact(side){
  recoilAge=0;recoilSide=side;
  audio.pause();audio.currentTime=0;audio.muted=false;audio.play().catch(()=>{});
 }
 function update(dt,toads){
  attackCooldown=Math.max(0,attackCooldown-dt);
  recoilAge=Math.min(1,recoilAge+dt);
  const bend=recoilAge<.085?THREE.MathUtils.smoothstep(recoilAge,0,.085):1-THREE.MathUtils.smoothstep(recoilAge,.085,.52);
  prisoner.userData.toadHeadRecoil=-.06*bend;
  prisoner.userData.toadHeadYaw=-recoilSide*.65*bend;
  prisoner.userData.toadHeadRoll=recoilSide*.12*bend;
  pivot.rotation.set(prisoner.userData.toadHeadRecoil,prisoner.userData.toadHeadYaw,prisoner.userData.toadHeadRoll);
  for(const toad of toads){
   let attack=tongues.get(toad);
   const blocked=prisoner.userData.dead||prisoner.userData.gameOver||prisoner.userData.levelTransition||prisoner.userData.currentLevel>1;
   if(toad.defeated||toad.targeted||!toad.root.visible||blocked){if(attack){attack.mesh.visible=false;attack.age=1;}toad.tongueAttacking=false;continue;}
   toad.tongueCooldown=Math.max(0,(toad.tongueCooldown??0)-dt);
   if(!attack||attack.age>=.32){
    if(attack)attack.mesh.visible=false;
    if(attackCooldown>0||toad.tongueCooldown>0||toad.state!=='jumping')continue;
    if(Math.hypot(toad.root.position.x-prisoner.position.x,toad.root.position.z-prisoner.position.z)>2.6)continue;
    toad.root.rotation.y=Math.atan2(prisoner.position.x-toad.root.position.x,prisoner.position.z-toad.root.position.z);
    if(!attack){
     const mesh=new THREE.Mesh(new THREE.CylinderGeometry(.024,.036,1,10),new THREE.MeshPhysicalMaterial({color:0xd91b34,roughness:.3,clearcoat:.65}));
     mesh.name='Lengua roja del sapo';mesh.raycast=()=>{};scene.add(mesh);
     attack={mesh,age:1,hit:false};tongues.set(toad,attack);
    }
    prisoner.updateWorldMatrix(true,true);
    const local=anchor.worldToLocal(toad.root.getWorldPosition(new THREE.Vector3()));
    attack.side=local.x<0?-1:1;
    attack.age=0;attack.hit=false;attack.mesh.visible=true;toad.tongueAttacking=true;
    toad.tongueCooldown=2.8;attackCooldown=.8;
   }
   attack.age+=dt;
   const start=toad.head.localToWorld(new THREE.Vector3(0,-.04,.285)),end=cheek(attack.side);
   const extension=attack.age<.075?Math.min(1,attack.age/.075):1-THREE.MathUtils.smoothstep(attack.age,.13,.32);
   end.lerpVectors(start,end,extension);
   const direction=end.clone().sub(start);
   attack.mesh.position.copy(start).add(end).multiplyScalar(.5);
   attack.mesh.scale.set(1,Math.max(.001,direction.length()),1);
   attack.mesh.quaternion.setFromUnitVectors(up,direction.normalize());
   if(attack.age>=.075&&!attack.hit){attack.hit=true;impact(attack.side);}
   if(attack.age>=.32){attack.mesh.visible=false;toad.tongueAttacking=false;}
  }
 }
 return {update,unlock};
}
