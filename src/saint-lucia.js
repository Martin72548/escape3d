import { publicAssetBase } from './public-asset-base.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let preparedAssets;
export function preloadSaintLucia() {
	if (!preparedAssets) {
		const loader = new GLTFLoader();
		preparedAssets = Promise.all([
			loader.loadAsync(`${publicAssetBase}models/prisoner/base_body.glb`),
			loader.loadAsync(`${publicAssetBase}models/saint-lucia/hair_long01.glb`).catch(error => {
				console.warn('Cheveux de sainte Lucie indisponibles :', error);
				return null;
			}),
		]);
		preparedAssets.catch(() => { preparedAssets = null; });
	}
	return preparedAssets;
}

export async function addSaintLucia(parent) {
	const fallback=[...parent.children];
	parent.name='Santa Lucia con vestido azul y halo dorado';
	const root=new THREE.Group();root.name='Santa Lucia de rostro humano';root.scale.setScalar(1.28);root.visible=false;parent.add(root);
	const assets=await preloadSaintLucia();
	const armRigs=[];
	for(const asset of assets){
		if(!asset)continue;
		const model=asset.scene;root.add(model);const meshes=[];model.traverse(object=>{if(object.isMesh)meshes.push(object);});
		for(const mesh of meshes){
			mesh.castShadow=mesh.receiveShadow=true;mesh.frustumCulled=false;
			if(mesh.morphTargetInfluences){mesh.morphTargetInfluences.fill(0);const i=mesh.morphTargetDictionary.gender_female;if(i!==undefined)mesh.morphTargetInfluences[i]=.85;}
			for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material]){
				if(material.map)material.map.anisotropy=8;
				if(material.name==='Skin'){material.roughness=.65;material.normalScale?.set(.6,.6);}
				if(material.name.startsWith('Hair')){material.color.set(0x39281e);material.roughness=.8;}
			}
			if(mesh.name==='Body'){
				// The gown covers the body; leave the face, neck and articulated arms.
				const ids=mesh.geometry.index,p=mesh.geometry.attributes.position,visible=[];
				for(let i=0;i<ids.count;i+=3){const tri=[ids.getX(i),ids.getX(i+1),ids.getX(i+2)];if(tri.every(id=>p.getY(id)<1.4&&Math.abs(p.getX(id))<.22))continue;visible.push(...tri);}
				mesh.geometry=mesh.geometry.clone();mesh.geometry.setIndex(visible);
			}
		}
		model.updateWorldMatrix(true,true);
		const inverseRoot=model.matrixWorld.clone().invert();
		const bones=new Map();model.traverse(object=>{if(object.isBone)bones.set(object.name,object);});
		for(const [side,sign] of [['l',1],['r',-1]]){
			const upper=bones.get('upperarm_'+side),lower=bones.get('lowerarm_'+side),hand=bones.get('hand_'+side);
			if(!upper||!lower||!hand)continue;
			const elbow=new THREE.Vector3(sign*.29,1.16,.18),wrist=new THREE.Vector3(sign*(side==='l'?.18:.14),1.15,side==='l'?.36:.43);
			const upperPoint=upper.getWorldPosition(new THREE.Vector3()).applyMatrix4(inverseRoot);
			const oldFore=hand.getWorldPosition(new THREE.Vector3()).sub(lower.getWorldPosition(new THREE.Vector3())).normalize();
			function pose(bone,start,end,restRotation){
				model.updateWorldMatrix(true,true);
				const position=model.localToWorld(start.clone()),endWorld=model.localToWorld(end.clone());
				const original=bone.children.find(child=>child.isBone)?.getWorldPosition(new THREE.Vector3()).sub(bone.getWorldPosition(new THREE.Vector3())).normalize()??oldFore;
				const rotation=restRotation.clone().premultiply(new THREE.Quaternion().setFromUnitVectors(original,endWorld.sub(position).normalize()));
				const transform=new THREE.Matrix4().compose(position,rotation,bone.getWorldScale(new THREE.Vector3()));
				bone.parent.updateWorldMatrix(true,false);transform.premultiply(bone.parent.matrixWorld.clone().invert());transform.decompose(bone.position,bone.quaternion,bone.scale);bone.updateWorldMatrix(false,true);
			}
			pose(upper,upperPoint,elbow,upper.getWorldQuaternion(new THREE.Quaternion()));
			// Use the current lower-arm orientation after the upper arm is posed.
			pose(lower,elbow,wrist,lower.getWorldQuaternion(new THREE.Quaternion()));
			hand.position.copy(hand.parent.worldToLocal(model.localToWorld(wrist.clone())));hand.updateWorldMatrix(false,true);
			const handWorld=model.getWorldQuaternion(new THREE.Quaternion()).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI/2,0,0)));
			hand.quaternion.copy(hand.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(handWorld));hand.updateWorldMatrix(false,true);
			for(const finger of ['index','middle','ring','pinky'])for(const joint of ['01','02','03']){const bone=bones.get(`${finger}_${joint}_${side}`);if(bone)bone.rotation.x+=side==='l'?.55:.12;}
			if(side==='l')armRigs.push({upper,lower,hand,upperRest:upper.quaternion.clone(),lowerRest:lower.quaternion.clone()});
			model.updateWorldMatrix(true,true);
		}
	}
	const size=128,data=new Uint8Array(size*size*4);
	for(let y=0;y<size;y++)for(let x=0;x<size;x++){const v=168+Math.sin(x*Math.PI)*9+Math.cos(y*Math.PI)*9+Math.sin(x*.3+y*.12)*4;data.set([v,v,v,255],(y*size+x)*4);}
	const weave=new THREE.DataTexture(data,size,size);weave.wrapS=weave.wrapT=THREE.RepeatWrapping;weave.repeat.set(3,5);weave.magFilter=weave.minFilter=THREE.LinearFilter;weave.needsUpdate=true;
	const blue=new THREE.MeshStandardMaterial({color:0x284f9a,roughness:.82,bumpMap:weave,bumpScale:.004,side:THREE.DoubleSide});
	const gold=new THREE.MeshStandardMaterial({color:0xdcb761,metalness:.7,roughness:.35,emissive:0x84601e,emissiveIntensity:.2});
	function mesh(geometry,material,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;root.add(m);return m;}
	const profile=[[.34,.025],[.35,.09],[.31,.45],[.24,.83],[.19,1.02],[.205,1.2],[.21,1.3],[.13,1.35],[.073,1.38]];
	const gown=new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),80);const p=gown.attributes.position;
	for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=Math.atan2(x,z),fold=1+Math.sin(a*14+y*3)*.055+Math.sin(a*7-y)*.02;p.setXYZ(i,x*fold,y,z*fold*.7);}
	gown.computeVertexNormals();mesh(gown,blue);
	for(const side of [-1,1]){
		const a=new THREE.Vector3(side*.17,1.32,.02),b=new THREE.Vector3(side*.27,1.19,.15),d=b.clone().sub(a);
		const sleeve=mesh(new THREE.CylinderGeometry(.08,.065,d.length(),24),blue);sleeve.position.copy(a).add(b).multiplyScalar(.5);sleeve.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());
	}
	const belt=mesh(new THREE.TorusGeometry(.203,.009,10,64),gold,0,1.015,0);belt.rotation.x=Math.PI/2;belt.scale.y=.7;
	const haloStart=root.children.length;
	const halo=mesh(new THREE.TorusGeometry(.255,.012,12,80),gold,0,1.565,-.085);halo.name='Halo dorado alrededor de la cabeza de Santa Lucia';halo.castShadow=false;
	for(let i=0;i<32;i++){
		const a=i/32*Math.PI*2,ray=mesh(new THREE.CylinderGeometry(.002,.002,i%4===0?.07:.037,6),gold,Math.sin(a)*.293,1.565+Math.cos(a)*.293,-.085);ray.rotation.z=-a;ray.castShadow=false;
	}
	const glow=mesh(new THREE.TorusGeometry(.255,.022,8,64),new THREE.MeshBasicMaterial({color:0xffdc82,transparent:true,opacity:.16,depthWrite:false,blending:THREE.AdditiveBlending}),0,1.565,-.087);glow.castShadow=false;
	const light=new THREE.PointLight(0xffd894,.6,1.2);light.position.set(0,1.64,.18);root.add(light);
	const haloParts=root.children.slice(haloStart),haloGroup=new THREE.Group();haloGroup.name='Halo arrojadizo de Santa Lucia';haloGroup.position.set(0,1.565,-.085);root.add(haloGroup);root.updateWorldMatrix(true,true);haloParts.forEach(part=>haloGroup.attach(part));
	root.userData.luciaHalo=haloGroup;root.userData.luciaArms=armRigs;
	// A small dish and a palm branch identify the saint without changing her pose.
	const dish=mesh(new THREE.CylinderGeometry(.13,.1,.018,40),gold,-.115,1.16,.46);dish.name='Bandeja de Santa Lucia';
	const ivory=new THREE.MeshStandardMaterial({color:0xe3d5bd,roughness:.55});
	for(const side of [-1,1]){const eye=mesh(new THREE.SphereGeometry(1,20,14),ivory,-.115+side*.045,1.182,.46);eye.scale.set(.028,.015,.019);const iris=mesh(new THREE.SphereGeometry(.009,16,10),new THREE.MeshStandardMaterial({color:0x5b6a50,roughness:.45}),-.115+side*.045,1.197,.46);iris.scale.y=.3;}
	const palmMaterial=new THREE.MeshStandardMaterial({color:0x536f35,roughness:.85,side:THREE.DoubleSide});
	const stemPoints=[new THREE.Vector3(.18,1.16,.43),new THREE.Vector3(.3,1.43,.39),new THREE.Vector3(.38,1.69,.36)];
	mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(stemPoints),24,.006,8,false),palmMaterial);
	for(let i=0;i<9;i++)for(const side of [-1,1]){const leaf=mesh(new THREE.SphereGeometry(1,16,10),palmMaterial,.2+i*.019+side*.032,1.23+i*.044,.42-i*.006);leaf.scale.set(.013,.064,.003);leaf.rotation.z=-side*.8-.2;}
	root.visible=true;fallback.forEach(object=>object.visible=false);
	parent.userData.saintLucia=true;
	return root;
}
