import * as THREE from 'three';

// Solve each leg toward a moving foot target instead of rotating rigid leg pieces.
export function createMedievalWalk(person, bones) {
	person.updateWorldMatrix(true, true);
	const legs = [['R', 61, 60, 59, 58], ['L', 57, 56, 55, 54]].map(([side, hip, knee, ankle, toe], index) => {
		const thigh = bones.get(`thigh${side}_${hip}`);
		const shin = bones.get(`shin${side}_${knee}`);
		const foot = bones.get(`foot${side}_${ankle}`);
		const toes = bones.get(`toe${side}_${toe}`);
		if (!thigh || !shin || !foot) return null;
		const soleRotation = person.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(foot.getWorldQuaternion(new THREE.Quaternion()));
		return { thigh, shin, foot, toes, index, soleRotation, rest: person.worldToLocal(foot.getWorldPosition(new THREE.Vector3())) };
	}).filter(Boolean);
	const origin = new THREE.Vector3(), current = new THREE.Vector3(), desired = new THREE.Vector3();
	const rotation = new THREE.Quaternion(), parentRotation = new THREE.Quaternion();
	function aim(bone, child, target) {
		bone.getWorldPosition(origin);
		child.getWorldPosition(current).sub(origin).normalize();
		desired.copy(target).sub(origin).normalize();
		rotation.setFromUnitVectors(current, desired).multiply(bone.getWorldQuaternion(new THREE.Quaternion()));
		bone.quaternion.copy(bone.parent.getWorldQuaternion(parentRotation).invert().multiply(rotation));
		bone.updateWorldMatrix(false, true);
	}
	return () => {
		const amount = person.userData.walkingIntensity ?? 0;
		if (amount < .001) return;
		const phase = person.userData.walkCycle ?? 0;
		const direction = person.userData.walkingDirection ?? new THREE.Vector3(0, 0, 1);
		const stance = .62;
		for (const { thigh, shin, foot, toes, index, rest, soleRotation } of legs) {
			const cycle = ((phase / (Math.PI * 2) + index * .5) % 1 + 1) % 1;
			const swing = cycle > stance ? (cycle - stance) / (1 - stance) : 0;
			const travel = cycle <= stance ? .375 - .75 * cycle / stance : -.375 + .75 * THREE.MathUtils.smoothstep(swing, 0, 1);
			const lift = Math.sin(Math.PI * swing) ** 2 * .14;
			const target = rest.clone().addScaledVector(direction, travel * amount);
			target.y += lift * amount;
			person.localToWorld(target);
			const hip = thigh.getWorldPosition(new THREE.Vector3());
			const knee = shin.getWorldPosition(new THREE.Vector3());
			const ankle = foot.getWorldPosition(new THREE.Vector3());
			const upper = hip.distanceTo(knee), lower = knee.distanceTo(ankle);
			const axis = target.clone().sub(hip);
			const distance = THREE.MathUtils.clamp(axis.length(), Math.abs(upper - lower) + .0001, upper + lower - .0001);
			axis.normalize(); target.copy(hip).addScaledVector(axis, distance);
			const pole = new THREE.Vector3(0, 0, 1).transformDirection(person.matrixWorld);
			pole.addScaledVector(axis, -pole.dot(axis)).normalize();
			const along = (upper * upper - lower * lower + distance * distance) / (2 * distance);
			const kneeTarget = hip.clone().addScaledVector(axis, along).addScaledVector(pole, Math.sqrt(Math.max(0, upper * upper - along * along)));
			const footRotation = person.getWorldQuaternion(new THREE.Quaternion()).multiply(soleRotation);
			aim(thigh, shin, kneeTarget);
			aim(shin, foot, target);
			// Keep the sole level during contact; roll off the toes before lifting.
			foot.quaternion.copy(foot.parent.getWorldQuaternion(parentRotation).invert().multiply(footRotation));
			const roll = cycle < stance ? .18 * THREE.MathUtils.smoothstep(cycle / stance, .65, 1) : -.12 * Math.sin(Math.PI * swing);
			const lateral = new THREE.Vector3(1, 0, 0).transformDirection(person.matrixWorld);
			rotation.setFromAxisAngle(lateral, roll * amount).multiply(footRotation);
			foot.quaternion.copy(foot.parent.getWorldQuaternion(parentRotation).invert().multiply(rotation));
			if (toes) toes.rotateX(-roll * amount * .5);
			foot.updateWorldMatrix(false, true);
		}
	};
}
