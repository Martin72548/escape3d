import * as THREE from 'three';

function createRoach(mode) {
	const root = new THREE.Group(); root.name = `Cucaracha gigante: ${mode}`;
	root.userData.spellTarget = 'roach';
	const shell = new THREE.MeshStandardMaterial({ color: 0x4c2515, roughness: 0.37, metalness: 0.16 });
	const dark = new THREE.MeshStandardMaterial({ color: 0x24160e, roughness: 0.75 });
	const wingMaterial = new THREE.MeshStandardMaterial({ color: 0xb38c57, roughness: 0.45, side: THREE.DoubleSide, transparent: true, opacity: 0.72 });
	function oval(material, x, y, z, sx, sy, sz) {
		const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), material);
		mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz);
		mesh.castShadow = mesh.receiveShadow = true; root.add(mesh); return mesh;
	}
	oval(dark, 0, 0, -0.08, 0.29, 0.13, 0.49);
	oval(shell, 0, 0.035, 0.3, 0.25, 0.15, 0.23);
	oval(dark, 0, 0.025, 0.5, 0.17, 0.1, 0.14);
	const wings = [], legs = [];
	for (const side of [-1, 1]) {
		const wingPivot = new THREE.Group(); wingPivot.position.set(side * 0.04, 0.105, 0.15); root.add(wingPivot);
		const cover = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), shell);
		cover.scale.set(0.14, 0.075, 0.43); cover.position.set(side * 0.12, 0, -0.28); wingPivot.add(cover);
		if (mode === 'voladora') {
			const membrane = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), wingMaterial);
			membrane.scale.set(0.4, 0.008, 0.48); membrane.position.set(side * 0.36, -0.025, -0.17); wingPivot.add(membrane);
		}
		wings.push({ pivot: wingPivot, side });
		const eye = oval(new THREE.MeshStandardMaterial({ color: 0x13100b, roughness: 0.16 }), side * 0.13, 0.075, 0.54, 0.042, 0.04, 0.037);
		const antennaCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(side * 0.07, 0.06, 0.58), new THREE.Vector3(side * 0.2, 0.15, 0.83), new THREE.Vector3(side * 0.4, 0.18, 1.08)]);
		root.add(new THREE.Mesh(new THREE.TubeGeometry(antennaCurve, 12, 0.008, 5, false), dark));
		for (let i = 0; i < 4; i++) {
			const pivot = new THREE.Group(); pivot.position.set(side * 0.19, 0, 0.3 - i * 0.2); root.add(pivot);
			const points = [new THREE.Vector3(), new THREE.Vector3(side * 0.27, -0.04, 0.18 - i * 0.12), new THREE.Vector3(side * 0.42, -0.14, 0.3 - i * 0.2)];
			pivot.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 8, 0.017, 6, false), dark));
			legs.push({ pivot, side, phase: i % 2 * Math.PI + (side < 0 ? Math.PI : 0) });
		}
	}
	root.scale.setScalar(1.45);
	return { root, legs, wings, mode, age: 0, routeIndex: 0, target: new THREE.Vector3(), normal: new THREE.Vector3(0, 1, 0) };
}

