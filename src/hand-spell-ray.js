import * as THREE from 'three';

const axis = new THREE.Vector3(0, 1, 0);
const start = new THREE.Vector3();
const direction = new THREE.Vector3();

export function syncHandSpellRay(ray, prisoner, target) {
	const hand = prisoner.getObjectByName('spell-origin') ?? prisoner.getObjectByName('casting-wrist') ?? prisoner;
	hand.getWorldPosition(start);
	direction.copy(target).sub(start);
	const length = direction.length();
	ray.visible = length >= .02;
	ray.position.copy(start).add(target).multiplyScalar(.5);
	ray.scale.y = length;
	if (length > 0) ray.quaternion.setFromUnitVectors(axis, direction.multiplyScalar(1 / length));
}
