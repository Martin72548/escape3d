import * as THREE from 'three';

export function createSecretDoor(scene, masonryTexture, stoneMaterial) {
	const centerX = -4.5;
	const left = centerX - 0.9;
	const right = centerX + 0.9;
	const wallMaterial = () => {
		const map = masonryTexture.clone();
		map.repeat.set(1.2, 2.35);
		map.needsUpdate = true;
		return new THREE.MeshStandardMaterial({ map, bumpMap: map, bumpScale: 0.065, color: 0xb5ada4, roughness: 0.97 });
	};
	const wallSection = (width, height, x, y) => {
		const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), wallMaterial());
		mesh.position.set(x, y, -9.86);
		mesh.receiveShadow = true;
		mesh.castShadow = true;
		scene.add(mesh);
	};
	wallSection(left + 7, 6, (-7 + left) / 2, 3);
	wallSection(7 - right, 6, (right + 7) / 2, 3);
	wallSection(right - left, 3.2, centerX, 4.4);
	const coverMap = masonryTexture.clone();
	coverMap.repeat.set(2.5, 2.35);
	coverMap.needsUpdate = true;
	const cover = new THREE.Mesh(
		new THREE.PlaneGeometry(14, 6),
		new THREE.MeshStandardMaterial({ map: coverMap, bumpMap: coverMap, bumpScale: 0.065, color: 0xb5ada4, roughness: 0.97 }),
	);
	cover.position.set(0, 3, -9.85);
	cover.receiveShadow = true;
	scene.add(cover);

	const stairs = new THREE.Group();
	stairs.visible = false;
	const stepMaterial = new THREE.MeshStandardMaterial({ color: 0x55483c, roughness: 0.95 });
	for (let i = 0; i < 8; i++) {
		const step = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.18, 0.38), stepMaterial);
		step.position.set(centerX, 0.08 + i * 0.22, -10.05 - i * 0.34);
		step.castShadow = true;
		step.receiveShadow = true;
		stairs.add(step);
	}
	scene.add(stairs);

	const reveal = new THREE.Group();
	reveal.visible = false;
	scene.add(reveal);
	for (const x of [left, right]) {
		const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.8, 0.24), stoneMaterial);
		post.position.set(x, 1.4, -9.72);
		post.castShadow = true;
		reveal.add(post);
	}
	const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.2, 0.24), stoneMaterial);
	lintel.position.set(centerX, 2.8, -9.72);
	lintel.castShadow = true;
	reveal.add(lintel);

	const hinge = new THREE.Group();
	hinge.position.set(left, 0, -9.7);
	reveal.add(hinge);
	const door = new THREE.Mesh(
		new THREE.BoxGeometry(1.8, 2.8, 0.14),
		new THREE.MeshStandardMaterial({ color: 0x49392c, roughness: 0.9 }),
	);
	door.position.set(0.9, 1.4, 0);
	door.castShadow = true;
	hinge.add(door);
	for (let y = 0.35; y < 2.8; y += 0.48) {
		const plank = new THREE.Mesh(
			new THREE.BoxGeometry(1.64, 0.035, 0.025),
			new THREE.MeshStandardMaterial({ color: 0x80603e, roughness: 0.82 }),
		);
		plank.position.set(0.9, y, 0.085);
		hinge.add(plank);
	}
	const handle = new THREE.Mesh(
		new THREE.TorusGeometry(0.075, 0.018, 8, 20),
		new THREE.MeshStandardMaterial({ color: 0xb98b42, metalness: 0.72, roughness: 0.28 }),
	);
	handle.position.set(1.56, 1.25, 0.11);
	hinge.add(handle);
	return { hinge, stairs, reveal, cover, open: false, angle: 0 };
}
