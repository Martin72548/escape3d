import { publicAssetBase } from './public-asset-base.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export async function installZombieAppearance(zombie){
 const {root,arms,legs,head,torso}=zombie;
 const proxies=[];root.traverse(o=>{if(o.isMesh)proxies.push(o);});
 const asset=await new GLTFLoader().loadAsync(`${publicAssetBase}models/prisoner/base_body.glb`);
 const visuals=new THREE.Group();visuals.name='Zombi anatomico con traje desgarrado';visuals.scale.setScalar(1.08);root.add(visuals);const model=asset.scene;visuals.add(model);
 const meshes=[];model.traverse(o=>{if(o.isMesh)meshes.push(o);});
 const faceMeshes=[];
 for(const mesh of meshes){
  mesh.castShadow=mesh.receiveShadow=true;mesh.frustumCulled=false;if(['Teeth','Tongue'].includes(mesh.name))mesh.visible=false;
  if(mesh.morphTargetInfluences){mesh.morphTargetInfluences.fill(0);for(const [name,value]of [['gender_male',.8],['age_old',.65],['weight_min',.55],['muscle_min',.3],['face_cheekbones_incr',.4],['face_mouth_width_incr',.35]]){const i=mesh.morphTargetDictionary[name];if(i!==undefined)mesh.morphTargetInfluences[i]=value;}}
  const original=Array.isArray(mesh.material)?mesh.material:[mesh.material],materials=original.map(source=>{const material=source.clone();if(material.name==='Skin'){material.color.set(0x9d8bb7);material.roughness=.79;material.normalScale?.set(.9,.9);}else if(material.name==='Eye')material.color.set(0xc9c7ae);else if(material.name==='Iris')material.color.set(0x6b7651);else if(material.name==='Teeth')material.color.set(0xb6ac86);else if(material.name==='Tongue')material.color.set(0x493647);if(material.map)material.map.anisotropy=8;return material;});mesh.material=Array.isArray(mesh.material)?materials:materials[0];
  if(mesh.name==='Body'&&mesh.morphTargetInfluences){
   mesh.geometry=mesh.geometry.clone();const positions=mesh.geometry.attributes.position,delta=new Float32Array(positions.count*3);
   for(let i=0;i<positions.count;i++){
    const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i),front=THREE.MathUtils.smoothstep(z,.015,.07),center=1-THREE.MathUtils.smoothstep(Math.abs(x),.035,.095),lower=THREE.MathUtils.smoothstep(y,1.395,1.425)*(1-THREE.MathUtils.smoothstep(y,1.46,1.487)),weight=mesh.name==='Teeth'?(y<1.482?1:0):mesh.name==='Tongue'?1:front*center*lower;
    const dy=y-1.495,dz=z+.015,angle=.76;
    delta[i*3+1]=(dy*Math.cos(angle)-dz*Math.sin(angle)-dy)*weight;
    delta[i*3+2]=(dy*Math.sin(angle)+dz*Math.cos(angle)-dz)*weight;
   }
   if(mesh.name==='Body'){
    const oldIndex=mesh.geometry.index,kept=[];
    for(let k=0;k<oldIndex.count;k+=3){const ids=[oldIndex.getX(k),oldIndex.getX(k+1),oldIndex.getX(k+2)];let x=0,y=0,z=0;for(const id of ids){x+=positions.getX(id)/3;y+=positions.getY(id)/3;z+=positions.getZ(id)/3;}
     const innerMouth=(x/.034)**2+((y-1.487)/.013)**2<1&&z>.10;
     if(!innerMouth)kept.push(...ids);
    }mesh.geometry.setIndex(kept);
   }
   const attribute=new THREE.BufferAttribute(delta,3);attribute.name='zombie_mouth';const i=mesh.geometry.morphAttributes.position.length;mesh.geometry.morphAttributes.position.push(attribute);if(mesh.geometry.morphAttributes.normal)mesh.geometry.morphAttributes.normal.push(new THREE.BufferAttribute(new Float32Array(delta.length),3));mesh.morphTargetDictionary.zombie_mouth=i;mesh.morphTargetInfluences.push(0);faceMeshes.push(mesh);
  }
 }
 const bones=new Map();model.traverse(o=>{if(o.isBone)bones.set(o.name,o);});
 const wrists=arms.map((arm,i)=>{const wrist=new THREE.Object3D();wrist.position.set(i===0?-.02:.02,-.045,.32);arm.userData.elbow.add(wrist);return wrist;});
 const sources=[torso,head,...arms,...arms.map(a=>a.userData.elbow),...wrists,...legs],poses=sources.map(o=>o.quaternion.clone());sources.forEach(o=>o.quaternion.identity());root.updateWorldMatrix(true,true);
 const rest=new Map(sources.map(o=>[o,o.matrixWorld.clone()])),mappings=[];
 function mapBone(name,source,positionControl=false,endSource=null){
  const bone=bones.get(name);if(!bone||!source)return;const rotation=bone.getWorldQuaternion(new THREE.Quaternion());
  if(endSource){const child=bone.children.find(o=>o.isBone);if(child){const from=child.getWorldPosition(new THREE.Vector3()).sub(bone.getWorldPosition(new THREE.Vector3())).normalize(),to=endSource.getWorldPosition(new THREE.Vector3()).sub(source.getWorldPosition(new THREE.Vector3())).normalize();rotation.premultiply(new THREE.Quaternion().setFromUnitVectors(from,to));}}
  if(name.startsWith('hand_')){const from=bone.getWorldPosition(new THREE.Vector3()).sub(bone.parent.getWorldPosition(new THREE.Vector3())).normalize(),to=source.getWorldPosition(new THREE.Vector3()).sub(source.parent.getWorldPosition(new THREE.Vector3())).normalize();rotation.premultiply(new THREE.Quaternion().setFromUnitVectors(from,to));}
  const position=positionControl?source.getWorldPosition(new THREE.Vector3()):bone.getWorldPosition(new THREE.Vector3()),matrix=new THREE.Matrix4().compose(position,rotation,bone.getWorldScale(new THREE.Vector3()));
  mappings.push({bone,source,relative:rest.get(source).clone().invert().multiply(matrix)});
 }
 for(const name of ['spine_01','spine_02','spine_03'])mapBone(name,torso);mapBone('neck_01',head);mapBone('head',head);
 for(const [i,suffix]of [[0,'r'],[1,'l']]){const arm=arms[i],elbow=arm.userData.elbow;mapBone('upperarm_'+suffix,arm,true,elbow);mapBone('lowerarm_'+suffix,elbow,true,wrists[i]);mapBone('hand_'+suffix,wrists[i],true);for(const name of ['thigh_','calf_','foot_','ball_'])mapBone(name+suffix,legs[i]);}
 const depth=o=>{let d=0;while(o.parent){d++;o=o.parent;}return d;};mappings.sort((a,b)=>depth(a.bone)-depth(b.bone));sources.forEach((o,i)=>o.quaternion.copy(poses[i]));root.updateWorldMatrix(true,true);
 const mouthGeometry=new THREE.BufferGeometry(),mouthPositions=new Float32Array(33*3),mouthIndices=[];
 for(let i=1;i<=32;i++)mouthIndices.push(0,i,i===32?1:i+1);
 mouthGeometry.setAttribute('position',new THREE.BufferAttribute(mouthPositions,3));mouthGeometry.setIndex(mouthIndices);
 const mouth=new THREE.Mesh(mouthGeometry,new THREE.MeshBasicMaterial({color:0x100c12,side:THREE.DoubleSide}));mouth.name='Interior profundo de la boca';mouth.frustumCulled=false;bones.get('head').add(mouth);
 root.updateWorldMatrix(true,true);const mouthToHead=bones.get('head').matrixWorld.clone().invert().multiply(model.matrixWorld),mouthVertex=new THREE.Vector3();
 const toothMaterial=new THREE.MeshStandardMaterial({color:0xb8af8b,roughness:.63});const teeth=[];
 for(const lower of [false,true])for(let i=0;i<10;i++){
  const x=(i-4.5)*.0064,z=.135-Math.pow(Math.abs(x)/.032,2)*.028;
  const tooth=new THREE.Mesh(new THREE.SphereGeometry(1,10,8),toothMaterial);tooth.castShadow=true;bones.get('head').add(tooth);teeth.push({mesh:tooth,point:new THREE.Vector3(x,lower?1.469:1.496,z),lower});
 }
 const toothMatrix=new THREE.Matrix4(),toothQuaternion=new THREE.Quaternion(),toothScale=new THREE.Vector3(.0034,.007,.004);
 // Woven, stained suit fabric. Real clothing surfaces replace the zombie's proxy clothes.
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(256,256);
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){const grain=(Math.sin(x*73+y*41)*.5+.5)*15,weave=(x%3===0?-17:0)+(y%4===0?-10:0),shade=176+weave+grain;pixels.data.set([shade,shade,shade,255],(y*256+x)*4);}ctx.putImageData(pixels,0,0);
 const fabric=new THREE.CanvasTexture(canvas);fabric.colorSpace=THREE.SRGBColorSpace;fabric.wrapS=fabric.wrapT=THREE.RepeatWrapping;
 const coat=new THREE.MeshStandardMaterial({color:0x443039,map:fabric,bumpMap:fabric,bumpScale:.006,roughness:1,side:THREE.DoubleSide}),shirt=coat.clone(),tieMat=coat.clone();shirt.color.set(0xb7c1b5);tieMat.color.set(0x762d2d);
 const sphere=new THREE.SphereGeometry(1,28,20);
 function oval(parent,material,x,y,z,sx,sy,sz){const m=new THREE.Mesh(sphere,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
 const shirtMesh=new THREE.Mesh(new THREE.LatheGeometry([[.21,-.21],[.22,-.05],[.25,.16],[.27,.32],[.20,.41],[.085,.49]].map(([r,y])=>new THREE.Vector2(r,y)),32),shirt);shirtMesh.scale.z=.78;shirtMesh.castShadow=shirtMesh.receiveShadow=true;torso.add(shirtMesh);oval(torso,coat,0,-.16,-.01,.23,.14,.15);
 function panel(parent,points,material,z){const shape=new THREE.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();const g=new THREE.ShapeGeometry(shape);const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,z-.18*Math.pow(Math.abs(p.getX(i)),1.3));g.computeVertexNormals();const m=new THREE.Mesh(g,material);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
 for(const side of [-1,1]){
  panel(torso,[[side*.025,.38],[side*.235,.34],[side*.26,.1],[side*.22,-.26],[side*.16,-.21],[side*.13,-.30],[side*.065,-.23],[side*.045,.07]],coat,.21);
  panel(torso,[[side*.03,.39],[side*.15,.34],[side*.07,.13],[side*.008,.32]],shirt,.215);
  panel(torso,[[side*.15,.36],[side*.22,.35],[side*.20,.19],[side*.08,.09],[side*.12,.27]],coat,.225);
 }
 const back=new THREE.Mesh(new THREE.CylinderGeometry(.28,.23,.65,24,1,true,Math.PI/2,Math.PI),coat);back.scale.z=.68;back.position.set(0,.13,-.005);torso.add(back);
 const tie=new THREE.Group();tie.position.set(0,.31,.20);torso.add(tie);panel(tie,[[-.028,0],[.028,0],[.022,-.07],[-.018,-.07]],tieMat,.005);panel(tie,[[-.016,-.06],[.016,-.06],[.034,-.36],[0,-.42],[-.034,-.36]],tieMat,.008);
 const rags=[];
 for(const [i,side]of [[0,-1],[1,1]]){
  const arm=arms[i],elbow=arm.userData.elbow;
  const sleeve=new THREE.Mesh(new THREE.CylinderGeometry(.088,.073,.34,20,5,true),coat);const axis=elbow.position.clone().normalize();sleeve.position.copy(elbow.position).multiplyScalar(.5);sleeve.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),axis);arm.add(sleeve);
  for(let j=0;j<7;j++){const strip=new THREE.Mesh(new THREE.PlaneGeometry(.025,.065+(j%3)*.018),coat);strip.position.copy(elbow.position).multiplyScalar(.9);strip.position.x+=Math.sin(j)*.07;strip.position.y+=Math.cos(j)*.045;strip.rotation.x=1.2;arm.add(strip);rags.push(strip);}
  const pants=new THREE.Mesh(new THREE.CylinderGeometry(.10,.081,.39,20,7,true),coat);pants.position.y=-.19;legs[i].add(pants);
  const positions=pants.geometry.attributes.position;for(let k=0;k<positions.count;k++){const y=positions.getY(k);if(y<-.15)positions.setY(k,y+(Math.sin(positions.getX(k)*94+i)*.03));}positions.needsUpdate=true;pants.geometry.computeVertexNormals();
  if(i===0){const lower=new THREE.Mesh(new THREE.CylinderGeometry(.069,.05,.19,16,4,true),coat);lower.position.set(0,-.51,0);legs[i].add(lower);}
 }
 const hairMat=new THREE.MeshStandardMaterial({color:0x26241f,roughness:1});
 for(let i=0;i<5;i++){
  const x=(i-2)*.012,y=1.647-Math.abs(x)*.2,z=.03-(i%3)*.005;
  const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(x,y,z),new THREE.Vector3(x*1.15,y+.045+(i%3)*.008,z-.01),new THREE.Vector3(x*1.35,y+.065+(i%2)*.012,z-.045)]);
  const strand=new THREE.Mesh(new THREE.TubeGeometry(curve,12,.0015,5,false),hairMat);model.add(strand);model.updateWorldMatrix(true,true);bones.get('head').attach(strand);
 }

 proxies.forEach(mesh=>mesh.layers.set(2));
 zombie.visuals=visuals;zombie.faceMeshes=faceMeshes;zombie.ready=true;
 const matrix=new THREE.Matrix4(),desired=new THREE.Matrix4();
 zombie.updateAppearance=(age,opening)=>{
  root.updateWorldMatrix(true,true);
  for(const {bone,source,relative}of mappings){desired.multiplyMatrices(source.matrixWorld,relative);matrix.copy(bone.parent.matrixWorld).invert().multiply(desired);matrix.decompose(bone.position,bone.quaternion,bone.scale);bone.updateWorldMatrix(false,false);}
  for(const mesh of faceMeshes)mesh.morphTargetInfluences[mesh.morphTargetDictionary.zombie_mouth]=opening;
  mouth.visible=opening>.12;
  for(let i=0;i<=32;i++){
   const a=i===0?0:(i-1)/32*Math.PI*2,s=i===0?0:Math.sin(a),c=i===0?0:Math.cos(a);
   mouthVertex.set(c*(.032+opening*.01),1.485-opening*.041+s*(.005+opening*.041),.112-opening*.031+s*opening*.031).applyMatrix4(mouthToHead);
   mouthPositions[i*3]=mouthVertex.x;mouthPositions[i*3+1]=mouthVertex.y;mouthPositions[i*3+2]=mouthVertex.z;
  }mouthGeometry.attributes.position.needsUpdate=true;
  for(const tooth of teeth){
   const point=tooth.point.clone();toothQuaternion.identity();
   if(tooth.lower&&zombie.jawDetached)continue;
   if(tooth.lower){const dy=point.y-1.495,dz=point.z+.015,angle=.76;point.y+=opening*(dy*Math.cos(angle)-dz*Math.sin(angle)-dy);point.z+=opening*(dy*Math.sin(angle)+dz*Math.cos(angle)-dz);toothQuaternion.setFromAxisAngle(new THREE.Vector3(1,0,0),opening*angle);}
   toothMatrix.compose(point,toothQuaternion,toothScale).premultiply(mouthToHead);toothMatrix.decompose(tooth.mesh.position,tooth.mesh.quaternion,tooth.mesh.scale);
  }
  tie.rotation.z=Math.sin(age*8)*.09;rags.forEach((rag,i)=>rag.rotation.z=Math.sin(age*15+i)*.12);
  model.updateWorldMatrix(false,true);
 };
 zombie.detachJaw=scene=>{
  const body=faceMeshes[0];root.updateWorldMatrix(true,true);body.skeleton.update();
  const positions=body.geometry.attributes.position,index=body.geometry.index,kept=[],removed=[];
  for(let k=0;k<index.count;k+=3){const ids=[index.getX(k),index.getX(k+1),index.getX(k+2)];let x=0,y=0,z=0;for(const id of ids){x+=positions.getX(id)/3;y+=positions.getY(id)/3;z+=positions.getZ(id)/3;}const jaw=y>1.405&&y<1.478&&z>.025&&Math.abs(x)<.085;(jaw?removed:kept).push(...ids);}
  const jawGeometry=new THREE.BufferGeometry(),points=[],uv=[];const vertex=new THREE.Vector3();
  for(const id of removed){body.getVertexPosition(id,vertex);vertex.applyMatrix4(body.matrixWorld);points.push(vertex.x,vertex.y,vertex.z);uv.push(body.geometry.attributes.uv.getX(id),body.geometry.attributes.uv.getY(id));}
  jawGeometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));jawGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));jawGeometry.computeVertexNormals();jawGeometry.computeBoundingBox();const center=jawGeometry.boundingBox.getCenter(new THREE.Vector3());jawGeometry.translate(-center.x,-center.y,-center.z);
  const jaw=new THREE.Group();jaw.name='Mandibula desprendida del zombi';jaw.position.copy(center);jaw.add(new THREE.Mesh(jawGeometry,body.material));scene.add(jaw);
  body.geometry.setIndex(kept);body.geometry.computeBoundingSphere();
  for(const tooth of teeth.filter(t=>t.lower))jaw.attach(tooth.mesh);
  zombie.jawDetached=true;return jaw;
 };
 zombie.updateAppearance(0,.2);
}
