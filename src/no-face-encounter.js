import { spawnWallFragments } from './wall-fragments.js';
import { wallBricksSound } from './falling-bricks-sound.js';
import * as THREE from 'three';
import { detailArachnidNoFace } from './arachnid-no-face.js';

// Local XY is the wall surface; local +Z faces into the room.
export function createNoFaceEncounter(scene, prisoner, { direction = 1, openWall = true, delay = 0, entrance = 'right', arachnid = false } = {}) {
	const wall = new THREE.Group();
	wall.name = direction > 0 ? 'Sin Cara recorriendo hacia la derecha' : 'Sin Cara recorriendo hacia la izquierda';
	wall.userData.spellTarget = 'no-face';wall.userData.arachnid=arachnid;
 const overhead=entrance==='door',wallTag=overhead?'door-overhead':'right-wall';
	wall.position.x = 9.68;
	wall.rotation.y = -Math.PI / 2;
	wall.visible = false;
	scene.add(wall);
	const creature = new THREE.Group();
	wall.add(creature);
	const ink = new THREE.MeshStandardMaterial({ color: 0x09080e, roughness: .88 });
	const ivory = new THREE.MeshStandardMaterial({ color: 0xf2ead7, roughness: .65, emissive: 0x777064, emissiveIntensity: .24 });
	const violet = new THREE.MeshStandardMaterial({ color: 0x69517d, roughness: .9 });
	const sphere = new THREE.SphereGeometry(1, 24, 18);
	function oval(parent, material, x, y, z, sx, sy, sz) {
		const mesh = new THREE.Mesh(sphere, material);
		mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz);
		mesh.castShadow = true; parent.add(mesh); return mesh;
	}
	const cloak = oval(creature, ink, 0, arachnid?.02:-.15, .28, arachnid?.34:.48, arachnid?.43:.85, .3);
	const face = new THREE.Group(); face.position.set(0, .35, .55); creature.add(face);
	oval(face, ivory, 0, 0, 0, .3, .43, .1);
	for (const side of [-1, 1]) {
		oval(face, ink, side * .115, .065, .095, .048, .025, .012);
		oval(face, violet, side * .13, .19, .087, .028, .07, .012);
		oval(face, violet, side * .13, -.075, .095, .024, .075, .012);
	}
	oval(face, ink, 0, -.22, .086, .072, .026, .012);
	const detail=arachnid?detailArachnidNoFace(creature,cloak,face,ink):null;
	const limbs = [];
	const bone = new THREE.CylinderGeometry(arachnid?.55:1, 1, 1, arachnid?16:8);
	const up = new THREE.Vector3(0, 1, 0), delta = new THREE.Vector3();
	for (const side of [-1, 1]) for (let i = 0; i < 4; i++) {
		const segments = (arachnid?[0,1,2]:[0,1]).map(() => { const mesh = new THREE.Mesh(bone, ink); mesh.castShadow = true; creature.add(mesh);detail?.decorateLeg(mesh); return mesh; });
		const joint = oval(creature, ink, 0, 0, 0, .065, .065, .065);
		const ankleJoint=arachnid?oval(creature,detail.shell,0,0,0,.035,.035,.035):null;
		limbs.push({ side, i, segments, joint,ankleJoint });
	}
	function segment(mesh, a, b, radius) {
		delta.copy(b).sub(a); mesh.position.copy(a).add(b).multiplyScalar(.5);
		mesh.quaternion.setFromUnitVectors(up, delta.clone().normalize());
		mesh.scale.set(radius, delta.length(), radius);
	}
	let age = 0, triggered = false, origin = 0, height = 0;
	let wallRoute;
	let hits = 0, targeted = false, defeated = false;
	const debris = [];
	function breakWall() {
  wallBricksSound.play(); spawnWallFragments(scene,new THREE.Vector3(overhead?origin:9.8,height,overhead?-9.8:origin));
		const matrix = new THREE.Matrix4(), worldMatrix = new THREE.Matrix4();
		const position = new THREE.Vector3(), rotation = new THREE.Quaternion(), scale = new THREE.Vector3();
		scene.updateMatrixWorld(true);
		scene.traverse(stones => {
			if (!stones.isInstancedMesh || stones.userData.spellTarget !== wallTag) return;
			for (let i = 0; i < stones.count; i++) {
				stones.getMatrixAt(i, matrix);
				worldMatrix.multiplyMatrices(stones.matrixWorld, matrix).decompose(position, rotation, scale);
				const horizontal = ((overhead?position.x:position.z) - origin) / (overhead?1.3:1.45), vertical = (position.y - height) / (overhead?1.05:1.55);
				if (horizontal * horizontal + vertical * vertical > 1 || scale.lengthSq() < .001) continue;
				const material = stones.material.clone();
				if (stones.instanceColor) { const color = new THREE.Color(); stones.getColorAt(i, color); material.color.multiply(color); }
				const block = new THREE.Mesh(stones.geometry, material);
				block.position.copy(position); block.quaternion.copy(rotation); block.scale.copy(scale);
				block.castShadow = block.receiveShadow = true;
				debris.push({ block, velocity: new THREE.Vector3(overhead?(Math.random()-.5)*3:-2-Math.random()*2,.5+Math.random()*2,overhead?2+Math.random()*2:(Math.random()-.5)*3), age: 0, settled: false });
				matrix.scale(new THREE.Vector3(0, 0, 0)); stones.setMatrixAt(i, matrix);
			}
			stones.instanceMatrix.needsUpdate = true; stones.computeBoundingBox(); stones.computeBoundingSphere();
		});
		for (const piece of debris) scene.add(piece.block);
		const outline = new THREE.Shape();
		for (let i = 0; i < 20; i++) {
			const angle = i / 20 * Math.PI * 2, radius = i % 2 ? .9 : 1;
			const x = Math.cos(angle) * (overhead?1.3:1.48) * radius, y = Math.sin(angle) * (overhead?1.05:1.58) * radius;
			if (i === 0) outline.moveTo(x, y); else outline.lineTo(x, y);
		}
		outline.closePath();
		const hole = new THREE.Mesh(new THREE.ShapeGeometry(outline), new THREE.MeshBasicMaterial({ color: 0x020103, fog: false, toneMapped: false }));
		hole.name = 'Agujero de salida de Sin Cara'; hole.userData.spellTarget = wallTag;
		if(overhead){hole.position.set(origin,height,-9.97);}else{hole.position.set(9.97, height, origin);hole.rotation.y=-Math.PI/2;} scene.add(hole);
	}
	const clouds = [];
	const smokeGeometry = new THREE.IcosahedronGeometry(1, 1);
	function emitSmoke() {
		const cloud = new THREE.Group(); cloud.name = 'Humo de Sin Cara';
		cloud.position.copy(wall.position);
		const material = new THREE.MeshBasicMaterial({ color: 0x99949f, transparent: true, opacity: .7, depthWrite: false });
		for (let i = 0; i < 24; i++) {
			const puff = new THREE.Mesh(smokeGeometry, material);
			puff.position.set((Math.random() - .5) * .9, Math.random() * .7, (Math.random() - .5) * .9);
			puff.scale.setScalar(.15 + Math.random() * .18);
			puff.userData.velocity = new THREE.Vector3((Math.random() - .5) * .7, .65 + Math.random() * .6, (Math.random() - .5) * .7);
			puff.raycast = () => {};
			cloud.add(puff);
		}
		scene.add(cloud); clouds.push({ cloud, material, age: 0 });
	}
	const wallRotation = new THREE.Quaternion();
	const floorRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
	const inward = new THREE.Vector3(), tangent = new THREE.Vector3();
	const orientation = new THREE.Matrix4();
	const crawlDuration = 12, descentDuration = .8, landingDuration = .25;
	function spawn(point) {
		if (triggered) return;
		triggered = true; wall.visible = true;
		age = -delay; creature.visible = false;
		origin = THREE.MathUtils.clamp(overhead?point.x:point.z, overhead?-.15:-7.6,overhead?.15:7.6);
		height = THREE.MathUtils.clamp(point.y,overhead?4.4:1.45,overhead?4.8:4.5);
		if (openWall) breakWall();
		// Round the corners inside the room while crossing all four walls.
		wallRoute = new THREE.CatmullRomCurve3([
			new THREE.Vector3(9.68, height, origin),
			new THREE.Vector3(9.68, 3.5, 7.3), new THREE.Vector3(7.3, 4, 9.68),
			new THREE.Vector3(-7.3, 3.4, 9.68), new THREE.Vector3(-9.68, 3, 7.3),
			new THREE.Vector3(-9.68, 4, -7.3), new THREE.Vector3(-7.3, 3.5, -9.68),
			new THREE.Vector3(7.3, 3, -9.68), new THREE.Vector3(9.68, 3.5, -7.3),
			new THREE.Vector3(9.68, height, origin),
		], false, 'centripetal');
		if(overhead)wallRoute=new THREE.CatmullRomCurve3([
   new THREE.Vector3(origin,height,-9.68),new THREE.Vector3(7.3,4,-9.68),new THREE.Vector3(9.68,3.5,-7.3),new THREE.Vector3(9.68,4,7.3),new THREE.Vector3(7.3,3.4,9.68),new THREE.Vector3(-7.3,3.8,9.68),new THREE.Vector3(-9.68,3.4,7.3),new THREE.Vector3(-9.68,4,-7.3),new THREE.Vector3(-7.3,3.5,-9.68),new THREE.Vector3(origin,height,-9.68)
  ],false,'centripetal');
  if (direction < 0) wallRoute.points.reverse();
		update(0);
	}
	function update(dt) {
		for (const piece of debris) {
			if (piece.settled) continue;
			piece.age += dt; piece.velocity.y -= 9.8 * dt;
			piece.block.position.addScaledVector(piece.velocity, dt);
			piece.block.rotation.x += dt * 2; piece.block.rotation.z += dt;
			const floor = Math.max(.15, piece.block.scale.y * .5);
			if (piece.block.position.y < floor) {
				piece.block.position.y = floor; piece.velocity.multiplyScalar(.3); piece.velocity.y = Math.abs(piece.velocity.y);
				if (piece.velocity.length() < .6 || piece.age > 3) piece.settled = true;
			}
		}
		for (let i = clouds.length - 1; i >= 0; i--) {
			const puff = clouds[i]; puff.age += dt;
			puff.material.opacity = .7 * Math.max(0, 1 - puff.age / 1.5);
			for (const mesh of puff.cloud.children) { mesh.position.addScaledVector(mesh.userData.velocity, dt); mesh.scale.multiplyScalar(Math.exp(dt * .7)); }
			if (puff.age >= 1.5) { scene.remove(puff.cloud); puff.material.dispose(); clouds.splice(i, 1); }
		}
		if (!triggered || defeated || targeted) return;
		age += dt;
		if (age < 0) return;
		const appear = THREE.MathUtils.smoothstep(age, .3, 1.4);
		wall.scale.setScalar(1);
		creature.visible = age >= .3;
		const crawlTime = Math.max(0, age - 1.4);
		const descent = THREE.MathUtils.clamp((crawlTime - crawlDuration) / descentDuration, 0, 1);
		const landing = THREE.MathUtils.smoothstep(crawlTime, crawlDuration + descentDuration, crawlDuration + descentDuration + landingDuration);
		const hopping = crawlTime >= crawlDuration + descentDuration + landingDuration;
		if (crawlTime < crawlDuration) {
			const progress = crawlTime / crawlDuration;
			wall.position.copy(wallRoute.getPointAt(progress));
			wall.position.x = THREE.MathUtils.clamp(wall.position.x, -9.68, 9.68);
			wall.position.z = THREE.MathUtils.clamp(wall.position.z, -9.68, 9.68);
			tangent.copy(wallRoute.getTangentAt(progress)); tangent.y = 0; tangent.normalize();
			tangent.multiplyScalar(direction);
			inward.set(-tangent.z, 0, tangent.x);
			orientation.makeBasis(tangent, up, inward);
			wall.quaternion.setFromRotationMatrix(orientation);
			if (age < 1.4) {
				if(overhead){wall.position.set(origin,height,THREE.MathUtils.lerp(-10.65,-9.68,appear));wall.rotation.set(0,0,0);}else{wall.position.set(THREE.MathUtils.lerp(10.65,9.68,appear),height,origin);wall.rotation.set(0,-Math.PI/2,0);}
			}
		} else if (!hopping) {
			// Accelerate downward like a fall rather than climbing down.
			if(overhead)wall.position.set(origin,THREE.MathUtils.lerp(height,.32,descent*descent),THREE.MathUtils.lerp(-9.68,-8.2,landing));else wall.position.set(THREE.MathUtils.lerp(9.68,8.2,landing),THREE.MathUtils.lerp(height,.32,descent*descent),origin);
			wallRotation.setFromAxisAngle(up,overhead?0:-Math.PI/2);
			wall.quaternion.copy(wallRotation).slerp(floorRotation, landing);
		}
		let hop = 0;
		if (hopping) {
			const hopTime = crawlTime - crawlDuration - descentDuration - landingDuration;
			// Approach opposite sides of the prisoner instead of overlapping.
			tangent.copy(prisoner.position);
			tangent.x += direction * 1.25;
			tangent.sub(wall.position); tangent.y = 0;
			const distance = tangent.length();
			if (distance > .001) {
				tangent.divideScalar(distance);
				wall.position.addScaledVector(tangent, Math.min(6.8 * dt, Math.max(0, distance - 1.15)));
				inward.crossVectors(tangent, up).normalize();
				orientation.makeBasis(inward, tangent, up);
				wall.quaternion.setFromRotationMatrix(orientation);
			}
			hop = distance > 1.2 ? Math.sin((hopTime % .48) / .48 * Math.PI) : 0;
			wall.position.y = .32 + hop * .95;
		}
		creature.rotation.z = hopping ? 0 : -.18 * Math.sin(age * .6);
		creature.scale.set(1 + hop * .08, 1 - hop * .12, 1 + hop * .12);
		cloak.scale.z = .3 + Math.sin(age * 3) * .025;
		face.rotation.z = Math.sin(age * .8) * .07;
		for (const { side, i, segments, joint,ankleJoint } of limbs) {
			const phase = age * 12 + i * Math.PI / 2 + (side > 0 ? Math.PI : 0);
			const lift = hopping ? hop : Math.max(0, Math.sin(phase));
			const shoulder = new THREE.Vector3(side * .3, .45 - i * .32, .25);
			const knee = new THREE.Vector3(side * (.85 + lift * .12), .9 - i * .57 + Math.cos(phase) * .12, .45 + lift * .12);
			const foot = new THREE.Vector3(side * (1.15 - Math.abs(i - 1.5) * .08), 1.1 - i * .73 + Math.cos(phase) * .25, -.12 + lift * .22);
			segment(segments[0], shoulder, knee, .047);
			if(arachnid){const ankle=knee.clone().lerp(foot,.63);ankle.z+=.11;segment(segments[1],knee,ankle,.034);segment(segments[2],ankle,foot,.019);ankleJoint.position.copy(ankle);}else segment(segments[1],knee,foot,.033);
			joint.position.copy(knee);
		}
	}
	function target(root) {
		if (root !== wall || !wall.visible || !creature.visible || defeated || targeted) return false;
		targeted = true; return true;
	}
	function release(root) { if (root === wall) targeted = false; }
	function defeat(root) {
		if (root !== wall || defeated || !wall.visible) return;
		targeted = false; hits++; emitSmoke();
		if (hits >= 2) { defeated = true; wall.visible = false; }
	}
	function crush(root) {
		if (root !== wall || defeated) return;
		defeated = true; targeted = false; hits = 2; wall.visible = false;
	}
	return { spawn, update, target, release, defeat, crush, root: wall, get hits() { return hits; }, get triggered() { return triggered; } };
}
