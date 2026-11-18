import * as THREE from 'three';

export function createTrunkWordPickup(prisoner, wordsReady, awardPoint, blocked) {
  let words=[], current=null, previous=[];
  wordsReady.then(group=>{words=group?.children.filter(object=>object.userData.collectibleNoun)??[];});
  const appearance=prisoner.userData.updateAppearance;
  function restoreBones(){previous.forEach(([bone,q])=>bone.quaternion.copy(q));previous=[];}
  function aim(bone, child, target, blend){
    const from=child.getWorldPosition(new THREE.Vector3()).sub(bone.getWorldPosition(new THREE.Vector3())).normalize();
    const to=target.clone().sub(bone.getWorldPosition(new THREE.Vector3())).normalize();
    const q=new THREE.Quaternion().setFromUnitVectors(from,to).multiply(bone.getWorldQuaternion(new THREE.Quaternion()));
    q.premultiply(bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert());
    bone.quaternion.slerp(q,blend);bone.updateWorldMatrix(false,true);
  }
  prisoner.userData.updateAppearance=dt=>{
    restoreBones();appearance?.(dt);
    if(!current||blocked())return;
    const amount=Math.sin(Math.min(1,current.time/1.6)*Math.PI);
    const torso=prisoner.getObjectByName('chest_52')??prisoner.getObjectByName('prisoner-torso');
    if(torso){previous.push([torso,torso.quaternion.clone()]);torso.rotation.x+=amount*.38;torso.rotation.z-=current.side*amount*.45;torso.updateWorldMatrix(true,true);}
    const right=current.side<0;
    const upper=prisoner.getObjectByName(right?'upper_armR_50':'upper_armL_27')??prisoner.getObjectByName(right?'casting-arm':'left-arm');
    const lower=prisoner.getObjectByName(right?'forearmR_49':'forearmL_26')??prisoner.getObjectByName(right?'casting-elbow':'left-elbow');
    const hand=prisoner.getObjectByName(right?'handR_48':'handL_25')??prisoner.getObjectByName(right?'casting-wrist':'left-wrist');
    if(upper&&lower&&hand){
      previous.push([upper,upper.quaternion.clone()],[lower,lower.quaternion.clone()],[hand,hand.quaternion.clone()]);
      const goal=current.startWorld.clone().add(new THREE.Vector3(0,.1,0));
      const elbow=upper.getWorldPosition(new THREE.Vector3()).lerp(goal,.55).add(new THREE.Vector3(current.side*.15,.15,0));
      aim(upper,lower,elbow,amount);aim(lower,hand,goal,amount);
      if(current.time>=.8){
        const point=hand.getWorldPosition(new THREE.Vector3());
        current.word.position.copy(current.word.parent.worldToLocal(point));
      }
    }
  };
  function take(object){
    if(current||blocked())return false;
    let word=object;
    while(word&&!words.includes(word))word=word.parent;
    if(!word||word.userData.collected||!word.visible)return false;
    current={word,time:0,start:word.position.clone(),startWorld:word.getWorldPosition(new THREE.Vector3()),side:Math.sign(word.position.x)||1,awarded:false};
    return true;
  }
  function update(dt){
    if(blocked()){
      if(current){current.word.position.copy(current.start);current.word.visible=!current.awarded;current=null;}
      restoreBones();return;
    }
    if(!current)return;
    current.time+=dt;
    if(current.time>=.8&&!current.awarded){current.awarded=true;current.word.userData.collected=true;awardPoint();}
    if(current.time>=1.25)current.word.visible=false;
    if(current.time>=1.6){current=null;restoreBones();}
  }
  return {update,take};
}
