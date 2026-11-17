import * as THREE from 'three';

// Solve each shoulder and elbow toward opposite sides of the prisoner's neck.
export function holdMummyNeck(mummy,prisoner){
 prisoner.updateWorldMatrix(true,true);mummy.root.updateWorldMatrix(true,true);
 const neck=prisoner.getObjectByName('head-anchor');
 for(const [i,arm] of mummy.arms.entries()){
  const target=neck?neck.localToWorld(new THREE.Vector3(i===0?-.075:.075,-.14,.015)):prisoner.localToWorld(new THREE.Vector3(i===0?-.075:.075,1.54,.015));
  const hand=arm.userData.hand,elbow=arm.userData.elbow;if(!hand)continue;
  for(let iteration=0;iteration<32;iteration++)for(const joint of [elbow,arm]){
   mummy.root.updateWorldMatrix(true,true);
   const origin=joint.getWorldPosition(new THREE.Vector3()),grip=hand.localToWorld(new THREE.Vector3(0,-.045,.015));
   const from=grip.sub(origin),to=target.clone().sub(origin);if(from.lengthSq()<1e-8||to.lengthSq()<1e-8)continue;
   const delta=new THREE.Quaternion().setFromUnitVectors(from.normalize(),to.normalize());
   const parent=joint.parent.getWorldQuaternion(new THREE.Quaternion());
   joint.quaternion.premultiply(parent.clone().invert().multiply(delta).multiply(parent));
  }
 }
 mummy.root.updateWorldMatrix(true,true);
}
