import * as THREE from 'three';

// Alternating planted forelimbs carry the weight; hands stay fixed during stance.
export function createWerewolfArmGait(root, torso, head, arms, legs) {
 const contacts=arms.map(()=>({plant:null,from:null,to:null,previous:0}));
 let time=0;
 const headY=head.position.y;
 function reset(){time=0;contacts.forEach(contact=>{contact.plant=null;contact.from=null;contact.to=null;contact.previous=0;});}
 function groundPoint(side,forward){
  root.updateWorldMatrix(true,true);
  const point=root.localToWorld(new THREE.Vector3(side*.88,0,forward));
  point.y=root.parent.localToWorld(new THREE.Vector3(0,.055,0)).y;
  return point;
 }
 function update(dt){
  time+=dt;
  const cycleTime=.58,phase=time/cycleTime;
  torso.rotation.x=.29;
  torso.rotation.z=Math.sin(phase*Math.PI*2)*.035;
  root.position.y=.03-Math.pow(Math.sin(phase*Math.PI*2),2)*.045;
  head.rotation.x=-.22;head.position.y=headY;
  root.updateWorldMatrix(true,true);
  arms.forEach((arm,i)=>{
   const side=i===0?-1:1,contact=contacts[i],t=(phase+i*.5)%1;
   contact.plant??=groundPoint(side,.8);
   if(t<contact.previous){contact.plant.copy(contact.to??groundPoint(side,.8));contact.from=null;contact.to=null;}
   let paw=contact.plant.clone();
   if(t>=.6){
    contact.from??=contact.plant.clone();contact.to??=groundPoint(side,1.85);
    const swing=(t-.6)/.4,smooth=THREE.MathUtils.smoothstep(swing,0,1);
    paw.lerpVectors(contact.from,contact.to,smooth);paw.y+=Math.sin(swing*Math.PI)*.34;
   }
   contact.previous=t;
   const target=arm.parent.worldToLocal(paw).sub(arm.position),length=target.length();
   arm.scale.set(1,Math.sqrt(Math.max(.01,length*length-.08))/1.72,1);
   const local=new THREE.Vector3(side*.2,-1.72*arm.scale.y,.2);
   arm.quaternion.setFromUnitVectors(local.normalize(),target.normalize());
   arm.userData.groundSupport=t<.6;
  });
  legs.forEach((leg,i)=>{
   const t=(phase+(i===0?.5:0))%1,swing=Math.max(0,(t-.6)/.4);
   leg.rotation.x=.12+Math.sin(t*Math.PI*2)*.36;
   leg.position.y=1.15+Math.sin(swing*Math.PI)*.16;
   leg.position.z=-.12;
  });
 }
 return {update,reset};
}
