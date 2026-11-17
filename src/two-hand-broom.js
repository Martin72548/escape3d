import * as THREE from 'three';

export function createTwoHandBroom(person, bones) {
	const broom = person.getObjectByName('Escoba mágica del prisionero');
	const torso = person.getObjectByName('prisoner-torso');
	const grips = new Map();
	if (!broom || !torso) return () => grips;
	// The prop has its own pivot so swinging it moves both hand targets together.
	const pivot = new THREE.Group(); pivot.name = 'two-hand-broom-pivot';
	torso.add(pivot); pivot.position.set(-.22, .395, .25);
	pivot.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(.55, -.82, .16).normalize());
	pivot.add(broom); broom.position.set(0, 0, 0); broom.rotation.set(0, 0, 0);
	broom.scale.z = 1.35;
	const contact = new THREE.Object3D(); contact.name = 'broom-ground-contact'; contact.position.z = 1.05; broom.add(contact);
	const hands = [['handR_48', .10], ['handL_25', .25]].map(([name, distance]) => {
		const hand = bones.get(name);
		if (!hand) return null;
		const palms = hand.children.filter(child => child.isBone && child.name.startsWith('palm'));
		const center = palms.reduce((v, bone) => v.add(bone.position), new THREE.Vector3());
		if (palms.length) center.multiplyScalar(.6 / palms.length);
		const along = center.clone().normalize();
		const across = palms.length > 1 ? palms.at(-1).position.clone().sub(palms[0].position).normalize() : new THREE.Vector3(1, 0, 0);
		const normal = across.clone().cross(along).normalize();
		const x = along.clone().cross(normal).normalize();
		const localBasis = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, along, normal));
		const grip = new THREE.Object3D(); grip.name = `broom-grip-${name}`; grip.position.z = distance;
		// Fingers cross the handle; the palm faces into it from the near side.
		const y = new THREE.Vector3(1, 0, 0), z = new THREE.Vector3(0, -1, 0);
		grip.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(y.clone().cross(z), y, z)).multiply(localBasis.invert());
		broom.add(grip);
		const fingers = [];
		hand.updateWorldMatrix(true, true);
		hand.traverse(bone => {
			if (!bone.isBone || !/^(f_|thumb)/.test(bone.name)) return;
			const child = bone.children.find(child => child.isBone);
			if (!child) return;
			const inward = normal.clone().applyQuaternion(hand.getWorldQuaternion(new THREE.Quaternion())).applyQuaternion(bone.getWorldQuaternion(new THREE.Quaternion()).invert());
			const axis = child.position.clone().normalize().cross(inward).normalize();
			fingers.push({ bone, rest: bone.quaternion.clone(), axis });
		});
		return { hand, grip, center, fingers };
	}).filter(Boolean);
	return () => {
		grips.clear();
		for (const { fingers } of hands) for (const { bone, rest } of fingers) bone.quaternion.copy(rest);
		if (!person.userData.broomMode || !broom.visible || person.userData.dead) return grips;
		const lift = person.userData.broomLiftAmount ?? 0;
		const strike = person.userData.broomStrikeAmount ?? 0;
		const direction = new THREE.Vector3(.3, -.75, .60).normalize()
			.lerp(new THREE.Vector3(.25, -.25, .94).normalize(), lift)
			.lerp(new THREE.Vector3(.05, -.99, .10).normalize(), strike).normalize();
		pivot.position.set(-.18, .395 + .08 * lift - .03 * strike, .12);
		pivot.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
		broom.rotation.set(0, 0, 0);
		broom.updateWorldMatrix(true, true);
		// Land the bristles on the floor, without pushing them through it.
		if (strike > 0) {
			const bounds = new THREE.Box3().setFromObject(broom);
			const floor = person.getWorldPosition(new THREE.Vector3()).y + .02;
			if (!bounds.isEmpty()) pivot.position.y += (floor - bounds.min.y) * strike;
		}
		broom.updateWorldMatrix(true, true);
		for (const { hand, grip, center, fingers } of hands) {
			const quaternion = grip.getWorldQuaternion(new THREE.Quaternion());
			const position = grip.getWorldPosition(new THREE.Vector3());
			// Offset the wrist so the centre of the palm lands on the handle.
			position.add(new THREE.Vector3(0, .016, 0).transformDirection(broom.matrixWorld).multiplyScalar(.016));
			position.sub(center.clone().multiply(hand.getWorldScale(new THREE.Vector3())).applyQuaternion(quaternion));
			grips.set(hand, { position, quaternion });
			for (const { bone, rest, axis } of fingers) bone.quaternion.copy(rest).multiply(new THREE.Quaternion().setFromAxisAngle(axis, .95));
		}
		return grips;
	};
}
