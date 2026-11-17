import * as THREE from 'three';

// Drink, hop sideways for four seconds, then roam before returning to the water.
export function updateToadWaterRoutine(toad, bowl) {
 const center=bowl.getWorldPosition(new THREE.Vector3());
 const spot=center.clone();
 spot[bowl.userData.drinkingAxis==='z'?'z':'x']+=toad.white?1.05:-1.05;
 spot.y=.03;
 if(toad.state==='jumping'){
  toad.state='approaching';toad.approachStart=toad.root.position.clone();toad.approachAt=toad.age;
  toad.approachHopCount=Math.max(1,Math.ceil(toad.approachStart.clone().setY(.03).distanceTo(spot)/2.2));
  toad.approachHopDuration=.4;
  toad.approachDuration=toad.approachHopCount*toad.approachHopDuration;
 }
 if(toad.state==='approaching'){
  const elapsed=Math.max(0,toad.age-toad.approachAt);
  const index=Math.min(toad.approachHopCount-1,Math.floor(elapsed/toad.approachHopDuration));
  const phase=THREE.MathUtils.clamp((elapsed-index*toad.approachHopDuration)/toad.approachHopDuration,0,1);
  const flight=THREE.MathUtils.clamp((phase-.12)/.74,0,1);
  const from=toad.approachStart.clone().lerp(spot,index/toad.approachHopCount);
  const to=toad.approachStart.clone().lerp(spot,(index+1)/toad.approachHopCount);
  if(index>0)from.y=.03;to.y=.03;
  toad.root.position.lerpVectors(from,to,flight);
  toad.root.position.y+=4*flight*(1-flight)*.48;
  const preparing=phase<.12,landing=phase>.86;
  const compression=preparing?Math.sin(phase/.12*Math.PI):landing?Math.sin((phase-.86)/.14*Math.PI):0;
  toad.root.rotation.set(preparing?-.09*compression:landing?.1*compression:THREE.MathUtils.lerp(-.23,.16,flight),Math.atan2(spot.x-toad.approachStart.x,spot.z-toad.approachStart.z),0);
  toad.root.scale.set(1.08*(1+compression*.035),1.08*(1-compression*.12),1.08*(1+compression*.025));
  toad.head.rotation.x=0;
  toad.legs.forEach(({leg,front})=>{
   leg.rotation.x=preparing||landing?front*compression*.42:front<0?THREE.MathUtils.lerp(-.85,.62,THREE.MathUtils.smoothstep(flight,.06,.52)):THREE.MathUtils.lerp(.38,-.48,THREE.MathUtils.smoothstep(flight,.5,.95));
  });
  if(elapsed<toad.approachDuration)return true;
  toad.waterArrivedAt=toad.approachAt+toad.approachDuration;
  toad.drinkCount++;
 }
 const time=Math.max(0,toad.age-toad.waterArrivedAt);
 toad.root.position.copy(spot);toad.root.rotation.set(0,Math.atan2(center.x-spot.x,center.z-spot.z),0);
 toad.root.scale.setScalar(1.08);toad.head.rotation.x=0;toad.tail.rotation.set(0,0,0);
 toad.legs.forEach(({leg})=>leg.rotation.x=0);
 if(time<.65){
  toad.state='drinking';toad.quickJumpCount=0;
  toad.head.rotation.x=.7+Math.sin(time*22)*.065;
  return true;
 }
 const hopDuration=.25,hopCount=16,hopTime=time-.65;
 if(hopTime<4){
  toad.state='water-hopping';
  const index=Math.min(hopCount-1,Math.floor(hopTime/hopDuration)),phase=(hopTime-index*hopDuration)/hopDuration;
  const offsetAt=step=>step===0||step===hopCount?0:step%2?.7:-.7;
  const toward=center.clone().sub(spot).setY(0).normalize();
  const lateral=new THREE.Vector3(toward.z,0,-toward.x);
  const offset=THREE.MathUtils.lerp(offsetAt(index),offsetAt(index+1),phase);
  toad.root.position.addScaledVector(lateral,offset);
  toad.root.position.y+=4*phase*(1-phase)*.38;
  const sign=Math.sign(offsetAt(index+1)-offsetAt(index));
  toad.root.rotation.y=Math.atan2(lateral.x*sign,lateral.z*sign);
  toad.root.rotation.x=THREE.MathUtils.lerp(-.16,.12,phase);
  toad.legs.forEach(({leg,front})=>leg.rotation.x=front*Math.sin(phase*Math.PI)*.65);
  toad.quickJumpCount=index;
  return true;
 }else{
  toad.state='jumping';toad.quickJumpCount=hopCount;toad.jumping=false;
  toad.nextDrinkAt=toad.age+8;
  return false;
 }
}
