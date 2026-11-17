import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Detailed feather geometry belongs only to the final, close-up presentation.
export function refineFinalHarpyWings(harpy) {
 const size=256,data=new Uint8Array(size*size*4);
 let seed=6921;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/(size-1),v=y/(size-1),shaft=Math.exp(-Math.abs(u-.48)*160);
  const barbs=Math.sin(v*440+Math.abs(u-.48)*95+Math.sin(v*19)*2);
  const shade=110+barbs*22+shaft*65+(random()-.5)*16+Math.sin(v*6)*18;
  data.set([shade,shade*.98,shade*.93,255],(y*size+x)*4);
 }
 const texture=new THREE.DataTexture(data,size,size);texture.colorSpace=THREE.SRGBColorSpace;texture.needsUpdate=true;texture.anisotropy=4;
 const materials=[0x747776,0x626769,0x96958d].map(color=>new THREE.MeshStandardMaterial({color,map:texture,bumpMap:texture,bumpScale:.012,roughness:.84,metalness:0,side:THREE.DoubleSide}));
 const shaftMaterial=new THREE.MeshStandardMaterial({color:0x8b8a7e,roughness:.76});
 const wrists=[];
 function feather(batches,shafts,base,end,width,tone){
  const length=base.distanceTo(end),rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),end.clone().sub(base).normalize());
  const transform=new THREE.Matrix4().compose(base,rotation,new THREE.Vector3(1,1,1));
  const positions=[],uv=[],indices=[],rows=18,columns=10;
  const camber=t=>Math.sin(t*Math.PI)*length*.045+t*t*length*.025;
  for(let row=0;row<=rows;row++){
   const t=row/rows,profile=(.025+Math.pow(Math.sin(t*Math.PI),.68))*(1-t*.3);
   for(let col=0;col<=columns;col++){
    const across=col/columns*2-1;
    const notch=Math.abs(across)>.8?1-.025*Math.sin(row*13.7+tone*3):1;
    positions.push(across*width*profile*(across<0?.43:.57)*notch+Math.sin(t*Math.PI)*width*.07,camber(t)+(1-across*across)*width*.07,t*length);
    uv.push(col/columns,t);
    if(row<rows&&col<columns){const a=row*(columns+1)+col,b=a+columns+1;indices.push(a,b,a+1,b,b+1,a+1);}
   }
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.applyMatrix4(transform);batches[tone].push(geometry);
  const curve=new THREE.CatmullRomCurve3([0,.25,.5,.75,.96].map(t=>new THREE.Vector3(0,camber(t)+width*.075,t*length)));
  shafts.push(new THREE.TubeGeometry(curve,12,.005,5,false).applyMatrix4(transform));
 }
 function finish(group,batches,shafts){
  for(const [i,list]of batches.entries())if(list.length){const mesh=new THREE.Mesh(mergeGeometries(list),materials[i]);mesh.name='Plumas curvas con barbas y bordes separados';mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);list.forEach(g=>g.dispose());}
  if(shafts.length){const mesh=new THREE.Mesh(mergeGeometries(shafts),shaftMaterial);mesh.name='Canones finos de las plumas';mesh.castShadow=true;group.add(mesh);shafts.forEach(g=>g.dispose());}
 }
 for(const wing of harpy.wings){
  // The flight scene keeps its original wings; these instances serve the final only.
  for(const child of [...wing.children])child.removeFromParent();
  wing.name='Ala anatomica con plumas superpuestas';
  const wrist=new THREE.Group();wrist.name='Muneca y remeras primarias';wrist.position.set(2.15,.025,.04);wing.add(wrist);wrists.push(wrist);
  const batches=[[],[],[]],shafts=[],outer=[[],[],[]],outerShafts=[];
  // Broad, overlapping secondary flight feathers follow the bent forearm.
  for(let i=0;i<18;i++){
   const x=.28+i*.112;
   feather(batches,shafts,new THREE.Vector3(x,.015,.12),new THREE.Vector3(x-.24,.02,-.95-Math.sin(i/17*Math.PI)*.48),.29,i%3);
  }
  // Long asymmetric primaries fan out at the wrist, with individually visible tips.
  for(let i=0;i<11;i++){
   const t=i/10;
   feather(outer,outerShafts,new THREE.Vector3(t*.64,.015,-t*.08),new THREE.Vector3(.5+t*1.5,-.04-t*.06,-1.65+t*.95),.34-t*.07,i%3);
  }
  // Three tiers of small coverts conceal the feather roots and give the wing depth.
  for(let row=0;row<3;row++)for(let i=0;i<23;i++){
   const x=.12+i*.1;
   feather(batches,shafts,new THREE.Vector3(x,.06+row*.028,.34-row*.13),new THREE.Vector3(x-.1,.09+row*.025,-.22-row*.17),.19,row===0?2:i%2);
  }
  for(let row=0;row<2;row++)for(let i=0;i<12;i++){
   const t=i/11;
   feather(outer,outerShafts,new THREE.Vector3(t*.8,.07+row*.03,.21-row*.12),new THREE.Vector3(t*1.12+.15,.05,-.38-row*.18),.2,(i+row)%3);
  }
  finish(wing,batches,shafts);finish(wrist,outer,outerShafts);
 }
 return wrists;
}
