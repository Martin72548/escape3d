import { publicAssetBase } from './public-asset-base.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const assetRoot = `${publicAssetBase}models/prisoner/`;

// Keep the existing gameplay joints as animation controls. The anatomical mesh
// is skinned to its own skeleton and follows those controls in world space.
export async function installRealisticPrisoner(person) {
	const loader = new GLTFLoader();
	const files = ['base_body.glb', 'hair_short02.glb', 'clothing_tshirt.glb', 'clothing_shorts.glb'];
	const assets = await Promise.all(files.map(file => loader.loadAsync(assetRoot + file)));
	const oldMeshes = [];
	person.traverse(object => { if (object.isMesh) oldMeshes.push(object); });
	const controls = Object.fromEntries(['casting-arm','casting-elbow','casting-wrist','left-arm','left-elbow','left-wrist','left-leg','right-leg','prisoner-torso'].map(name=>[name,person.getObjectByName(name)]));
	const visuals = new THREE.Group(); visuals.name = 'Prisionero humano anatomico'; visuals.scale.setScalar(1.08);
	person.add(visuals);
	const firstPerson = person.userData.headParts.some(part=>part.layers.mask===2);
	const facialMeshes = [], headMeshes = [], rigs = [];
	const sourceRest = new Map();
	person.updateWorldMatrix(true,true);
	for(const source of Object.values(controls)) sourceRest.set(source,source.matrixWorld.clone());
	const hiddenHeadProxy = person.getObjectByName('screaming-mouth');
	const fabric=oldMeshes.find(mesh=>mesh.material?.map&&mesh.material?.side===THREE.DoubleSide)?.material.map;

	function splitHead(mesh) {
		const index=mesh.geometry.index, positions=mesh.geometry.attributes.position;
		const body=[],head=[];
		for(let i=0;i<index.count;i+=3){
			const ids=[index.getX(i),index.getX(i+1),index.getX(i+2)];
			// Covered skin must not poke through the shorts when a thigh is raised.
			if(ids.every(id=>positions.getY(id)>.62&&positions.getY(id)<1.02&&Math.abs(positions.getX(id))<.29))continue;
			const destination=ids.every(id=>positions.getY(id)>1.44)?head:body;destination.push(...ids);
		}
		const headGeometry=mesh.geometry.clone();headGeometry.setIndex(head);
		const headMesh=new THREE.SkinnedMesh(headGeometry,mesh.material);headMesh.name='Cabeza anatomica del prisionero';
		headMesh.bind(mesh.skeleton,mesh.bindMatrix);headMesh.morphTargetDictionary={...mesh.morphTargetDictionary};headMesh.morphTargetInfluences=mesh.morphTargetInfluences.slice();
		headMesh.frustumCulled=false;headMesh.castShadow=headMesh.receiveShadow=true;mesh.parent.add(headMesh);
		const bodyGeometry=mesh.geometry.clone();bodyGeometry.setIndex(body);mesh.geometry=bodyGeometry;
		facialMeshes.push(headMesh);headMeshes.push(headMesh);
	}
	function addPainMorph(mesh){
		if(!mesh.morphTargetInfluences||!['Cabeza anatomica del prisionero','Eyebrows','Teeth','Tongue'].includes(mesh.name))return;
		const positions=mesh.geometry.attributes.position,delta=new Float32Array(positions.count*3);
		for(let i=0;i<positions.count;i++){
			const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);
			const front=THREE.MathUtils.smoothstep(z,.035,.1),center=1-THREE.MathUtils.smoothstep(Math.abs(x),.065,.11);
			const jaw=THREE.MathUtils.smoothstep(y,1.425,1.45)*(1-THREE.MathUtils.smoothstep(y,1.478,1.5))*front*center;
			const brow=Math.exp(-(((y-1.565)/.012)**2))*front*(1-THREE.MathUtils.smoothstep(Math.abs(x),.07,.09));
			delta[i*3+1]=-.025*jaw+brow*(.004-Math.abs(x)*.09);
			delta[i*3+2]=-.004*jaw;
		}
		const attribute=new THREE.BufferAttribute(delta,3);attribute.name='pain_expression';
		const index=mesh.geometry.morphAttributes.position.length;mesh.geometry.morphAttributes.position.push(attribute);
		if(mesh.geometry.morphAttributes.normal)mesh.geometry.morphAttributes.normal.push(new THREE.BufferAttribute(new Float32Array(delta.length),3));
		mesh.morphTargetDictionary.pain_expression=index;mesh.morphTargetInfluences.push(0);
	}

	for(let assetIndex=0;assetIndex<assets.length;assetIndex++){
		const model=assets[assetIndex].scene;visuals.add(model);
		const meshes=[];model.traverse(object=>{if(object.isMesh)meshes.push(object);});
		for(const mesh of meshes){
			mesh.castShadow=mesh.receiveShadow=true;mesh.frustumCulled=false;
			if(mesh.morphTargetInfluences){
				mesh.morphTargetInfluences.fill(0);
				for(const [name,weight] of [['gender_male',.65],['muscle_max',.15],['age_old',.08]]){
					const index=mesh.morphTargetDictionary[name];if(index!==undefined)mesh.morphTargetInfluences[index]=weight;
				}
			}
			const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
			for(const material of materials){
				if(material.map)material.map.anisotropy=8;
				if(assetIndex===2||assetIndex===3){material.color.set(assetIndex===2?0xaaa08a:0x777063);material.roughness=.95;material.metalness=0;if(fabric){material.map=fabric;material.normalMap=null;material.bumpMap=fabric;material.bumpScale=.002;}}
				if(material.name==='Skin'){material.roughness=.62;material.normalScale?.set(.65,.65);}
			}
			if(assetIndex===0&&mesh.name==='Body')splitHead(mesh);
			else if(assetIndex<=1){headMeshes.push(mesh);facialMeshes.push(mesh);}
		}
		person.updateWorldMatrix(true,true);
		const bones=new Map();model.traverse(object=>{if(object.isBone)bones.set(object.name,object);});
		const mappings=[];
		function mapBone(name,source,positionControl=false,endSource=null){
			const bone=bones.get(name);if(!bone||!source)return;
			const rest=bone.matrixWorld.clone(),rotation=bone.getWorldQuaternion(new THREE.Quaternion());
			if(endSource){
				const child=bone.children.find(child=>child.isBone);
				if(child){
					const original=child.getWorldPosition(new THREE.Vector3()).sub(bone.getWorldPosition(new THREE.Vector3())).normalize();
					const desired=endSource.getWorldPosition(new THREE.Vector3()).sub(source.getWorldPosition(new THREE.Vector3())).normalize();
					rotation.premultiply(new THREE.Quaternion().setFromUnitVectors(original,desired));
				}
			}
			if(name.startsWith('hand_')){
				const original=bone.getWorldPosition(new THREE.Vector3()).sub(bone.parent.getWorldPosition(new THREE.Vector3())).normalize();
				const desired=source.getWorldPosition(new THREE.Vector3()).sub(source.parent.getWorldPosition(new THREE.Vector3())).normalize();
				rotation.premultiply(new THREE.Quaternion().setFromUnitVectors(original,desired));
			}
			const position=bone.getWorldPosition(new THREE.Vector3()),scale=bone.getWorldScale(new THREE.Vector3());
			if(positionControl)position.copy(source.getWorldPosition(new THREE.Vector3()));
			rest.compose(position,rotation,scale);
			mappings.push({bone,source,relative:sourceRest.get(source).clone().invert().multiply(rest)});
		}
		for(const name of ['spine_01','spine_02','spine_03','neck_01','head'])mapBone(name,controls['prisoner-torso']);
		for(const [suffix,arm,elbow,wrist,leg] of [
			['r','casting-arm','casting-elbow','casting-wrist','right-leg'],
			['l','left-arm','left-elbow','left-wrist','left-leg'],
		]){
			mapBone('upperarm_'+suffix,controls[arm],true,controls[elbow]);
			mapBone('lowerarm_'+suffix,controls[elbow],true,controls[wrist]);
			mapBone('hand_'+suffix,controls[wrist],true);
			for(const name of ['thigh_','calf_','foot_','ball_'])mapBone(name+suffix,controls[leg]);
		}
		mappings.sort((a,b)=>{const depth=bone=>{let d=0;while(bone.parent){d++;bone=bone.parent;}return d;};return depth(a.bone)-depth(b.bone);});
		rigs.push({model,mappings,bones});
	}
	// Parent the prop to the skinned right hand itself. The palm's local +Y
	// axis runs toward the fingers, so the wand follows the grip through poses.
	const wand=person.getObjectByName('Varita mágica del prisionero');
	const rightHand=rigs[0]?.bones.get('hand_r');
	const broom=person.getObjectByName('Escoba mágica del prisionero');
	if(wand&&rightHand){
		rightHand.add(wand);
		wand.position.set(0,.055,0);
		wand.rotation.set(-Math.PI/2,0,0);
	}
	if(broom&&rightHand){
		person.add(broom);
		broom.position.set(-.03,1.2,.18);
		broom.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(-.45,.9,0).normalize());
	}
	for(const mesh of facialMeshes)addPainMorph(mesh);
	for(const mesh of oldMeshes){
		// Gameplay still reads the invisible mouth and limb controls.
		mesh.layers.set(2);
	}
	// The wand and broom are gameplay props attached to the old wrist control,
	// so keep their meshes on the renderable layer when hiding the proxy body.
	for(const name of ['Varita mágica del prisionero','Escoba mágica del prisionero']){
		person.getObjectByName(name)?.traverse(object=>{if(object.isMesh)object.layers.set(0);});
	}
	for(const mesh of headMeshes){if(firstPerson)mesh.layers.set(1);person.userData.headParts.push(mesh);}
	person.updateWorldMatrix(true,true);
	const castingArm=controls['casting-arm'],armParent=castingArm.parent;
	const restArmRotation=castingArm.quaternion.clone(),restWandRotation=wand?.quaternion.clone();
	const shoulderLocal=armParent.worldToLocal(castingArm.getWorldPosition(new THREE.Vector3()));
	const wristLocal=armParent.worldToLocal(controls['casting-wrist'].getWorldPosition(new THREE.Vector3()));
	const restArmAxis=wristLocal.sub(shoulderLocal).normalize();
	let castTarget=null;
	let age=0, missingHead=false,painAmount=0,castArmTime=0,castArmAmount=0,broomGrip=0;
	const matrix=new THREE.Matrix4(), desired=new THREE.Matrix4();
	const aimRotation=new THREE.Quaternion(),desiredArmRotation=new THREE.Quaternion();
	const aimDirection=new THREE.Vector3(),localAim=new THREE.Vector3();
	function update(dt){
		age+=dt;
		castArmTime=Math.max(0,castArmTime-dt);
		castArmAmount=THREE.MathUtils.damp(castArmAmount,castArmTime>0?1:0,castArmTime>0?15:6,dt);
		broomGrip=THREE.MathUtils.damp(broomGrip,person.userData.broomMode?1:0,7,dt);
		if(!person.userData.broomMode&&castTarget&&castArmAmount>0){
			const targetLocal=armParent.worldToLocal(castTarget.clone());
			const handLocal=armParent.worldToLocal(controls['casting-wrist'].getWorldPosition(new THREE.Vector3()));
			aimDirection.copy(targetLocal).sub(handLocal).normalize();
			if(aimDirection.lengthSq()>.01){
				aimRotation.setFromUnitVectors(restArmAxis,aimDirection);
				desiredArmRotation.copy(aimRotation).multiply(restArmRotation);
				castingArm.quaternion.slerpQuaternions(restArmRotation,desiredArmRotation,castArmAmount);
			}
		}else castingArm.quaternion.slerp(restArmRotation,THREE.MathUtils.clamp(dt*6,0,1));
		controls['casting-elbow'].rotation.z=person.userData.broomMode?0:1.05*castArmAmount;
		controls['casting-wrist'].rotation.z=person.userData.broomMode?0:.12*castArmAmount;
		controls['left-arm'].rotation.z=0;
		controls['left-elbow'].rotation.z=0;
		controls['left-wrist'].rotation.z=0;
		person.updateWorldMatrix(true,true);
		for(const {mappings} of rigs)for(const {bone,source,relative} of mappings){
			desired.multiplyMatrices(source.matrixWorld,relative);
			matrix.copy(bone.parent.matrixWorld).invert().multiply(desired);
			matrix.decompose(bone.position,bone.quaternion,bone.scale);bone.updateWorldMatrix(false,false);
		}
		if(broom&&person.userData.broomMode){
			broom.updateWorldMatrix(true,true);
			const shaftDirection=new THREE.Vector3(0,0,1).applyQuaternion(broom.getWorldQuaternion(new THREE.Quaternion())).normalize();
			const rootRotation=person.getWorldQuaternion(new THREE.Quaternion());
			function aimLimb(bones,suffix,shaftDistance,poleSign){
				const upper=bones.get(`upperarm_${suffix}`),forearm=bones.get(`lowerarm_${suffix}`),hand=bones.get(`hand_${suffix}`);
				if(!upper||!forearm||!hand)return;
				upper.updateWorldMatrix(true,true);
				const shoulder=upper.getWorldPosition(new THREE.Vector3());
				const elbow=forearm.getWorldPosition(new THREE.Vector3());
				const wrist=hand.getWorldPosition(new THREE.Vector3());
				const upperLength=shoulder.distanceTo(elbow),lowerLength=elbow.distanceTo(wrist);
				const grip=broom.localToWorld(new THREE.Vector3(0,0,shaftDistance));
				const wristTarget=grip.clone().addScaledVector(shaftDirection,-.055);
				const axis=wristTarget.clone().sub(shoulder);
				const distance=THREE.MathUtils.clamp(axis.length(),Math.abs(upperLength-lowerLength)+.008,upperLength+lowerLength-.015);
				axis.normalize();wristTarget.copy(shoulder).addScaledVector(axis,distance);
				const pole=new THREE.Vector3(poleSign,0,0).applyQuaternion(rootRotation);
				pole.addScaledVector(axis,-pole.dot(axis));
				if(pole.lengthSq()<.001){pole.set(0,0,1).applyQuaternion(rootRotation);pole.addScaledVector(axis,-pole.dot(axis));}
				pole.normalize();
				const along=(upperLength*upperLength-lowerLength*lowerLength+distance*distance)/(2*distance);
				const height=Math.sqrt(Math.max(0,upperLength*upperLength-along*along));
				const elbowTarget=shoulder.clone().addScaledVector(axis,along).addScaledVector(pole,height);
				function pointBone(bone,child,target){
					const origin=bone.getWorldPosition(new THREE.Vector3());
					const current=child.getWorldPosition(new THREE.Vector3()).sub(origin).normalize();
					const wanted=target.clone().sub(origin).normalize();
					const world=bone.getWorldQuaternion(new THREE.Quaternion()).premultiply(new THREE.Quaternion().setFromUnitVectors(current,wanted));
					world.slerp(bone.getWorldQuaternion(new THREE.Quaternion()),1-broomGrip);
					bone.quaternion.copy(bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(world));
					bone.updateWorldMatrix(true,true);
				}
				pointBone(upper,forearm,elbowTarget);
				pointBone(forearm,hand,wristTarget);
				hand.updateWorldMatrix(true,true);
				const currentWorld=hand.getWorldQuaternion(new THREE.Quaternion());
				const palmAxis=new THREE.Vector3(0,1,0).applyQuaternion(currentWorld).normalize();
				const correction=new THREE.Quaternion().setFromUnitVectors(palmAxis,shaftDirection);
			const aimedWorld=correction.multiply(currentWorld).slerp(currentWorld,1-broomGrip);
				hand.quaternion.copy(hand.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(aimedWorld));
				hand.updateWorldMatrix(true,true);
			}
			for(const {bones} of rigs){aimLimb(bones,'r',.08,-1);aimLimb(bones,'l',.22,1);}
		}
		// Curl the right fingers around the wand, with the thumb opposing them
		// across the handle. This is a stable grip pose in the imported hand rig.
		for(const {bones} of rigs){
			for(const [finger,curl] of [['index',.56],['middle',.68],['ring',.72],['pinky',.66]]){
				for(const [joint,angle] of [['01',curl*.62],['02',curl],['03',curl*.72]]){
					const right=bones.get(`${finger}_${joint}_r`);if(right){right.rotation.x=angle;right.updateWorldMatrix(false,true);}
					const left=bones.get(`${finger}_${joint}_l`);if(left){left.rotation.x=angle*broomGrip;left.updateWorldMatrix(false,true);}
				}
			}
			const thumb=[bones.get('thumb_01_r'),bones.get('thumb_02_r'),bones.get('thumb_03_r')];
			if(thumb[0]){thumb[0].rotation.set(.18,-.24,-.42);thumb[0].updateWorldMatrix(false,true);}
			if(thumb[1]){thumb[1].rotation.set(.12,0,-.62);thumb[1].updateWorldMatrix(false,true);}
			if(thumb[2]){thumb[2].rotation.set(.08,0,-.34);thumb[2].updateWorldMatrix(false,true);}
			const leftThumb=[bones.get('thumb_01_l'),bones.get('thumb_02_l'),bones.get('thumb_03_l')];
			if(leftThumb[0]){leftThumb[0].rotation.set(.18*broomGrip,.24*broomGrip,.42*broomGrip);leftThumb[0].updateWorldMatrix(false,true);}
			if(leftThumb[1]){leftThumb[1].rotation.set(.12*broomGrip,0,.62*broomGrip);leftThumb[1].updateWorldMatrix(false,true);}
			if(leftThumb[2]){leftThumb[2].rotation.set(.08*broomGrip,0,.34*broomGrip);leftThumb[2].updateWorldMatrix(false,true);}
		}
		if(wand&&rightHand&&castTarget&&castArmAmount>0){
			rightHand.updateWorldMatrix(true,true);
			const wandStart=wand.getWorldPosition(new THREE.Vector3());
			const wandEnd=rightHand.worldToLocal(castTarget.clone());
			const wandOrigin=rightHand.worldToLocal(wandStart);
			localAim.copy(wandEnd).sub(wandOrigin).normalize();
			if(localAim.lengthSq()>.01){
				const aimedWandRotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),localAim);
				wand.quaternion.slerpQuaternions(restWandRotation,aimedWandRotation,castArmAmount);
			}
		}else if(wand&&restWandRotation)wand.quaternion.slerp(restWandRotation,THREE.MathUtils.clamp(dt*6,0,1));
		if(person.userData.toadHeadRecoil){
   for(const {bones} of rigs){
    const neck=bones.get('neck_01'),head=bones.get('head');
    if(neck){neck.rotateX(person.userData.toadHeadRecoil*.35);neck.rotateY((person.userData.toadHeadYaw??0)*.35);neck.rotateZ((person.userData.toadHeadRoll??0)*.35);neck.updateWorldMatrix(false,true);}
    if(head){head.rotateX(person.userData.toadHeadRecoil*.65);head.rotateY((person.userData.toadHeadYaw??0)*.65);head.rotateZ((person.userData.toadHeadRoll??0)*.65);head.updateWorldMatrix(false,true);}
   }
  }
		if(person.userData.wolfHeadShake){
			const shake=person.userData.wolfHeadShake;
			for(const {bones} of rigs){
				const head=bones.get('head'),neck=bones.get('neck_01');
				if(neck){neck.quaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(shake.x*.35,shake.y*.25,shake.z*.3)));neck.updateWorldMatrix(false,true);}
				if(head){head.quaternion.multiply(new THREE.Quaternion().setFromEuler(shake));head.updateWorldMatrix(false,true);}
			}
		}
		// Plant each ankle on its tread and bend the knee toward the direction of travel.
		if(person.userData.stairFootTargets)for(const {bones} of rigs){
			for(const [index,suffix] of [[0,'r'],[1,'l']]){
				const thigh=bones.get('thigh_'+suffix),calf=bones.get('calf_'+suffix),foot=bones.get('foot_'+suffix);
				if(!thigh||!calf||!foot)continue;
				const hip=thigh.getWorldPosition(new THREE.Vector3()),knee=calf.getWorldPosition(new THREE.Vector3()),ankle=foot.getWorldPosition(new THREE.Vector3());
				const upper=hip.distanceTo(knee),lower=knee.distanceTo(ankle),target=person.userData.stairFootTargets[index].clone();
				const axis=target.clone().sub(hip),distance=THREE.MathUtils.clamp(axis.length(),Math.abs(upper-lower)+.001,upper+lower-.001);axis.normalize();target.copy(hip).addScaledVector(axis,distance);
				const pole=new THREE.Vector3(0,0,1).applyQuaternion(person.getWorldQuaternion(new THREE.Quaternion()));pole.addScaledVector(axis,-pole.dot(axis)).normalize();
				const along=(upper*upper-lower*lower+distance*distance)/(2*distance),bend=Math.sqrt(Math.max(0,upper*upper-along*along));
				const kneeTarget=hip.clone().addScaledVector(axis,along).addScaledVector(pole,bend);
				const footRotation=foot.getWorldQuaternion(new THREE.Quaternion());
				function pointBone(bone,child,point){
					const origin=bone.getWorldPosition(new THREE.Vector3()),current=child.getWorldPosition(new THREE.Vector3()).sub(origin).normalize(),desired=point.clone().sub(origin).normalize();
					const world=bone.getWorldQuaternion(new THREE.Quaternion()).premultiply(new THREE.Quaternion().setFromUnitVectors(current,desired));
					bone.quaternion.copy(bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(world));bone.updateWorldMatrix(false,true);
				}
				pointBone(thigh,calf,kneeTarget);pointBone(calf,foot,target);
				foot.quaternion.copy(foot.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(footRotation));foot.updateWorldMatrix(false,true);
			}
		}
		for(const legName of (person.userData.trollKneeBend||person.userData.batDuckAmount||person.userData.georgeKneeBend||person.userData.luciaKneeBend)?['left-leg','right-leg']:person.userData.scorpionKneeBend?[person.userData.scorpionLiftedLeg]:person.userData.snakeKneeBend?[person.userData.snakeLiftedLeg]:person.userData.denisKneeBend?[person.userData.denisLiftedLeg]:[]){
			const bendAmount=person.userData.trollKneeBend||person.userData.batDuckAmount||person.userData.georgeKneeBend||person.userData.luciaKneeBend||person.userData.scorpionKneeBend||person.userData.snakeKneeBend||person.userData.denisKneeBend;
			const suffix=legName==='left-leg'?'l':'r';
			const axis=new THREE.Vector3(1,0,0).applyQuaternion(controls[legName].getWorldQuaternion(new THREE.Quaternion()));
			for(const {bones} of rigs){
				const knee=bones.get('calf_'+suffix).getWorldPosition(new THREE.Vector3());
				const rotation=new THREE.Matrix4().makeRotationAxis(axis,bendAmount);
				const bend=new THREE.Matrix4().makeTranslation(...knee.toArray()).multiply(rotation).multiply(new THREE.Matrix4().makeTranslation(-knee.x,-knee.y,-knee.z));
				const targets=['calf_','foot_','ball_'].map(name=>{const bone=bones.get(name+suffix);return {bone,world:bone.matrixWorld.clone().premultiply(bend)};});
				for(const {bone,world} of targets){matrix.copy(bone.parent.matrixWorld).invert().multiply(world);matrix.decompose(bone.position,bone.quaternion,bone.scale);bone.updateWorldMatrix(false,true);}
			}
		}
		person.userData.updateGeorgeCuffs?.(rigs[0].bones);
		const blink=person.userData.haloEyesOpen?0:person.userData.dead?1:Math.max(0,1-Math.abs((age%4.2)-4.05)/.08);
		const pain=!!person.userData.toadHeadRecoil||hiddenHeadProxy.visible||!!person.userData.scorpionHopping||!!person.userData.snakeHopping||!!person.userData.waistGrabOwner||!!person.userData.sebastianArrowHits||!!person.userData.denisBiting||!!person.userData.haloTrapped||!!person.userData.georgeCaptured;
		painAmount=THREE.MathUtils.damp(painAmount,pain&&!person.userData.dead?1:0,12,dt);
		if(person.userData.dead&&headMeshes.every(mesh=>!mesh.visible))missingHead=true;
		for(const mesh of facialMeshes){
			if(missingHead)mesh.visible=false;
			if(!mesh.morphTargetDictionary)continue;
			for(const name of ['blink_left','blink_right']){const index=mesh.morphTargetDictionary[name];if(index!==undefined)mesh.morphTargetInfluences[index]=blink;}
			const painIndex=mesh.morphTargetDictionary.pain_expression;if(painIndex!==undefined)mesh.morphTargetInfluences[painIndex]=painAmount;
		}
		// Keep the legacy expression proxy hidden while encounter code uses it.
		hiddenHeadProxy.layers.set(2);
	}
	person.userData.updateAppearance=update;
	person.userData.castWand=point=>{castTarget=point.clone();castArmTime=.42;};
	person.userData.realisticModel=visuals;
	person.userData.realisticReady=true;
	update(0);
	return visuals;
}
