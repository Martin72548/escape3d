import { publicAssetBase } from './public-asset-base.js';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// Bake the anatomical face and hands into the statue's existing detachable
// groups so the bouncing head and articulated bite retain their original rig.
export async function installDenisAnatomy(parent,statue,faceFallback,handFallback,stone,trim){
 const base=publicAssetBase,asset=await new GLTFLoader().loadAsync(`${base}models/prisoner/base_body.glb`);
 if(statue.head.parent!==parent)return null;
 const model=asset.scene;model.updateMatrixWorld(true);const bones=new Map(),meshes=[];
 model.traverse(object=>{if(object.isBone)bones.set(object.name,object);if(object.isMesh){meshes.push(object);if(object.morphTargetInfluences){object.morphTargetInfluences.fill(0);for(const[name,weight]of [['gender_male',1],['age_old',.95],['corr_gender_male__age_old',.65],['weight_min',.22],['face_jaw_width_incr',.24],['face_cheekbones_incr',.48],['face_nose_length_incr',.28],['face_nose_height_incr',.3],['face_eye_size_decr',.18],['face_lips_decr',.22],['face_chin_incr',.12]]){const id=object.morphTargetDictionary[name];if(id!==undefined)object.morphTargetInfluences[id]=weight;}}}});
 for(const suffix of ['l','r'])for(const finger of ['index','middle','ring','pinky'])for(const joint of ['01','02','03']){const bone=bones.get(`${finger}_${joint}_${suffix}`);if(bone)bone.rotation.x+=joint==='02'?.2:.12;}
 model.updateMatrixWorld(true);
 const bodySource=meshes.find(mesh=>mesh.name==='Body'),bounds=new THREE.Box3(),sample=new THREE.Vector3();
 bodySource.skeleton.update();for(let i=0;i<bodySource.geometry.attributes.position.count;i++){if(bodySource.geometry.attributes.position.getY(i)<1.435)continue;bodySource.getVertexPosition(i,sample).applyMatrix4(bodySource.matrixWorld);bounds.expandByPoint(sample);}
 const extent=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3()),sx=.285/extent.x,sy=.35/extent.y,sz=.265/extent.z;
 const faceMatrix=new THREE.Matrix4().makeTranslation(-center.x*sx,-.135-bounds.min.y*sy,.15-bounds.max.z*sz).multiply(new THREE.Matrix4().makeScale(sx,sy,sz));

 const point=new THREE.Vector3();
 function bake(source,indices,owner,transform,name){
  if(!indices.length)return;
  const geometry=source.geometry.clone(),positions=new Float32Array(geometry.attributes.position.count*3);source.skeleton?.update();
  for(let i=0;i<geometry.attributes.position.count;i++){source.getVertexPosition(i,point).applyMatrix4(source.matrixWorld).applyMatrix4(transform).toArray(positions,i*3);}
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setIndex(indices);geometry.morphAttributes={};geometry.deleteAttribute('skinIndex');geometry.deleteAttribute('skinWeight');geometry.computeVertexNormals();geometry.computeBoundingSphere();
  const material=stone.clone(),original=Array.isArray(source.material)?source.material[0]:source.material;if(original.normalMap){material.normalMap=original.normalMap;material.normalScale.set(.85,.85);}
  const result=new THREE.Mesh(geometry,material);result.name=name;result.castShadow=result.receiveShadow=true;owner.add(result);return result;
 }
 for(const mesh of meshes){
  const p=mesh.geometry.attributes.position,index=mesh.geometry.index,upper=[],lower=[];
  for(let i=0;i<index.count;i+=3){const ids=[index.getX(i),index.getX(i+1),index.getX(i+2)];if(mesh.name==='Body'&&!ids.every(id=>p.getY(id)>1.435))continue;
   const jaw=mesh.name==='Body'&&ids.every(id=>p.getY(id)<1.505&&p.getZ(id)>.04);(jaw?lower:upper).push(...ids);
  }
  bake(mesh,upper,statue.head,faceMatrix,'Rostro anatomico de piedra de San Denis');
  statue.jaw.updateMatrix();bake(mesh,lower,statue.jaw,statue.jaw.matrix.clone().invert().multiply(faceMatrix),'Mandibula anatomica tallada');
 }
 const body=meshes.find(mesh=>mesh.name==='Body');
 if(body){
  for(const [suffix,side]of [['l',1],['r',-1]]){
   const hand=bones.get('hand_'+suffix);if(!hand)continue;
   const handBones=new Set();hand.traverse(bone=>{if(bone.isBone)handBones.add(bone.name);});
   const index=body.geometry.index,skin=body.geometry.attributes.skinIndex,weight=body.geometry.attributes.skinWeight,indices=[];
   function handWeight(id){let total=0;for(let k=0;k<4;k++){const bone=body.skeleton.bones[skin.getComponent(id,k)];if(handBones.has(bone?.name))total+=weight.getComponent(id,k);}return total;}
   for(let i=0;i<index.count;i+=3){const ids=[index.getX(i),index.getX(i+1),index.getX(i+2)];if(ids.every(id=>handWeight(id)>.25&&new THREE.Vector3().fromBufferAttribute(body.geometry.attributes.position,id).distanceTo(hand.getWorldPosition(new THREE.Vector3()))<.19))indices.push(...ids);}
   const middle=bones.get('middle_01_'+suffix),origin=hand.getWorldPosition(new THREE.Vector3()),forward=middle.getWorldPosition(new THREE.Vector3()).sub(origin).normalize();
   const pose=statue.handPoses.find(pose=>pose.side===side);
   const rotation=new THREE.Quaternion().setFromUnitVectors(forward,pose.forward.clone().normalize());
   const matrix=new THREE.Matrix4().makeTranslation(...pose.position.toArray()).multiply(new THREE.Matrix4().makeRotationFromQuaternion(rotation)).multiply(new THREE.Matrix4().makeScale(1.1,1.1,1.1)).multiply(new THREE.Matrix4().makeTranslation(-origin.x,-origin.y,-origin.z));
   bake(body,indices,parent,matrix,'Mano anatomica que sostiene la cabeza '+side);
  }
 }
 for(const object of [...faceFallback,...handFallback])object.visible=false;
 // A continuous beard volume follows the chin, with fine carved locks on its surface.
 const beardPositions=[],beardIndices=[],columns=128,rows=40;
 for(let row=0;row<=rows;row++)for(let col=0;col<=columns;col++){
  const t=row/rows,angle=(col/columns-.5)*Math.PI*1.25,top=-.015-.055*Math.cos(angle),bottom=-.105+.045*Math.pow(Math.abs(Math.sin(angle)),1.5),radius=.108*(1-t*.28),ridge=Math.sin(angle*49+t*35)*.0009;
  beardPositions.push(Math.sin(angle)*(radius+ridge),THREE.MathUtils.lerp(top,bottom,t),.07+Math.cos(angle)*(.068-t*.01+ridge));
  if(row<rows&&col<columns){const i=row*(columns+1)+col;beardIndices.push(i,i+columns+1,i+1,i+1,i+columns+1,i+columns+2);}
 }
 const beardGeometry=new THREE.BufferGeometry();beardGeometry.setAttribute('position',new THREE.Float32BufferAttribute(beardPositions,3));beardGeometry.setIndex(beardIndices);beardGeometry.computeVertexNormals();
 const beardMaterial=stone.clone();beardMaterial.side=THREE.DoubleSide;const beard=new THREE.Mesh(beardGeometry,beardMaterial);beard.name='Barba continua esculpida';beard.castShadow=true;statue.jaw.add(beard);
 for(const side of [-1,1]){
  const moustacheCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(side*.004,-.019,.141),new THREE.Vector3(side*.035,-.023,.15),new THREE.Vector3(side*.067,-.037,.135)]);
  const moustache=new THREE.Mesh(new THREE.TubeGeometry(moustacheCurve,32,.0045,12,false),stone);moustache.castShadow=true;statue.head.add(moustache);
  for(let i=0;i<9;i++){
   const y=.13-i*.012,x=side*(.113+Math.sin(i*.8)*.005),curve=new THREE.CatmullRomCurve3([new THREE.Vector3(x,y,-.014),new THREE.Vector3(x+side*.011,y-.025,.012),new THREE.Vector3(x,y-.047,.024)]);
   const lock=new THREE.Mesh(new THREE.TubeGeometry(curve,12,.008,8,false),stone);lock.castShadow=true;statue.head.add(lock);
  }
 }
 addCarvedFaceDetails(statue.head,stone,trim);
 return {head:statue.head,hands:true};
}

