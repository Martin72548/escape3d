import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// A fixed seed keeps the masonry identical on desktop and in the headset.
function randomSource(seed) {
	return () => {
		seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
		return seed / 4294967296;
	};
}

export function createStoneMaterial() {
	const size = 512;
	const colorCanvas = document.createElement('canvas');
	const heightCanvas = document.createElement('canvas');
	const roughCanvas = document.createElement('canvas');
	for (const canvas of [colorCanvas, heightCanvas, roughCanvas]) canvas.width = canvas.height = size;
	const colorCtx = colorCanvas.getContext('2d');
	const heightCtx = heightCanvas.getContext('2d');
	const roughCtx = roughCanvas.getContext('2d');
	const colors = colorCtx.createImageData(size, size);
	const heights = heightCtx.createImageData(size, size);
	const roughness = roughCtx.createImageData(size, size);
	const random = randomSource(407);
	// Periodic mineral veins and pores wrap without a hard texture seam.
	for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
		const u = x / size * Math.PI * 2, v = y / size * Math.PI * 2;
		const grain = random();
		const veins = Math.sin(u * 3 + Math.sin(v * 2) * 1.7) * Math.sin(v * 4 + Math.cos(u * 2));
		const patches = Math.sin(u + Math.cos(v)) * Math.cos(v * 2 + Math.sin(u));
		const pore = grain < 0.045 ? -35 : 0;
		const shade = 135 + patches * 18 + veins * 9 + (grain - 0.5) * 32 + pore;
		const index = (y * size + x) * 4;
		colors.data.set([shade + 8, shade + 5, shade - 3, 255], index);
		const relief = 135 + veins * 19 + patches * 22 + (grain - 0.5) * 40 + pore;
		heights.data.set([relief, relief, relief, 255], index);
		const rough = 219 + patches * 16 + grain * 18;
		roughness.data.set([rough, rough, rough, 255], index);
	}
	colorCtx.putImageData(colors, 0, 0);
	heightCtx.putImageData(heights, 0, 0);
	roughCtx.putImageData(roughness, 0, 0);
	// Fine, branching fractures are also etched into the bump map.
	for (let i = 0; i < 14; i++) {
		let x = random() * size, y = random() * size;
		for (const [ctx, stroke] of [[colorCtx, 'rgba(46,43,35,.38)'], [heightCtx, 'rgb(65,65,65)']]) {
			const crackRandom = randomSource(i + 31);
			ctx.strokeStyle = stroke;
			ctx.lineWidth = 0.7;
			ctx.beginPath(); ctx.moveTo(x, y);
			for (let step = 0; step < 8; step++) ctx.lineTo(x += (crackRandom() - 0.5) * 15, y += crackRandom() * 8);
			ctx.stroke();
			x = (i * 137) % size; y = (i * 83) % size;
		}
	}
	const textures = [colorCanvas, heightCanvas, roughCanvas].map(canvas => {
		const texture = new THREE.CanvasTexture(canvas);
		texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
		texture.anisotropy = 4;
		return texture;
	});
	textures[0].colorSpace = THREE.SRGBColorSpace;
	return new THREE.MeshStandardMaterial({ map: textures[0], bumpMap: textures[1], bumpScale: 0.045, roughnessMap: textures[2], roughness: 1 });
}

export function addStoneCourses(scene, material, width, height, x, y, z, rotationX, rotationY, seed, slabs = false, { tight = false, jointed = false } = {}) {
	const random = randomSource(seed);
	const group = new THREE.Group();
	group.position.set(x, y, z);
	group.rotation.set(rotationX, rotationY, 0);
	const blocks = [];
	const rowHeight = slabs ? 1.05 : 0.53;
	const rows = Math.ceil(height / rowHeight);
	for (let row = 0; row < rows; row++) {
		const bottom = -height / 2 + row * rowHeight;
		const h = Math.min(rowHeight, height / 2 - bottom);
		let left = -width / 2;
		while (left < width / 2 - 0.01) {
			const w = Math.min((slabs ? 0.8 : 0.65) + random() * 0.7, width / 2 - left);
			blocks.push({ x: left + w / 2, y: bottom + h / 2, w, h });
			left += w;
		}
	}
	// Instancing retains real beveled silhouettes without one draw call per stone.
	const geometry = tight ? new THREE.BoxGeometry(1, 1, 1) : new RoundedBoxGeometry(1, 1, 1, 2, jointed ? .045 : .09);
	if (jointed) {
		const p = geometry.attributes.position;
		for (let i = 0; i < p.count; i++) {
			const px=p.getX(i),py=p.getY(i),pz=p.getZ(i);
			const relief=(Math.sin(px*8+py*7)*.065+Math.sin(px*17-py*11)*.025)*THREE.MathUtils.smoothstep(pz,.2,.5);
			p.setXYZ(i,px+Math.sin(py*11+pz*3)*.012*THREE.MathUtils.smoothstep(Math.abs(px),.3,.5),py+Math.sin(px*9-pz*4)*.01*THREE.MathUtils.smoothstep(Math.abs(py),.3,.5),pz+relief);
		}
		geometry.computeVertexNormals();
	}
	const stones = new THREE.InstancedMesh(geometry, material, blocks.length);
	const dummy = new THREE.Object3D();
	blocks.forEach((block, index) => {
		const depth = slabs ? 0.055 + random() * 0.025 : 0.13 + random() * 0.13;
		dummy.position.set(block.x, block.y + (random() - 0.5) * 0.018, slabs ? -0.025 : 0);
		dummy.rotation.set((random() - 0.5) * 0.035, (random() - 0.5) * 0.045, (random() - 0.5) * 0.035);
		dummy.scale.set(Math.max(0.01, block.w - 0.025 - random() * 0.025), block.h - 0.025 - random() * 0.025, depth);
		if (tight) {
			dummy.position.set(block.x, block.y, -.025);
			dummy.rotation.set(0, 0, 0);
			dummy.scale.set(block.w, block.h, .065);
		}
		if (jointed) {
			dummy.position.set(block.x+(random()-.5)*.005,block.y+(random()-.5)*.005,-.025+(random()-.5)*.009);
			dummy.rotation.set((random()-.5)*.009,(random()-.5)*.009,(random()-.5)*.008);
			dummy.scale.set(Math.max(.01,block.w-.055),Math.max(.01,block.h-.055),.11+random()*.012);
		}
		dummy.updateMatrix();
		stones.setMatrixAt(index, dummy.matrix);
		const shade = 0.62 + random() * 0.36;
		stones.setColorAt(index, new THREE.Color().setRGB(shade, shade * (0.94 + random() * 0.06), shade * (0.85 + random() * 0.1)));
	});
	stones.userData.draggableSlabs = slabs && rotationX < 0;
	stones.userData.floorSurface = rotationX < 0;
	stones.castShadow = !slabs || jointed;
	stones.receiveShadow = true;
	stones.computeBoundingSphere();
	group.add(stones);
	scene.add(group);
	return stones;
}
