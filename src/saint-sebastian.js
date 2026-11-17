import * as THREE from 'three';
import { installSebastianAnatomy } from './sebastian-anatomy.js';

export function addSaintSebastian(parent) {
	parent.name = 'Estatua de San Sebastian con flechas';
	const size = 128, pixels = new Uint8Array(size * size * 4);
	let seed = 823;
	for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
		seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
		const vein = Math.sin(x * .09 + Math.sin(y * .065) * 2);
		const value = 170 + vein * 16 + (seed >>> 24) * .12;
		pixels.set([value, value, value, 255], (y * size + x) * 4);
	}
	const relief = new THREE.DataTexture(pixels, size, size); relief.needsUpdate = true;
	relief.wrapS = relief.wrapT = THREE.RepeatWrapping; relief.magFilter = relief.minFilter = THREE.LinearFilter;
	const marble = new THREE.MeshStandardMaterial({ color: 0xc9baa0, roughness: .62, bumpMap: relief, bumpScale: .007 });
	const recess = new THREE.MeshStandardMaterial({ color: 0x776958, roughness: .85 });
	const hair = new THREE.MeshStandardMaterial({ color: 0x8b7960, roughness: .8, bumpMap: relief, bumpScale: .012 });
	const cloth = new THREE.MeshStandardMaterial({ color: 0xe0d5bd, roughness: .87, side: THREE.DoubleSide });
	const timber = new THREE.MeshStandardMaterial({ color: 0x64523d, roughness: .95, bumpMap: relief, bumpScale: .045 });
	const rope = new THREE.MeshStandardMaterial({ color: 0x93816a, roughness: 1 });
	const shaftMaterial = new THREE.MeshStandardMaterial({ color: 0x60432a, roughness: .82 });
	const steel = new THREE.MeshStandardMaterial({ color: 0x68635c, roughness: .45, metalness: .65 });
	const feather = new THREE.MeshStandardMaterial({ color: 0xc6bba5, side: THREE.DoubleSide, roughness: .95 });
	const sphere = new THREE.SphereGeometry(1, 36, 24);
	const restingArms = [], bindings = [], legs = [];
	function mesh(geometry, material, container = parent) { const object = new THREE.Mesh(geometry, material); object.castShadow = object.receiveShadow = true; container.add(object); return object; }
	function oval(material, x, y, z, sx, sy, sz, tilt = 0, container = parent) {
		const object = mesh(sphere, material, container); object.position.set(x, y, z); object.scale.set(sx, sy, sz); object.rotation.z = tilt; return object;
	}
	function rod(a, b, r1, r2, material, container = parent) {
		const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), direction = end.clone().sub(start);
		const object = mesh(new THREE.CylinderGeometry(r2, r1, direction.length(), 20), material, container);
		object.position.copy(start).add(end).multiplyScalar(.5); object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize()); return object;
	}
	// A continuous torso has a narrow waist, a rib cage and broad shoulders.
	const torso = new THREE.LatheGeometry([[.19,.88],[.23,1.01],[.2,1.16],[.235,1.35],[.3,1.53],[.32,1.65],[.22,1.75],[.1,1.82]].map(([r,y])=>new THREE.Vector2(r,y)),48);
	const body = mesh(torso, marble); body.scale.z = .64;
	for (const s of [-1, 1]) {
		oval(marble, s*.145,1.57,.12,.16,.105,.075,s*.07);
		for (let i=0;i<3;i++) oval(marble,s*.071,1.36-i*.115,.123,.072,.068,.035);
		rod([s*.04,1.75,.08],[s*.28,1.68,.055],.025,.035,marble);
		const armStart = parent.children.length;
		oval(marble,s*.32,1.67,0,.12,.135,.12);
		const elbow=[s*.37,1.36,-.22], wrist=[s*.065,1.17,-.43];
		rod([s*.32,1.68,0],elbow,.102,.068,marble);
		oval(marble,s*.35,1.51,-.085,.085,.16,.08,-s*.12);
		oval(marble,...elbow,.068,.075,.07);
		rod(elbow,wrist,.07,.042,marble);
		const hand=oval(marble,s*.06,1.095,-.45,.048,.082,.035,s*.12);hand.name='Mano atada detras de la espalda '+s;
		for(let i=0;i<4;i++)rod([s*.06+(i-1.5)*.018,1.065,-.46],[s*.06+(i-1.5)*.017,1.005,-.47],.012,.009,marble);
		rod([s*.095,1.12,-.435],[s*.112,1.055,-.45],.018,.012,marble);
		const parts = parent.children.slice(armStart), arm = new THREE.Group();
		arm.name = 'Brazo de San Sebastian en reposo '+s; parent.add(arm);
		for (const part of parts) arm.add(part);
		restingArms.push(arm);
		const legStart=parent.children.length;
		const knee=[s*.13,.48,s>0?.06:.15], ankle=[s*.16,.13,s>0?0:.16];
		rod([s*.13,.97,0],knee,.125,.075,marble);
		oval(marble,s*.14,.72,s>0?.075:.13,.1,.23,.09,-s*.06);
		oval(marble,...knee,.075,.08,.08);
		rod(knee,ankle,.072,.043,marble);
		oval(marble,s*.15,.31,s>0?-.015:.14,.063,.15,.065);
		oval(marble,s*.16,.075,s>0?.09:.25,.075,.065,.155);
		for(let i=0;i<4;i++)oval(marble,s*.16+(i-1.5)*.028,.057,(s>0?.21:.37)-i*.008,.018,.025,.034);
		const legParts=parent.children.slice(legStart),leg=new THREE.Group();leg.name='Pierna de piedra de San Sebastian '+s;leg.position.set(s*.13,.97,0);parent.add(leg);parent.updateWorldMatrix(true,true);legParts.forEach(part=>leg.attach(part));legs.push(leg);
	}
	rod([0,1.77,0],[.025,1.97,.01],.095,.085,marble);
	const head=new THREE.Group();head.position.set(.035,2.035,.025);head.rotation.set(-.12, .23, -.17);parent.add(head);
	oval(marble,0,.045,0,.145,.195,.13,0,head);
	oval(marble,0,-.075,.04,.105,.105,.095,0,head);
	oval(marble,0,-.115,.075,.062,.045,.05,0,head);
	oval(marble,0,.015,.124,.027,.055,.035,0,head);
	oval(recess,0,-.067,.131,.047,.006,.005,0,head);
	for(const s of [-1,1]) {
		oval(marble,s*.137,.025,0,.028,.053,.025,0,head);
		oval(recess,s*.054,.043,.118,.036,.007,.006,s*.08,head);
		oval(marble,s*.055,.061,.113,.043,.015,.016,s*.1,head);
		oval(marble,s*.076,-.018,.09,.047,.035,.031,0,head);
	}
	// Locks of carved hair follow the crown and sides, leaving the face clear.
	for(let row=0;row<4;row++)for(let i=0;i<12;i++){
		const angle=i/12*Math.PI*2, y=.18-row*.065;
		if(row>1&&Math.cos(angle)>.25)continue;
		oval(hair,Math.sin(angle)*.132,y,Math.cos(angle)*.112-.015,.036,.052,.035,Math.sin(angle)*.35,head);
	}
	const drape=new THREE.LatheGeometry([[.255,.95],[.265,1.04],[.225,1.18],[.213,1.25]].map(([r,y])=>new THREE.Vector2(r,y)),64);
	const positions=drape.attributes.position;
	for(let i=0;i<positions.count;i++){
		const x=positions.getX(i),z=positions.getZ(i),y=positions.getY(i),angle=Math.atan2(x,z);
		const fold=1+Math.sin(angle*11+y*6)*.055;
		positions.setXYZ(i,x*fold,y+Math.sin(angle*2)*.012,z*fold*.78);
	}
	drape.computeVertexNormals();const loincloth=mesh(drape,cloth);loincloth.name='Taparrabos sujeto a la cintura de San Sebastian';
 const waistband=mesh(new THREE.LatheGeometry([[.215,1.205],[.218,1.225],[.213,1.255]].map(([r,y])=>new THREE.Vector2(r,y)),64),cloth);waistband.scale.z=.78;waistband.name='Banda de sujecion del taparrabos';
	oval(cloth,.21,1.205,.08,.042,.04,.035);
	const hanging=mesh(new THREE.ConeGeometry(.075,.32,24),cloth);hanging.position.set(.2,1.025,.17);hanging.rotation.z=.15;
	// A carved support and wrist bindings identify the martyr's pose.
	rod([0,0,-.23],[0,2.35,-.23],.13,.09,timber);
	for(let i=0;i<4;i++){
		const binding=mesh(new THREE.TorusGeometry(.078,.009,8,32),rope);
		binding.name='Cuerda alrededor de ambas munecas';binding.position.set(0,1.15+i*.014,-.43);
		binding.rotation.x=Math.PI/2;binding.scale.x=1.45;
		bindings.push(binding);
	}
	bindings.push(oval(rope,.075,1.17,-.49,.027,.025,.021));
	bindings.push(rod([.075,1.17,-.49],[.1,.99,-.5],.009,.007,rope));
	const arrows=[];
	for(const [index,entry] of [[-.2,1.51,.17,-.32,.1,.76],[.2,1.29,.16,.4,.16,.73],[-.07,1.12,.15,-.18,-.15,.8],[.14,.72,.15,.35,-.12,.7],[-.34,1.49,-.025,-.3,.22,.68]].entries()){
		const [x,y,z,dx,dy,dz]=entry,arrow=new THREE.Group();arrow.name='Flecha de San Sebastian '+(index+1);parent.add(arrow);arrow.position.set(x,y,z);
		const direction=new THREE.Vector3(dx,dy,dz).normalize();arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),direction);
		rod([0,0,-.035],[0,0,.7],.009,.009,shaftMaterial,arrow);
		const point=mesh(new THREE.ConeGeometry(.024,.09,4),steel,arrow);point.rotation.x=-Math.PI/2;point.position.z=-.015;
		for(let i=0;i<3;i++){
			const fin=mesh(new THREE.PlaneGeometry(.065,.14),feather,arrow);fin.position.z=.59;fin.rotation.x=Math.PI/2;fin.rotation.z=i*Math.PI*2/3;
		}
		arrows.push(arrow);
	}
	parent.updateWorldMatrix(true,true);legs[1].attach(arrows[3]);
 const statue={arrows, restingArms, bindings, material: marble, head, legs};
 const fallback=[];parent.traverse(object=>{if(object.isMesh&&object.material===marble)fallback.push(object);});
 // Include the old face and hair, which use their own stone shades.
 head.traverse(object=>{if(object.isMesh&&!fallback.includes(object))fallback.push(object);});
 statue.appearanceReady=installSebastianAnatomy(parent,statue,fallback).catch(error=>{console.warn('No se pudo cargar la anatomia de San Sebastian:',error);return null;});
 parent.userData.appearanceReady=statue.appearanceReady;
 return statue;
}
