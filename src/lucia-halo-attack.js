import { createChokedCrySound } from './choked-cry-sound.js';
import { createHaloBoomerangSound } from './halo-boomerang-sound.js';
import * as THREE from 'three';
import { createLuciaDestruction } from './lucia-destruction.js';

export function createLuciaHaloAttack(scene,figure,prisoner){
 let requested=false,state='idle',time=0,throws=0,returns=0,halo,saint,flight,rest,baseY,rootRest,legRest,torsoRest,finished=false;
 const legs=['left-leg','right-leg'].map(name=>prisoner.getObjectByName(name)),torso=prisoner.getObjectByName('prisoner-torso');
 const boomerang=createHaloBoomerangSound(),chokedCry=createChokedCrySound();
 const up=new THREE.Vector3(0,1,0),axis=new THREE.Vector3(1,0,0);
 const armNames=['casting-arm','casting-elbow','casting-wrist','left-arm','left-elbow','left-wrist'];let armRest;
 const destruction=createLuciaDestruction(scene,figure,()=>{
  if(!finished&&rest){resetDuck();if(prisoner.userData.haloTrapped)prisoner.quaternion.copy(rootRest);if(armRest)armNames.forEach((name,i)=>prisoner.getObjectByName(name)?.quaternion.copy(armRest[i]));if(prisoner.userData.haloTrapped){prisoner.userData.fallen=false;prisoner.userData.haloTrapped=false;prisoner.userData.haloEyesOpen=false;}}
  chokedCry.stop();boomerang.stop();halo?.removeFromParent();requested=false;state='destroyed';
 });
 function trigger(){if(!requested&&!destruction.exploded&&!prisoner.userData.dead){requested=true;state='waiting';}}
 function hit(activate=true){boomerang.unlock();chokedCry.unlock();if(destruction.exploded)return false;if(activate)trigger();return destruction.hit();}
 function handPoint(){saint.updateWorldMatrix(true,true);const hand=saint.userData.luciaArms[0]?.hand;return hand?hand.getWorldPosition(new THREE.Vector3()):saint.localToWorld(new THREE.Vector3(.18,1.2,.43));}
 function begin(){
  saint=figure.children.find(child=>child.userData.luciaHalo);if(!saint)return false;
  halo=saint.userData.luciaHalo;scene.updateMatrixWorld(true);rest=halo.getWorldPosition(new THREE.Vector3());scene.attach(halo);
  armRest=armNames.map(name=>prisoner.getObjectByName(name)?.quaternion.clone());
  halo.traverse(o=>o.raycast=()=>{});halo.userData.spellTarget='lucia-halo';rootRest=prisoner.quaternion.clone();baseY=prisoner.position.y;legRest=legs.map(leg=>leg?.quaternion.clone());torsoRest=torso?.quaternion.clone();state='taking';time=0;return true;
 }
 function resetDuck(){prisoner.position.y=baseY;legs.forEach((leg,i)=>leg?.quaternion.copy(legRest[i]));if(torso)torso.quaternion.copy(torsoRest);prisoner.userData.luciaKneeBend=0;prisoner.userData.luciaVictim=false;}
 function startThrow(){
  boomerang.play();
  throws++;state='outbound';time=0;const start=handPoint();
  const end=prisoner.localToWorld(new THREE.Vector3(0,throws===3?1.46:1.7,0));
  if(throws<3){const side=new THREE.Vector3().subVectors(end,start).cross(up).normalize();end.addScaledVector(side,throws===1?.52:-.52);}
  flight={start,end,duration:Math.max(.65,start.distanceTo(end)/9)};
 }
 function duck(amount){
  prisoner.userData.luciaVictim=amount>.001;prisoner.position.y=baseY-.65*amount;
  legs.forEach((leg,i)=>leg?.quaternion.copy(legRest[i]).multiply(new THREE.Quaternion().setFromAxisAngle(axis,-.5*amount)));
  prisoner.userData.luciaKneeBend=.95*amount;if(torso)torso.quaternion.copy(torsoRest).multiply(new THREE.Quaternion().setFromAxisAngle(axis,.23*amount));
 }
 function gripNeck(){
  for(const [side,names] of [[-1,['casting-arm','casting-elbow','casting-wrist']],[1,['left-arm','left-elbow','left-wrist']]]){
   const [arm,elbow,wrist]=names.map(name=>prisoner.getObjectByName(name));if(!arm||!elbow||!wrist)continue;
   const shoulder=arm.position.clone(),desiredHand=new THREE.Vector3(side*.115,1.55,.14).sub(new THREE.Vector3(0,1.025,0));
   const reach=desiredHand.clone().sub(shoulder),a=elbow.position.length(),b=wrist.position.length(),distance=THREE.MathUtils.clamp(reach.length(),Math.abs(a-b)+.01,a+b-.01);reach.normalize();
   const pole=new THREE.Vector3(side,.15,.7);pole.addScaledVector(reach,-pole.dot(reach)).normalize();
   const along=(a*a-b*b+distance*distance)/(2*distance),bend=Math.sqrt(Math.max(0,a*a-along*along));
   const elbowOffset=reach.clone().multiplyScalar(along).addScaledVector(pole,bend),fore=reach.clone().multiplyScalar(distance).sub(elbowOffset);
   arm.quaternion.setFromUnitVectors(elbow.position.clone().normalize(),elbowOffset.clone().normalize());
   elbow.quaternion.copy(arm.quaternion).invert().multiply(new THREE.Quaternion().setFromUnitVectors(wrist.position.clone().normalize(),fore.normalize()));wrist.rotation.set(.3,side*.3,0);
  }
 }
 function showEnd(){
  chokedCry.stop();finished=true;state='finished';prisoner.userData.dead=prisoner.userData.gameOver=prisoner.userData.fallen=true;
  if(typeof document==='undefined')return;
  const panel=document.createElement('div');panel.id='lucia-game-over';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.style.cssText='position:fixed;inset:0;z-index:1000;display:grid;place-items:center;background:rgba(8,7,6,.8);color:#eee4cf;font-family:system-ui;text-align:center';
  const card=document.createElement('div'),title=document.createElement('h1'),text=document.createElement('p'),button=document.createElement('button');title.textContent='Fin del juego';text.textContent='El halo de Santa Lucía acabó con el prisionero.';button.textContent='Volver a empezar';button.style.cssText='padding:12px 24px;font:inherit;cursor:pointer';button.onclick=()=>window.location.reload();card.append(title,text,button);panel.append(card);document.body.append(panel);button.focus();
 }
 function update(dt){
  destruction.update(dt);
  if(destruction.exploded)return;
  if(!requested||finished)return;if(state==='waiting'&&!begin())return;
  if(prisoner.userData.dead&&!prisoner.userData.haloTrapped){chokedCry.stop();resetDuck();return;}
  time+=dt;
  if(!['trapped','collapse'].includes(state)){
   const goal=prisoner.getWorldPosition(new THREE.Vector3()).sub(figure.getWorldPosition(new THREE.Vector3()));const yaw=Math.atan2(goal.x,goal.z);figure.rotation.y+=Math.atan2(Math.sin(yaw-figure.rotation.y),Math.cos(yaw-figure.rotation.y))*(1-Math.exp(-5*dt));
  }
  const arms=saint.userData.luciaArms;for(const rig of arms){rig.upper.quaternion.copy(rig.upperRest);rig.lower.quaternion.copy(rig.lowerRest);if(state==='taking'){const lift=Math.sin(Math.min(time/.8,1)*Math.PI);rig.upper.rotateX(-lift*1.4);}else if(state==='outbound'){rig.upper.rotateX(-.7*(1-THREE.MathUtils.smoothstep(time,0,.45)));}}
  if(state==='taking'){
   halo.position.lerpVectors(rest,handPoint(),THREE.MathUtils.smoothstep(time,0,.8));halo.rotation.set(Math.PI/2,0,time*6);if(time>=1.15)startThrow();
  }else if(state==='outbound'){
   const t=Math.min(1,time/flight.duration);halo.position.lerpVectors(flight.start,flight.end,t);halo.position.y+=Math.sin(t*Math.PI)*.22;halo.rotation.set(Math.PI/2,.1*Math.sin(t*Math.PI),time*24);
   if(throws<3)duck(THREE.MathUtils.smoothstep(t,.45,.85));
   if(t===1){if(throws<3){state='returning';flight={start:halo.position.clone(),duration:Math.max(.65,halo.position.distanceTo(handPoint())/10)};time=0;}else{
    resetDuck();boomerang.stop();chokedCry.play();state='trapped';time=0;prisoner.userData.haloTrapped=prisoner.userData.luciaVictim=true;prisoner.userData.fallen=true;prisoner.userData.haloEyesOpen=true;
    const parent=torso||prisoner;parent.attach(halo);halo.position.copy(parent.worldToLocal(prisoner.localToWorld(new THREE.Vector3(0,1.55,.015))));halo.rotation.set(Math.PI/2,0,0);halo.scale.setScalar(.48);
   }}
  }else if(state==='returning'){
   const t=Math.min(1,time/flight.duration);halo.position.lerpVectors(flight.start,handPoint(),t);halo.position.y+=Math.sin(t*Math.PI)*.35;halo.rotation.set(Math.PI/2,0,time*24);duck(1-THREE.MathUtils.smoothstep(t,.1,.65));
   if(t===1){returns++;resetDuck();state='holding';time=0;}
  }else if(state==='holding'){
   halo.position.copy(handPoint());if(time>=.65)startThrow();
  }else if(state==='trapped'||state==='collapse'){
   const kneel=THREE.MathUtils.smoothstep(time,.35,1.6),fall=THREE.MathUtils.smoothstep(time,3.1,4.3),bend=kneel*(1-fall);
   prisoner.position.y=THREE.MathUtils.lerp(baseY-1.45*kneel,.27,fall);prisoner.userData.luciaKneeBend=2.7*bend;
   legs.forEach((leg,i)=>leg?.quaternion.copy(legRest[i]).multiply(new THREE.Quaternion().setFromAxisAngle(axis,-1.15*bend)));
   if(torso)torso.quaternion.copy(torsoRest).multiply(new THREE.Quaternion().setFromAxisAngle(axis,.12*bend));gripNeck();
   halo.scale.setScalar(.48-.04*THREE.MathUtils.smoothstep(time,0,.7));
   prisoner.quaternion.copy(rootRest).multiply(new THREE.Quaternion().setFromAxisAngle(axis,-fall*Math.PI/2));
   if(time>=4.6)showEnd();
  }
 }
 return {trigger,hit,update,unlockAudio(){destruction.unlockAudio();boomerang.unlock();chokedCry.unlock();},destruction,get hits(){return destruction.hits;},get exploded(){return destruction.exploded;},get state(){return state;},get throws(){return throws;},get returns(){return returns;},get finished(){return finished;},get halo(){return halo;}};
}
