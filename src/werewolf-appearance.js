import * as THREE from 'three';

export function createWerewolfMaterials(){
 const size=256,data=new Uint8Array(size*size*4);let seed=742;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const strand=Math.sin(x*.43+Math.sin(y*.031)*3+y*.08)*.5+.5;
  const patch=Math.sin(x*.051+Math.sin(y*.027))*Math.cos(y*.035),v=180+strand*10+patch*17+random()*13;
  data.set([v,v*.91,v*.84,255],(y*size+x)*4);
 }
 const texture=new THREE.DataTexture(data,size,size);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.colorSpace=THREE.SRGBColorSpace;texture.needsUpdate=true;
 const fur=new THREE.MeshStandardMaterial({color:0x756659,map:texture,bumpMap:texture,bumpScale:.006,roughness:.93});
 const mane=fur.clone();mane.color.set(0x51443a);
 const flesh=new THREE.MeshStandardMaterial({color:0x806d5c,map:texture,bumpMap:texture,bumpScale:.005,roughness:.89});
 return {fur,mane,flesh,claw:new THREE.MeshPhysicalMaterial({color:0x521d20,roughness:.49,clearcoat:.13}),skin:new THREE.MeshPhysicalMaterial({color:0x171516,roughness:.47,clearcoat:.16}),ivory:new THREE.MeshStandardMaterial({color:0xd2bd90,roughness:.6}),mouth:new THREE.MeshPhysicalMaterial({color:0x300e12,roughness:.36,clearcoat:.2}),eyes:new THREE.MeshStandardMaterial({color:0xc23819,emissive:0xff2411,emissiveIntensity:1.25,roughness:.3})};
}

export function addWerewolfDetails(root,head,arms,legs,materials){
 const {fur,mane,flesh,skin,ivory,mouth}=materials;
 const sphere=new THREE.SphereGeometry(1,28,18);
 function oval(parent,material,x,y,z,sx,sy,sz){const mesh=new THREE.Mesh(sphere,material);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 function curve(parent,points,radius,material){const mesh=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),20,radius,7,false),material);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 function claw(parent,points,radius){
  const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),geometry=new THREE.TubeGeometry(path,16,1,8,false),p=geometry.attributes.position;
  for(let i=0;i<=16;i++){const t=i/16,center=path.getPointAt(t),r=radius*Math.pow(1-t,.65)+.001;
   for(let j=0;j<=8;j++){const id=i*9+j,v=new THREE.Vector3().fromBufferAttribute(p,id).sub(center).multiplyScalar(r).add(center);p.setXYZ(id,v.x,v.y,v.z);}
  }
  geometry.computeVertexNormals();const mesh=new THREE.Mesh(geometry,materials.claw);mesh.castShadow=true;parent.add(mesh);return mesh;
 }
 let seed=197;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 // Curved tapered locks are batched per body part to retain silhouette without
 // hundreds of separate draw calls or flat triangular fur spikes.
 function coat(parent,patches,count,material){
  const positions=[],indices=[],colors=[];
  for(let n=0;n<count;n++){
   const patch=patches[n%patches.length],[cx,cy,cz,rx,ry,rz,length]=patch;
   const y=random()*2-1,angle=random()*Math.PI*2,r=Math.sqrt(1-y*y),normal=new THREE.Vector3(Math.cos(angle)*r,y,Math.sin(angle)*r);
   const base=new THREE.Vector3(cx+normal.x*rx,cy+normal.y*ry,cz+normal.z*rz);
   const out=new THREE.Vector3(normal.x*.5,-.8,normal.z*.5).normalize(),tangent=new THREE.Vector3(0,0,1).cross(out).normalize();
   const bitangent=new THREE.Vector3().crossVectors(out,tangent).normalize(),len=length*(.65+random()*.7),offset=positions.length/3,tone=.72+random()*.28;
   for(let ring=0;ring<5;ring++){
    const t=ring/4,width=(1-t)*len*.27+.0008,center=base.clone().addScaledVector(out,len*t).addScaledVector(normal,Math.sin(t*Math.PI)*len*.13);
    for(let j=0;j<5;j++){
     const a=j/5*Math.PI*2,v=center.clone().addScaledVector(tangent,Math.cos(a)*width).addScaledVector(bitangent,Math.sin(a)*width*.6);
     positions.push(v.x,v.y,v.z);colors.push(tone,tone*.97,tone*.93);
     if(ring<4){const id=offset+ring*5+j,next=offset+ring*5+(j+1)%5;indices.push(id,next,id+5,next,next+5,id+5);}
    }
   }
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  const mat=material.clone();mat.vertexColors=true;const mesh=new THREE.Mesh(geometry,mat);mesh.name='Pelaje irregular de mechones curvos';mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);
 }
 // A dark mantle frames the exposed chest, with shorter hair over the abdomen.
 coat(root,[[0,2.5,-.17,.82,.48,.43,.23],[0,2.12,-.22,.6,.61,.33,.16]],1050,mane);
 coat(root,[[0,1.44,-.07,.4,.38,.31,.06]],150,fur);
 for(const side of [-1,1]){
  const arm=arms[side<0?0:1];
  const beforeFingers=new Set(arm.children);
  for(let i=0;i<4;i++){
   const x=side*.2+(i-1.5)*.105,y=-1.46-Math.sin(i/3*Math.PI)*.045;
   oval(arm,flesh,x,y,.18,.052,.17,.07);
   claw(arm,[[x,y-.09,.21],[x,y-.18,.26],[x,y-.21,.33]],.027);
  }
  oval(arm,fur,side*.2-side*.23,-1.29,.2,.075,.17,.09);
  claw(arm,[[side*.2-side*.24,-1.38,.23],[side*.2-side*.25,-1.47,.3],[side*.2-side*.19,-1.51,.34]],.03);
  const grip=new THREE.Group();grip.name='Dedos que agarran los barrotes';grip.position.set(side*.2,-1.32,.14);arm.add(grip);arm.updateWorldMatrix(true,true);
  for(const part of [...arm.children])if(part!==grip&&!beforeFingers.has(part))grip.attach(part);
  coat(arm,[[side*.12,-.2,-.07,.24,.32,.22,.15],[side*.2,-.92,-.065,.19,.36,.16,.085]],270,fur);
  const leg=legs[side<0?0:1];
  coat(leg,[[0,-.22,-.12,.24,.38,.2,.08],[0,-.78,-.1,.145,.34,.155,.06]],180,fur);
 }
}
