import { cuticleTexture, detailMantis } from './arthropod-detail.js';
import * as THREE from 'three';

export function createMantisEncounter(scene) {
 const root=new THREE.Group();root.name='Gran mantis religiosa';root.userData.spellTarget='mantis';root.visible=false;root.scale.setScalar(.85);scene.add(root);
 const green=new THREE.MeshStandardMaterial({color:0x405333,roughness:.86});
 const light=new THREE.MeshStandardMaterial({color:0x76805a,roughness:.8});
 const dark=new THREE.MeshStandardMaterial({color:0x243e1d,roughness:.6});
 const angryEyes=new THREE.MeshStandardMaterial({color:0x9a9c60,roughness:.38});
 const cuticle=cuticleTexture();for(const material of [green,light,dark]){material.map=cuticle;material.bumpMap=cuticle;material.bumpScale=.007;}
 function oval(parent,material,x,y,z,sx,sy,sz){const m=new THREE.Mesh(new THREE.SphereGeometry(1,20,14),material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
 function limb(parent,a,b,r,material=green){const d=b.clone().sub(a);const m=new THREE.Mesh(new THREE.CylinderGeometry(r*.65,r,d.length(),10),material);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());m.castShadow=true;parent.add(m);return m;}
 oval(root,green,0,.64,-.23,.19,.17,.55);
 oval(root,light,0,.81,-.27,.16,.05,.48);
 limb(root,new THREE.Vector3(0,.67,.06),new THREE.Vector3(0,1.32,.36),.085);
 const head=new THREE.Group();head.position.set(0,1.42,.39);root.add(head);
 const shape=new THREE.Shape();shape.moveTo(-.25,.12);shape.lineTo(.25,.12);shape.lineTo(0,-.18);shape.closePath();
 const face=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.12,bevelEnabled:true,bevelSize:.035,bevelThickness:.025,bevelSegments:2,steps:1}),green);face.position.z=-.06;head.add(face);
 for(const side of [-1,1]){
  oval(head,angryEyes,side*.23,.1,.035,.11,.08,.1);oval(head,dark,side*.24,.105,.13,.018,.048,.012);
  const antenna=new THREE.CatmullRomCurve3([new THREE.Vector3(side*.12,.19,0),new THREE.Vector3(side*.18,.5,.06),new THREE.Vector3(side*.32,.71,.2)]);
  head.add(new THREE.Mesh(new THREE.TubeGeometry(antenna,20,.009,5,false),dark));
 }
 const mouth=new THREE.Mesh(new THREE.BoxGeometry(.13,.025,.025),dark);mouth.position.set(0,-.105,.09);head.add(mouth);
 for(const side of [-1,1]){
  const mandible=new THREE.Mesh(new THREE.ConeGeometry(.035,.14,7),dark);mandible.position.set(side*.075,-.12,.12);mandible.rotation.z=Math.PI+side*.4;head.add(mandible);
 }
 const legs=[],arms=[];
 for(const side of [-1,1]){
  for(let i=0;i<2;i++){
   const pivot=new THREE.Group();pivot.position.set(side*.12,.66,-.05-i*.35);root.add(pivot);
   const knee=new THREE.Vector3(side*.48,-.12,-.16+i*.16);
   limb(pivot,new THREE.Vector3(),knee,.037);limb(pivot,knee,new THREE.Vector3(side*.7,-.65,-.1+i*.18),.025);
   legs.push({pivot,side,phase:i*Math.PI+(side<0?Math.PI:0)});
  }
  const arm=new THREE.Group();arm.position.set(side*.08,1.19,.3);root.add(arm);
  limb(arm,new THREE.Vector3(),new THREE.Vector3(side*.2,-.19,.22),.055);
  const forearm=new THREE.Group();forearm.position.set(side*.2,-.19,.22);arm.add(forearm);
  limb(forearm,new THREE.Vector3(),new THREE.Vector3(side*.06,.38,.13),.065,light);
  limb(forearm,new THREE.Vector3(side*.06,.38,.13),new THREE.Vector3(side*.04,.08,.19),.035);
  for(let i=0;i<6;i++){
   const thorn=new THREE.Mesh(new THREE.ConeGeometry(.018,.075,6),dark);thorn.position.set(side*.04,.04+i*.055,.065);thorn.rotation.x=Math.PI/2;forearm.add(thorn);
  }
  arms.push({arm,forearm,side});
 }
 detailMantis(root,head,arms,{green,light,dark});
 let spawned=false,defeated=false,targeted=false,age=0,index=0;
 const goals=[[-6,6],[6,-6],[-6,-6],[6,6],[0,0]],goal=new THREE.Vector3(),direction=new THREE.Vector3();
 function next(){const p=goals[index++%goals.length];goal.set(p[0],.04,p[1]);}
 function spawn(point){if(spawned)return;spawned=true;root.visible=true;root.position.set(point.x,-2,point.z);next();}
 function update(dt){
  if(!spawned||defeated||targeted)return;age+=dt;
  if(age<1.7){root.position.y=THREE.MathUtils.lerp(-2,.04,THREE.MathUtils.smoothstep(age,0,1.7));return;}
  root.position.y=.04;direction.subVectors(goal,root.position).setY(0);const distance=direction.length();
  if(distance<.1)next();else{direction.normalize();root.position.addScaledVector(direction,Math.min(distance,dt*1.1));root.rotation.y=Math.atan2(direction.x,direction.z);}
  for(const {pivot,side,phase} of legs){pivot.rotation.y=Math.sin(age*7+phase)*.18;pivot.rotation.z=side*Math.max(0,Math.cos(age*7+phase))*.12;}
  head.rotation.y=Math.sin(age*1.8)*.22;
  for(const {arm,forearm,side} of arms){arm.rotation.y=side*(.15+Math.sin(age*2)*.08);forearm.rotation.x=Math.sin(age*2.5+side)*.16;}
 }
 function target(object){if(object!==root||!spawned||defeated||targeted)return false;targeted=true;return true;}
 function release(object){if(object===root&&!defeated)targeted=false;}
 function defeat(object){if(object!==root||defeated)return;defeated=true;targeted=false;root.visible=false;}
 return {spawn,update,target,release,defeat,root};
}
