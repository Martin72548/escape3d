import * as THREE from 'three';

// Sample the head's travelled path by distance. Each successive section occupies
// an earlier point on that path, so bends propagate backwards without stretching.
export function createSnakeBody(snake, skin, belly) {
	const rings = 49, sides = 12, spacing = 0.035;
	const positions = new Float32Array(rings * sides * 3);
	const uv = new Float32Array(rings * sides * 2);
	const geometry = new THREE.BufferGeometry();
	const upperIndices = [], bellyIndices = [];
	for (let i = 0; i < rings; i++) for (let j = 0; j < sides; j++) {
		uv[(i * sides + j) * 2] = j / sides;
		uv[(i * sides + j) * 2 + 1] = i / (rings - 1);
		if (i === rings - 1) continue;
		const a = i * sides + j, b = i * sides + (j + 1) % sides;
		const indices = Math.sin((j + 0.5) / sides * Math.PI * 2) < -0.55 ? bellyIndices : upperIndices;
		indices.push(a, a + sides, b, b, a + sides, b + sides);
	}
	geometry.setIndex([...upperIndices, ...bellyIndices]);
	geometry.addGroup(0, upperIndices.length, 0);
	geometry.addGroup(upperIndices.length, bellyIndices.length, 1);
	geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
	geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
	const mesh = new THREE.Mesh(geometry, [skin, belly]);
	mesh.name = 'Cuerpo continuo de serpiente';
	mesh.castShadow = mesh.receiveShadow = true;
	snake.add(mesh);
	let trail = [];
	const samples = Array.from({ length: rings }, () => new THREE.Vector3());
	const point = new THREE.Vector3(), tangent = new THREE.Vector3(), side = new THREE.Vector3();
	function reset(direction) {
		trail = [];
		const forward = direction.clone().setY(0).normalize();
		if (forward.lengthSq() < 0.1) forward.set(0, 0, 1);
		const lateral = new THREE.Vector3(forward.z, 0, -forward.x);
		for (let i = 0; i < 130; i++) {
			const distance = i * 0.02;
			trail.push(snake.position.clone().setY(0).addScaledVector(forward, -distance).addScaledVector(lateral, Math.sin(distance * 7) * 0.1));
		}
		update();
	}
	function update() {
		if (!trail.length) return;
		const current = snake.position.clone().setY(0);
		// Insert distance-spaced samples, independent of frame rate or speed.
		const old = trail[0];
		const distance = old.distanceTo(current);
		const count = Math.floor(distance / 0.02);
		if (count > 0) {
			const step = current.clone().sub(old).normalize().multiplyScalar(0.02);
			const additions = [];
			for (let i = count; i >= 1; i--) additions.push(old.clone().addScaledVector(step, i));
			trail = additions.concat(trail).slice(0, 150);
		}
		const path = [current, ...trail];
		let edge = 0, travelled = 0;
		for (let i = 0; i < rings; i++) {
			const desired = i * spacing;
			while (edge < path.length - 2 && travelled + path[edge].distanceTo(path[edge + 1]) < desired) {
				travelled += path[edge].distanceTo(path[edge + 1]); edge++;
			}
			const length = path[edge].distanceTo(path[edge + 1]);
			samples[i].lerpVectors(path[edge], path[edge + 1], THREE.MathUtils.clamp((desired - travelled) / Math.max(0.00001, length), 0, 1));
		}
		for (let i = 0; i < rings; i++) {
			tangent.copy(samples[Math.max(0, i - 1)]).sub(samples[Math.min(rings - 1, i + 1)]).normalize();
			side.set(tangent.z, 0, -tangent.x).normalize();
			const t = i / (rings - 1);
			const radius = 0.072 * Math.pow(1 - t, 0.65) + 0.003;
			for (let j = 0; j < sides; j++) {
				const angle = j / sides * Math.PI * 2;
				point.copy(samples[i]).sub(current).addScaledVector(side, Math.cos(angle) * radius);
				// Belly stays close to the floor as the tail tapers.
				point.y = radius * 0.72 - 0.054 + Math.sin(angle) * radius * 0.72;
				point.toArray(positions, (i * sides + j) * 3);
			}
		}
		geometry.attributes.position.needsUpdate = true;
		geometry.computeVertexNormals();
		geometry.computeBoundingSphere();
	}
	return { reset, update, mesh };
}
