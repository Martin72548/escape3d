import * as THREE from 'three';

// Project the slab's rounded outline onto the floor, preserving its size,
// position and rotation even if it was dragged before being destroyed.
export function createSlabHoles(scene) {
	const material = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide, fog: false, toneMapped: false });
	const shape = new THREE.Shape();
	const r = 0.09, lo = -0.5, hi = 0.5;
	shape.moveTo(lo + r, lo);
	shape.lineTo(hi - r, lo);
	shape.quadraticCurveTo(hi, lo, hi, lo + r);
	shape.lineTo(hi, hi - r);
	shape.quadraticCurveTo(hi, hi, hi - r, hi);
	shape.lineTo(lo + r, hi);
	shape.quadraticCurveTo(lo, hi, lo, hi - r);
	shape.lineTo(lo, lo + r);
	shape.quadraticCurveTo(lo, lo, lo + r, lo);
	const outline = new THREE.ShapeGeometry(shape, 6);
	const transform = new THREE.Matrix4();
	return function addHole(slab, instanceMatrix) {
		slab.updateWorldMatrix(true, false);
		transform.multiplyMatrices(slab.matrixWorld, instanceMatrix);
		const geometry = outline.clone().applyMatrix4(transform);
		const vertices = geometry.attributes.position;
		for (let i = 0; i < vertices.count; i++) vertices.setY(i, 0.001);
		vertices.needsUpdate = true;
		geometry.computeVertexNormals();
		geometry.computeBoundingSphere();
		const hole = new THREE.Mesh(geometry, material);
		hole.name = 'Hueco negro de baldosa';
		scene.add(hole);
		return hole;
	};
}
