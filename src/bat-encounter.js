import { createBatScreechLoop } from './bat-screech-loop.js';
import * as THREE from 'three';

export function createBat(index, { white = false, black = false } = {}) {
	const root = new THREE.Group(); root.name = `Murcielago ${index + 1}`;
	root.userData.spellTarget = 'bat';
	const fur = new THREE.MeshStandardMaterial({ color: white ? 0xffffff : black ? 0x080808 : 0x332a2c, roughness: 0.95 });
	const membrane = new THREE.MeshStandardMaterial({ color: white ? 0xf1eee8 : black ? 0x111111 : 0x492b32, side: THREE.DoubleSide, roughness: 0.7 });
	const bone = new THREE.MeshStandardMaterial({ color: white ? 0xe8e5df : black ? 0x191919 : 0x66534a, roughness: 0.8 });
	function oval(material, position, scale) {
		const object = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), material);
		object.position.set(...position); object.scale.set(...scale); object.castShadow = true; root.add(object); return object;
	}
	oval(fur, [0, 0, 0], [0.13, 0.15, 0.27]);
	oval(fur, [0, 0.12, 0.2], [0.14, 0.13, 0.14]);
	const wings = [];
	for (const side of [-1, 1]) {
		const ear = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.23, 10), fur);
		ear.position.set(side * 0.09, 0.3, 0.18); ear.rotation.z = -side * 0.22; root.add(ear);
		oval(new THREE.MeshStandardMaterial({ color: 0x17100e, roughness: 0.2 }), [side * 0.075, 0.14, 0.32], [0.022, 0.024, 0.018]);
		const pivot = new THREE.Group(); pivot.position.set(side * 0.1, 0.06, 0.08); root.add(pivot);
		const shape = new THREE.Shape();
		shape.moveTo(0, 0); shape.quadraticCurveTo(side * 0.3, 0.24, side * 0.63, 0.17);
		shape.lineTo(side * 0.92, -0.08); shape.quadraticCurveTo(side * 0.7, -0.03, side * 0.62, -0.27);
		shape.quadraticCurveTo(side * 0.48, -0.14, side * 0.39, -0.38);
		shape.quadraticCurveTo(side * 0.23, -0.23, side * 0.13, -0.4); shape.lineTo(0, -0.16); shape.closePath();
		const web = new THREE.Mesh(new THREE.ShapeGeometry(shape, 14), membrane);
		web.rotation.x = Math.PI / 2; web.castShadow = true; pivot.add(web);
		for (const [x, z] of [[0.63, -0.17], [0.92, 0.08], [0.62, 0.27], [0.39, 0.38]]) {
			const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(side * x * 0.5, 0.015, z * 0.35), new THREE.Vector3(side * x, 0, z)]);
			pivot.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 8, 0.009, 5, false), bone));
		}
		wings.push({ pivot, side });
	}
	root.scale.setScalar(1.1);
	return { root, wings, index, age: 0, phase: 0, route: 0, duration: 1, curve: null };
}

