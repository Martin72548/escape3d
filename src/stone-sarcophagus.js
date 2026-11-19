import { publicAssetBase } from './public-asset-base.js';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export function createStoneSarcophagus(parent){
 const root=new THREE.Group();root.userData.museumTomb=true;root.name='Sarcofago medieval de piedra tallada con figura yacente';parent.add(root);
 const size=512,color=new Uint8Array(size*size*4),normal=new Uint8Array(size*size*4),rough=new Uint8Array(size*size*4),height=new Float32Array(size*size);
 function hash(x,y){let n=Math.imul(x,374761393)^Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295;}
 function noise(x,y){const ix=Math.floor(x),iy=Math.floor(y),a=x-ix,b=y-iy,u=a*a*(3-2*a),v=b*b*(3-2*b);return THREE.MathUtils.lerp(THREE.MathUtils.lerp(hash(ix,iy),hash(ix+1,iy),u),THREE.MathUtils.lerp(hash(ix,iy+1),hash(ix+1,iy+1),u),v);}
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const patch=noise(x/75,y/75),grain=noise(x/4,y/4),pore=Math.max(0,.31-grain)*2,fine=hash(x,y),lichen=THREE.MathUtils.smoothstep(noise(x/29+37,y/29+71),.64,.84);
  const shade=128+(patch-.5)*40+(grain-.5)*16+(fine-.5)*14-pore*34;
  color.set([shade+1-lichen*13,shade+3-lichen*5,shade-8-lichen*20,255],(y*size+x)*4);rough.set([235,235,235,255],(y*size+x)*4);height[y*size+x]=patch*.15+grain*.04-pore*.09;
 }
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const dx=(height[y*size+Math.min(size-1,x+1)]-height[y*size+Math.max(0,x-1)])*12,dy=(height[Math.min(size-1,y+1)*size+x]-height[Math.max(0,y-1)*size+x])*12,inv=1/Math.hypot(dx,dy,1);
  normal.set([(-dx*inv*.5+.5)*255,(-dy*inv*.5+.5)*255,(inv*.5+.5)*255,255],(y*size+x)*4);
 }
 function texture(data){const t=new THREE.DataTexture(data,size,size);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.generateMipmaps=true;t.anisotropy=8;t.needsUpdate=true;return t;}
 const map=texture(color);map.colorSpace=THREE.SRGBColorSpace;
 const stone=new THREE.MeshStandardMaterial({map,normalMap:texture(normal),normalScale:new THREE.Vector2(.8,.8),roughnessMap:texture(rough),roughness:1,metalness:0});
 const recess=stone.clone();recess.color.set(0x777d69);const lightStone=stone.clone();lightStone.color.set(0xd5d2b9);const moss=stone.clone();moss.color.set(0x626b46);
 const shell=new THREE.Group();shell.name='Parois sculptées du sarcophage';root.add(shell);root.userData.shell=shell;
 function mesh(geometry,material=stone,container=shell){const m=new THREE.Mesh(geometry,material);m.castShadow=m.receiveShadow=true;container.add(m);return m;}
 const lid=new THREE.Group();lid.name='Tapa superior rompible del sarcofago';root.add(lid);root.userData.lid=lid;root.userData.stoneMaterial=stone;
 function block(w,h,d,x,y,z,material=stone){const m=mesh(new RoundedBoxGeometry(w,h,d,3,Math.min(.027,w*.15,h*.18,d*.15)),material,y>=.95?lid:shell);m.position.set(x,y,z);return m;}
 function frame(w,h,d,y,material=stone){const edge=.16;for(const side of [-1,1]){block(edge,h,d,side*(w-edge)/2,y,0,material);block(w-edge*2,h,edge,0,y,side*(d-edge)/2,material);}}
 function oval(x,y,z,sx,sy,sz,container=root){const m=mesh(new THREE.SphereGeometry(1,32,24),stone,container);m.position.set(x,y,z);m.scale.set(sx,sy,sz);return m;}
 frame(1.84,.15,3.56,.075,recess);frame(1.75,.14,3.47,.21);
 frame(1.52,.68,3.18,.6);block(1.68,.11,3.34,0,.99,0,lightStone);block(1.78,.15,3.47,0,1.12,0);block(1.59,.065,3.29,0,1.225,0,lightStone);
 // Permanent front steps share the tomb's stone and stay outside its breakable lid.
 const entranceSteps=new THREE.Group();entranceSteps.name='Escalones delanteros permanentes de la tumba';root.add(entranceSteps);root.userData.entranceSteps=entranceSteps;
 for(let i=0;i<6;i++){
  const h=.2*(i+1),step=mesh(new RoundedBoxGeometry(1.24,h,.34,3,.018),stone,entranceSteps);
  step.name='Escalon delantero '+(i+1);step.position.set(0,h/2,3.3-i*.32);
 }
 // Recessed long panels, framed by deep carved moldings.
 for(const side of [-1,1]){
  block(.022,.43,2.57,side*.769,.615,0,recess);
  for(const y of [.38,.85])block(.048,.045,2.67,side*.793,y,0,lightStone);
  for(const z of [-1.31,1.31])block(.05,.5,.055,side*.794,.615,z,lightStone);
  for(const z of [-1.08,-.73,.73,1.08]){
   block(.058,.34,.075,side*.81,.62,z);
   for(const y of [.49,.62,.75])block(.075,.035,.17,side*.825,y,z);
  }
  const medallion=mesh(new THREE.CylinderGeometry(.23,.23,.055,48),lightStone);medallion.rotation.z=Math.PI/2;medallion.position.set(side*.818,.62,0);
  const rim=mesh(new THREE.TorusGeometry(.205,.013,10,48),recess);rim.rotation.y=Math.PI/2;rim.position.set(side*.854,.62,0);
  const letter=new THREE.Shape();letter.moveTo(-.065,-.12);letter.lineTo(-.065,.12);letter.lineTo(.005,.12);letter.bezierCurveTo(.16,.12,.16,-.12,.005,-.12);letter.closePath();
  const hole=new THREE.Path();hole.moveTo(-.028,-.082);hole.lineTo(.005,-.082);hole.bezierCurveTo(.106,-.082,.106,.082,.005,.082);hole.lineTo(-.028,.082);hole.closePath();letter.holes.push(hole);
  const initial=mesh(new THREE.ExtrudeGeometry(letter,{depth:.012,bevelEnabled:true,bevelSize:.003,bevelThickness:.003,bevelSegments:2,steps:1}),stone);initial.rotation.y=side*Math.PI/2;initial.position.set(side*.861,.62,0);
 }
 // Corner piers have independently stacked blocks and weathered capitals.
 for(const x of [-.76,.76])for(const z of [-1.5,1.5]){
  for(let row=0;row<6;row++)block(.28+(row%2)*.055,.145,.28+(row%2)*.055,x,.37+row*.157,z,row<2?moss:stone);
  block(.37,.105,.37,x,1.27,z,lightStone);block(.24,.22,.24,x,1.42,z);
 }
 for(const end of [-1,1]){
  block(1.22,.4,.027,0,.62,end*1.603,recess);
  for(const x of [-.5,0,.5]){block(.035,.3,.042,x,.62,end*1.625,lightStone);block(.19,.035,.045,x,.65,end*1.631,lightStone);}
 }
 // Raised meanders along the rim, matching the reference's carved border.
 for(const side of [-1,1])for(let i=0;i<18;i++){
  const z=-1.34+i*.155;
  block(.1,.025,.023,side*.64,1.274,z);block(.023,.025,.105,side*(.64+.04),1.274,z+.041);block(.065,.025,.023,side*.665,1.274,z+.086);
 }
 for(const end of [-1,1])for(let i=0;i<8;i++){
  const x=-.54+i*.15;block(.105,.025,.022,x,1.274,end*1.35);block(.022,.025,.08,x+.041,1.274,end*1.32);
 }
 // Patches sit in the lowest crevices rather than covering the whole stone.
 for(let i=0;i<26;i++){const side=i%2?1:-1,z=-1.43+(i%13)*.23;block(.025,.025+(i%3)*.012,.11,side*.887,.13+(i%4)*.047,z,moss);}
 block(.43,.055,.36,0,1.29,-1.15,lightStone);
 const effigy=new THREE.Group();effigy.name='Figura yacente tallada sobre la tapa';effigy.position.set(0,1.34,1.17);effigy.rotation.x=-Math.PI/2;effigy.scale.setScalar(1.4);lid.add(effigy);
 root.userData.effigy=effigy;
 const fallback=new THREE.Group();effigy.add(fallback);oval(0,1.07,0,.18,.38,.12,fallback);oval(0,1.53,0,.11,.15,.1,fallback);for(const side of [-1,1])oval(side*.09,.48,0,.075,.43,.075,fallback);
 const robeProfile=[[.185,.7],[.19,.85],[.16,1.02],[.19,1.23],[.2,1.34],[.08,1.42]];
 const garment=new THREE.LatheGeometry(robeProfile.map(p=>new THREE.Vector2(...p)),48);const gp=garment.attributes.position;
 for(let i=0;i<gp.count;i++){const x=gp.getX(i),y=gp.getY(i),z=gp.getZ(i),a=Math.atan2(x,z),fold=1+Math.sin(a*12+y*3)*.03;gp.setXYZ(i,x*fold,y,z*.72*fold);}garment.computeVertexNormals();root.userData.effigyGarment=mesh(garment,stone,effigy);
 const loader=new GLTFLoader();const base=publicAssetBase;
 root.userData.appearanceReady=loader.loadAsync(`${base}models/prisoner/base_body.glb`).then(asset=>{
  const model=asset.scene;effigy.add(model);
  model.traverse(object=>{
   if(!object.isMesh)return;object.userData.livingMaterials=object.material;object.material=stone;object.castShadow=object.receiveShadow=true;object.frustumCulled=false;
   if(object.morphTargetInfluences){object.morphTargetInfluences.fill(0);const i=object.morphTargetDictionary.gender_male;if(i!==undefined)object.morphTargetInfluences[i]=.7;}
   if(object.name==='Body'){
    object.userData.fullBodyGeometry=object.geometry;
    const index=object.geometry.index,p=object.geometry.attributes.position,visible=[];
    for(let i=0;i<index.count;i+=3){const ids=[index.getX(i),index.getX(i+1),index.getX(i+2)];if(ids.every(id=>p.getY(id)>.72&&p.getY(id)<1.4&&Math.abs(p.getX(id))<.22))continue;visible.push(...ids);}
    object.geometry=object.geometry.clone();object.geometry.setIndex(visible);
   }
  });
  model.updateWorldMatrix(true,true);
  for(const [suffix,side]of [['l',1],['r',-1]]){
   const upper=model.getObjectByName('upperarm_'+suffix),lower=model.getObjectByName('lowerarm_'+suffix),hand=model.getObjectByName('hand_'+suffix);
   function pose(bone,start,end){model.updateWorldMatrix(true,true);const child=bone.children.find(o=>o.isBone),original=child.getWorldPosition(new THREE.Vector3()).sub(bone.getWorldPosition(new THREE.Vector3())).normalize();const a=model.localToWorld(start.clone()),b=model.localToWorld(end.clone());const q=bone.getWorldQuaternion(new THREE.Quaternion()).premultiply(new THREE.Quaternion().setFromUnitVectors(original,b.sub(a).normalize()));const matrix=new THREE.Matrix4().compose(a,q,bone.getWorldScale(new THREE.Vector3())).premultiply(bone.parent.matrixWorld.clone().invert());matrix.decompose(bone.position,bone.quaternion,bone.scale);bone.updateWorldMatrix(false,true);}
   const shoulder=model.worldToLocal(upper.getWorldPosition(new THREE.Vector3())),elbow=new THREE.Vector3(side*.24,1.02,.16),wrist=new THREE.Vector3(side*.035,1.12,.205);
   pose(upper,shoulder,elbow);pose(lower,elbow,wrist);hand.position.copy(hand.parent.worldToLocal(model.localToWorld(wrist)));hand.updateWorldMatrix(false,true);
  }
  fallback.visible=false;return model;
 }).catch(error=>{console.warn('No se pudo cargar la figura yacente:',error);return null;});
 return root;
}
