import * as THREE from 'three';
import { createPrisonerScream } from './prisoner-scream.js';

// The zombie and mummy share the same grip and prisoner reaction.
export function createWaistGrab(prisoner, createScream = createPrisonerScream, { backArch = .48, liftHeight = 0, killAfter = Infinity, onDeath = () => {}, shakeBody = false } = {}) {
	const scream = createScream();
	const mouth = prisoner.getObjectByName('screaming-mouth');
	const victimArms = [prisoner.getObjectByName('casting-arm'), prisoner.getObjectByName('casting-elbow')];
	let attacker = null, age = 0, restPosition, restRotation, restArms;
	function begin(creature) {
		if (attacker || prisoner.userData.dead || prisoner.userData.gameOver || prisoner.userData.fallen || prisoner.userData.waistGrabOwner) return false;
		attacker = creature; prisoner.userData.waistGrabOwner = creature.root;
		restPosition = prisoner.position.clone(); restRotation = prisoner.rotation.clone();
		restArms = victimArms.map(arm => arm?.quaternion.clone());
		scream.play(); return true;
	}
	function update(dt) {
		if (!attacker || prisoner.userData.fallen) return;
		age += dt;
		const close = THREE.MathUtils.smoothstep(age, 0, .65);
		if(!shakeBody)attacker.arms.forEach((arm, i) => { const side = i === 0 ? -1 : 1; arm.rotation.set(.3 * close, side * .6 * close, 0); arm.userData.elbow.rotation.y = -side * 1.55 * close; });
		prisoner.userData.setBackArch?.((backArch + (shakeBody ? 0 : Math.sin(age * 7) * .025)) * close);
		const struggle = (.65 + .35 * Math.sin(age * 2.5)) * close;
		prisoner.position.copy(restPosition); prisoner.position.x += Math.sin(age * 23) * .035 * struggle; prisoner.position.z += Math.sin(age * 19) * .025 * struggle;
		prisoner.position.y += liftHeight * close;
		prisoner.rotation.copy(restRotation); prisoner.rotation.x += Math.sin(age * 16) * .025 * struggle; prisoner.rotation.z += Math.sin(age * 21) * .035 * struggle;
		if(shakeBody){
			// Rock the body beneath a fixed neck so the gripping hands stay still.
			const neck=prisoner.getObjectByName('head-anchor');
			const gripPoint=new THREE.Vector3(0,-.14,.015);
			prisoner.position.copy(restPosition);prisoner.position.y+=liftHeight*close;
			prisoner.rotation.copy(restRotation);prisoner.updateWorldMatrix(true,true);
			const anchor=neck?.localToWorld(gripPoint.clone());
			prisoner.rotation.x+=Math.sin(age*17)*.16*close;
			prisoner.rotation.z+=Math.sin(age*13)*.13*close;
			prisoner.updateWorldMatrix(true,true);
			if(anchor){
				const displaced=neck.localToWorld(gripPoint.clone());
				if(prisoner.parent){prisoner.parent.worldToLocal(anchor);prisoner.parent.worldToLocal(displaced);}
				prisoner.position.add(anchor.sub(displaced));
			}
		}
		victimArms.forEach((arm, i) => { if (arm && restArms[i]) arm.quaternion.copy(restArms[i]).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.sin(age * 18 + i) * .12 * struggle)); });
		if (mouth) { mouth.visible = true; mouth.scale.y = .032 + Math.sin(age * 15) * .006; }
		if(age + 1e-9 >= killAfter){
			prisoner.userData.dead = prisoner.userData.gameOver = prisoner.userData.fallen = true;
			if(mouth)mouth.visible=false;
			onDeath();
		}
	}
	function end() {
		if (!attacker) return;
		if (prisoner.userData.waistGrabOwner === attacker.root) {
			delete prisoner.userData.waistGrabOwner;
			if (!prisoner.userData.fallen) {
				prisoner.position.copy(restPosition); prisoner.rotation.copy(restRotation);
				prisoner.userData.setBackArch?.(0);
				victimArms.forEach((arm,i)=>{if(arm&&restArms[i])arm.quaternion.copy(restArms[i]);});
			}
			if (mouth) mouth.visible = false;
		}
		attacker = null; age = 0;
	}
	return { begin, update, end, unlockAudio: scream.unlock, get active() { return !!attacker; }, get age() { return age; } };
}
