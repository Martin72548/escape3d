import * as THREE from 'three';

export function cuticleTexture(seed=73){
 const size=128,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const grain=(seed/4294967296-.5)*34;
  const value=THREE.MathUtils.clamp(190+grain+18*Math.sin(x*.23)*Math.sin(y*.17)+10*Math.cos(y*.9),0,255);
  const i=(y*size+x)*4;data[i]=data[i+1]=data[i+2]=value;data[i+3]=255;
 }
 const map=new THREE.DataTexture(data,size,size);map.wrapS=map.wrapT=THREE.RepeatWrapping;map.needsUpdate=true;
 return map;
}

function curveMesh(parent,points,radius,material,taper=false){
 const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
 const geometry=new THREE.TubeGeometry(curve,20,radius,7,false);
 if(taper){
  const positions=geometry.attributes.position;
  for(let ring=0;ring<=20;ring++){
   const center=curve.getPointAt(ring/20),factor=1-ring/20*.97;
   for(let j=0;j<=7;j++){const index=ring*8+j;const v=new THREE.Vector3().fromBufferAttribute(positions,index).sub(center).multiplyScalar(factor).add(center);positions.setXYZ(index,v.x,v.y,v.z);}
  }
  geometry.computeVertexNormals();
 }
 const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
}

export function detailMantis(root,head,arms,{green,light,dark}){
 const vein=new THREE.MeshStandardMaterial({color:0x26391b,roughness:.94});
 const horn=new THREE.MeshStandardMaterial({color:0x211b10,roughness:.63});
 // Folded forewings, central seam and branching veins across the abdomen.
 for(const side of [-1,1]){
  const wing=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),green);
  wing.position.set(side*.075,.825,-.28);wing.scale.set(.095,.025,.45);wing.rotation.y=side*.07;root.add(wing);
  curveMesh(root,[[side*.03,.846,.13],[side*.09,.853,-.25],[side*.06,.84,-.68]],.004,vein);
  for(let i=0;i<8;i++){
   const z=.05-i*.085;
   curveMesh(root,[[side*.065,.85,z],[side*.12,.847,z-.05],[side*.15,.835,z-.1]],.0025,vein);
  }
  // Paired chewing mouthparts instead of a single painted mouth slit.
  curveMesh(head,[[side*.07,-.075,.1],[side*.105,-.12,.16],[side*.025,-.15,.18]],.025,horn,true);
  curveMesh(head,[[side*.055,-.15,.12],[side*.08,-.21,.16],[side*.035,-.24,.18]],.01,light,true);
  for(let i=0;i<7;i++){
   const z=-.6+i*.105;
   curveMesh(root,[[side*.04,.64,z],[side*.17,.66,z+.015],[side*.18,.72,z+.02]],.008,dark);
  }
 }
 for(const {forearm,side}of arms){
  for(let i=0;i<8;i++){
   const y=.04+i*.042;
   curveMesh(forearm,[[side*.055,y,.10],[side*.035,y+.02,.15],[side*.015,y+.04,.18]],.011,horn,true);
  }
  curveMesh(forearm,[[side*.04,.08,.19],[side*.02,.035,.23],[0,.04,.27]],.018,horn,true);
 }
 // Bristled sensory margins rather than eyebrows or glowing eyes.
 const bristles=[];
 for(let i=0;i<55;i++){
  const side=i%2?1:-1,y=.7+(i%20)*.027,z=.08+(i%9)*.025;
  bristles.push(side*.065,y,z,side*.09,y+.012,z+.025);
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(bristles,3));
 root.add(new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:0x252517})));
}

export function detailScorpion(root,tail,claws,{shell,dark,tipMaterial}){
 const eye=new THREE.MeshStandardMaterial({color:0x070605,roughness:.16});
 function bead(parent,material,x,y,z,size){const m=new THREE.Mesh(new THREE.SphereGeometry(size,8,6),material);m.position.set(x,y,z);parent.add(m);}
 // Central and lateral eye clusters, subtle hard-shell ridges and granulation.
 for(const side of [-1,1]){
  bead(root,eye,side*.035,.391,.42,.019);
  for(let i=0;i<3;i++)bead(root,eye,side*(.19+i*.008),.32,.49-i*.037,.012);
  for(let i=0;i<7;i++){
   const z=-.34+i*.1;
   curveMesh(root,[[side*.035,.402,z],[side*.18,.385,z],[side*.25,.32,z-.02]],.008,dark);
   for(let j=0;j<3;j++)bead(root,shell,side*(.09+j*.055),.391-j*.012,z,.012);
  }
  curveMesh(root,[[side*.07,.25,.54],[side*.10,.23,.63],[side*.035,.22,.66]],.025,tipMaterial,true);
 }
 for(const fingers of claws)for(const {pivot,jaw}of fingers){
  for(let i=0;i<5;i++){
   const z=.065+i*.032;
   curveMesh(pivot,[[jaw*.075,0,z],[jaw*.045,0,z+.015],[jaw*.025,0,z+.018]],.011,tipMaterial,true);
  }
 }
 // Venom bulb and hooked aculeus, replacing the straight cone.
 const bulb=new THREE.Mesh(new THREE.SphereGeometry(1,20,14),shell);bulb.position.set(0,.79,.36);bulb.scale.set(.09,.115,.105);tail.add(bulb);
 curveMesh(tail,[[0,.76,.41],[0,.67,.49],[0,.57,.49],[0,.53,.43]],.045,tipMaterial,true);
 const hairs=[];
 for(let i=0;i<100;i++){
  const side=i%2?1:-1,z=-.35+(i%24)*.04,x=side*(.22+(i%5)*.07),y=.16+(i%3)*.015;
  hairs.push(x,y,z,x+side*.035,y+.045,z+.012);
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(hairs,3));
 root.add(new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:0x645240,transparent:true,opacity:.65})));
}
