import * as THREE from 'three';

const turn = 2 * Math.PI;
const sides = 8;
const pitch = .19;
const colors = [0xa32f2a, 0xb73c33, 0xad352e];

export function createTwistedRope(sections, radius, haloRadius = 0) {
	const rope = new THREE.Group();
	const geometry = new THREE.BufferGeometry();
	const positions = new THREE.BufferAttribute(new Float32Array(3 * (sections + 1) * sides * 3), 3);
	const indices = [];
	for (let strand = 0; strand < 3; strand++) {
		const first = strand * (sections + 1) * sides;
		const groupStart = indices.length;
		for (let section = 0; section < sections; section++) {
			for (let side = 0; side < sides; side++) {
				const a = first + section * sides + side;
				const b = first + section * sides + (side + 1) % sides;
				indices.push(a, b, a + sides, b, b + sides, a + sides);
			}
		}
		geometry.addGroup(groupStart, indices.length - groupStart, strand);
	}
	geometry.setIndex(indices);
	geometry.setAttribute('position', positions.setUsage(THREE.DynamicDrawUsage));
	const mesh = new THREE.Mesh(geometry, colors.map(color => new THREE.MeshStandardMaterial({ color, roughness: .96 })));
	mesh.frustumCulled = false;
	rope.add(mesh);
	let halo, haloPositions;
	if (haloRadius > 0) {
		const haloGeometry = new THREE.BufferGeometry();
		haloPositions = new THREE.BufferAttribute(new Float32Array((sections + 1) * sides * 3), 3);
		haloGeometry.setAttribute('position', haloPositions.setUsage(THREE.DynamicDrawUsage));
		haloGeometry.setIndex(indices.slice(0, geometry.groups[0].count));
		halo = new THREE.Mesh(haloGeometry, new THREE.ShaderMaterial({
			transparent: true,
			depthWrite: false,
			blending: THREE.AdditiveBlending,
			vertexShader: `
				varying vec3 viewNormal;
				varying vec3 viewPosition;
				void main() {
					vec4 positionInView = modelViewMatrix * vec4(position, 1.0);
					viewNormal = normalMatrix * normal;
					viewPosition = -positionInView.xyz;
					gl_Position = projectionMatrix * positionInView;
				}
			`,
			fragmentShader: `
				varying vec3 viewNormal;
				varying vec3 viewPosition;
				void main() {
					float facing = max(dot(normalize(viewNormal), normalize(viewPosition)), 0.0);
					float glow = 0.78 * pow(facing, 4.0);
					gl_FragColor = vec4(1.0, 0.055, 0.018, glow);
				}
			`,
		}));
		halo.frustumCulled = false;
		halo.visible = false;
		rope.add(halo);
	}

	const center = new THREE.Vector3(), normal = new THREE.Vector3(), binormal = new THREE.Vector3();
	const previous = new THREE.Vector3();
	function update(sampleFrame, closed = false, glow = false) {
		if (halo) halo.visible = glow;
		const updateHalo = halo?.visible;
		let distance = 0;
		for (let section = 0; section <= sections; section++) {
			const t = section / sections;
			sampleFrame(t, center, normal, binormal);
			if (updateHalo) {
				for (let side = 0; side < sides; side++) {
					const angle = side * turn / sides;
					const x = Math.cos(angle) * haloRadius;
					const y = Math.sin(angle) * haloRadius;
					haloPositions.setXYZ(section * sides + side, center.x + normal.x * x + binormal.x * y,
						center.y + normal.y * x + binormal.y * y, center.z + normal.z * x + binormal.z * y);
				}
			}
			if (section > 0) distance += center.distanceTo(previous);
			previous.copy(center);
			const twist = turn * (closed ? 10 * t : distance / pitch);
			for (let strand = 0; strand < 3; strand++) {
				const angle = twist + strand * turn / 3;
				const strandX = Math.cos(angle) * radius * .48;
				const strandY = Math.sin(angle) * radius * .48;
				for (let side = 0; side < sides; side++) {
					const around = angle + side * turn / sides;
					const x = strandX + Math.cos(around) * radius * .55;
					const y = strandY + Math.sin(around) * radius * .55;
					const index = (strand * (sections + 1) + section) * sides + side;
					positions.setXYZ(index, center.x + normal.x * x + binormal.x * y,
						center.y + normal.y * x + binormal.y * y, center.z + normal.z * x + binormal.z * y);
				}
			}
		}
		positions.needsUpdate = true;
		geometry.computeVertexNormals();
		if (updateHalo) {
			haloPositions.needsUpdate = true;
			halo.geometry.computeVertexNormals();
		}
	}
	return { root: rope, update };
}
