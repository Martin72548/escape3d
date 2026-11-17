import { publicAssetBase } from './public-asset-base.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// The anatomical mesh replaces the primitive fallback, while the original head
// and leg groups remain the gameplay controls for detachable stone pieces.
export async function installSebastianAnatomy(parent,statue,fallback){
 const loader=new GLTFLoader(),base=publicAssetBase;
 const assets=await Promise.all([loader.loadAsync(`${base}models/prisoner/base_body.glb`),loader.loadAsync(`${base}models/prisoner/hair_short02.glb`)]);
 if(statue.head.parent!==parent||statue.legs.some(leg=>leg.parent!==parent)||!parent.visible)return null;
 const root=new THREE.Group();root.name='Anatomia humana de San Sebastian';root.scale.setScalar(1.28);parent.add(root);
 const rigs=[],bodyMeshes=[];
 const stone=statue.material.clone();stone.color.set(0xcfc0a5);stone.roughness=.58;
 const hairStone=stone.clone();hairStone.color.set(0xa89b83);hairStone.roughness=.75;
 for(const [index,asset]of assets.entries()){
  const model=asset.scene;root.add(model);
  model.traverse(object=>{
   if(!object.isMesh)return;object.castShadow=object.receiveShadow=true;object.frustumCulled=false;
   if(object.morphTargetInfluences){object.morphTargetInfluences.fill(0);for(const [name,weight]of [['gender_male',.85],['muscle_max',.85],['proportions_ideal',.45],['weight_min',.08]]){const id=object.morphTargetDictionary[name];if(id!==undefined)object.morphTargetInfluences[id]=weight;}}
   const original=Array.isArray(object.material)?object.material[0]:object.material;
   const material=(index===1?hairStone:stone).clone();if(original.normalMap){material.normalMap=original.normalMap;material.normalScale.set(.6,.6);}object.material=material;
   if(object.name==='Body'){
    object.geometry=object.geometry.clone();const positions=object.geometry.attributes.position,normals=object.geometry.attributes.normal;
    const bump=(x,y,cx,cy,sx,sy)=>Math.exp(-(((x-cx)/sx)**2)-((y-cy)/sy)**2);
    for(let i=0;i<positions.count;i++){
     const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i),front=Math.max(0,normals.getZ(i));
     if(y<.92||y>1.36||Math.abs(x)>.23||z<.015)continue;
     let relief=0;for(const side of [-1,1]){
      relief+=.017*bump(x,y,side*.105,1.265,.085,.055);
      for(const cy of [1.16,1.09,1.02])relief+=.007*bump(x,y,side*.047,cy,.035,.029);
     }
     positions.setZ(i,z+relief*front);
    }
    positions.needsUpdate=true;object.geometry.computeVertexNormals();
   }
   bodyMeshes.push({mesh:object,hair:index===1});
  });
  parent.updateWorldMatrix(true,false);parent.updateMatrixWorld(true);const bones=new Map();model.traverse(object=>{if(object.isBone)bones.set(object.name,object);});
  // A mild curve through the trunk and unequal knees avoid a rigid symmetrical pose.
  const headBone=bones.get('head');if(headBone){headBone.rotation.z+=.12;headBone.rotation.x-=.08;}
  const spine=bones.get('spine_03');if(spine)spine.rotation.z+=.055;
  const thigh=bones.get('thigh_r'),knee=bones.get('calf_r');if(thigh){thigh.rotation.x-=.12;thigh.rotation.z-=.045;}if(knee)knee.rotation.x+=.16;
  parent.updateWorldMatrix(true,false);parent.updateMatrixWorld(true);
  for(const [side,sign]of [['l',1],['r',-1]]){
   const upper=bones.get('upperarm_'+side),lower=bones.get('lowerarm_'+side),hand=bones.get('hand_'+side);if(!upper||!lower||!hand)continue;
   rigs.push({model,bones,side,sign,upper,lower,hand,rest:[upper,lower,hand].map(bone=>({position:bone.position.clone(),quaternion:bone.quaternion.clone(),scale:bone.scale.clone()}))});
   for(const finger of ['index','middle','ring','pinky'])for(const joint of ['01','02','03']){const bone=bones.get(`${finger}_${joint}_${side}`);if(bone)bone.rotation.x+=joint==='01'?.16:.25;}
  }
 }
 function poseBone(bone,start,end){
  parent.updateWorldMatrix(true,false);parent.updateMatrixWorld(true);
  const child=bone.children.find(object=>object.isBone);if(!child)return;
  const original=child.getWorldPosition(new THREE.Vector3()).sub(bone.getWorldPosition(new THREE.Vector3())).normalize();
  const a=parent.localToWorld(start.clone()),b=parent.localToWorld(end.clone());
  const rotation=bone.getWorldQuaternion(new THREE.Quaternion()).premultiply(new THREE.Quaternion().setFromUnitVectors(original,b.sub(a).normalize()));
  const matrix=new THREE.Matrix4().compose(a,rotation,bone.getWorldScale(new THREE.Vector3())).premultiply(bone.parent.matrixWorld.clone().invert());matrix.decompose(bone.position,bone.quaternion,bone.scale);bone.updateWorldMatrix(false,true);
 }
 function pose(draw=0,raise=0){
  for(const rig of rigs){
   const {sign,upper,lower,hand,rest}=rig;[upper,lower,hand].forEach((bone,i)=>{bone.position.copy(rest[i].position);bone.quaternion.copy(rest[i].quaternion);bone.scale.copy(rest[i].scale);});
   parent.updateWorldMatrix(true,false);parent.updateMatrixWorld(true);
   const shoulder=parent.worldToLocal(upper.getWorldPosition(new THREE.Vector3()));
   const restElbow=new THREE.Vector3(sign*.33,1.34,-.17),restHand=new THREE.Vector3(sign*.055,1.16,-.4);
   const elbow=sign<0?new THREE.Vector3(-.48,1.48,.28):new THREE.Vector3(.45,1.65,.1-draw*.16);
   const wrist=sign<0?new THREE.Vector3(-.35,1.57,.55):new THREE.Vector3(-.27+draw*.43,1.57+draw*.13,.55-draw*.4);
   elbow.lerpVectors(restElbow,elbow,raise);wrist.lerpVectors(restHand,wrist,raise);
   poseBone(upper,shoulder,elbow);poseBone(lower,elbow,wrist);
   hand.position.copy(hand.parent.worldToLocal(parent.localToWorld(wrist.clone())));hand.updateWorldMatrix(false,true);
  }
 }
 pose();parent.updateWorldMatrix(true,false);parent.updateMatrixWorld(true);
 const point=new THREE.Vector3();
 function bake(mesh,indices,owner,name){
  if(!indices.length)return;
  mesh.skeleton?.update();
  const geometry=mesh.geometry.clone(),position=geometry.attributes.position;
  const matrix=owner.matrixWorld.clone().invert().multiply(mesh.matrixWorld),vertices=new Float32Array(position.count*3);
  for(let i=0;i<position.count;i++){mesh.getVertexPosition(i,point).applyMatrix4(matrix);point.toArray(vertices,i*3);}
  geometry.setAttribute('position',new THREE.BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.morphAttributes={};geometry.deleteAttribute('skinIndex');geometry.deleteAttribute('skinWeight');geometry.computeVertexNormals();geometry.computeBoundingSphere();
  const result=new THREE.Mesh(geometry,mesh.material);result.name=name;result.castShadow=result.receiveShadow=true;owner.add(result);return result;
 }
 // Partition at the neck and beneath the cloth. Arms retain skinning for archery.
 for(const {mesh,hair}of bodyMeshes){
  const geometry=mesh.geometry,index=geometry.index,position=geometry.attributes.position,parts={head:[],left:[],right:[],body:[]};
  for(let i=0;i<index.count;i+=3){const ids=[index.getX(i),index.getX(i+1),index.getX(i+2)];let key='body';
   if(hair||mesh.name!=='Body'||ids.every(id=>position.getY(id)>1.42))key='head';
   else if(ids.every(id=>position.getY(id)<.78))key=ids.reduce((sum,id)=>sum+position.getX(id),0)>0?'left':'right';
   parts[key].push(...ids);
  }
  bake(mesh,parts.head,statue.head,'Cabeza anatomica tallada de San Sebastian');
  bake(mesh,parts.left,statue.legs[1],'Pierna anatomica izquierda tallada');
  bake(mesh,parts.right,statue.legs[0],'Pierna anatomica derecha tallada');
  if(parts.body.length){mesh.geometry=geometry.clone();mesh.geometry.setIndex(parts.body);mesh.geometry.computeBoundingSphere();}else mesh.visible=false;
 }
 for(const mesh of fallback)mesh.visible=false;
 // Head tilt is baked through the neck's skin weights, keeping the neck seam closed.
 statue.anatomical={root,pose,rigs};statue.poseArms=pose;
 return statue.anatomical;
}
