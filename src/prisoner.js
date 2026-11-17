import * as THREE from 'three';
import { createPrisonerMaterials, addPrisonerFace } from './prisoner-appearance.js';
import { installMedievalPrisonerAppearance } from './medieval-warrior-appearance.js';

export function createPrisoner() {
	const person = new THREE.Group();
	person.name = 'Prisionero';
	const {skin,shadedSkin,hair} = createPrisonerMaterials();
	const iron = new THREE.MeshStandardMaterial({ color: 0x45413b, metalness: 0.65, roughness: 0.72 });
	const clothCanvas = document.createElement('canvas');
	clothCanvas.width = clothCanvas.height = 256;
	const ctx = clothCanvas.getContext('2d');
	ctx.fillStyle = '#898985'; ctx.fillRect(0, 0, 256, 256);
	for (let i = 0; i < 256; i += 2) {
		ctx.strokeStyle = i % 4 ? '#747570' : '#9c9c95';
		ctx.lineWidth = 0.5;
		ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 256); ctx.stroke();
		ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(256, i); ctx.stroke();
	}
	for(let i=0;i<1500;i++){
		const x=(i*73)%256,y=(i*113)%256;
		ctx.fillStyle=i%3?'rgba(35,31,24,.08)':'rgba(196,183,153,.12)';ctx.fillRect(x,y,1+i%3,1);
	}
	const weave = new THREE.CanvasTexture(clothCanvas);
	weave.wrapS = weave.wrapT = THREE.RepeatWrapping;
	weave.repeat.set(3, 3);
	weave.colorSpace=THREE.SRGBColorSpace;
	const robe = new THREE.MeshStandardMaterial({ color: 0xa9a599, map:weave, bumpMap: weave, bumpScale: 0.004, roughness: .96, side: THREE.DoubleSide });
	function mesh(geometry, material, x, y, z) {
		const object = new THREE.Mesh(geometry, material);
		object.position.set(x, y, z);
		object.castShadow = object.receiveShadow = true;
		person.add(object);
		return object;
	}
	function ellipsoid(material, x, y, z, sx, sy, sz) {
		const object = mesh(new THREE.SphereGeometry(1, 28, 20), material, x, y, z);
		object.scale.set(sx, sy, sz);
		return object;
	}
	function limb(a, b, radiusA, radiusB, material) {
		const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
		const object = mesh(new THREE.CylinderGeometry(radiusB, radiusA, start.distanceTo(end), 20), material, 0, 0, 0);
		object.position.copy(start).add(end).multiplyScalar(0.5);
		object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize());
		return object;
	}
	const walkingLegs=[];
	// Bare calves, knees and worn leather sandals below a knee-length tunic.
	const leather = new THREE.MeshStandardMaterial({ color: 0x3d3027, roughness: 0.97 });
	for (const side of [-1, 1]) {
		const beforeLeg=new Set(person.children);
		const x = side * 0.115;
		limb([x, 0.1, 0], [x, 0.67, 0], 0.055, 0.083, skin);
		ellipsoid(skin, x, 0.56, 0.028, 0.076, 0.1, 0.072);
		ellipsoid(skin,x,.36,-.02,.064,.155,.072);
		ellipsoid(skin,x,.37,.025,.047,.16,.045);
		ellipsoid(shadedSkin,x+side*.039,.15,.007,.018,.035,.025);
		ellipsoid(skin, x, 0.078, 0.075, 0.073, 0.052, 0.15);
		ellipsoid(leather, x, 0.035, 0.07, 0.08, 0.025, 0.16);
		limb([x - 0.07, 0.095, 0.15], [x + 0.07, 0.095, 0.15], 0.017, 0.017, leather);
		const leg=new THREE.Group();leg.name=side<0?'right-leg':'left-leg';leg.position.set(x,.78,0);person.add(leg);person.updateMatrixWorld(true);
		for(const part of [...person.children])if(part!==leg&&!beforeLeg.has(part))leg.attach(part);
		walkingLegs.push(leg);
	}
	// Continuous fabric surface, with asymmetric hanging folds and a ragged hem.
	const profile = [[0.29, 0.65], [0.285, 0.72], [0.25, 0.88], [0.215, 1.02], [0.23, 1.18], [0.265, 1.35], [0.21, 1.42], [0.095, 1.455]];
	const tunicGeometry = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), 64);
	const vertices = tunicGeometry.attributes.position;
	for (let i = 0; i < vertices.count; i++) {
		const x = vertices.getX(i), y = vertices.getY(i), z = vertices.getZ(i);
		const angle = Math.atan2(x, z);
		const fold = 1 + Math.sin(angle * 13 + y * 2) * 0.038 + Math.cos(angle * 7 - y * 4) * 0.024;
		vertices.setXYZ(i, x * fold, y + (y < 0.73 ? Math.sin(angle * 11) * 0.012 : 0), z * fold * 0.64);
	}
	tunicGeometry.computeVertexNormals();
	mesh(tunicGeometry, robe, 0, 0, 0);
	const rope = new THREE.MeshStandardMaterial({ color: 0x79684b, roughness: 1 });
	const belt = mesh(new THREE.TorusGeometry(0.224, 0.012, 8, 64), rope, 0, 1.025, 0);
	belt.rotation.x = Math.PI / 2; belt.scale.y = 0.65;
	limb([0.045, 1.025, 0.15], [0.065, 0.84, 0.18], 0.009, 0.007, rope);
	limb([0.035, 1.025, 0.15], [0.015, 0.88, 0.17], 0.009, 0.007, rope);

	const rightArm = new THREE.Group();
	rightArm.name = 'casting-arm';
	rightArm.position.set(-0.14, 1.4, -0.045);
	person.add(rightArm);
	const rightElbow = new THREE.Group();
	rightElbow.name = 'casting-elbow';
	rightElbow.position.set(-0.08, -0.22, -0.01);
	rightArm.add(rightElbow);
	const rightWrist = new THREE.Group();
	rightWrist.name = 'casting-wrist';
	rightWrist.position.set(-0.07, -0.13, 0);
	rightElbow.add(rightWrist);
	const leftArm = new THREE.Group();
	leftArm.name = 'left-arm';
	leftArm.position.set(0.14, 1.4, -0.045);
	person.add(leftArm);
	const leftElbow=new THREE.Group();leftElbow.name='left-elbow';leftElbow.position.set(.08,-.22,-.01);leftArm.add(leftElbow);
	const leftWrist=new THREE.Group();leftWrist.name='left-wrist';leftWrist.position.set(.07,-.13,0);leftElbow.add(leftWrist);
	// The figure faces +Z; its anatomical right hand is on the viewer's left.
	for (const side of [-1, 1]) {
		const existingParts = new Set(person.children);
		const shoulder = [side * 0.23, 1.34, 0];
		const elbow = [side * 0.33, 1.12, 0.035];
		const wrist = side < 0 ? [-0.39, 1.13, 0.28] : [0.36, 0.9, 0.08];
		ellipsoid(robe, ...shoulder, 0.105, 0.12, 0.105);
		limb(shoulder, elbow, 0.098, 0.075, robe);
		ellipsoid(skin, ...elbow, 0.065, 0.065, 0.065);
		limb(elbow, wrist, 0.067, 0.043, skin);
		const forearm=new THREE.Vector3(...wrist).sub(new THREE.Vector3(...elbow));
		const muscle=ellipsoid(skin,(elbow[0]+wrist[0])*.5,(elbow[1]+wrist[1])*.5,(elbow[2]+wrist[2])*.5,.055,forearm.length()*.42,.055);
		muscle.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),forearm.normalize());
		const handStart=person.children.filter(part=>!existingParts.has(part)).length;
		ellipsoid(skin, wrist[0], wrist[1] - 0.03, wrist[2] + 0.02, 0.045, 0.065, 0.038);
		for (let finger = 0; finger < 4; finger++) {
			const fx = wrist[0] + (finger - 1.5) * 0.018;
			limb([fx, wrist[1] - 0.035, wrist[2] + 0.04], [fx, wrist[1] - 0.085, wrist[2] + 0.025], 0.009, 0.007, skin);
		}
		ellipsoid(skin, wrist[0] - side * 0.04, wrist[1] - 0.01, wrist[2] + 0.035, 0.018, 0.032, 0.018);
		const cuff = mesh(new THREE.TorusGeometry(0.049, 0.012, 8, 24), iron, wrist[0], wrist[1] + 0.025, wrist[2] - 0.015);
		cuff.rotation.x = Math.PI / 2;
		for (let link = 0; link < 3; link++) {
			const chain = mesh(new THREE.TorusGeometry(0.018, 0.005, 6, 12), iron, wrist[0] + side * 0.045, wrist[1] - link * 0.028, wrist[2] - 0.01);
			chain.rotation.y = link % 2 * Math.PI / 2;
		}
		if (side < 0) {
			person.updateMatrixWorld(true);
			const parts = person.children.filter(part => !existingParts.has(part));
			parts.forEach((part, index) => {
				(index < 2 ? rightArm : index < handStart ? rightElbow : rightWrist).attach(part);
			});
		} else {
			person.updateMatrixWorld(true);
			const parts=person.children.filter(part=>!existingParts.has(part));
			parts.forEach((part,index)=>(index<2?leftArm:index<handStart?leftElbow:leftWrist).attach(part));
		}
	}
	// The prisoner's original magic wand follows the articulated casting hand.
	const wand = new THREE.Group();
	wand.name = 'Varita mágica del prisionero';
	// Retain the spell origin while removing the wand and its light from view.
	wand.visible = false;
	// Keep the handle in the palm; the staff extends forward from the fist.
	wand.position.set(-0.025, 0.005, 0.025);
	rightWrist.add(wand);
	const wandWood = new THREE.MeshStandardMaterial({ color: 0x65452f, roughness: 0.76 });
	const wandGold = new THREE.MeshStandardMaterial({ color: 0xc99a52, metalness: 0.72, roughness: 0.28 });
	const wandShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.014, 0.39, 10), wandWood);
	wandShaft.name = 'Mango de madera de la varita';
	wandShaft.rotation.x = Math.PI / 2;
	wandShaft.position.z = 0.195;
	wandShaft.castShadow = true;
	wand.add(wandShaft);
	for (const z of [0.035, 0.075, 0.36]) {
		const band = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.003, 6, 16), wandGold);
		band.name = 'Aro dorado de la varita';
		band.position.z = z;
		wand.add(band);
	}
	const wandTip = new THREE.Object3D();
	wandTip.name = 'Punta de la varita';
	wandTip.position.z = 0.39;
	wand.add(wandTip);
	const wandGlow = new THREE.PointLight(0x60dfff, 0.45, 0.65);
	wandGlow.position.z = 0.39;
	wand.add(wandGlow);
	const broom = new THREE.Group();
	broom.name = 'Escoba mágica del prisionero';
	broom.position.copy(wand.position);
	broom.visible = false;
	rightWrist.add(broom);
	const woodCanvas=document.createElement('canvas');woodCanvas.width=256;woodCanvas.height=512;
	const woodContext=woodCanvas.getContext('2d');woodContext.fillStyle='#59402b';woodContext.fillRect(0,0,256,512);
	let woodSeed=8127;const woodRandom=()=>{woodSeed=(woodSeed*1664525+1013904223)>>>0;return woodSeed/4294967296;};
	for(let i=0;i<620;i++){
		const x=woodRandom()*256,shade=woodRandom()>.5?'rgba(28,17,10,.18)':'rgba(205,157,101,.10)';
		woodContext.strokeStyle=shade;woodContext.lineWidth=.3+woodRandom()*1.2;woodContext.beginPath();woodContext.moveTo(x,0);woodContext.bezierCurveTo(x+(woodRandom()-.5)*12,150,x+(woodRandom()-.5)*10,350,x+(woodRandom()-.5)*8,512);woodContext.stroke();
	}
	for(const [x,y] of [[68,112],[191,347]]){
		woodContext.strokeStyle='rgba(31,19,11,.52)';woodContext.lineWidth=2;woodContext.beginPath();woodContext.ellipse(x,y,5,17,-.08,0,Math.PI*2);woodContext.stroke();
		woodContext.strokeStyle='rgba(184,136,83,.3)';woodContext.lineWidth=1;woodContext.beginPath();woodContext.ellipse(x,y,2,10,-.08,0,Math.PI*2);woodContext.stroke();
	}
	const woodTexture=new THREE.CanvasTexture(woodCanvas);woodTexture.colorSpace=THREE.SRGBColorSpace;woodTexture.anisotropy=4;
	const broomWood=new THREE.MeshStandardMaterial({color:0xffffff,map:woodTexture,roughness:.86});
	const broomHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.019, 0.78, 16, 8), broomWood);
	broomHandle.name = 'Mango largo de la escoba';
	broomHandle.rotation.x = Math.PI / 2;
	broomHandle.position.z = 0.39;
	broomHandle.castShadow = true;
	broomHandle.receiveShadow = true;
	broom.add(broomHandle);
	const twigPalette=[0x34271f,0x49362a,0x604734,0x795a40,0x927253].map(color=>new THREE.MeshStandardMaterial({color,roughness:1}));
	const twigBuckets=twigPalette.map(()=>({positions:[],indices:[]}));
	let twigSeed=19731;const twigRandom=()=>{twigSeed=(twigSeed*1664525+1013904223)>>>0;return twigSeed/4294967296;};
	function addTwig(bucket,points,radius){
		const curve=new THREE.CatmullRomCurve3(points),segments=7,sides=4,frames=curve.computeFrenetFrames(segments,false),offset=bucket.positions.length/3;
		for(let i=0;i<=segments;i++){
			const t=i/segments,center=curve.getPointAt(t),r=radius*Math.pow(1-t,.82)+.00012;
			for(let side=0;side<sides;side++){
				const angle=side/sides*Math.PI*2;
				const v=center.clone().addScaledVector(frames.normals[i],Math.cos(angle)*r).addScaledVector(frames.binormals[i],Math.sin(angle)*r);
				bucket.positions.push(v.x,v.y,v.z);
			}
		}
		for(let i=0;i<segments;i++)for(let side=0;side<sides;side++){
			const a=offset+i*sides+side,b=offset+i*sides+(side+1)%sides,c=b+sides,d=a+sides;
			bucket.indices.push(a,b,d,b,c,d);
		}
	}
	// A tapered, uneven sheaf of individually curved twigs instead of a solid cone.
	for(let i=0;i<176;i++){
		const angle=twigRandom()*Math.PI*2,startR=.008+twigRandom()*.04,startZ=.69+twigRandom()*.08;
		const spread=.035+Math.pow(twigRandom(),.7)*.145,length=.15+twigRandom()*.18;
		const dx=Math.cos(angle),dy=Math.sin(angle),curl=(twigRandom()-.5)*.055;
		const points=[
			new THREE.Vector3(Math.cos(angle)*startR,Math.sin(angle)*startR,startZ),
			new THREE.Vector3(dx*spread*.32-curl*.25,dy*spread*.32+curl*.2,startZ+length*.36),
			new THREE.Vector3(dx*spread*.68+curl,dy*spread*.7-curl,startZ+length*.73),
			new THREE.Vector3(dx*spread,dy*spread,startZ+length),
		];
		addTwig(twigBuckets[Math.floor(twigRandom()*twigBuckets.length)],points,.0011+twigRandom()*.0014);
	}
	for(let index=0;index<twigBuckets.length;index++){
		const bucket=twigBuckets[index],geometry=new THREE.BufferGeometry();
		geometry.setAttribute('position',new THREE.Float32BufferAttribute(bucket.positions,3));geometry.setIndex(bucket.indices);geometry.computeVertexNormals();geometry.computeBoundingSphere();
		const twigs=new THREE.Mesh(geometry,twigPalette[index]);twigs.name='Ramitas naturales de la escoba';twigs.castShadow=true;twigs.receiveShadow=true;broom.add(twigs);
	}
	const binding=new THREE.MeshStandardMaterial({color:0x8b6845,roughness:1});
	for(const z of [.715,.741,.768]){
		const band=new THREE.Mesh(new THREE.TorusGeometry(.046,.0028,6,36),binding);band.name='Atadura de cuerda del haz';band.position.z=z;band.castShadow=true;broom.add(band);
	}
	for(let strand=0;strand<3;strand++){
		const points=[];for(let step=0;step<=28;step++){
			const t=step/28,angle=t*Math.PI*7+strand*Math.PI*2/3,z=.704+t*.068;
			points.push(new THREE.Vector3(Math.cos(angle)*.048,Math.sin(angle)*.048,z));
		}
		const cord=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),84,.0017,5,false),binding);cord.name='Hebra trenzada de la atadura';cord.castShadow=true;broom.add(cord);
	}
	let broomSwingAge = Infinity, broomImpact = null, broomExpiresAt = Infinity;
	function restoreHandRays() {
		broom.visible = false;
		broom.rotation.x = 0;
		broomExpiresAt = Infinity;
		broomSwingAge = Infinity;
		broomImpact = null;
		person.userData.broomImpactPending = null;
		person.userData.broomMode = false;
		person.userData.broomStriking = false;
		person.userData.broomLiftAmount = 0;
		person.userData.broomStrikeAmount = 0;
	}
	person.userData.transformWandToBroom = () => {
		wand.visible = false;
		broom.visible = true;
		person.userData.broomMode = true;
		person.userData.broomCrushedCount = 0;
		broomExpiresAt = performance.now() + 60000;
	};
	person.userData.recordBroomCrush = () => {
		if (!person.userData.broomMode) return;
		person.userData.broomCrushedCount = (person.userData.broomCrushedCount ?? 0) + 1;
		if (person.userData.broomCrushedCount >= 3) {
			restoreHandRays();
		}
	};
	person.userData.swingBroom = onImpact => {
		if (!person.userData.broomMode || broomSwingAge !== Infinity) return false;
		broomSwingAge = 0;
		broomImpact = onImpact;
		person.userData.broomStriking = true;
		return true;
	};
	limb([0, 1.4, 0], [0, 1.54, 0], 0.075, 0.07, skin);
	for(const side of [-1,1])limb([side*.055,1.43,.015],[side*.035,1.53,.045],.012,.009,skin);
	const updateFace=addPrisonerFace(person,{skin,shadedSkin,hair});
	person.userData.updateAppearance=delta=>{
		if (person.userData.broomMode && performance.now() >= broomExpiresAt) restoreHandRays();
		updateFace(delta);
		if(broomSwingAge===Infinity)return;
		broomSwingAge=Math.min(.64,broomSwingAge+delta);
		const lift=THREE.MathUtils.smoothstep(broomSwingAge,0,.12)*(1-THREE.MathUtils.smoothstep(broomSwingAge,.12,.25));
		const down=THREE.MathUtils.smoothstep(broomSwingAge,.12,.25)*(1-THREE.MathUtils.smoothstep(broomSwingAge,.34,.64));
		person.userData.broomLiftAmount=lift;
		person.userData.broomStrikeAmount=down;
		broom.rotation.x=1.3*down-.25*lift;
		if(broomSwingAge>=.25&&broomImpact){
			const impact=broomImpact;broomImpact=null;
			if(person.userData.realisticReady)person.userData.broomImpactPending=impact;
			else impact();
		}
		if(broomSwingAge>=.64){broom.rotation.x=0;broomSwingAge=Infinity;person.userData.broomStriking=false;}
	};
	person.userData.headParts=person.children.filter(part=>part.isMesh&&part.position.y>=1.5);
	const headAnchor=new THREE.Object3D();headAnchor.name='head-anchor';headAnchor.position.set(0,1.68,0);person.add(headAnchor);
	const torso = new THREE.Group();
	torso.name = 'prisoner-torso'; torso.position.y = 1.025;
	person.add(torso); person.updateMatrixWorld(true);
	for (const part of [...person.children]) {
		if (part !== torso && (part === rightArm || part === leftArm || part.position.y > 1.04)) torso.attach(part);
	}
	const clothRest = new Float32Array(tunicGeometry.attributes.position.array);
	person.userData.setBackArch = angle => {
		torso.rotation.x = -angle;
		const positions = tunicGeometry.attributes.position;
		for (let i = 0; i < positions.count; i++) {
			const x = clothRest[i * 3], y = clothRest[i * 3 + 1], z = clothRest[i * 3 + 2];
			const blend = THREE.MathUtils.smoothstep(y, 1.025, 1.23);
			const bend = -angle * blend, offset = y - 1.025;
			positions.setXYZ(i, x, 1.025 + Math.cos(bend) * offset - Math.sin(bend) * z, Math.sin(bend) * offset + Math.cos(bend) * z);
		}
		positions.needsUpdate = true; tunicGeometry.computeVertexNormals(); tunicGeometry.computeBoundingSphere();
	};
	person.userData.walkingLegs=walkingLegs;
	person.userData.movable = true;
	// Keep the procedural body as a fallback while the textured medieval man loads.
	person.userData.appearanceReady = installMedievalPrisonerAppearance(person).catch(error => {
		console.warn('No se pudo cargar el modelo realista del prisionero:', error);
		return null;
	});
	return person;
}
