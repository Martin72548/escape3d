import { spawnWallFragments } from './wall-fragments.js';
import { wallBricksSound } from './falling-bricks-sound.js';
import * as THREE from 'three';
import { createAirborneDust } from './airborne-dust.js';
import { createPrisonerScream } from './prisoner-scream.js';

export function createCobraEncounter(scene, prisoner) {
	const root = new THREE.Group(); root.name = 'Cobra erguida'; root.userData.spellTarget = 'cobra'; root.visible = false; scene.add(root);
	// Small overlapping scales, with subtle variation instead of a flat surface.
	const scalePixels = new Uint8Array(128 * 256 * 4);
	for (let y = 0; y < 256; y++) for (let x = 0; x < 128; x++) {
		const row = Math.floor(y / 16), sx = ((x + (row % 2) * 8) % 16) / 16 - .5, sy = (y % 16) / 16;
		const edge = Math.abs(sx) * 1.3 + Math.abs(sy - .4) > .67;
		const shade = (edge ? .68 : .92 + .12 * Math.sin(sy * Math.PI)) + .025 * Math.sin(x * 13 + y * 7);
		const i = (y * 128 + x) * 4;
		scalePixels[i] = 139 * shade; scalePixels[i + 1] = 113 * shade; scalePixels[i + 2] = 68 * shade; scalePixels[i + 3] = 255;
	}
	const scales = new THREE.DataTexture(scalePixels, 128, 256); scales.colorSpace = THREE.SRGBColorSpace;
	scales.wrapS = scales.wrapT = THREE.RepeatWrapping; scales.magFilter = THREE.LinearFilter; scales.needsUpdate = true;
	const skin = new THREE.MeshStandardMaterial({ color: 0xc6b48a, map: scales, bumpMap: scales, bumpScale: .012, roughness: .62 });
	const belly = new THREE.MeshStandardMaterial({ color: 0xd3b978, roughness: .9 });
	const black = new THREE.MeshStandardMaterial({ color: 0x19150f });
	const red = new THREE.MeshStandardMaterial({ color: 0xb52b42 });
	function oval(parent, material, x, y, z, sx, sy, sz) {
		const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), material);
		mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz); mesh.castShadow = true; parent.add(mesh); return mesh;
	}
	const rings = 112, sides = 16, positions = new Float32Array((rings + 1) * (sides + 1) * 3), uvs = [], indices = [];
	for (let i = 0; i <= rings; i++) for (let j = 0; j <= sides; j++) {
		uvs.push(j / sides, i / rings * 8);
		if (i < rings && j < sides) { const k = i * (sides + 1) + j; indices.push(k, k + 1, k + sides + 1, k + 1, k + sides + 2, k + sides + 1); }
	}
	const bodyGeometry = new THREE.BufferGeometry(); bodyGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
	bodyGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); bodyGeometry.setIndex(indices);
	const body = new THREE.Mesh(bodyGeometry, skin); body.name = 'Cuerpo continuo y cola larga de la cobra'; body.castShadow = body.receiveShadow = true; root.add(body);
	const neck = new THREE.Group(); root.add(neck);
	const hoodShape = new THREE.Shape(); hoodShape.moveTo(0, -.95);
	hoodShape.bezierCurveTo(-.13, -.8, -.53, -.58, -.47, -.25);
	hoodShape.bezierCurveTo(-.43, .04, -.2, .12, 0, .09);
	hoodShape.bezierCurveTo(.2, .12, .43, .04, .47, -.25);
	hoodShape.bezierCurveTo(.53, -.58, .13, -.8, 0, -.95);
	const hood = new THREE.Mesh(new THREE.ExtrudeGeometry(hoodShape, { depth: .09, bevelEnabled: true, bevelSize: .045, bevelThickness: .035, bevelSegments: 3, curveSegments: 20, steps: 1 }), skin);
	hood.position.z = -.07; hood.castShadow = true; neck.add(hood);
	oval(neck, belly, 0, -.42, .075, .26, .43, .035);
	for (let i = 0; i < 13; i++) {
		const y = -.82 + i * .065, width = .12 + Math.sin(i / 13 * Math.PI) * .17;
		const rib = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-width, y, .095), new THREE.Vector3(0, y - .012, .115), new THREE.Vector3(width, y, .095)]), 12, .008, 5, false), skin); neck.add(rib);
	}
	const head = new THREE.Group(); neck.add(head);
	oval(head, skin, 0, .035, .11, .15, .095, .24);
	oval(head, skin, 0, .015, .28, .12, .065, .12);
	oval(head, black, 0, -.045, .2, .135, .012, .19);
	const jaw = oval(head, belly, 0, -.065, .17, .135, .028, .21);
	for (const side of [-1, 1]) {
		oval(head, new THREE.MeshStandardMaterial({ color: 0xa67d25, roughness: .22 }), side * .13, .065, .17, .025, .024, .032);
		oval(head, black, side * .148, .065, .185, .008, .018, .015);
		oval(head, black, side * .078, .045, .35, .012, .009, .007);
		const fang = new THREE.Mesh(new THREE.ConeGeometry(.012, .075, 10), belly); fang.position.set(side * .07, -.05, .28); fang.rotation.z = Math.PI; head.add(fang);
	}
	const tongue = new THREE.Group(); tongue.position.set(0, -.035, .37); head.add(tongue);
	function tonguePart(x, z, length, angle) {
		const mesh = new THREE.Mesh(new THREE.CylinderGeometry(.005, .012, length, 6), red);
		mesh.rotation.x = Math.PI / 2; mesh.rotation.z = angle; mesh.position.set(x, 0, z); tongue.add(mesh);
	}
	tonguePart(0, .2, .4, 0); tonguePart(-.055, .48, .21, -.55); tonguePart(.055, .48, .21, .55);
	const dust = createAirborneDust(scene), scream = createPrisonerScream(), smoke = [];
	let spawned = false, age = 0, hits = 0, targeted = false, attack = -1, bitten = false, cooldown = 0, pain = 0;
	const tangent = new THREE.Vector3(), normal = new THREE.Vector3(), binormal = new THREE.Vector3(), axis = new THREE.Vector3(1, 0, 0), center = new THREE.Vector3();
	function spawn(point) {
		if (spawned) return; spawned = true; wallBricksSound.play(); spawnWallFragments(scene,point);
		root.position.set(THREE.MathUtils.clamp(point.x, 2.5, 7.5), .03, -10.8);
		scene.updateMatrixWorld(true);
		const matrix = new THREE.Matrix4(), world = new THREE.Vector3();
		scene.traverse(wall => {
			if (!wall.isInstancedMesh || wall.userData.spellTarget !== 'cobra-wall') return;
			for (let i = 0; i < wall.count; i++) {
				wall.getMatrixAt(i, matrix); world.setFromMatrixPosition(matrix).applyMatrix4(wall.matrixWorld);
				if (Math.abs(world.x - root.position.x) > .8 || world.y > 2.5) continue;
				matrix.elements[14] -= 4; wall.setMatrixAt(i, matrix);
			}
			wall.instanceMatrix.needsUpdate = true; wall.computeBoundingBox(); wall.computeBoundingSphere();
		});
		const hole = new THREE.Mesh(new THREE.PlaneGeometry(1.65, 2.5), new THREE.MeshBasicMaterial({ color: 0x080706 }));
		hole.position.set(root.position.x, 1.25, -9.96); scene.add(hole);
	}
	function update(dt) {
		dust.update(dt);
		for (let i = smoke.length - 1; i >= 0; i--) {
			const p = smoke[i]; p.age += dt; p.mesh.position.addScaledVector(p.velocity, dt); p.mesh.scale.addScalar(dt * .3);
			p.mesh.material.opacity = .45 * Math.max(0, 1 - p.age / 1.8);
			if (p.age >= 1.8) { scene.remove(p.mesh); p.mesh.geometry.dispose(); p.mesh.material.dispose(); smoke.splice(i, 1); }
		}
		if (pain > 0) { pain = Math.max(0, pain - dt); if (!pain) { const mouth = prisoner.getObjectByName('screaming-mouth'); if (mouth) mouth.visible = false; } }
		if (!spawned || hits >= 2) return;
		age += dt; cooldown = Math.max(0, cooldown - dt); root.visible = true;
		const direction = prisoner.getWorldPosition(new THREE.Vector3()).sub(root.position); direction.y = 0;
		const distance = direction.length(); if (distance > .001) { direction.normalize(); root.rotation.y = Math.atan2(direction.x, direction.z); }
		if (!targeted && distance > 1.25) root.position.addScaledVector(direction, Math.min(distance - 1.25, dt * 1.45));
		if (!targeted && distance <= 1.3 && attack < 0 && cooldown === 0 && !prisoner.userData.dead && !prisoner.userData.fallen) { attack = 0; bitten = false; }
		let lunge = 0;
		if (attack >= 0) {
			attack += dt; lunge = Math.sin(Math.min(1, attack / .8) * Math.PI);
			if (attack >= .3 && !bitten) {
				bitten = true;
				if (distance < 1.6 && !targeted) { scream.play(); pain = 1.65; const mouth = prisoner.getObjectByName('screaming-mouth'); if (mouth) mouth.visible = true; }
			}
			if (attack >= .8) { attack = -1; cooldown = 2.5; }
		}
		const sway = Math.sin(age * 4) * .08;
		const wave = phase => Math.sin(age * 3.5 - phase) * .2;
		const curve = new THREE.CatmullRomCurve3([
			new THREE.Vector3(wave(5), .035, -4.3), new THREE.Vector3(-.55 + wave(4), .07, -3.4),
			new THREE.Vector3(.55 + wave(3), .11, -2.4), new THREE.Vector3(-.4 + wave(2), .14, -1.4),
			new THREE.Vector3(.12 + wave(1) * .4, .2, -.65), new THREE.Vector3(sway, .65, -.45),
			new THREE.Vector3(sway, 1.25, -.25 + lunge * .3), new THREE.Vector3(sway, 1.98, .2 + lunge * .65),
		]);
		for (let i = 0; i <= rings; i++) {
			const t = i / rings; curve.getPoint(t, center); curve.getTangent(t, tangent);
			normal.crossVectors(tangent, axis).normalize(); binormal.crossVectors(tangent, normal).normalize();
			const radius = .008 + .105 * THREE.MathUtils.smoothstep(t, 0, .48) - .025 * THREE.MathUtils.smoothstep(t, .7, 1);
			for (let j = 0; j <= sides; j++) {
				const angle = j / sides * Math.PI * 2, offset = (i * (sides + 1) + j) * 3;
				for (let k = 0; k < 3; k++) positions[offset + k] = center.getComponent(k) + radius * (Math.cos(angle) * normal.getComponent(k) + Math.sin(angle) * binormal.getComponent(k));
			}
		}
		bodyGeometry.attributes.position.needsUpdate = true; bodyGeometry.computeVertexNormals(); bodyGeometry.computeBoundingSphere();
		curve.getPoint(1, neck.position); neck.rotation.x = lunge * .45;
		jaw.position.y = -.065 - lunge * .13; tongue.scale.z = .05 + Math.max(0, Math.sin(age * 12)) * .95;
	}
	function target(object) { if (object !== root || !root.visible || hits >= 2 || targeted) return false; targeted = true; attack = -1; return true; }
	function release(object) { if (object === root) targeted = false; }
	function defeat(object) {
		if (object !== root || !root.visible || hits >= 2) return;
		targeted = false; attack = -1; hits++;
		if (hits === 2) { dust.emit(root); root.visible = false; return; }
		root.updateWorldMatrix(true, true);
		for (let i = 0; i < 16; i++) {
			const mesh = new THREE.Mesh(new THREE.SphereGeometry(.15, 8, 6), new THREE.MeshBasicMaterial({ color: 0x777078, transparent: true, opacity: .45, depthWrite: false }));
			mesh.position.copy(root.localToWorld(new THREE.Vector3((Math.random() - .5) * .5, .3 + Math.random() * 1.7, 0))); scene.add(mesh);
			smoke.push({ mesh, age: 0, velocity: new THREE.Vector3((Math.random() - .5) * .4, .5, (Math.random() - .5) * .4) });
		}
	}
	return { root, spawn, update, target, release, defeat, unlockAudio: scream.unlock, get hits() { return hits; } };
}
