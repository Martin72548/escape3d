import { publicAssetBase } from './public-asset-base.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Bake the existing anatomical mesh into a lightweight, static desiccated face.
export async function installMummyFace(head,proxies){
 const {scene}=await new GLTFLoader().loadAsync(`${publicAssetBase}models/prisoner/base_body.glb`);
 scene.traverse(mesh=>{if(mesh.morphTargetInfluences){mesh.morphTargetInfluences.fill(0);for(const [name,value]of [['gender_male',.8],['age_old',1],['weight_min',1],['muscle_min',1],['face_cheekbones_incr',.8]]){const i=mesh.morphTargetDictionary[name];if(i!==undefined)mesh.morphTargetInfluences[i]=value;}}});
 scene.updateMatrixWorld(true);
 const face=new THREE.Group();face.name='Rostro anatomico desecado de la momia';
 const vertex=new THREE.Vector3();
 scene.traverse(source=>{
  if(!source.isMesh||!['Body','Eyes_1','Eyes_2','Eyes_3','Teeth'].includes(source.name))return;
  const geometry=source.geometry,positions=[],uv=[],indices=[],lookup=new Map(),index=geometry.index;
  const get=id=>{if(lookup.has(id))return lookup.get(id);source.getVertexPosition(id,vertex);const x=vertex.x,y=vertex.y,z=vertex.z;
   // Hollow cheeks and eye sockets retain the anatomy and its skin texture.
   const socket=Math.exp(-((Math.abs(x)-.035)**2/.00036+(y-1.551)**2/.00022))*THREE.MathUtils.smoothstep(z,.035,.08);
   vertex.set(x*1.20,(y-1.58)*1.10,(z-socket*.009)*1.12-.012);
   const n=positions.length/3;positions.push(vertex.x,vertex.y,vertex.z);uv.push(geometry.attributes.uv.getX(id),geometry.attributes.uv.getY(id));lookup.set(id,n);return n;};
  for(let k=0;k<index.count;k+=3){const ids=[index.getX(k),index.getX(k+1),index.getX(k+2)];if(ids.some(id=>geometry.attributes.position.getY(id)<1.475))continue;indices.push(...ids.map(get));}
  if(!indices.length)return;
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
  const mat=source.material.clone();mat.roughness=1;
  if(source.name==='Body'){mat.color.set(0x84745a);mat.normalScale?.set(1.5,1.5);}else if(source.name.startsWith('Eyes')){mat.color.set(0x302b22);}else mat.color.set(0x9f9175);
  const mesh=new THREE.Mesh(g,mat);mesh.castShadow=mesh.receiveShadow=true;face.add(mesh);
 });
 if(!face.children.length)throw Error('No anatomical face geometry');
 proxies.forEach(mesh=>mesh.visible=false);head.add(face);
 return face;
}
