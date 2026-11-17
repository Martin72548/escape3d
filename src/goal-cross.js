import * as THREE from 'three';

export function isStandingOnGoalCross(prisoner,cross){
 const data=prisoner.userData;
 if(data.dead||data.gameOver||data.fallen||data.levelTransition)return false;
 const feet=prisoner.getWorldPosition(new THREE.Vector3());
 for(const bar of cross.children){
  if(!bar.isMesh||bar.geometry.type!=='BoxGeometry')continue;
  bar.updateWorldMatrix(true,false);
  const point=bar.worldToLocal(feet.clone()),{width,height,depth}=bar.geometry.parameters;
  // A small foot-contact margin makes the narrow painted arms usable.
  if(Math.abs(point.x)<=width/2+.08&&Math.abs(point.z)<=depth/2+.08&&Math.abs(point.y-height/2)<.16)return true;
 }
 return false;
}
