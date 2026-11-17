import * as THREE from 'three';

export function addDetailedDevil(parent) {
	// Fine, repeatable pores add relief without requiring external textures.
	const size = 128, data = new Uint8Array(size * size * 4);
	let seed = 713;
	for (let i = 0; i < size * size; i++) {
		seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
		const value = 100 + (seed >>> 24) * .4;
		data.set([value, value, value, 255], i * 4);
	}
	const pores = new THREE.DataTexture(data, size, size); pores.needsUpdate = true;
	pores.wrapS = pores.wrapT = THREE.RepeatWrapping; pores.repeat.set(3, 3);
	pores.magFilter = pores.minFilter = THREE.LinearFilter;
	const skin = new THREE.MeshStandardMaterial({ color: 0x783328, roughness: .74, bumpMap: pores, bumpScale: .018 });
	const ridge = new THREE.MeshStandardMaterial({ color: 0x4b211c, roughness: .85, bumpMap: pores, bumpScale: .012 });
	const horn = new THREE.MeshStandardMaterial({ color: 0x29211c, roughness: .55, bumpMap: pores, bumpScale: .025 });
	const ivory = new THREE.MeshStandardMaterial({ color: 0xc6ac7c, roughness: .58 });
	const socket = new THREE.MeshStandardMaterial({ color: 0x130b09, roughness: .9 });
	const eye = new THREE.MeshStandardMaterial({ color: 0xffb42c, emissive: 0xff6409, emissiveIntensity: 1.6, roughness: .22 });
	const membrane = new THREE.MeshStandardMaterial({ color: 0x51251f, side: THREE.DoubleSide, roughness: .9, bumpMap: pores, bumpScale: .012 });
	const sphere = new THREE.SphereGeometry(1, 36, 24);
	const arms = [], legParts = new Set();
	function pivot(name, position, parts) {
		const group = new THREE.Group(); group.name = name; group.position.set(...position); parent.add(group);
		parent.updateWorldMatrix(true, true);
		for (const part of parts) group.attach(part);
		return group;
	}
	function mesh(geometry, material) { const m = new THREE.Mesh(geometry, material); m.castShadow = m.receiveShadow = true; parent.add(m); return m; }
	function oval(material, x, y, z, a, b, c, tilt = 0) {
		const m = mesh(sphere, material); m.position.set(x, y, z); m.scale.set(a, b, c); m.rotation.z = tilt; return m;
	}
	function curve(points, material, radius, endRadius = radius, segments = 24) {
		const path = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
		const geometry = new THREE.TubeGeometry(path, segments, radius, 10, false);
		const positions = geometry.attributes.position;
		for (let i = 0; i <= segments; i++) {
			const center = path.getPointAt(i / segments), factor = THREE.MathUtils.lerp(1, endRadius / radius, i / segments);
			for (let j = 0; j <= 10; j++) {
				const index = i * 11 + j, p = new THREE.Vector3().fromBufferAttribute(positions, index).sub(center).multiplyScalar(factor).add(center);
				positions.setXYZ(index, p.x, p.y, p.z);
			}
		}
		geometry.computeVertexNormals(); return mesh(geometry, material);
	}
	// Torso, chest and abdominal planes follow a humanoid silhouette.
	oval(skin, 0, 1.35, -.025, .32, .49, .19);
	oval(skin, 0, .88, 0, .27, .24, .2);
	oval(skin, 0, 1.88, 0, .13, .2, .12);
	for (const s of [-1, 1]) {
		oval(skin, s * .19, 1.61, .12, .22, .14, .13, s * .1);
		for (let i = 0; i < 3; i++) oval(skin, s * .085, 1.39 - i * .14, .167, .083, .075, .055);
		oval(ridge, s * .24, 1.22, .06, .075, .22, .13, -s * .25);
		const armStart = parent.children.length;
		oval(skin, s * .38, 1.67, -.015, .18, .2, .18);
		curve([[s * .37, 1.65, 0], [s * .53, 1.38, .025], [s * .57, 1.19, .09]], skin, .12, .08);
		oval(skin, s * .49, 1.43, .09, .105, .19, .1, s * .25);
		const elbowStart = parent.children.length;
		curve([[s * .57, 1.2, .09], [s * .63, 1.03, .16], [s * .65, .88, .22]], skin, .09, .055);
		const handStart = parent.children.length;
		oval(skin, s * .66, .84, .23, .085, .105, .045);
		for (let i = 0; i < 4; i++) {
			const x = s * (.603 + i * .038), y = .79 - Math.sin(i * .8) * .025;
			curve([[x, .85, .25], [x + s * .015, y, .29], [x + s * .018, y - .08, .32]], skin, .019, .012, 12);
			curve([[x + s * .018, y - .08, .32], [x + s * .014, y - .12, .35], [x, y - .12, .38]], horn, .014, .001, 10);
		}
		curve([[s * .61, .86, .24], [s * .55, .81, .3], [s * .56, .75, .33]], skin, .025, .008, 12);
		const upperParts = parent.children.slice(armStart, elbowStart);
		const lowerParts = parent.children.slice(elbowStart, handStart);
		const handParts = parent.children.slice(handStart);
		const shoulder = pivot('devil-shoulder-' + s, [s * .38, 1.67, 0], upperParts);
		const elbow = pivot('devil-elbow-' + s, [s * .57, 1.2, .09], lowerParts);
		const hand = pivot('devil-hand-' + s, [s * .65, .88, .22], handParts);
		elbow.attach(hand); shoulder.attach(elbow);
		const grip = new THREE.Object3D(); grip.name = 'devil-grip-' + s; grip.position.set(0, -.045, .055); hand.add(grip);
		arms.push({ shoulder, elbow, hand, grip, side: s });
		const legStart = parent.children.length;
		curve([[s * .18, .88, 0], [s * .24, .58, .12], [s * .25, .43, .1]], skin, .14, .09);
		oval(skin, s * .22, .66, .13, .12, .23, .1);
		curve([[s * .25, .44, .1], [s * .27, .24, -.03], [s * .28, .1, .03]], skin, .085, .055);
		for (const split of [-1, 1]) oval(horn, s * .28 + split * .043, .075, .11, .042, .075, .14);
		for (const part of parent.children.slice(legStart)) legParts.add(part);
		// Curved horns taper from a heavy root to a fine point.
		curve([[s * .14, 2.2, -.035], [s * .25, 2.36, -.1], [s * .29, 2.58, -.13], [s * .19, 2.72, -.06]], horn, .085, .001, 36);
		oval(ridge, s * .145, 2.2, -.03, .1, .085, .09);
	}
	// Angular brow, cheekbones, muzzle and a narrow, toothed mouth.
	oval(skin, 0, 2.08, -.015, .19, .24, .16);
	oval(skin, 0, 1.95, .05, .135, .12, .13);
	oval(ridge, 0, 1.91, .13, .07, .09, .06);
	oval(socket, 0, 1.994, .165, .104, .027, .025);
	for (const s of [-1, 1]) {
		oval(socket, s * .081, 2.115, .135, .068, .04, .043, s * .15);
		oval(eye, s * .081, 2.114, .171, .037, .013, .01, s * .15);
		oval(socket, s * .081, 2.114, .181, .005, .013, .003);
		oval(ridge, s * .08, 2.16, .14, .095, .035, .055, s * .27);
		oval(skin, s * .126, 2.04, .11, .065, .035, .065, -s * .35);
		oval(socket, s * .034, 2.045, .203, .016, .01, .012);
		for (let i = 0; i < 3; i++) curve([[s * (.025 + i * .027), 2.012, .185], [s * (.025 + i * .027), 1.987 - (i === 2 ? .018 : 0), .193]], ivory, i === 2 ? .012 : .008, .001, 6);
	}
	oval(skin, 0, 2.075, .161, .037, .07, .055);
	// Broad scalloped bat membranes with raised skeletal ribs.
	for (const s of [-1, 1]) {
		const points = [[s * .22, 1.68, -.16], [s * .6, 2.15, -.23], [s * 1.12, 2.35, -.35], [s * .99, 1.89, -.29], [s * .96, 1.45, -.24], [s * .71, 1.63, -.22], [s * .63, 1.15, -.18], [s * .43, 1.39, -.17], [s * .25, .98, -.12]];
		const vertices = [], hub = [s * .46, 1.72, -.24];
		for (let i = 0; i < points.length; i++) vertices.push(...hub, ...points[i], ...points[(i + 1) % points.length]);
		const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geometry.computeVertexNormals(); mesh(geometry, membrane);
		curve(points.slice(0, 3), ridge, .05, .012);
		for (const index of [2, 4, 6, 8]) curve([points[0], hub, points[index]], ridge, .025, .008, 18);
	}
	curve([[0, .91, -.17], [.3, .6, -.39], [.68, .45, -.52], [.86, .7, -.5], [.83, 1.02, -.46]], skin, .055, .018, 40);
	const tip = mesh(new THREE.ConeGeometry(.085, .21, 3), horn); tip.position.set(.83, 1.1, -.46);
	parent.name = 'Diablo de piel roja, cuernos y alas detallados';
	const torso = pivot('devil-torso', [0, .95, 0], parent.children.filter(part => !legParts.has(part)));
	parent.userData.devilRig = { torso, arms };
}
