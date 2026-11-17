import { publicAssetBase } from './public-asset-base.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createMedievalWalk } from './medieval-walk.js';
import { createMedievalCastPose } from './medieval-cast-pose.js';
import { createAnatomicalElbows } from './anatomical-elbows.js';
import { createTwoHandBroom } from './two-hand-broom.js';
import { createSleepingPose } from './prisoner-sleep.js';

export async function installMedievalPrisonerAppearance(person, fallback) {
	const base = publicAssetBase;
	const loader = new GLTFLoader();
	// This older asset stores its albedo in the retired specular/glossiness extension.
	// Translate it before parsing so current Three.js retains the photographed texture.
	loader.register(parser => ({
		name: 'MedievalMaterialCompatibility',
		beforeRoot() {
			for (const material of parser.json.materials ?? []) {
				const legacy = material.extensions?.KHR_materials_pbrSpecularGlossiness;
				if (!legacy) continue;
				material.pbrMetallicRoughness = {
					baseColorFactor: legacy.diffuseFactor ?? [1, 1, 1, 1],
					baseColorTexture: legacy.diffuseTexture,
					metallicFactor: 0,
					roughnessFactor: .85,
				};
			}
		},
	}));
	const gltf = await loader.loadAsync(`${base}models/prisoner/medieval_young_male_01_v1.1_2018.glb`);
	const model = gltf.scene;
	model.name = 'Prisionero medieval';
	model.traverse(object => {
		if (!object.isMesh) return;
		object.castShadow = object.receiveShadow = true;
		object.frustumCulled = false;
		object.layers.set(0);
	});
	const skinnedMeshes = [];
	model.traverse(object => { if (object.isSkinnedMesh) skinnedMeshes.push(object); });
	if (skinnedMeshes.length) {
		const bounds = new THREE.Box3().setFromObject(model);
		const size = bounds.getSize(new THREE.Vector3());
		const center = bounds.getCenter(new THREE.Vector3());
		model.scale.setScalar(1.78 / (size.y || 1));
		model.position.set(-center.x * model.scale.x, -bounds.min.y * model.scale.y, -center.z * model.scale.z);
		const firstPerson = person.userData.headParts?.some(part => part.layers.mask === 2);
		person.traverse(object => { if (object.isMesh) object.layers.set(2); });
		for (const name of ['Varita mágica del prisionero', 'Escoba mágica del prisionero']) {
			person.getObjectByName(name)?.traverse(object => { if (object.isMesh) object.layers.set(0); });
		}
		person.add(model);
		person.updateWorldMatrix(true, true);
		// Separate only the head for first-person rendering and encounter effects.
		const headParts = [];
		const vertex = new THREE.Vector3();
		const inversePerson = person.matrixWorld.clone().invert();
		for (const mesh of skinnedMeshes) {
			const geometry = mesh.geometry, index = geometry.index;
			const head = [], body = [];
			const transform = inversePerson.clone().multiply(mesh.matrixWorld);
			for (let i = 0; i < (index?.count ?? geometry.attributes.position.count); i += 3) {
				const ids = [0, 1, 2].map(offset => index ? index.getX(i + offset) : i + offset);
				const isHead = ids.every(id => {
					mesh.getVertexPosition(id, vertex).applyMatrix4(transform);
					return vertex.y > 1.5;
				});
				(isHead ? head : body).push(...ids);
			}
			const headGeometry = geometry.clone(); headGeometry.setIndex(head);
			const headMesh = mesh.clone(); headMesh.geometry = headGeometry;
			headMesh.name = 'medieval-head'; headMesh.layers.set(firstPerson ? 1 : 0);
			mesh.parent.add(headMesh); headParts.push(headMesh);
			mesh.geometry = geometry.clone(); mesh.geometry.setIndex(body);
			geometry.dispose();
		}

		const bones = new Map();
		model.traverse(object => { if (object.isBone) bones.set(object.name, object); });
		const castingHand = bones.get('handR_48');
		if (castingHand) {
			const origin = new THREE.Object3D();
			origin.name = 'spell-origin';
			// Place the emitter inside the palm, using the rig's own scale and axes.
			const palms = castingHand.children.filter(child => child.isBone && child.name.startsWith('palm'));
			for (const palm of palms) origin.position.add(palm.position);
			if (palms.length) origin.position.multiplyScalar(.6 / palms.length);
			castingHand.add(origin);
		}
		const controls = {
			torso: person.getObjectByName('prisoner-torso'),
			arms: [person.getObjectByName('casting-arm'), person.getObjectByName('left-arm')],
			elbows: [person.getObjectByName('casting-elbow'), person.getObjectByName('left-elbow')],
			wrists: [person.getObjectByName('casting-wrist'), person.getObjectByName('left-wrist')],
			legs: person.userData.walkingLegs ?? [],
		};
		const mappings = [];
		function mapBone(name, control) {
			const bone = bones.get(THREE.PropertyBinding.sanitizeNodeName(name));
			if (!bone || !control) return;
			mappings.push({ bone, control, relative: control.matrixWorld.clone().invert().multiply(bone.matrixWorld) });
		}
		for (const name of ['hips_62', 'spine_53', 'chest_52', 'neck_5', 'head_4']) mapBone(name, controls.torso);
		for (const [side, index] of [['R', 0], ['L', 1]]) {
			mapBone(`shoulder.${side}_${side === 'R' ? 51 : 28}`, controls.arms[index]);
			mapBone(`upper_arm.${side}_${side === 'R' ? 50 : 27}`, controls.arms[index]);
			mapBone(`forearm.${side}_${side === 'R' ? 49 : 26}`, controls.elbows[index]);
			mapBone(`hand.${side}_${side === 'R' ? 48 : 25}`, controls.wrists[index]);
			const legControl = controls.legs[index];
			for (const [segment, suffix] of [['thigh', side === 'R' ? 61 : 57], ['shin', side === 'R' ? 60 : 56], ['foot', side === 'R' ? 59 : 55], ['toe', side === 'R' ? 58 : 54]]) mapBone(`${segment}.${side}_${suffix}`, legControl);
		}
		mappings.sort((a, b) => {
			const depth = bone => { let value = 0; while (bone.parent) { value++; bone = bone.parent; } return value; };
			return depth(a.bone) - depth(b.bone);
		});
		const desired = new THREE.Matrix4();
		const updateWalk = createMedievalWalk(person, bones);
		const castingPose = createMedievalCastPose(person, bones);
		const updateElbows = createAnatomicalElbows(person, bones);
		const updateBroomGrip = createTwoHandBroom(person, bones);
		const updateFace = person.userData.updateAppearance;
		const updateSleep = createSleepingPose(person, bones);
		const restBones = [...bones.values()].map(bone => ({ bone, position: bone.position.clone(), quaternion: bone.quaternion.clone(), scale: bone.scale.clone() }));
		person.userData.headParts.push(...headParts);
		person.userData.updateAppearance = dt => {
			castingPose.restore();
			updateFace?.(dt);
			// Start from one coherent skeleton. Retargeting every joint in world
			// space while its parent still carries yesterday's IK pose stretches
			// the links during the seated-to-standing transition.
			for (const rest of restBones) {
				rest.bone.position.copy(rest.position);
				rest.bone.quaternion.copy(rest.quaternion);
				rest.bone.scale.copy(rest.scale);
			}
			person.updateWorldMatrix(true, true);
			if (person.userData.sleeping || person.userData.wakingUp && !person.userData.introWalking) { updateSleep(dt); return; }
			for (const { bone, control, relative } of mappings) {
				desired.multiplyMatrices(control.matrixWorld, relative);
				desired.premultiply(bone.parent.matrixWorld.clone().invert());
				desired.decompose(bone.position, bone.quaternion, bone.scale);
				bone.updateWorldMatrix(false, false);
			}
			updateWalk();
			castingPose.apply(dt);
			updateElbows(updateBroomGrip());
			if (person.userData.broomImpactPending) {
				const impact = person.userData.broomImpactPending;
				person.userData.broomImpactPending = null;
				impact();
			}
		};
		person.userData.castWand = point => {
			castingPose.cast(point);
			person.userData.updateAppearance(0);
		};
		if (fallback) {
			fallback.parent?.remove(fallback);
			fallback.traverse(object => {
				if (object.isMesh) { object.geometry.dispose(); if (Array.isArray(object.material)) object.material.forEach(material => material.dispose()); else object.material.dispose(); }
			});
		}
		person.userData.medievalWarriorModel = model;
		person.userData.realisticReady = true;
		return model;
	}
	const bounds = new THREE.Box3().setFromObject(model);
	const size = bounds.getSize(new THREE.Vector3());
	const center = bounds.getCenter(new THREE.Vector3());
	const height = size.y || 1;
	model.scale.setScalar(1.78 / height);
	const armRadius = size.x * model.scale.x * .5;
	model.position.set(-center.x * model.scale.x, -bounds.min.y * model.scale.y, -center.z * model.scale.z);
	person.traverse(object => {
		if (object.isMesh) object.visible = false;
	});
	person.add(model);
	model.updateWorldMatrix(true, true);
	const importedRoots = [...model.children];
	const mesh = [];
	model.traverse(object => { if (object.isMesh) mesh.push(object); });
	const controls = {
		torso: person.getObjectByName('prisoner-torso'),
		arms: [person.getObjectByName('casting-arm'), person.getObjectByName('left-arm')],
		elbows: [person.getObjectByName('casting-elbow'), person.getObjectByName('left-elbow')],
		wrists: [person.getObjectByName('casting-wrist'), person.getObjectByName('left-wrist')],
		legs: person.userData.walkingLegs ?? [],
	};
	const initialRightArmPose = [controls.arms[0], controls.elbows[0], controls.wrists[0]].map(joint => joint.quaternion.clone());
	person.updateWorldMatrix(true, true);
	model.updateWorldMatrix(true, true);
	const elbowMaskCenter = model.worldToLocal(controls.elbows[0].getWorldPosition(new THREE.Vector3()));
	const elbowMaskRadiusSq = 0.095 * 0.095;
	const bins = new Map(['torso', 'head', 'rightUpper', 'rightLower', 'rightHand', 'leftUpper', 'leftLower', 'leftHand', 'rightLeg', 'leftLeg'].map(name => [name, []]));
	const inverseRoot = model.matrixWorld.clone().invert();
	for (const source of mesh) {
		const geometry = source.geometry.clone();
		geometry.applyMatrix4(inverseRoot.multiply(source.matrixWorld));
		inverseRoot.copy(model.matrixWorld).invert();
		const position = geometry.getAttribute('position');
		const index = geometry.index;
		const groups = new Map([...bins.keys()].map(name => [name, []]));
		for (let i = 0; i < index.count; i += 3) {
			const a = new THREE.Vector3().fromBufferAttribute(position, index.getX(i));
			const b = new THREE.Vector3().fromBufferAttribute(position, index.getX(i + 1));
			const c = new THREE.Vector3().fromBufferAttribute(position, index.getX(i + 2));
			const p = a.add(b).add(c).multiplyScalar(1 / 3);
			// Remove the source mesh around the right elbow; its original hand-like sleeve detail
			// overlaps the rebuilt arm and reads as a second hand in the joint.
			if (p.distanceToSquared(elbowMaskCenter) < elbowMaskRadiusSq) continue;
			const pose = p.clone().multiply(model.scale).add(model.position);
			let part = 'torso';
			if (pose.y > 1.5 && Math.abs(pose.x) < armRadius * .6) part = 'head';
			else if (pose.y < .79 && Math.abs(pose.x) < armRadius * .7) part = pose.x < 0 ? 'rightLeg' : 'leftLeg';
			else if (Math.abs(pose.x) > armRadius * .34 && pose.y > .82 && pose.y < 1.57) {
				const side = pose.x < 0 ? 'right' : 'left', reach = Math.abs(pose.x);
				part = `${side}${reach > armRadius * .83 ? 'Hand' : reach > armRadius * .59 ? 'Lower' : 'Upper'}`;
			}
			groups.get(part).push(index.getX(i), index.getX(i + 1), index.getX(i + 2));
		}
		for (const [name, indices] of groups) {
			if (!indices.length) continue;
			const piece = new THREE.BufferGeometry();
			const remap = new Map(), compactIndices = [];
			const attributes = Object.entries(geometry.attributes);
			const compact = new Map(attributes.map(([attribute]) => [attribute, []]));
			for (const oldIndex of indices) {
				let newIndex = remap.get(oldIndex);
				if (newIndex === undefined) {
					newIndex = remap.size; remap.set(oldIndex, newIndex);
					for (const [attribute, data] of attributes) {
						for (let k = 0; k < data.itemSize; k++) compact.get(attribute).push(data.array[oldIndex * data.itemSize + k]);
					}
				}
				compactIndices.push(newIndex);
			}
			for (const [attribute, data] of attributes) piece.setAttribute(attribute, new THREE.BufferAttribute(new data.array.constructor(compact.get(attribute)), data.itemSize, data.normalized));
			piece.setIndex(compactIndices);
			piece.computeBoundingSphere();
			const fragment = new THREE.Mesh(piece, source.material);
			fragment.name = `medieval-${name}`;
			fragment.castShadow = fragment.receiveShadow = true;
			fragment.frustumCulled = false;
			bins.get(name).push(fragment);
		}
		geometry.dispose();
	}
	model.remove(...importedRoots);
	for (const fragments of bins.values()) model.add(...fragments);
	model.updateWorldMatrix(true, true);
	function attach(name, control) {
		for (const fragment of bins.get(name)) control.attach(fragment);
	}
	// Bind the imported mesh in its neutral source pose, then apply the folded
	// starting pose so the arm does not appear pre-bent in the bind position.
	controls.arms[0].quaternion.identity();
	controls.elbows[0].quaternion.identity();
	controls.wrists[0].quaternion.identity();
	attach('torso', controls.torso);
	attach('head', controls.torso);
	person.userData.headParts = bins.get('head');
	for (const [side, i] of [['right', 0], ['left', 1]]) {
		attach(`${side}Upper`, controls.arms[i]);
		attach(`${side}Lower`, controls.elbows[i]);
		attach(`${side}Hand`, controls.wrists[i]);
		attach(`${side}Leg`, controls.legs[i]);
	}
	[controls.arms[0], controls.elbows[0], controls.wrists[0]].forEach((joint, i) => joint.quaternion.copy(initialRightArmPose[i]));
	// Rebuild the right arm around the retargeted shoulder, elbow and wrist.
	// The source model has no skeleton, so its x-sliced arm pieces cannot bend
	// cleanly at these pivots.
	for (const name of ['rightUpper', 'rightLower', 'rightHand']) {
		for (const fragment of bins.get(name)) {
			model.remove(fragment);
			fragment.geometry.dispose();
		}
	}
	const sleeve = new THREE.MeshStandardMaterial({color:0x426363,roughness:.92});
	const leather = new THREE.MeshStandardMaterial({color:0x814d37,roughness:.94});
	const skin = new THREE.MeshStandardMaterial({color:0xb9785b,roughness:.95});
	function armSegment(parent, start, end, startRadius, endRadius, material, name) {
		const axis = end.clone().sub(start), length = axis.length();
		const mesh = new THREE.Mesh(new THREE.CylinderGeometry(endRadius,startRadius,length,12,1),material);
		mesh.name=name;mesh.position.copy(start).add(end).multiplyScalar(.5);
		mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),axis.normalize());
		mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
	}
	function ellipsoid(parent, position, scale, material, name) {
		const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),material);
		mesh.name=name;mesh.position.copy(position);mesh.scale.copy(scale);
		mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
	}
	const zero=new THREE.Vector3();
	armSegment(controls.arms[0],zero,controls.elbows[0].position,.075,.062,leather,'Manga superior reconstruida');
	ellipsoid(controls.arms[0],zero,new THREE.Vector3(.084,.09,.078),leather,'Refuerzo del hombro derecho');
	armSegment(controls.elbows[0],zero,controls.wrists[0].position,.058,.043,sleeve,'Antebrazo derecho reconstruido');
	ellipsoid(controls.wrists[0],zero,new THREE.Vector3(.048,.055,.044),skin,'Palma de la mano derecha');
	for(let i=0;i<4;i++){
		const y=.038-i*.021,x=-.027+i*.018;
		const curve=new THREE.CatmullRomCurve3([
			new THREE.Vector3(x-.012,y-.012,-.018),
			new THREE.Vector3(x-.008,y-.025,-.043),
			new THREE.Vector3(x+.008,y-.025,-.043),
			new THREE.Vector3(x+.012,y-.012,-.018),
		]);
		const finger=new THREE.Mesh(new THREE.TubeGeometry(curve,10,.008,7,false),skin);
		finger.name=`Dedo ${i+1} cerrando el agarre`;finger.castShadow=finger.receiveShadow=true;controls.wrists[0].add(finger);
	}
	const thumbCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(.045,-.025,-.005),new THREE.Vector3(.031,-.005,-.04),new THREE.Vector3(.008,.018,-.043)]);
	const thumb=new THREE.Mesh(new THREE.TubeGeometry(thumbCurve,10,.011,8,false),skin);
	thumb.name='Pulgar derecho';thumb.castShadow=thumb.receiveShadow=true;controls.wrists[0].add(thumb);
	if (fallback) {
		fallback.parent?.remove(fallback);
		fallback.traverse(object => {
			if (object.isMesh) { object.geometry.dispose(); if (Array.isArray(object.material)) object.material.forEach(material => material.dispose()); else object.material.dispose(); }
		});
	}
	person.userData.medievalWarriorModel = model;
	person.userData.realisticReady = true;
	return model;
}
