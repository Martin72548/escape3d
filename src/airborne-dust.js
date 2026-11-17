import * as THREE from 'three';

export function createAirborneDust(scene) {
	let cloud = null;
	const dummy = new THREE.Object3D();
	function emit(root) {
		if (cloud) return;
		root.updateWorldMatrix(true, true);
		const particles = Array.from({ length: 180 }, () => ({
			position: root.localToWorld(new THREE.Vector3((Math.random() - .5) * .5, .12 + Math.random() * 1.6, (Math.random() - .5) * .3)),
			velocity: new THREE.Vector3(1.2 + Math.random() * .7, .25 + Math.random() * .6, (Math.random() - .5) * .6),
			size: .018 + Math.random() * .03,
		}));
		const mesh = new THREE.InstancedMesh(
			new THREE.IcosahedronGeometry(1, 0),
			new THREE.MeshBasicMaterial({ color: 0xa8aa89, transparent: true, opacity: .85, depthWrite: false }),
			particles.length,
		);
		mesh.name = `Polvo de ${root.name} llevado por el aire`;
		cloud = { mesh, particles, age: 0 };
		update(0); scene.add(mesh);
	}
	function update(dt) {
		if (!cloud) return;
		cloud.age += dt;
		const { mesh, particles, age } = cloud;
		if (age >= 3.5) {
			scene.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); cloud = null; return;
		}
		mesh.material.opacity = .85 * (1 - age / 3.5);
		particles.forEach((p, i) => {
			p.position.addScaledVector(p.velocity, dt);
			p.position.x += Math.sin(age * 3 + i) * dt * .16;
			p.position.y += Math.sin(age * 4 + i) * dt * .08;
			dummy.position.copy(p.position); dummy.rotation.set(age + i, age * .7, 0);
			dummy.scale.setScalar(p.size); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
		});
		mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere();
	}
	return { emit, update };
}
