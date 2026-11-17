import * as THREE from 'three';
import { createGeorgeDamage } from './saint-george-damage.js';

export function createGeorgeEncounter(scene,figure,prisoner,museum){
 const rig=figure.userData.georgeRig,{rider,sword,shield,armor,dark,gold}=rig;
 let active=false,state='mounted',time=0,age=0,start,landing,oldScale,routeIndex=0,capture=null,seat=null;
 const damage=createGeorgeDamage(scene,rider,sword);
 const route=[new THREE.Vector3(3,1.15,2),new THREE.Vector3(3,1.15,-3),new THREE.Vector3(0,1.15,-8.05)];
 const up=new THREE.Vector3(0,1,0),direction=new THREE.Vector3(),face=new THREE.Vector3(0,0,1);
 const limbs=new THREE.Group();limbs.name='Brazos y piernas articulados de San Jorge';limbs.visible=false;rider.add(limbs);
 function oval(material,scale){const m=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),material);m.scale.set(...scale);m.castShadow=m.receiveShadow=true;limbs.add(m);return m;}
 const arms=[-1,1].map(side=>({side,segments:[0,1].map(()=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(.78,1,1,20,5),armor);m.castShadow=true;limbs.add(m);return m;}),joints:[oval(armor,[.12,.105,.12]),oval(gold,[.065,.065,.065]),oval(armor,[.05,.06,.05])]}));
 const legs=[-1,1].map(side=>({side,segments:[0,1].map(()=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(.78,1,1,20,5),armor);m.castShadow=true;limbs.add(m);return m;}),knee:oval(gold,[.085,.075,.085]),boot:oval(dark,[.07,.065,.14])}));
 function segment(mesh,a,b,radius){const d=b.clone().sub(a);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(up,d.clone().normalize());mesh.scale.set(radius,d.length(),radius);}
 function pose(walking=0,mountBlend=1){
  for(const leg of legs){const {side,segments,knee,boot}=leg;const gait=Math.sin(age*9+(side>0?Math.PI:0))*walking;
   const hip=new THREE.Vector3(side*.13,.24,-.02),joint=new THREE.Vector3(side*.17,-.25,.03+gait*.21),foot=new THREE.Vector3(side*.17,-.74, .12+gait*.4);
   joint.lerpVectors(new THREE.Vector3(side*.35,-.04,.15),joint,mountBlend);foot.lerpVectors(new THREE.Vector3(side*.39,-.37,.25),foot,mountBlend);
   foot.y+=Math.max(0,gait)*.12;segment(segments[0],hip,joint,.09);segment(segments[1],joint,foot,.065);knee.position.copy(joint);boot.position.copy(foot);boot.rotation.x=-gait*.2;
  }
  if(!sword.userData.georgeThrown){sword.position.set(0,.47,.43);sword.rotation.set(-.18,0,0);
  if(['grab','fall','dragging','seating','binding','chained'].includes(state)){sword.position.set(.28,.32,.1);sword.rotation.set(.25,0,-.35);}
  }
  rider.updateWorldMatrix(true,true);
  for(const arm of arms){const {side,segments,joints}=arm;const shoulder=new THREE.Vector3(side*.24,.67,-.06);
   let hand=new THREE.Vector3(0,side<0?.46:.36,.43),elbow=new THREE.Vector3(side*.34,.37,.21);
   if(side<0&&['grab','fall','dragging','seating'].includes(state)){
    const grip=prisoner.localToWorld(new THREE.Vector3(-.065,1.38,.12));hand=rider.worldToLocal(grip);elbow=shoulder.clone().lerp(hand,.5).add(new THREE.Vector3(-.12,0,.06));
   }else if(side>0&&['grab','fall','dragging','seating'].includes(state)){hand.set(.28,.32,.1);elbow.set(.39,.38,.02);}
   if(state==='binding'){const ring=seat.rings[time<1.3?0:1];if(ring&&side<0){hand=rider.worldToLocal(ring.getWorldPosition(new THREE.Vector3()));elbow=shoulder.clone().lerp(hand,.5).add(new THREE.Vector3(-.1,0,.1));}}
   segment(segments[0],shoulder,elbow,.075);segment(segments[1],elbow,hand,.055);[shoulder,elbow,hand].forEach((point,i)=>joints[i].position.copy(point));
  }
 }
 function trigger({damageOnTrigger=true,activate=true}={}){
  if(prisoner.userData.dead||figure.userData.serpentTransformation)return;if(damageOnTrigger)damage.hit();if(!activate||active||damage.melted)return;active=true;state='dismount';scene.updateMatrixWorld(true);scene.attach(rider);rider.userData.museumGeorge=true;
  start=rider.position.clone();oldScale=rider.scale.clone();landing=start.clone().add(new THREE.Vector3(1.9,0,1.1));landing.y=1.43;
  rig.mountedLegs.forEach(part=>part.visible=false);rig.mountedArms.forEach(part=>part.visible=false);limbs.visible=true;
  shield.position.set(0,.47,-.3);shield.rotation.set(0,Math.PI,0);
 }
 function beginGrab(){
  state='grab';time=0;prisoner.userData.georgeCaptured=true;prisoner.userData.fallen=true;
  capture={position:prisoner.position.clone(),rotation:prisoner.quaternion.clone(),king:rider.position.clone(),legs:['left-leg','right-leg'].map(name=>prisoner.getObjectByName(name)),legRest:['left-leg','right-leg'].map(name=>prisoner.getObjectByName(name)?.quaternion.clone())};
  face.set(Math.sin(rider.rotation.y),0,Math.cos(rider.rotation.y));capture.face=face.clone();
 }
 function victimPose(dt,fall=1){
  const targetRotation=new THREE.Quaternion().setFromEuler(new THREE.Euler(0,rider.rotation.y,0)).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2));
  if(state==='fall'){prisoner.quaternion.copy(capture.rotation).slerp(targetRotation,fall);prisoner.position.copy(capture.position);prisoner.position.y=THREE.MathUtils.lerp(capture.position.y,.27,fall);}
  else {prisoner.quaternion.slerp(targetRotation,1-Math.exp(-10*dt));const behind=new THREE.Vector3(Math.sin(rider.rotation.y),0,Math.cos(rider.rotation.y));const desired=rider.position.clone().addScaledVector(behind,3.15);desired.y=.27;prisoner.position.lerp(desired,1-Math.exp(-12*dt));}
  prisoner.userData.setBackArch?.(-.12*fall);
  capture.legs.forEach((leg,i)=>{if(leg&&capture.legRest[i])leg.quaternion.copy(capture.legRest[i]).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.max(0,Math.sin(age*12+i*Math.PI))*.6*fall));});
  prisoner.userData.georgeDragging=fall>.01;
 }
 function beginSeating(){
  state='seating';time=0;
  const tripalium=museum.getObjectByName('Tripalium de tres postes');
  const rings=tripalium?.userData.shackles||[];
  const target=tripalium?tripalium.localToWorld(new THREE.Vector3(0,-1.25,.5)):new THREE.Vector3(0,-1.25,-8.35);
  seat={position:prisoner.position.clone(),rotation:prisoner.quaternion.clone(),king:rider.position.clone(),target,rings,arms:[]};
  for(const side of [-1,1]){const arm=prisoner.getObjectByName(side<0?'casting-arm':'left-arm'),elbow=prisoner.getObjectByName(side<0?'casting-elbow':'left-elbow'),wrist=prisoner.getObjectByName(side<0?'casting-wrist':'left-wrist');if(arm&&elbow&&wrist)seat.arms.push({side,arm,elbow,wrist,rest:[arm.quaternion.clone(),elbow.quaternion.clone(),wrist.quaternion.clone()]});}
  const iron=new THREE.MeshStandardMaterial({color:0x77736a,metalness:.85,roughness:.33});
  for(const control of seat.arms){
   const cuff=new THREE.Group();cuff.name='Anilla cerrada alrededor de la muneca '+control.side;cuff.visible=false;museum.add(cuff);control.cuff=cuff;
   const band=new THREE.Mesh(new THREE.CylinderGeometry(.077,.077,.075,32,1,true),iron);band.rotation.x=Math.PI/2;cuff.add(band);
   for(const z of [-.0375,.0375]){const rim=new THREE.Mesh(new THREE.TorusGeometry(.077,.012,10,32),iron);rim.position.z=z;cuff.add(rim);}
   const clasp=new THREE.Mesh(new THREE.BoxGeometry(.045,.032,.055),iron);clasp.position.y=-.081;cuff.add(clasp);
   control.links=Array.from({length:5},()=>{const link=new THREE.Mesh(new THREE.TorusGeometry(.027,.008,8,16),iron);link.visible=false;museum.add(link);return link;});
   cuff.traverse(part=>{if(part.isMesh)part.castShadow=part.receiveShadow=true;});
  }
  prisoner.userData.updateGeorgeCuffs=(bones)=>{
   museum.updateWorldMatrix(true,false);
   const inverse=museum.getWorldQuaternion(new THREE.Quaternion()).invert(),scale=museum.getWorldScale(new THREE.Vector3());
   for(const control of seat.arms){
    const hand=bones.get(control.side<0?'hand_r':'hand_l');if(!hand)continue;
    const point=hand.getWorldPosition(new THREE.Vector3()),axis=point.clone().sub(hand.parent.getWorldPosition(new THREE.Vector3())).normalize();point.addScaledVector(axis,-.035);
    const {cuff,links}=control;cuff.visible=control.boundAmount>.9;if(!cuff.visible){links.forEach(link=>link.visible=false);continue;}
    cuff.position.copy(museum.worldToLocal(point.clone()));cuff.quaternion.copy(inverse).multiply(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),axis));cuff.scale.set(1/scale.x,1/scale.y,1/scale.z);
    const anchor=seat.rings.find(ring=>ring.userData.side===control.side).getWorldPosition(new THREE.Vector3());
    links.forEach((link,i)=>{link.visible=true;link.position.copy(museum.worldToLocal(anchor.clone().lerp(point,(i+1)/6)));link.quaternion.copy(inverse).multiply(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),point.clone().sub(anchor).normalize()));link.rotateY(i%2*Math.PI/2);link.scale.copy(cuff.scale);});
   }
  };
  prisoner.userData.georgeDragging=false;
 }
 function seatedPose(blend=1){
  prisoner.position.lerpVectors(seat.position,seat.target,blend);
  prisoner.quaternion.copy(seat.rotation).slerp(new THREE.Quaternion(),blend);
  prisoner.userData.setBackArch?.(-.06*blend);
  prisoner.userData.georgeKneeBend=-.25*blend;
  capture.legs.forEach((leg,i)=>{if(leg)leg.quaternion.copy(capture.legRest[i]).slerp(new THREE.Quaternion().setFromEuler(new THREE.Euler(-1.45,0,i===0?.1:-.1)),blend);});
  prisoner.updateWorldMatrix(true,true);
  for(const control of seat.arms){
   const {side,arm,elbow,wrist,rest}=control,ring=seat.rings.find(item=>item.userData.side===side);if(!ring)continue;
   const amount=state==='seating'?0:state==='chained'?1:THREE.MathUtils.smoothstep(time,side<0?0:1.3,side<0?1.2:2.5);
   control.boundAmount=amount;
   const target=arm.parent.worldToLocal(ring.getWorldPosition(new THREE.Vector3())).sub(arm.position);
   const a=elbow.position.length(),b=wrist.position.length(),distance=THREE.MathUtils.clamp(target.length(),Math.abs(a-b)+.001,a+b-.001),axis=target.normalize();
   const pole=new THREE.Vector3(side,0,.8).addScaledVector(axis,-new THREE.Vector3(side,0,.8).dot(axis)).normalize();
   const along=(a*a-b*b+distance*distance)/(2*distance),offset=axis.clone().multiplyScalar(along).addScaledVector(pole,Math.sqrt(Math.max(0,a*a-along*along)));
   const upper=new THREE.Quaternion().setFromUnitVectors(elbow.position.clone().normalize(),offset.clone().normalize());
   const lower=upper.clone().invert().multiply(new THREE.Quaternion().setFromUnitVectors(wrist.position.clone().normalize(),axis.clone().multiplyScalar(distance).sub(offset).normalize()));
   arm.quaternion.copy(rest[0]).slerp(upper,amount);elbow.quaternion.copy(rest[1]).slerp(lower,amount);wrist.quaternion.copy(rest[2]);
   ring.rotation.y=Math.sin(amount*Math.PI)*.8;
  }
 }
 function update(dt){
  if(prisoner.userData.dead||prisoner.userData.gameOver)return;
  if(damage.update(dt)){state=damage.melted?'melted':'melting';return;}
  if(!active)return;
  age+=dt*damage.speed;time+=dt;
  if(state==='dismount'){
   const t=THREE.MathUtils.smoothstep(time,0,1.65);rider.position.lerpVectors(start,landing,t);rider.position.y+=Math.sin(t*Math.PI)*.45;rider.scale.lerpVectors(oldScale,new THREE.Vector3(1.6,1.8,1.6),t);pose(0,t);
   if(time>=1.65){state='approach';time=0;}return;
  }
  if(state==='approach'){
   direction.copy(prisoner.position).sub(rider.position);direction.y=0;const distance=direction.length();if(distance>.001)direction.divideScalar(distance);
   const yaw=Math.atan2(direction.x,direction.z);rider.rotation.set(0,yaw,0);
   if(distance>1.3){rider.position.addScaledVector(direction,Math.min(distance-1.3,2.3*damage.speed*dt));rider.position.y=1.43+Math.abs(Math.sin(age*9))*.035;pose(1);}else if(!damage.burning)beginGrab();
  }
  if(state==='grab'){pose(0);if(time>=.65){state='fall';time=0;}}
  else if(state==='fall'){
   const t=THREE.MathUtils.smoothstep(time,0,1.1);rider.position.copy(capture.king).addScaledVector(capture.face,-1.8*t);rider.position.y=THREE.MathUtils.lerp(1.43,1.15,t);rider.rotation.x=.35*t;victimPose(dt,t);pose(.2);
   if(time>=1.1){state='dragging';time=0;}
  }else if(state==='dragging'){
   direction.copy(route[routeIndex]).sub(rider.position);direction.y=0;const distance=direction.length();if(distance>.001)direction.divideScalar(distance);
   if(distance<.2){routeIndex++;if(routeIndex>=route.length){beginSeating();}}
   else {rider.position.addScaledVector(direction,Math.min(distance,1.65*damage.speed*dt));const yaw=Math.atan2(-direction.x,-direction.z);rider.rotation.y+=Math.atan2(Math.sin(yaw-rider.rotation.y),Math.cos(yaw-rider.rotation.y))*(1-Math.exp(-8*dt));}
   rider.position.y=1.15+Math.abs(Math.sin(age*9))*.02;rider.rotation.x=.35;victimPose(dt);pose(.7);
  }else if(state==='seating'){
   const t=THREE.MathUtils.smoothstep(time,0,1.8);seatedPose(t);rider.position.lerpVectors(seat.king,seat.target.clone().add(new THREE.Vector3(-1.05,2.68,1.1)),t);rider.rotation.set(0,-.25,.15);pose(0);
   if(time>=1.8){state='binding';time=0;}
  }else if(state==='binding'||state==='chained'){
   seatedPose();pose(0);
   if(state==='binding'&&time>=2.7){state='chained';time=0;prisoner.userData.georgeChained=true;}
  }
 }
 return {trigger,update,rider,get hits(){return damage.hits;},get state(){return state;},get active(){return active;},get captured(){return !!prisoner.userData.georgeCaptured;}};
}


