import * as THREE from 'three';

// A short, repeatable palm-strike stance, blended over the current walk pose.
export function createMedievalCastPose(person, bones) {
	let remaining = 0, amount = 0;
	let previous = [];
	const target = new THREE.Vector3();
	const limbs = [
		['upper_armR_50', 'forearmR_49', 'handR_48', [-.23, 1.3, .55], [-.46, 1.14, .22]],
		['upper_armL_27', 'forearmL_26', 'handL_25', [.23, 1.84, .23], [.46, 1.64, .08]],
		['thighR_61', 'shinR_60', 'footR_59', [-.18, .11, .4], [-.18, .5, .62]],
		['thighL_57', 'shinL_56', 'footL_55', [.18, .11, -.42], [.18, .5, -.12]],
	].map(([a, b, c, end, pole]) => ({ a: bones.get(a), b: bones.get(b), c: bones.get(c), end, pole })).filter(limb => limb.a && limb.b && limb.c);
	const hands = ['handR_48', 'handL_25'].map(name => {
		const hand = bones.get(name);
		const palms = hand?.children.filter(child => child.isBone && child.name.startsWith('palm')) ?? [];
		if (palms.length < 2) return null;
		const fingers = palms.reduce((v, palm) => v.add(palm.position), new THREE.Vector3()).normalize();
		const across = palms.at(-1).position.clone().sub(palms[0].position).normalize();
		const normal = across.cross(fingers).normalize();
		const x = fingers.clone().cross(normal).normalize();
		const basis = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, fingers, normal));
		return { hand, inverseBasis: basis.invert() };
	}).filter(Boolean);
	function world(point) { return person.localToWorld(new THREE.Vector3(...point)); }
	function aim(bone, child, point) {
		const origin = bone.getWorldPosition(new THREE.Vector3());
		const from = child.getWorldPosition(new THREE.Vector3()).sub(origin).normalize();
		const to = point.clone().sub(origin).normalize();
		const rotation = new THREE.Quaternion().setFromUnitVectors(from, to).multiply(bone.getWorldQuaternion(new THREE.Quaternion()));
		bone.quaternion.copy(bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(rotation));
		bone.updateWorldMatrix(false, true);
	}
	function restore() {
		for (const [bone, position, quaternion] of previous) {
			bone.position.copy(position); bone.quaternion.copy(quaternion);
		}
		previous = [];
	}
	function apply(dt) {
		remaining = Math.max(0, remaining - dt);
		amount = THREE.MathUtils.damp(amount, remaining > 0 ? 1 : 0, remaining > 0 ? 28 : 10, dt);
		person.userData.castingPoseAmount = amount;
		if (amount < .001) return;
		previous = [...bones.values()].map(bone => [bone, bone.position.clone(), bone.quaternion.clone()]);
		const hips = bones.get('hips_62');
		if (hips) {
			const position = hips.getWorldPosition(new THREE.Vector3());
			position.add(new THREE.Vector3(0, -.15 * amount, .035 * amount).applyQuaternion(person.getWorldQuaternion(new THREE.Quaternion())));
			hips.position.copy(hips.parent.worldToLocal(position));
			hips.updateWorldMatrix(false, true);
		}
		for (const { a, b, c, end, pole } of limbs) {
			const start = a.getWorldPosition(new THREE.Vector3());
			const joint = b.getWorldPosition(new THREE.Vector3());
			const finish = c.getWorldPosition(new THREE.Vector3());
			const rotation = c.getWorldQuaternion(new THREE.Quaternion());
			const upper = start.distanceTo(joint), lower = joint.distanceTo(finish);
			const goal = finish.clone().lerp(world(end), amount);
			const axis = goal.clone().sub(start);
			const length = THREE.MathUtils.clamp(axis.length(), Math.abs(upper - lower) + .0001, upper + lower - .0001);
			axis.normalize(); goal.copy(start).addScaledVector(axis, length);
			const bend = world(pole).sub(start);
			bend.addScaledVector(axis, -bend.dot(axis)).normalize();
			const along = (upper * upper - lower * lower + length * length) / (2 * length);
			const knee = start.clone().addScaledVector(axis, along).addScaledVector(bend, Math.sqrt(Math.max(0, upper * upper - along * along)));
			aim(a, b, knee); aim(b, c, goal);
			c.quaternion.copy(c.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(rotation));
			c.updateWorldMatrix(false, true);
		}
		for (const { hand, inverseBasis } of hands) {
			const poseRotation = person.getWorldQuaternion(new THREE.Quaternion()).multiply(inverseBasis);
			const local = hand.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(poseRotation);
			hand.quaternion.slerp(local, amount);
			hand.updateWorldMatrix(false, true);
		}
	}
	function cast(point) {
		if (person.userData.dead || person.userData.fallen) return;
		target.copy(point).sub(person.getWorldPosition(new THREE.Vector3())).setY(0);
		if (target.lengthSq() > .0001) person.rotation.y = Math.atan2(target.x, target.z);
		remaining = .38;
		// Enter the stance on the shot frame; subsequent frames smooth the release.
		amount = 1;
	}
	return { restore, apply, cast };
}
