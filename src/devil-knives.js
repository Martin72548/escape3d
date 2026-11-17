import { createPrisonerScream } from './prisoner-scream.js';
import * as THREE from 'three';

export function createDevilKnives(scene, devil, prisoner) {
 const knives=[];
 let triggered=false,age=0,launched=0,stopped=false;
	const rig=devil.userData.devilRig, arm=rig?.arms.find(arm=>arm.side===1);
	let heldKnife=null, throwAge=-1, released=false, idleAge=0;
	const lookPosition=new THREE.Vector3(), devilPosition=new THREE.Vector3();
	const turn=new THREE.Quaternion(), turnEuler=new THREE.Euler();
	const poses=[
	 [0,0,0,0,0,0], [.36,-2.1,-.32,-1.35,-.35,-.16],
	 [.55,-1.45,.12,-.08,.25,.14], [.78,-1.05,.18,.12,.1,.22], [1.2,0,0,0,0,0],
	];
	function animateBody(dt){
		idleAge+=dt;
		if(!devil.visible)return;
		prisoner.getWorldPosition(lookPosition);devil.getWorldPosition(devilPosition);
		lookPosition.sub(devilPosition);lookPosition.y=0;
		if(lookPosition.lengthSq()>.001){
			turnEuler.set(0,Math.atan2(lookPosition.x,lookPosition.z),0);turn.setFromEuler(turnEuler);
			if(devil.parent){const parentRotation=devil.parent.getWorldQuaternion(new THREE.Quaternion()).invert();turn.premultiply(parentRotation);}
			devil.quaternion.slerp(turn,1-Math.exp(-5*dt));
		}
		if(!rig)return;
		const t=throwAge<0?1.2:Math.min(throwAge,1.2);
		let index=1;while(index<poses.length-1&&t>poses[index][0])index++;
		const a=poses[index-1],b=poses[index],mix=THREE.MathUtils.smoothstep(t,a[0],b[0]);
		const values=a.slice(1).map((value,i)=>THREE.MathUtils.lerp(value,b[i+1],mix));
		arm.shoulder.rotation.set(values[0],0,values[1]);arm.elbow.rotation.x=values[2];arm.hand.rotation.x=values[3];
		rig.torso.rotation.set(Math.sin(idleAge*1.6)*.008+values[4]*.25,-values[4],Math.sin(idleAge*.9)*.012);
		rig.torso.position.y=.95+Math.sin(idleAge*2)*.008;
		const other=rig.arms.find(part=>part!==arm);if(other)other.shoulder.rotation.x=Math.sin(idleAge*1.7)*.035;
	}
 const scream=createPrisonerScream();
 let kneeling=null;
 function fallToKnees(){
  if(kneeling)return;
  scream.play();prisoner.userData.fallen=true;prisoner.userData.kneeling=true;
  const knees=[];
  for(const name of ['left-leg','right-leg']){
   const leg=prisoner.getObjectByName(name);if(!leg)continue;
   leg.rotation.x=0;
   const parts=[...leg.children],knee=new THREE.Group();knee.name='kneeling-'+name;knee.position.set(0,-.22,.028);leg.add(knee);
   prisoner.updateWorldMatrix(true,true);
   for(const part of parts)knee.attach(part);
   knees.push(knee);
  }
  kneeling={age:0,y:prisoner.position.y,knees};
 }
 function updateKneeling(dt){
  if(!kneeling)return;
  kneeling.age+=dt;const t=THREE.MathUtils.smoothstep(kneeling.age,0,.85);
  prisoner.position.y=kneeling.y-t*.5*prisoner.scale.y;
  for(const knee of kneeling.knees)knee.rotation.x=t*1.5;
  const mouth=prisoner.getObjectByName('screaming-mouth');if(mouth)mouth.visible=kneeling.age<1.65;
 }
 const steel=new THREE.MeshStandardMaterial({color:0xd2dce0,metalness:.9,roughness:.2});
 const grip=new THREE.MeshStandardMaterial({color:0x30201a,roughness:.8});
 function trigger(){if(triggered)return;scream.unlock();triggered=true;}
 function makeKnife(){
  const root=new THREE.Group();root.name='Cuchillo del diablo '+(launched+1);
  const bladeShape=new THREE.Shape();bladeShape.moveTo(-.07,-.08);bladeShape.lineTo(.07,-.08);bladeShape.lineTo(.055,.25);bladeShape.lineTo(0,.46);bladeShape.lineTo(-.055,.25);bladeShape.closePath();
  const blade=new THREE.Mesh(new THREE.ExtrudeGeometry(bladeShape,{depth:.025,bevelEnabled:true,bevelThickness:.008,bevelSize:.008,bevelSegments:1,steps:1}),steel);blade.rotation.x=Math.PI/2;root.add(blade);
  const handle=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.22,10),grip);handle.rotation.x=Math.PI/2;handle.position.z=-.2;root.add(handle);
  const guard=new THREE.Mesh(new THREE.BoxGeometry(.23,.065,.04),steel);guard.position.z=-.085;root.add(guard);
  root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.raycast=()=>{};}});scene.add(root);return root;
 }
 function legTarget(){
  const leg=prisoner.getObjectByName('left-leg')||prisoner;
  return {leg,point:leg.localToWorld(new THREE.Vector3(0,-.25,.1))};
 }
 function launch(){
  const root=heldKnife||makeKnife();
	devil.updateWorldMatrix(true,true);
	if(heldKnife)scene.attach(root);
	const start=heldKnife?root.getWorldPosition(new THREE.Vector3()):devil.localToWorld(new THREE.Vector3(.6,1.2,.4));root.position.copy(start);
	heldKnife=null;
  const fifth=launched===4;
  let end;
  if(fifth)end=legTarget().point;
  else{
   const center=prisoner.getWorldPosition(new THREE.Vector3());
   const toward=center.clone().sub(start).setY(0).normalize();
   const sideways=new THREE.Vector3(-toward.z,0,toward.x);
   const near=center.clone().addScaledVector(sideways,launched%2===0?.7:-.7);near.y+=1.2+(launched%2)*.6;
   const direction=near.sub(start).normalize();
   const tx=Math.abs(direction.x)>.0001?((direction.x>0?9.8:-9.8)-start.x)/direction.x:Infinity;
   const tz=Math.abs(direction.z)>.0001?((direction.z>0?9.8:-9.8)-start.z)/direction.z:Infinity;
   end=start.clone().addScaledVector(direction,Math.min(tx,tz));end.y=THREE.MathUtils.clamp(end.y,.4,5.5);
  }
  knives.push({root,start,end,fifth,progress:0,stuck:false});launched++;
 }
 function update(dt){
	if(triggered){age+=dt;updateKneeling(dt);}
	if(!stopped&&triggered&&launched<5&&throwAge<0&&age>=.35+launched*1.3){
		throwAge=0;released=false;heldKnife=makeKnife();
		if(arm){arm.grip.add(heldKnife);heldKnife.position.set(0,0,.2);heldKnife.rotation.set(0,0,0);}
	}
	if(throwAge>=0)throwAge+=dt;
	animateBody(dt);
	if(!stopped&&throwAge>=.55&&!released){launch();released=true;}
	if(throwAge>=1.2)throwAge=-1;
  for(const knife of knives){
   if(knife.stuck)continue;
   if(knife.fifth)knife.end.copy(legTarget().point);
   const distance=knife.start.distanceTo(knife.end);
   knife.progress=Math.min(1,knife.progress+dt*10/Math.max(.01,distance));
   const direction=knife.end.clone().sub(knife.start).normalize();
   knife.root.position.lerpVectors(knife.start,knife.end,knife.progress);
   knife.root.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),direction);
   if(knife.progress>=1){
    knife.stuck=true;knife.root.position.addScaledVector(direction,-.32);
    if(knife.fifth){const {leg}=legTarget();leg.attach(knife.root);prisoner.userData.knifeInLeg=true;fallToKnees();}
   }
  }
 }
 return {trigger,update,stopLaunching(){stopped=true;if(heldKnife){heldKnife.removeFromParent();heldKnife.traverse(o=>o.geometry?.dispose());heldKnife=null;}},knives,get launched(){return launched;}};
}
