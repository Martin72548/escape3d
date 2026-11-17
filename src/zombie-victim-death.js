import * as THREE from 'three';

export function createZombieVictimDeath(_scene, prisoner) {
	let age = -1;
	const joints = [];
	function begin() {
		if (age >= 0) return;
		age = 0;
		for (const prefix of ['casting', 'left']) {
			const arm = prisoner.getObjectByName(`${prefix}-arm`);
			const elbow = prisoner.getObjectByName(`${prefix}-elbow`);
			const wrist = prisoner.getObjectByName(`${prefix}-wrist`);
			if (!arm || !elbow || !wrist) continue;
			const upper = elbow.position.clone().normalize();
			joints.push({joint:arm,from:arm.quaternion.clone(),to:new THREE.Quaternion().setFromUnitVectors(upper,new THREE.Vector3(0,-1,0))});
			joints.push({joint:elbow,from:elbow.quaternion.clone(),to:new THREE.Quaternion().setFromUnitVectors(wrist.position.clone().normalize(),upper)});
		}
	}
	function update(dt) {
		if (age < 0) return;
		age += dt;
		const amount = THREE.MathUtils.smoothstep(age,0,.55);
		joints.forEach(({joint,from,to})=>joint.quaternion.slerpQuaternions(from,to,amount));
	}
	return {begin,update};
}
