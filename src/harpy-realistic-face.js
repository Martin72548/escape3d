import { publicAssetBase } from './public-asset-base.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export async function refineFinalHarpy(harpy){
 const head=harpy.bird.getObjectByName('Cabeza de mujer');
 const base=publicAssetBase,loader=new GLTFLoader();
 const [bodyAsset,hairAsset]=await Promise.all([loader.loadAsync(`${base}models/prisoner/base_body.glb`),loader.loadAsync(`${base}models/saint-lucia/hair_long01.glb`)]);
 const body=bodyAsset.scene,hair=hairAsset.scene;
 body.traverse(object=>{
  if(!object.morphTargetInfluences)return;object.morphTargetInfluences.fill(0);
  for(const [name,value]of [['gender_female',1],['face_jaw_width_decr',.22],['face_cheekbones_incr',.16],['face_eye_size_decr',.08]]){
   const index=object.morphTargetDictionary[name];if(index!==undefined)object.morphTargetInfluences[index]=value;
  }
 });
 body.updateMatrixWorld(true);hair.updateMatrixWorld(true);
 const bounds=new THREE.Box3(),point=new THREE.Vector3();
 const skin=body.getObjectByName('Body');skin.skeleton.update();
 for(let i=0;i<skin.geometry.attributes.position.count;i++){
  if(skin.geometry.attributes.position.getY(i)<1.435)continue;
  skin.getVertexPosition(i,point).applyMatrix4(skin.matrixWorld);bounds.expandByPoint(point);
 }
 const size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
 const scale=new THREE.Vector3(.59/size.x,.78/size.y,.56/size.z);
 const transform=new THREE.Matrix4().makeTranslation(-center.x*scale.x,-.36-bounds.min.y*scale.y,.37-bounds.max.z*scale.z).multiply(new THREE.Matrix4().makeScale(scale.x,scale.y,scale.z));
 const realistic=new THREE.Group();realistic.name='Rostro femenino anatomico y cabello natural';
 for(const model of [body,hair])model.traverse(source=>{
  if(!source.isMesh)return;source.skeleton?.update();
  const original=source.geometry,index=original.index,positions=original.attributes.position,indices=[];
  for(let i=0;i<index.count;i+=3){
   const ids=[index.getX(i),index.getX(i+1),index.getX(i+2)];
   if(model===body&&source.name==='Body'&&ids.some(id=>positions.getY(id)<1.435))continue;
   indices.push(...ids);
  }
  if(!indices.length)return;
  const geometry=original.clone(),vertices=new Float32Array(positions.count*3);
  for(let i=0;i<positions.count;i++)source.getVertexPosition(i,point).applyMatrix4(source.matrixWorld).applyMatrix4(transform).toArray(vertices,i*3);
  geometry.setAttribute('position',new THREE.BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.morphAttributes={};geometry.deleteAttribute('skinIndex');geometry.deleteAttribute('skinWeight');geometry.computeVertexNormals();geometry.computeBoundingSphere();
  const material=source.material.clone();material.roughness=model===hair?.78:.65;material.metalness=0;
  const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=mesh.receiveShadow=true;realistic.add(mesh);
 });
 if(!realistic.children.length)throw Error('No anatomical harpy face geometry');
 head.children.forEach(part=>part.visible=false);head.add(realistic);
 harpy.hair.forEach(lock=>lock.mesh.visible=false);
 // Give each feather a shallow camber instead of a completely flat silhouette.
 const curved=new Map();
 harpy.bird.traverse(object=>{
  if(!object.isMesh||object.geometry.type!=='ShapeGeometry'||object.geometry.parameters.curveSegments!==8)return;
  const original=object.geometry;
  if(!curved.has(original)){
   const geometry=original.clone(),p=geometry.attributes.position;
   for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,p.getY(i)+Math.sin(z*Math.PI)*.035+x*x*.3);}
   geometry.computeVertexNormals();curved.set(original,geometry);
  }
  object.geometry=curved.get(original);object.material.metalness=0;object.material.roughness=.88;
 });
 return realistic;
}
