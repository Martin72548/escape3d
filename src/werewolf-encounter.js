import { createWerewolfMaterials, addWerewolfDetails } from './werewolf-appearance.js';
import { createWerewolfArmGait } from './werewolf-arm-gait.js';
import { createSculptedWerewolfHead } from './werewolf-sculpted-head.js';
import { createSculptedWerewolfTorso } from './werewolf-sculpted-torso.js';
import { createWerewolfLimb } from './werewolf-limbs.js';
import { createWerewolfCageBlood } from './werewolf-cage-blood.js';
import * as THREE from 'three';

export function createWerewolfEncounter(parent,prisoner,onCaged){
 const root=new THREE.Group();root.name='Hombre lobo siniestro de brazos largos y marcha apoyada en las manos';root.userData.spellTarget='cage-werewolf';root.visible=false;parent.add(root);
 const cageBlood=createWerewolfCageBlood(parent);
 const materials=createWerewolfMaterials(),{fur,mane,skin,ivory,mouth,eyes}=materials;
 const sphere=new THREE.SphereGeometry(1,32,22);
 function oval(parent,material,x,y,z,sx,sy,sz){const m=new THREE.Mesh(sphere,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
 function spike(parent,material,x,y,z,r,h,flip=false){const m=new THREE.Mesh(new THREE.ConeGeometry(r,h,10),material);m.position.set(x,y,z);if(flip)m.rotation.x=Math.PI;m.castShadow=true;parent.add(m);return m;}
 root.add(createSculptedWerewolfTorso(materials));
 const head=createSculptedWerewolfHead(materials);head.position.set(0,2.69,.3);root.add(head);
 const arms=[],legs=[];
 for(const side of [-1,1]){
  const arm=new THREE.Group();arm.name=side<0?'wolf-left-arm':'wolf-right-arm';arm.position.set(side*.77,2.35,0);root.add(arm);arms.push(arm);
  arm.add(createWerewolfLimb(side,false,materials.flesh));oval(arm,mane,side*.2,-1.32,.14,.21,.16,.19);

  const leg=new THREE.Group();leg.position.set(side*.31,1.15,0);root.add(leg);legs.push(leg);
  leg.add(createWerewolfLimb(side,true,fur));oval(leg,mane,0,-1.02,.14,.22,.13,.34);
  for(let i=0;i<3;i++)spike(leg,materials.claw,(i-1)*.12,-1.02,.48,.04,.18).rotation.x=Math.PI/2;
 }
 addWerewolfDetails(root,head,arms,legs,materials);
 // Slim the chest, waist and pelage together, retaining the long support limbs.
 for(const part of root.children)if(part.isMesh){part.position.x*=.78;part.position.z*=.84;part.geometry=part.geometry.clone().scale(.78,1,.84);}
 arms.forEach((arm,i)=>{
  arm.position.x=(i===0?-1:1)*.66;
  for(const part of arm.children)if(part.isMesh){part.geometry=part.geometry.clone().scale(.88,1,.9);}
 });
 legs.forEach((leg,i)=>{leg.position.x=(i===0?-1:1)*.27;for(const part of leg.children)if(part.isMesh)part.geometry=part.geometry.clone().scale(.86,1,.9);});
 const torso=new THREE.Group();torso.name='Torso encorvado del hombre lobo';torso.position.y=1.2;root.add(torso);
 root.updateWorldMatrix(true,true);
 for(const part of [...root.children])if(part!==torso&&!legs.includes(part))torso.attach(part);
 const headRestY=head.position.y;
 const armGait=createWerewolfArmGait(root,torso,head,arms,legs);
 // Short, planted strides: the support leg keeps its sole at floor height.
 function heavyWalk(dt,dragging=false){
  phase+=dt*11.8;
  const stride=dragging?.3:.48;
  const swing=Math.sin(phase);
  legs.forEach((leg,i)=>{
   const cycle=phase+i*Math.PI;
   leg.rotation.x=Math.sin(cycle)*stride;
   leg.position.y=1.15+Math.max(0,Math.cos(cycle))*.13;
  });
  const support=legs[Math.cos(phase)>0?1:0];
  root.position.y=.03-1.02*(1-Math.cos(support.rotation.x));
  root.rotation.z=swing*.035;
  // Abrupt compression on contact, then a slower recovery, gives each step weight.
  const contact=(phase%Math.PI)/Math.PI;
  const impact=Math.exp(-contact*15);
  root.position.y-=impact*.025;
  head.position.y=headRestY-impact*.025;
  if(!dragging){
   arms.forEach((arm,i)=>{arm.rotation.x=-.15-Math.sin(phase+i*Math.PI)*.26;arm.rotation.z=(i===0?1:-1)*.08;});
   head.rotation.x=.09+impact*.025;
  }
 }
 function resetStride(){root.rotation.z=0;torso.rotation.set(0,0,0);legs.forEach(leg=>{leg.position.set(leg.position.x,1.15,0);leg.rotation.x=0;});arms.forEach(arm=>{arm.rotation.set(0,0,0);arm.scale.set(1,1.45,1);const fingers=arm.getObjectByName('Dedos que agarran los barrotes');if(fingers)fingers.rotation.x=0;});head.position.y=headRestY;armGait.reset();}
 let state='hidden',age=0,phase=0,start=null,victimStart=null,victimEnd=null,victimScale=null,victimYaw=0;
 let rageGate=null;
 function rage(gate){
  if(!['hidden','caged'].includes(state))return false;
  state='cage-rage';age=0;rageGate=gate;root.visible=true;root.position.set(0,.03,-11.5);root.rotation.set(0,0,0);resetStride();return true;
 }
 const pushDirection=new THREE.Vector3(),dragHeading=new THREE.Vector3();
 const dragPath=[new THREE.Vector3(0,.03,-8.4),new THREE.Vector3(0,.03,-14.4),new THREE.Vector3(-6.2,.03,-14.4)];let dragWaypoint=0,grabEnd=null,grabYaw=0,grabFromYaw=0;
 const struggleJoints=['casting-arm','casting-elbow','casting-wrist','left-arm','left-elbow','left-wrist'].map(name=>prisoner.getObjectByName(name));let struggleRest=null;
 const headShake=new THREE.Euler();
 const heldLeg=prisoner.getObjectByName('right-leg'),pawLocal=new THREE.Vector3(-.2,-1.32,.14);
 function footPoint(){return heldLeg?heldLeg.localToWorld(new THREE.Vector3(0,-.66,.14)):prisoner.localToWorld(new THREE.Vector3(-.115,.12,.14));}
 function pawPoint(){return arms[0].localToWorld(pawLocal.clone());}
 function holdFoot(){
  prisoner.scale.copy(victimScale);prisoner.rotation.set(0,root.rotation.y,0);prisoner.rotateX(-Math.PI/2);
  (prisoner.userData.walkingLegs||[]).forEach(leg=>leg.rotation.x=0);
  const correction=pawPoint().sub(footPoint());prisoner.position.add(correction);
 }
 const home=new THREE.Vector3(0,.03,-11.15);
 function spawn(){if(!['hidden','caged','cage-rage'].includes(state))return;if(rageGate){rageGate.position.x=0;rageGate.position.z=0;rageGate=null;}state='charging';root.visible=true;root.position.set(0,.03,-14.6);age=0;phase=0;resetStride();}
 function hit(mesh){let object=mesh;while(object&&object!==root)object=object.parent;if(object!==root||state!=='charging')return false;state='thrown';age=0;start=root.position.clone();resetStride();return true;}
 function beginAttack(){
  state='pushing';age=0;struggleRest=struggleJoints.map(joint=>joint?.quaternion.clone());victimStart=prisoner.position.clone();victimScale=prisoner.scale.clone();
  pushDirection.copy(prisoner.position).sub(root.position).setY(0).normalize();if(pushDirection.lengthSq()<.01)pushDirection.set(0,0,1);
  victimYaw=Math.atan2(-pushDirection.x,-pushDirection.z);
  victimEnd=victimStart.clone().addScaledVector(pushDirection,1.5);victimEnd.x=THREE.MathUtils.clamp(victimEnd.x,-7.5,7.5);victimEnd.z=THREE.MathUtils.clamp(victimEnd.z,-7.5,7.5);victimEnd.y=.42;
  prisoner.userData.fallen=true;prisoner.userData.gameOver=true;prisoner.userData.wolfVictim=true;
  resetStride();root.position.y=.03;
 }
 function finishDrag(){
  state='offscreen';age=0;root.visible=false;prisoner.visible=false;prisoner.userData.wolfHeadShake=null;struggleJoints.forEach((joint,i)=>{if(joint&&struggleRest[i])joint.quaternion.copy(struggleRest[i]);});prisoner.userData.wolfVictim=false;head.rotation.x=0;
 }
 function finishGame(){
  state='finished';prisoner.userData.dead=true;
  const panel=document.createElement('div');panel.id='werewolf-game-over';panel.setAttribute('role','alert');panel.textContent='El juego termin\u00f3';panel.style.cssText='position:fixed;inset:0;z-index:100;display:grid;place-items:center;background:rgba(13,7,9,.28);color:#fff0e3;font:bold clamp(28px,5vw,62px) system-ui;text-align:center;text-shadow:0 3px 18px #000;padding:24px;pointer-events:none;';document.body.append(panel);
 }
 function update(dt){
  if(state==='hidden'||state==='caged'||state==='finished')return;age+=dt;cageBlood.update(dt);
  if(state==='cage-rage'){
   const intensity=THREE.MathUtils.smoothstep(age,0,.28);
   rageGate.position.x=Math.sin(age*43)*.045*intensity;
   rageGate.position.z=(Math.sin(age*36)+Math.sin(age*57)*.35)*.055*intensity;
   root.position.x=Math.sin(age*43)*.025*intensity;root.position.z=-11.5+Math.sin(age*36)*.065*intensity;
   torso.rotation.x=.09+Math.sin(age*36)*.025*intensity;
   head.rotation.x=THREE.MathUtils.lerp(.05,-.98,THREE.MathUtils.smoothstep(age,0,.4))+Math.sin(age*18)*.025;
   head.rotation.z=Math.sin(age*39)*.018*intensity;
   root.updateWorldMatrix(true,true);rageGate.updateWorldMatrix(true,true);
   arms.forEach((arm,i)=>{
    const side=i===0?-1:1,palm=rageGate.localToWorld(new THREE.Vector3(side*.68,1.95,-9.57));
    const target=arm.parent.worldToLocal(palm).sub(arm.position),length=target.length();
    arm.scale.set(1,Math.sqrt(Math.max(.01,length*length-.0596))/1.32,1);
    arm.quaternion.setFromUnitVectors(new THREE.Vector3(side*.2,-1.32*arm.scale.y,.14).normalize(),target.normalize());
    const fingers=arm.getObjectByName('Dedos que agarran los barrotes');if(fingers)fingers.rotation.x=-.85*intensity;
   });
  }else if(state==='charging'){
   if(prisoner.userData.dead||prisoner.userData.gameOver)return;
   const inPassage=root.position.z< -8.9,goal=inPassage?new THREE.Vector3(0,.03,-8.8):prisoner.position;
   const direction=goal.clone().sub(root.position).setY(0),distance=direction.length(),stopDistance=inPassage?0:.95;
   if(distance>stopDistance){direction.divideScalar(distance);root.position.addScaledVector(direction,Math.min(distance-stopDistance,dt*5.5));root.rotation.y=Math.atan2(direction.x,direction.z);}
   armGait.update(dt);
   if(prisoner.position.clone().sub(root.position).setY(0).length()<=1.15)beginAttack();
  }else if(state==='pushing'){
   const t=THREE.MathUtils.smoothstep(age,0,.9);prisoner.position.lerpVectors(victimStart,victimEnd,t);prisoner.position.y+=Math.sin(Math.PI*t)*.2;
   prisoner.rotation.set(0,victimYaw,0);prisoner.rotateX(-t*Math.PI/2);arms.forEach(arm=>arm.rotation.x=-1.2);
   (prisoner.userData.walkingLegs||[]).forEach((leg,i)=>leg.rotation.x=Math.sin(age*9+i*Math.PI)*.25);
   if(age>=1.05){
    state='grabbing-foot';age=0;start=root.position.clone();grabFromYaw=root.rotation.y;
    (prisoner.userData.walkingLegs||[]).forEach(leg=>leg.rotation.x=0);
    dragHeading.copy(dragPath[0]).sub(root.position).setY(0).normalize();grabYaw=Math.atan2(dragHeading.x,dragHeading.z);
    // Align the wolf's lowered paw with the ankle before the body starts moving.
    const arm=arms[0],oldRotation=arm.rotation.clone(),oldScale=arm.scale.clone();arm.rotation.set(.25,0,0);arm.scale.y=1.3;
    const offset=arm.localToWorld(pawLocal.clone()).sub(root.getWorldPosition(new THREE.Vector3()));
    offset.applyAxisAngle(new THREE.Vector3(0,1,0),grabYaw-grabFromYaw);grabEnd=footPoint().sub(offset);grabEnd.y=.03;arm.rotation.copy(oldRotation);arm.scale.copy(oldScale);
   }
  }else if(state==='grabbing-foot'){
   const t=THREE.MathUtils.smoothstep(age,0,1);root.position.lerpVectors(start,grabEnd,t);root.rotation.y=grabFromYaw+Math.atan2(Math.sin(grabYaw-grabFromYaw),Math.cos(grabYaw-grabFromYaw))*t;
   arms[0].rotation.set(THREE.MathUtils.lerp(-1.2,.25,t),0,0);arms[0].scale.y=1+t*.3;head.rotation.x=t*.2;
   if(age>=1){state='dragging';age=0;dragWaypoint=0;holdFoot();}
  }else if(state==='dragging'){
   const goal=dragPath[dragWaypoint],delta=goal.clone().sub(root.position).setY(0),distance=delta.length(),move=Math.min(distance,dt*3.3);
   if(distance>.001){delta.divideScalar(distance);root.position.addScaledVector(delta,move);const yaw=Math.atan2(delta.x,delta.z);root.rotation.y+=Math.atan2(Math.sin(yaw-root.rotation.y),Math.cos(yaw-root.rotation.y))*(1-Math.exp(-dt*8));}
   heavyWalk(dt,true);arms[0].rotation.set(.25,0,0);arms[0].scale.y=1.3;arms[1].rotation.x=Math.sin(phase)*.25;head.rotation.x=.1;
   holdFoot();
   for(const [i,names]of [['casting-arm','casting-elbow','casting-wrist'],['left-arm','left-elbow','left-wrist']].entries()){
    const [arm,elbow,wrist]=names.map(name=>prisoner.getObjectByName(name)),side=i===0?-1:1;
    if(arm)arm.rotation.set(-.85+Math.sin(age*12+i*1.8)*.6,Math.sin(age*9+i)*.2,side*(.65+Math.sin(age*10+i)*.4));
    if(elbow)elbow.rotation.set((i===0?.2:-.7)+Math.sin(age*14+i)*.3,0,side*Math.sin(age*11)*.16);
    if(wrist)wrist.rotation.set(Math.sin(age*17+i)*.25,Math.cos(age*13+i)*.25,Math.sin(age*15)*.18);
   }
   headShake.set(Math.sin(age*10)*.13,Math.sin(age*14)*.3+Math.sin(age*5)*.08,Math.sin(age*11+.7)*.17);prisoner.userData.wolfHeadShake=headShake;
   if(distance<.06){dragWaypoint++;if(dragWaypoint>=dragPath.length){root.position.copy(dragPath[dragPath.length-1]);holdFoot();finishDrag();}}
  }else if(state==='offscreen'){
   if(age>=.45)cageBlood.trigger();
   if(age>=1.65)finishGame();
  }else{
   const t=Math.min(1,age/1.05);root.position.lerpVectors(start,home,t);root.position.y=.03+Math.sin(Math.PI*t)*1.6;root.rotation.x=-Math.sin(Math.PI*t)*.9;legs.forEach(leg=>leg.rotation.x=-.6);arms.forEach(arm=>arm.rotation.x=-1.8);
   if(t===1){state='caged';root.rotation.set(0,0,0);legs.forEach(leg=>leg.rotation.x=0);arms.forEach(arm=>arm.rotation.x=0);onCaged();}
  }
 }
 return {root,spawn,hit,update,footPoint,pawPoint,rage,cageBlood,get state(){return state;}};
}