// Project small carved ridges onto the anatomical surface rather than placing
// flat lines in front of the face. The shallow grooves retain the stone finish.
function addCarvedFaceDetails(head,stone,trim){
 const face=head.children.find(mesh=>mesh.name==='Rostro anatomico de piedra de San Denis');
 if(!face)return;
 head.updateWorldMatrix(true,true);
 const ray=new THREE.Raycaster(),direction=new THREE.Vector3(0,0,-1).transformDirection(head.matrixWorld);
 const crease=stone.clone();crease.color.set(0x998c76);crease.roughness=.95;
 function carve(points,radius=.0009,material=crease){
  const projected=[];
  for(const [x,y] of points){
   const origin=head.localToWorld(new THREE.Vector3(x,y,.6));ray.set(origin,direction);
   const hit=ray.intersectObject(face,false)[0];
   if(hit){const p=head.worldToLocal(hit.point.clone());p.z+=radius*.35;projected.push(p);}
  }
  if(projected.length<3)return;
  const curve=new THREE.CatmullRomCurve3(projected);
  const line=new THREE.Mesh(new THREE.TubeGeometry(curve,32,radius,6,false),material);
  line.name='Detalle de talla facial';line.castShadow=line.receiveShadow=true;head.add(line);
 }
 for(let row=0;row<3;row++){
  const y=.09+row*.018;
  carve(Array.from({length:17},(_,i)=>{const x=(i-8)*.01;return [x,y+.009*(1-(x/.08)**2)+Math.sin(i*.9+row)*.0012];}),.0008);
 }
 for(const side of [-1,1]){
  carve([[side*.012,.088],[side*.027,.083],[side*.047,.081],[side*.065,.073],[side*.079,.062]],.0022,trim);
  carve([[side*.025,.027],[side*.04,.016],[side*.057,.015],[side*.074,.024]],.001);
  carve([[side*.03,-.014],[side*.043,-.027],[side*.054,-.044],[side*.058,-.06]],.0012);
  carve([[side*.014,.09],[side*.016,.108],[side*.02,.124]],.0009);
  for(let i=0;i<3;i++)carve([[side*.074,.037],[side*.085,.035-i*.005],[side*.098,.036-i*.008]],.00065);
 }
}
