import * as THREE from 'three';

const frame = (x, y) => {
	const z = x.clone().cross(y).normalize();
	y = z.clone().cross(x).normalize();
	return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
};

// Each elbow is a hinge with positive flexion, rather than a free ball joint.
export function createAnatomicalElbows(person, bones) {
	person.updateWorldMatrix(true, true);
	const arms = [['R', 50, 49, 48, -1], ['L', 27, 26, 25, 1]].map(([side, a, b, c, sign]) => {
		const upper = bones.get(`upper_arm${side}_${a}`);
		const elbow = bones.get(`forearm${side}_${b}`);
		const hand = bones.get(`hand${side}_${c}`);
		if (!upper || !elbow || !hand) return null;
		const along = elbow.position.clone().normalize();
		const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(person.getWorldQuaternion(new THREE.Quaternion()));
		forward.applyQuaternion(upper.getWorldQuaternion(new THREE.Quaternion()).invert());
		forward.addScaledVector(along, -forward.dot(along)).normalize();
		const hinge = along.clone().cross(forward).normalize();
		const lowerDirection = hand.position.clone().applyQuaternion(elbow.quaternion).normalize();
		const straight = new THREE.Quaternion().setFromUnitVectors(lowerDirection, along).multiply(elbow.quaternion);
		return {
			upper, elbow, hand, sign, hinge, straight,
			inverseFrame: frame(along, forward).invert(),
			elbowPosition: elbow.position.clone(), handPosition: hand.position.clone(),
			upperLength: upper.getWorldPosition(new THREE.Vector3()).distanceTo(elbow.getWorldPosition(new THREE.Vector3())),
			lowerLength: elbow.getWorldPosition(new THREE.Vector3()).distanceTo(hand.getWorldPosition(new THREE.Vector3())),
		};
	}).filter(Boolean);
	return (grips) => {
		for (const arm of arms) {
			const { upper, elbow, hand, sign, hinge, straight, inverseFrame, upperLength: a, lowerLength: b } = arm;
			const shoulder = upper.getWorldPosition(new THREE.Vector3());
			const grip = grips?.get(hand);
			const goal = grip?.position.clone() ?? hand.getWorldPosition(new THREE.Vector3());
			const handRotation = grip?.quaternion.clone() ?? hand.getWorldQuaternion(new THREE.Quaternion());
			const axis = goal.sub(shoulder);
			// Avoid locking straight and prevent folding beyond a human elbow's range.
			const reach = angle => Math.sqrt(a * a + b * b + 2 * a * b * Math.cos(angle));
			const distance = THREE.MathUtils.clamp(axis.length(), reach(THREE.MathUtils.degToRad(145)), reach(THREE.MathUtils.degToRad(5)));
			if (axis.lengthSq() < 1e-10) axis.set(0, -1, 0);
			axis.normalize();
			const pole = new THREE.Vector3(sign * .5, -.65, -.2).transformDirection(person.matrixWorld);
			pole.addScaledVector(axis, -pole.dot(axis));
			if (pole.lengthSq() < 1e-8) {
				pole.set(sign, 0, 0).transformDirection(person.matrixWorld);
				pole.addScaledVector(axis, -pole.dot(axis));
			}
			pole.normalize();
			const along = (a * a - b * b + distance * distance) / (2 * distance);
			const upperDirection = axis.clone().multiplyScalar(along).addScaledVector(pole, Math.sqrt(Math.max(0, a * a - along * along))).normalize();
			const flexDirection = axis.clone().addScaledVector(upperDirection, -axis.dot(upperDirection)).normalize();
			const worldRotation = frame(upperDirection, flexDirection).multiply(inverseFrame);
			upper.quaternion.copy(upper.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(worldRotation));
			elbow.position.copy(arm.elbowPosition);
			hand.position.copy(arm.handPosition);
			const flex = Math.acos(THREE.MathUtils.clamp((distance * distance - a * a - b * b) / (2 * a * b), -1, 1));
			elbow.quaternion.setFromAxisAngle(hinge, flex).multiply(straight);
			upper.updateWorldMatrix(false, true);
			hand.quaternion.copy(hand.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(handRotation));
			hand.updateWorldMatrix(false, true);
		}
	};
}