export function createBatEncounter(scene) {
	const bats = [],screech=createBatScreechLoop();
 function syncSound(){if(bats.some(bat=>!bat.defeated&&bat.root.visible))screech.start();else screech.stop();}
	let spawned = false, seed = 1741;
	const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
	const forward = new THREE.Vector3(0, 0, 1), desired = new THREE.Quaternion();
	function nextFlight(bat) {
		// Each bat visits a different quadrant and height, then changes sector.
		const sector = (bat.index + bat.route++) % 4;
		const end = new THREE.Vector3((sector % 2 ? 1 : -1) * (2 + random() * 5.8), 1.5 + random() * 3.2, (sector < 2 ? -1 : 1) * (2 + random() * 5.8));
		const start = bat.root.position.clone();
		const control1 = start.clone().lerp(end, 0.3);
		const control2 = start.clone().lerp(end, 0.7);
		for (const point of [control1, control2]) {
			point.x = THREE.MathUtils.clamp(point.x + (random() - 0.5) * 5, -8, 8);
			point.z = THREE.MathUtils.clamp(point.z + (random() - 0.5) * 5, -8, 8);
			point.y = 1.3 + random() * 3.5;
		}
		bat.curve = new THREE.CubicBezierCurve3(start, control1, control2, end);
		bat.duration = Math.max(0.4, bat.curve.getLength() / (7 + bat.index * 0.65)); bat.phase = 0;
	}
	function spawn(point) {
		if (spawned) return;
		spawned = true;
		for (let i = 0; i < 4; i++) {
			const bat = createBat(i); bat.origin = point.clone(); bat.root.position.copy(point).setY(-0.35);
			scene.add(bat.root); bats.push(bat);
		}
		syncSound();
	}
	function update(dt) {
		syncSound();
		for (const bat of bats) {
			if (bat.defeated) continue;
			bat.age += dt;
			if (bat.launched) {
				const flight = bat.launched;
				flight.age += dt;
				const progress = Math.min(1, flight.age * 22 / flight.distance);
				bat.root.position.lerpVectors(flight.start, flight.end, progress);
				bat.root.rotateZ(dt * 15);
				if (progress === 1) {
					bat.root.quaternion.setFromUnitVectors(forward, flight.direction);
					bat.root.scale.z *= .12;
					for (const wing of bat.wings) wing.pivot.rotation.z = 0;
					bat.defeated = true;
					bat.root.userData.squashed = true;
					syncSound();
				}
				continue;
			}
			if (bat.targeted) {
				for (const wing of bat.wings) wing.pivot.rotation.z = wing.side * (0.15 + Math.sin(bat.age * (43 + bat.index * 2) + bat.index) * 0.85);
				continue;
			}
			const delay = bat.index * 0.13, emergence = 0.65;
			if (bat.age < delay + emergence) {
				const progress = THREE.MathUtils.smoothstep(bat.age - delay, 0, emergence);
				const angle = bat.index * Math.PI / 2;
				bat.root.position.set(bat.origin.x + Math.cos(angle) * progress * 0.22, THREE.MathUtils.lerp(-0.35, 1.5, progress), bat.origin.z + Math.sin(angle) * progress * 0.22);
			} else {
				if (!bat.curve) nextFlight(bat);
				let remaining = dt;
				while (remaining > 0) {
					const advance = Math.min(remaining, (1 - bat.phase) * bat.duration);
					bat.phase = Math.min(1, bat.phase + advance / bat.duration); remaining -= advance;
					bat.curve.getPointAt(bat.phase, bat.root.position);
					const tangent = bat.curve.getTangentAt(bat.phase).normalize();
					desired.setFromUnitVectors(forward, tangent);
					bat.root.quaternion.slerp(desired, 1 - Math.exp(-12 * dt));
					if (bat.phase >= 1) nextFlight(bat);
				}
			}
			for (const wing of bat.wings) wing.pivot.rotation.z = wing.side * (0.15 + Math.sin(bat.age * (43 + bat.index * 2) + bat.index) * 0.85);
		}
	}
	function target(root) {
		const bat = bats.find(bat => bat.root === root);
		if (!bat || bat.defeated || bat.targeted || bat.launched) return false;
		bat.targeted = true; return true;
	}
	function release(root) {
		const bat = bats.find(bat => bat.root === root);
		if (bat && !bat.defeated) bat.targeted = false;
	}
	function defeat(root) {
		const bat = bats.find(bat => bat.root === root);
		if (!bat || bat.defeated) return;
		bat.defeated = true; bat.targeted = false; bat.root.visible = false;syncSound();
	}
	function swat(root, origin) {
		const bat = bats.find(bat => bat.root === root);
		if (!bat || bat.defeated || bat.launched) return false;
		const direction = bat.curve ? bat.curve.getTangentAt(bat.phase).negate().setY(0) : root.position.clone().sub(origin).setY(0);
		if (direction.lengthSq() < .0001) direction.set(0, 0, 1);
		direction.normalize();
		const start = root.position.clone(), limit = 9.65;
		const tx = Math.abs(direction.x) > .0001 ? ((direction.x > 0 ? limit : -limit) - start.x) / direction.x : Infinity;
		const tz = Math.abs(direction.z) > .0001 ? ((direction.z > 0 ? limit : -limit) - start.z) / direction.z : Infinity;
		const distance = Math.max(.01, Math.min(tx, tz));
		bat.launched = { start, end: start.clone().addScaledVector(direction, distance), direction, distance, age: 0 };
		bat.targeted = false;
		delete root.userData.spellTarget;
		return true;
	}
	return { spawn, update, bats, target, release, defeat, swat,unlockAudio:screech.unlock,stopAudio:screech.stop,get audioPlaying(){return screech.playing;} };
}
