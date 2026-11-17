import * as THREE from 'three';

export function hideKeyUnderSlab(scene, hidingPosition, onReveal = () => {}) {
	scene.updateMatrixWorld(true);
	const ray = new THREE.Raycaster(new THREE.Vector3(hidingPosition.x, 2, hidingPosition.z), new THREE.Vector3(0, -1, 0));
	const slabs = [];
	scene.traverse(object => { if (object.userData.draggableSlabs) slabs.push(object); });
	const hit = ray.intersectObjects(slabs)[0];
	if (!hit) return () => {};
	const slab = hit.object;
	slab.userData.keySlabInstance = hit.instanceId;
	const matrix = new THREE.Matrix4();
	const center = new THREE.Vector3();
	slab.getMatrixAt(hit.instanceId, matrix);
	center.setFromMatrixPosition(matrix);
	slab.localToWorld(center);

	const key = new THREE.Group();
	key.name = 'Llave oculta bajo la losa';
	key.position.set(center.x, 0.025, center.z);
	const gold = new THREE.MeshStandardMaterial({ color: 0xe8b640, metalness: 0.72, roughness: 0.3, emissive: 0x634008, emissiveIntensity: 0.28 });
	const bow = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.018, 10, 28), gold);
	bow.rotation.x = -Math.PI / 2;
	bow.position.x = -0.14;
	key.add(bow);
	const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.29, 0.025, 0.028), gold);
	shaft.position.x = 0.075;
	key.add(shaft);
	for (const x of [0.12, 0.2]) {
		const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.025, 0.075), gold);
		tooth.position.set(x, 0, 0.025);
		key.add(tooth);
	}
	key.visible = false;
	scene.add(key);
	const current = new THREE.Vector3();
	let revealed = false, glowAge = 0;
	const glowMaterial = new THREE.MeshBasicMaterial({color:0xffd85c,transparent:true,opacity:.45,depthWrite:false,blending:THREE.AdditiveBlending});
	const glow = new THREE.Mesh(slab.geometry.clone(), glowMaterial);
	glow.name = 'Brillo de la baldosa de la llave';
	glow.matrixAutoUpdate = false;
	glow.matrix.multiplyMatrices(slab.matrixWorld, matrix);
	glow.matrix.elements[13] += .012;
	glow.visible = false;
	glow.raycast = () => {};
	scene.add(glow);
	const light = new THREE.PointLight(0xffd45c,0,2.5,2);
	light.name = 'Luz de la baldosa de la llave';light.position.set(center.x,.3,center.z);scene.add(light);
	// Keep the key at its hiding place, even when the covering slab is moved back.
	return function updateHiddenKey(score = 0, dt = 0) {
		slab.getMatrixAt(hit.instanceId, matrix);
		current.setFromMatrixPosition(matrix);
		slab.localToWorld(current);
		key.visible = slab.userData.removedSlabs?.has(hit.instanceId) || Math.hypot(current.x - center.x, current.z - center.z) > 0.7;
		glowAge += dt;
		glow.visible = score >= 15 && !key.visible;
		const pulse = .5 + .5 * Math.sin(glowAge * 4);
		glowMaterial.opacity = .35 + pulse * .35;
		light.intensity = glow.visible ? 2 + pulse * 2 : 0;
		if (key.visible && !revealed) { revealed = true; onReveal(); }
	};
}