export function createRoachEncounter(scene) {
	const roaches = [];
	let spawned = false, randomSeed = 331;
	const random = () => { randomSeed = (Math.imul(randomSeed, 1664525) + 1013904223) >>> 0; return randomSeed / 4294967296; };
	const up = new THREE.Vector3(0, 1, 0), forward = new THREE.Vector3(), right = new THREE.Vector3();
	const basis = new THREE.Matrix4(), rotation = new THREE.Quaternion();
	const wallRoute = [
		[0, 0.23, -9.65, 0, 1, 0], [0, 1, -9.65, 0, 0, 1], [0, 4.9, -9.65, 0, 0, 1],
		[7.5, 4.9, -9.65, 0, 0, 1], [7.5, 0.23, -9.65, 0, 0, 1], [7.5, 0.23, -8.8, 0, 1, 0],
		[9.65, 0.23, 5, 0, 1, 0], [9.65, 1, 5, -1, 0, 0], [9.65, 4.9, 5, -1, 0, 0],
		[9.65, 4.9, -6, -1, 0, 0], [9.65, 0.23, -6, -1, 0, 0], [8.8, 0.23, -6, 0, 1, 0],
		[-8, 0.23, 8.8, 0, 1, 0], [-8, 0.23, 9.65, 0, 0, -1], [-8, 4.9, 9.65, 0, 0, -1],
		[6, 4.9, 9.65, 0, 0, -1], [6, 0.23, 9.65, 0, 0, -1], [6, 0.23, 8.8, 0, 1, 0],
	];
	function nextTarget(roach) {
		if (roach.mode === 'paredes') {
			const waypoint = wallRoute[roach.routeIndex++ % wallRoute.length];
			roach.target.set(...waypoint.slice(0, 3)); roach.normal.set(...waypoint.slice(3));
		} else {
			roach.target.set((random() - 0.5) * 17.5, roach.mode === 'voladora' ? 1.1 + random() * 3.8 : 0.23, (random() - 0.5) * 17.5);
		}
	}
	function spawn(point) {
		if (spawned) return;
		spawned = true;
		for (const mode of ['piso', 'paredes', 'voladora']) {
			const roach = createRoach(mode);
			roach.origin = point.clone(); roach.root.position.copy(point).setY(-0.45);
			scene.add(roach.root); roaches.push(roach); nextTarget(roach);
		}
	}
	function update(dt) {
		for (let index = 0; index < roaches.length; index++) {
			const roach = roaches[index];
			if (roach.defeated || roach.targeted) continue;
			roach.age += dt;
			if (roach.age < 1.1) {
				const progress = THREE.MathUtils.smoothstep(roach.age, 0, 1.1);
				const angle = index * Math.PI * 2 / 3;
				roach.root.position.set(roach.origin.x + Math.sin(angle) * progress * 0.35, THREE.MathUtils.lerp(-0.45, 0.23, progress), roach.origin.z + Math.cos(angle) * progress * 0.35);
			} else {
				let remaining = dt * (roach.mode === 'voladora' ? 5.8 : roach.mode === 'paredes' ? 4.8 : 4.3);
				for (let step = 0; step < 8 && remaining > 0; step++) {
					forward.copy(roach.target).sub(roach.root.position);
					const distance = forward.length();
					if (distance < 0.001) { nextTarget(roach); continue; }
					forward.divideScalar(distance);
					const travel = Math.min(remaining, distance); roach.root.position.addScaledVector(forward, travel); remaining -= travel;
					// Surface normal keeps the belly facing the floor or the wall.
					const normal = roach.mode === 'paredes' ? roach.normal : up;
					right.crossVectors(normal, forward);
					if (right.lengthSq() > 0.00001) {
						right.normalize(); const correctedUp = new THREE.Vector3().crossVectors(forward, right).normalize();
						basis.makeBasis(right, correctedUp, forward); rotation.setFromRotationMatrix(basis);
						roach.root.quaternion.slerp(rotation, 1 - Math.exp(-14 * dt));
					}
				}
			}
			for (const leg of roach.legs) {
				const gait = roach.age * (roach.mode === 'voladora' ? 10 : 27) + leg.phase;
				leg.pivot.rotation.y = Math.sin(gait) * 0.38;
				leg.pivot.rotation.z = leg.side * Math.max(0, Math.cos(gait)) * 0.26;
			}
			if (roach.mode === 'voladora') for (const wing of roach.wings) wing.pivot.rotation.z = wing.side * (0.65 + Math.sin(roach.age * 65) * 0.4);
		}
	}
	function target(root) {
		const roach = roaches.find(roach => roach.root === root);
		if (!roach || roach.defeated || roach.targeted) return false;
		roach.targeted = true;
		return true;
	}
	function release(root) {
		const roach = roaches.find(roach => roach.root === root);
		if (roach && !roach.defeated) roach.targeted = false;
	}
	function defeat(root) {
		const roach = roaches.find(roach => roach.root === root);
		if (!roach || roach.defeated) return;
		roach.defeated = true; roach.targeted = false;
		roach.root.visible = false;
	}
	return { spawn, update, roaches, target, release, defeat };
}
