import { spawnWallFragments } from './wall-fragments.js';
import { wallBricksSound } from './falling-bricks-sound.js';
import * as THREE from 'three';
import { createZombieGrowl } from './zombie-growl.js';
import { createKomodoSkin } from './komodo-skin.js';

export function createKomodoEncounter(scene, prisoner) {
	const roar = createZombieGrowl();
	const root = new THREE.Group();
	root.name = 'Dragon de Komodo';
	root.userData.spellTarget = 'komodo';
	root.visible = false;
	scene.add(root);
	const { skin, belly } = createKomodoSkin();
	const dark = new THREE.MeshStandardMaterial({ color: 0x201c15, roughness: .8 });
	const tongueMaterial = new THREE.MeshStandardMaterial({ color: 0xb77386, roughness: .65 });
	function oval(parent, material, x, y, z, sx, sy, sz) {
		const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 22), material);
		mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz);
		mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh); return mesh;
	}
	function bone(parent, start, end, r1, r2, material) {
		const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end), direction = b.clone().sub(a);
		const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r2, r1, direction.length(), 20), material);
		mesh.position.copy(a).add(b).multiplyScalar(.5);
		mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
		mesh.castShadow = true; parent.add(mesh); return mesh;
	}
	oval(root, skin, 0, .49, 0, .45, .32, .98);
	oval(root, belly, 0, .31, .08, .34, .12, .82);
	oval(root, skin, 0, .57, .86, .25, .23, .55);
	const head = new THREE.Group(); head.position.set(0, .63, 1.19); root.add(head);
	head.name = 'Cabeza del Komodo';
	oval(head, skin, 0, .07, .2, .24, .16, .43);
	oval(head, dark, 0, -.035, .28, .205, .025, .34);
	const jawPivot = new THREE.Group(); jawPivot.position.set(0, -.025, -.06); head.add(jawPivot);
	oval(jawPivot, belly, 0, -.065, .3, .21, .065, .38);
	const eyeMaterial = new THREE.MeshPhysicalMaterial({ color: 0x9a742f, roughness: .18, clearcoat: 1, clearcoatRoughness: .06 });
	const wet = new THREE.MeshPhysicalMaterial({ color: 0x392824, roughness: .23, clearcoat: .65 });
	const pupil = new THREE.MeshPhysicalMaterial({ color: 0x080906, roughness: .12, clearcoat: 1 });
	const glint = new THREE.MeshBasicMaterial({ color: 0xf2e5c0 });
	oval(head, skin, 0, .105, .43, .18, .105, .26);
	oval(head, wet, 0, -.044, .49, .185, .009, .17);
	for (const side of [-1, 1]) {
		oval(head, skin, side * .19, .15, .05, .085, .075, .14);
		oval(head, eyeMaterial, side * .235, .155, .12, .028, .04, .05);
		const brow = oval(head, skin, side * .235, .205, .15, .065, .035, .16);
		brow.rotation.x = -.35; brow.rotation.z = -side * .4;
		oval(head, pupil, side * .258, .155, .14, .009, .024, .023);
		oval(head, glint, side * .265, .169, .156, .003, .005, .005);
		oval(head, dark, side * .12, .095, .61, .019, .01, .009);
		oval(head, skin, side * .18, .01, .33, .06, .075, .2);
		// Creased lips, a recessed ear and loose throat folds.
		oval(head, dark, side * .24, .09, -.055, .008, .024, .016);
		for(let fold=0;fold<4;fold++){
			const crease=oval(head, belly, side*.12, -.13-fold*.017, -.035+fold*.06, .095, .013, .035);
			crease.rotation.z=side*.18;
		}
	}
	const teeth = new THREE.MeshStandardMaterial({ color: 0xe4d5a7, roughness: .65 });
	for (const side of [-1, 1]) for (let i = 0; i < 7; i++) {
		bone(head, [side * .17, -.035, .1 + i * .065], [side * .17, -.105, .1 + i * .065], .025, .002, teeth);
	}
	const tongue = new THREE.Group(); tongue.position.set(0, -.035, .58); head.add(tongue);
	bone(tongue, [0, 0, 0], [0, 0, .95], .024, .012, tongueMaterial);
	for (const side of [-1, 1]) bone(tongue, [0, 0, .93], [side * .17, .012, 1.35], .012, .002, tongueMaterial);
	const tail = new THREE.Group(); tail.position.set(0, .43, -.75); root.add(tail);
	tail.name = 'Cola ondulante del Komodo';
	for (let i = 0; i < 12; i++) {
		const t = i / 12, next = (i + 1) / 12;
		bone(tail, [.2 * Math.sin(t * 3), -.2 * t, -t * 2], [.2 * Math.sin(next * 3), -.2 * next, -next * 2], .24 * (1 - t) + .008, .24 * (1 - next) + .008, skin);
	}
	const legs = [];
	for (const side of [-1, 1]) for (const z of [-.58, .64]) {
		const leg = new THREE.Group(); leg.position.set(side * .31, .47, z); root.add(leg);
		bone(leg, [0, 0, 0], [side * .37, -.15, -.16], .14, .09, skin);
		bone(leg, [side * .37, -.15, -.16], [side * .4, -.39, .08], .09, .055, skin);
		oval(leg, skin, side * .4, -.39, .14, .12, .055, .18);
		for (let toe = 0; toe < 4; toe++) {
			const x = side * .4 + (toe - 1.5) * .055;
			bone(leg, [x, -.39, .2], [x, -.405, .33], .025, .013, skin);
			bone(leg, [x, -.405, .33], [x, -.435, .415], .014, .001, teeth);
		}
		legs.push(leg);
	}
	// Raised scales give the broad back a reptilian silhouette.
	for (let row = 0; row < 13; row++) for (let col = -2; col <= 2; col++) {
		oval(root, skin, col * .135, .75 - Math.abs(col) * .04, -.73 + row * .12, .045, .035, .055);
	}
	const pose = new THREE.Group(); pose.position.set(0, .1, -.58);
	const parts = [...root.children]; root.add(pose); root.updateMatrixWorld(true);
	parts.forEach(part => pose.attach(part));
	const torso = pose.children.filter(part => part.isMesh).map(mesh => ({
		mesh, rest: mesh.geometry.attributes.position.array.slice(), restX: mesh.position.x,
		rigid: Math.max(mesh.scale.x, mesh.scale.y, mesh.scale.z) < .1,
	}));
	const headRest = head.position.clone();
	const targetPoint = new THREE.Vector3(), tailA = new THREE.Vector3(), tailB = new THREE.Vector3(), tailDirection = new THREE.Vector3();
	const up = new THREE.Vector3(0, 1, 0);
	function undulate(walking) {
		const amplitude = walking ? .1 : .045;
		const wave = z => Math.sin(age * 4.5 - z * 2.7) * amplitude;
		for (const { mesh, rest, restX, rigid } of torso) {
			if (rigid) { mesh.position.x = restX + wave(mesh.position.z); continue; }
			const vertices = mesh.geometry.attributes.position;
			for (let i = 0; i < vertices.count; i++) {
				const z = rest[i * 3 + 2] * mesh.scale.z + mesh.position.z;
				vertices.setX(i, rest[i * 3] + wave(z) / mesh.scale.x);
			}
			vertices.needsUpdate = true; mesh.geometry.computeVertexNormals(); mesh.geometry.computeBoundingSphere();
		}
		head.position.copy(headRest); head.position.x += wave(headRest.z);
		// Adjacent segments share endpoints, making a wave travel down the tail.
		function tailPoint(t, out) {
			const z = tail.position.z - t * 2;
			out.set(.2 * Math.sin(t * 3) + wave(z) * (1 + t * 2), -.2 * t, -t * 2);
		}
		tail.children.forEach((segment, i) => {
			tailPoint(i / 12, tailA); tailPoint((i + 1) / 12, tailB);
			tailDirection.subVectors(tailB, tailA);
			segment.position.copy(tailA).add(tailB).multiplyScalar(.5);
			segment.scale.y = tailDirection.length() / segment.geometry.parameters.height;
			segment.quaternion.setFromUnitVectors(up, tailDirection.normalize());
		});
		// Aim in world space so rearing up and body motion cannot tilt the gaze away.
		prisoner.updateWorldMatrix(true, false);
		targetPoint.set(0, 1.15, 0); prisoner.localToWorld(targetPoint);
		head.updateWorldMatrix(true, false); head.lookAt(targetPoint);
	}
	let triggered = false, age = 0, appeared = false, hits = 0, targeted = false, rise = 0, smokeTime = 0;
	const smoke = [], smokeGeometry = new THREE.SphereGeometry(1, 10, 8);
	function puff() {
		root.updateWorldMatrix(true, true);
		const center = pose.localToWorld(new THREE.Vector3(0, .5, .6));
		for (let i = 0; i < 4; i++) {
			const material = new THREE.MeshBasicMaterial({ color: 0x68666b, transparent: true, opacity: .45, depthWrite: false });
			const mesh = new THREE.Mesh(smokeGeometry, material);
			mesh.position.copy(center).add(new THREE.Vector3((Math.random() - .5) * .65, Math.random() * .5, (Math.random() - .5) * .65));
			mesh.scale.setScalar(.18 + Math.random() * .16); scene.add(mesh);
			smoke.push({ mesh, age: 0, velocity: new THREE.Vector3((Math.random() - .5) * .35, .55 + Math.random() * .3, (Math.random() - .5) * .35) });
		}
	}
	function spawn(point) {
		if (triggered) return;
		triggered = true; wallBricksSound.play(); spawnWallFragments(scene,point);
		const x = THREE.MathUtils.clamp(point.x, -7.5, 7.5);
		root.position.set(x, .03, -11.8);
		// Open a low breach through the actual stone instances.
		scene.updateMatrixWorld(true);
		const matrix = new THREE.Matrix4(), world = new THREE.Vector3();
		scene.traverse(wall => {
			if (!wall.isInstancedMesh || wall.userData.spellTarget !== 'komodo-wall') return;
			for (let i = 0; i < wall.count; i++) {
				wall.getMatrixAt(i, matrix); world.setFromMatrixPosition(matrix).applyMatrix4(wall.matrixWorld);
				if (Math.abs(world.x - x) > 1.1 || world.y > 1.65) continue;
				matrix.elements[14] -= 4; wall.setMatrixAt(i, matrix);
			}
			wall.instanceMatrix.needsUpdate = true; wall.computeBoundingBox(); wall.computeBoundingSphere();
		});
		const hole = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.7), new THREE.MeshBasicMaterial({ color: 0x080807 }));
		hole.name = 'Brecha del dragon de Komodo'; hole.position.set(x, .85, -9.96); scene.add(hole);
	}
	function update(dt) {
		for (let i = smoke.length - 1; i >= 0; i--) {
			const p = smoke[i]; p.age += dt; p.mesh.position.addScaledVector(p.velocity, dt);
			p.mesh.scale.addScalar(dt * .32); p.mesh.material.opacity = .45 * Math.max(0, 1 - p.age / 1.8);
			if (p.age >= 1.8) { scene.remove(p.mesh); p.mesh.material.dispose(); smoke.splice(i, 1); }
		}
		if (!triggered) return;
		if (hits >= 3) return;
		age += dt;
		if (age < .35) return;
		if (!appeared) { appeared = true; root.visible = true; roar.play(1.4); }
		const progress = THREE.MathUtils.smoothstep(age, .35, 3.5);
		let walking = progress < 1;
		if (hits === 0) root.position.z = THREE.MathUtils.lerp(-11.8, -6.6, progress);
		else {
			rise = Math.min(1, rise + dt / .8); pose.rotation.x = -1.05 * THREE.MathUtils.smoothstep(rise, 0, 1);
			const direction = prisoner.getWorldPosition(new THREE.Vector3()).sub(root.position); direction.y = 0;
			const distance = direction.length(); walking = distance > 2.6 && !targeted;
			if (distance > .001) { direction.normalize(); root.rotation.y = Math.atan2(direction.x, direction.z); }
			if (walking && rise === 1) root.position.addScaledVector(direction, Math.min(distance - 2.6, dt * 1.3));
		}
		legs.forEach((leg, i) => {
			const hind = i === 0 || i === 2;
			leg.rotation.x = (hits > 0 ? (hind ? rise * 1.05 : -.55 * rise) : 0) + (walking ? Math.sin(age * 7 + (i === 0 || i === 3 ? 0 : Math.PI)) * .25 : 0);
		});
		if (hits === 2) { smokeTime -= dt; if (smokeTime <= 0) { puff(); smokeTime = .18; } }
		undulate(walking);
		const flick = Math.max(0, Math.sin(age * 4.5));
		tongue.visible = flick > .1;
		tongue.scale.z = .04 + flick * .96;
		tongue.rotation.y = Math.sin(age * 18) * .08;
		jawPivot.rotation.x = .12 + flick * .55;
	}
	function target(object) {
		if (object !== root || !root.visible || targeted || hits >= 3) return false;
		targeted = true; return true;
	}
	function release(object) { if (object === root) targeted = false; }
	function defeat(object) {
		if (object !== root || !root.visible || hits >= 3) return;
		targeted = false; hits++;
		if (hits === 2) { puff(); smokeTime = .18; }
		if (hits === 3) { root.visible = false; roar.stop(); }
	}
	return { spawn, update, target, release, defeat, unlockAudio: roar.unlock, root, get hits() { return hits; } };
}
