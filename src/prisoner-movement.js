import * as THREE from 'three';

export function createPrisonerMovement(prisoner, { scripted = false } = {}) {
	const legs = prisoner.userData.walkingLegs ?? [];
	const arms = [prisoner.getObjectByName('casting-arm'), prisoner.getObjectByName('left-arm')];
	const elbows = [prisoner.getObjectByName('casting-elbow'), prisoner.getObjectByName('left-elbow')];
	const wrists = [prisoner.getObjectByName('casting-wrist'), prisoner.getObjectByName('left-wrist')];
	const armRest = arms.map(joint => joint.quaternion.clone());
	const elbowRest = elbows.map(joint => joint.quaternion.clone());
	const wristRest = wrists.map(joint => joint.quaternion.clone());
	const move = new THREE.Vector3();
	const gaitRotation = new THREE.Quaternion();
	const walkingDirection = new THREE.Vector3(0, 0, 1);
	const inverseRotation = new THREE.Quaternion();
	let phase = 0;
	let gait = 0;
	const baseY = prisoner.userData.standingY ?? prisoner.position.y;

	function update(dt, direction, turn = true, speed = 2.8) {
		if (prisoner.userData.wakingUp && !prisoner.userData.introWalking) return;
		if (prisoner.userData.sleeping) {
			return;
		}
		if (prisoner.userData.broomStriking) {
			gait = 0; prisoner.userData.walkingIntensity = 0;
			legs.forEach(leg => leg.rotation.x = 0);
			return;
		}
		if (prisoner.userData.broomStriking || prisoner.userData.victoryCelebrating || prisoner.userData.batDucking || prisoner.userData.snakeHopping || prisoner.userData.scorpionHopping || prisoner.userData.levelTransition || prisoner.userData.denisHopping || prisoner.userData.luciaVictim || prisoner.userData.georgeCaptured) return;
		if (prisoner.userData.dead || prisoner.userData.fallen || prisoner.userData.waistGrabOwner || prisoner.userData.chasmJumping || prisoner.userData.firstSpellTrance) {
			gait = 0; prisoner.userData.walkingIntensity = 0;
			legs.forEach(leg => leg.rotation.x = 0);
			return;
		}

		move.copy(direction).setY(0);
		let groundY = prisoner.userData.constrainMovement ? prisoner.userData.constrainMovement(prisoner.position.x, prisoner.position.z).y : baseY;
		let distance = 0;
		if (move.lengthSq() > 0) {
			move.normalize();
			const oldX = prisoner.position.x, oldZ = prisoner.position.z;
			if (scripted) {
				prisoner.position.addScaledVector(move, speed * dt);
			} else if (prisoner.userData.constrainMovement) {
				const next = prisoner.userData.constrainMovement(oldX + move.x * speed * dt, oldZ + move.z * speed * dt);
				groundY = next.y;
				prisoner.position.set(next.x, next.y, next.z);
			} else {
				const inPassage = prisoner.userData.currentLevel === 3 && prisoner.userData.lowerPassageOpen;
				const nextZ = oldZ + move.z * speed * dt;
				const canEnter = inPassage && nextZ >= -4.6 && nextZ <= -2.4;
				prisoner.position.x = THREE.MathUtils.clamp(oldX + move.x * speed * dt, canEnter || inPassage && oldX < -9 ? -15.5 : -9, 9);
				prisoner.position.z = THREE.MathUtils.clamp(nextZ, prisoner.position.x < -9 ? -4.6 : -9, prisoner.position.x < -9 ? -2.4 : 9);
			}
			distance = Math.hypot(prisoner.position.x - oldX, prisoner.position.z - oldZ);
			if (turn) {
				const yaw = Math.atan2(move.x, move.z);
				if (prisoner.userData.currentLevel === 4) {
					prisoner.rotation.y = yaw;
				} else {
					const delta = Math.atan2(Math.sin(yaw - prisoner.rotation.y), Math.cos(yaw - prisoner.rotation.y));
					prisoner.rotation.y += delta * (1 - Math.exp(-12 * dt));
				}
			}
		}

		if (distance > 0.00001) {
			walkingDirection.copy(move).applyQuaternion(prisoner.getWorldQuaternion(inverseRotation).invert());
			prisoner.userData.walkingDirection = walkingDirection;
			phase += distance * 5.2;
			gait = THREE.MathUtils.damp(gait, 1, 10, dt);
		} else gait = THREE.MathUtils.damp(gait, 0, 9, dt);
		prisoner.userData.walkCycle = phase;
		prisoner.userData.walkingIntensity = gait;
		legs.forEach((leg, i) => { leg.rotation.x = Math.sin(phase + i * Math.PI) * 0.34 * gait; });
		prisoner.position.y = groundY + Math.abs(Math.sin(phase * 2)) * 0.012 * gait;

		for (let i = 0; i < arms.length; i++) {
			const armPhase = phase + i * Math.PI;
			gaitRotation.setFromEuler(new THREE.Euler(-Math.sin(armPhase) * 0.2 * gait, 0, 0));
			arms[i].quaternion.copy(armRest[i]).multiply(gaitRotation);
			gaitRotation.setFromEuler(new THREE.Euler(-0.12 * gait - Math.max(0, Math.cos(armPhase)) * 0.14 * gait, 0, 0));
			elbows[i].quaternion.copy(elbowRest[i]).multiply(gaitRotation);
			gaitRotation.setFromEuler(new THREE.Euler(Math.sin(armPhase) * 0.035 * gait, 0, 0));
			wrists[i].quaternion.copy(wristRest[i]).multiply(gaitRotation);
		}
	}
	return { update };
}
