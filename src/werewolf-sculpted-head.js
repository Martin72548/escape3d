import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Sculpted from the supplied reference, in native geometry so every pose stays animated.
export function createSculptedWerewolfHead(materials) {
 const {fur,mane,skin,ivory,mouth,eyes}=materials;
 const head=new THREE.Group();head.name='Cabeza de hocico largo y gesto feroz';
 const gum=new THREE.MeshStandardMaterial({color:0x692b2c,roughness:.52});
 const tongueMaterial=new THREE.MeshPhysicalMaterial({color:0x9b3e42,roughness:.48,clearcoat:.15});
 const dark=new THREE.MeshStandardMaterial({color:0x100b0d,roughness:.98});
 const sphere=new THREE.SphereGeometry(1,32,24);
 function oval(parent,mat,p,s){const mesh=new THREE.Mesh(sphere,mat);mesh.position.set(...p);mesh.scale.set(...s);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 function tube(parent,points,radius,mat){const mesh=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),18,radius,8,false),mat);mesh.castShadow=true;parent.add(mesh);return mesh;}
 function fang(parent,x,y,z,length,radius,up=false){
  const path=new THREE.CatmullRomCurve3([new THREE.Vector3(x,y,z),new THREE.Vector3(x*.97,y+(up?1:-1)*length*.6,z+.035),new THREE.Vector3(x*.94,y+(up?1:-1)*length,z+.015)]);
  const geometry=new THREE.TubeGeometry(path,12,1,9,false),p=geometry.attributes.position;
  for(let ring=0;ring<=12;ring++){
   const t=ring/12,center=path.getPointAt(t),r=radius*Math.pow(1-t,.72)+.0006;
   for(let j=0;j<=9;j++){const id=ring*10+j,v=new THREE.Vector3().fromBufferAttribute(p,id).sub(center).multiplyScalar(r).add(center);p.setXYZ(id,v.x,v.y,v.z);}
  }
  geometry.computeVertexNormals();const mesh=new THREE.Mesh(geometry,ivory);mesh.name='Colmillo curvo';mesh.castShadow=true;parent.add(mesh);
 }
 oval(head,fur,[0,.28,-.035],[.35,.39,.34]);
 oval(head,mane,[0,.21,-.17],[.39,.43,.3]);
 // Broad bridge tapering into a long canine nose, with separate muscular lips.
 const muzzle=oval(head,fur,[0,.12,.49],[.235,.19,.54]);muzzle.rotation.x=-.055;
 oval(head,fur,[0,.21,.34],[.18,.17,.35]);
 oval(head,skin,[0,.12,1.005],[.175,.105,.11]);
 oval(head,skin,[0,.165,1.03],[.14,.05,.087]);
 for(const side of [-1,1]){
  oval(head,dark,[side*.084,.128,1.099],[.033,.018,.012]);
  oval(head,fur,[side*.23,.1,.22],[.11,.17,.21]);
  const lip=oval(head,gum,[side*.188,-.015,.59],[.055,.065,.4]);lip.rotation.x=-.04;
  tube(head,[[side*.1,.055,.94],[side*.16,.09,.8],[side*.215,.105,.62],[side*.24,.03,.4]],.024,fur);
  // Dark sockets and a hooded, slanted red eye, rather than a luminous sphere.
  oval(head,dark,[side*.26,.34,.29],[.11,.067,.092]);
  const eye=oval(head,eyes,[side*.266,.343,.36],[.058,.025,.027]);eye.rotation.z=side*.28;
  oval(head,dark,[side*.266,.343,.383],[.008,.022,.004]);
  const brow=oval(head,mane,[side*.25,.4,.305],[.16,.065,.115]);brow.rotation.z=side*.36;
  tube(head,[[side*.19,.3,.36],[side*.26,.3,.37],[side*.325,.34,.31]],.014,fur);
  // Tall, backward swept ears with a recessed reddish interior.
  const earShape=new THREE.Shape();earShape.moveTo(-.12,0);earShape.quadraticCurveTo(-.13,.21,-.1,.43);earShape.quadraticCurveTo(.09,.29,.15,.06);earShape.quadraticCurveTo(.02,-.06,-.12,0);
  const ear=new THREE.Mesh(new THREE.ExtrudeGeometry(earShape,{depth:.045,bevelEnabled:true,bevelSize:.018,bevelThickness:.015,bevelSegments:2,steps:1}),mane);
  ear.position.set(side*.27,.49,-.13);ear.rotation.set(-.38,side*.25,-side*.4);head.add(ear);
  const inner=new THREE.Mesh(new THREE.ShapeGeometry(earShape,12),gum);inner.scale.set(.63,.7,1);inner.position.set(.008,.045,.065);ear.add(inner);
 }
 // A deep open throat, palate and a hinged lower jaw form the reference's snarl.
 oval(head,dark,[0,-.14,.24],[.26,.34,.29]);
 oval(head,mouth,[0,-.045,.52],[.185,.045,.45]);
 const jaw=new THREE.Group();jaw.name='Mandibula abierta con lengua';jaw.position.set(0,-.04,.08);jaw.rotation.x=.7;head.add(jaw);
 oval(jaw,fur,[0,-.085,.4],[.22,.115,.45]);
 oval(jaw,gum,[0,.012,.46],[.197,.045,.4]);
 oval(jaw,mouth,[0,.035,.4],[.155,.025,.34]);
 const tongue=oval(jaw,tongueMaterial,[0,.067,.48],[.115,.035,.29]);tongue.rotation.x=-.06;
 oval(jaw,tongueMaterial,[0,.076,.73],[.105,.04,.1]);
 tube(jaw,[[0,.102,.27],[0,.108,.47],[0,.11,.73]],.004,gum);
 for(const side of [-1,1]){
  tube(head,[[side*.23,-.02,.22],[side*.24,-.2,.29],[side*.19,-.38,.47]],.035,mouth);
  fang(head,side*.175,-.055,.82,.32,.046);
  fang(jaw,side*.172,.037,.7,.19,.035,true);
  for(let i=0;i<5;i++){
   const z=.32+i*.09,x=side*(.19-i*.006);
   fang(head,x,-.047,z,.09+(i%2)*.035,.021);
   fang(jaw,x,.036,z,.07+(i%2)*.025,.018,true);
  }
  for(let i=0;i<3;i++){fang(head,side*(.035+i*.044),-.038,.97,.085,.019);fang(jaw,side*(.033+i*.043),.035,.83,.065,.017,true);}
 }
 // Layered flattened locks around the cheeks and nape create the ragged mane.
 const locks=[];let seed=751;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<420;i++){
  const angle=random()*Math.PI*2,t=random(),normal=new THREE.Vector3(Math.cos(angle),.25+random()*.6,Math.sin(angle)).normalize();
  const facial=i>=230;
  const base=facial?new THREE.Vector3((random()-.5)*.52,.45+random()*.15,.15+random()*.13):new THREE.Vector3(normal.x*.34,.04+t*.4,normal.z*.31-.1);
  if(!facial&&base.z>.12&&Math.abs(base.x)<.25)continue;
  const direction=facial?new THREE.Vector3(base.x*.4,.12,-1).normalize():new THREE.Vector3(normal.x*.65,-.65,-.45).normalize(),length=facial?.07+random()*.07:.14+random()*.18;
  const path=new THREE.CatmullRomCurve3([base,base.clone().addScaledVector(direction,length*.45).addScaledVector(normal,.025),base.clone().addScaledVector(direction,length)]);
  const geometry=new THREE.TubeGeometry(path,5,1,4,false),p=geometry.attributes.position;
  for(let ring=0;ring<=5;ring++){
   const q=ring/5,center=path.getPointAt(q),width=(1-q)*(.025+length*.07)+.0004;
   for(let j=0;j<=4;j++){const id=ring*5+j,v=new THREE.Vector3().fromBufferAttribute(p,id).sub(center);v.y*=.4;v.multiplyScalar(width).add(center);p.setXYZ(id,v.x,v.y,v.z);}
  }
  geometry.computeVertexNormals();locks.push(geometry);
 }
 const coat=new THREE.Mesh(mergeGeometries(locks),mane);coat.name='Melena irregular alrededor de la cabeza';coat.castShadow=coat.receiveShadow=true;head.add(coat);locks.forEach(g=>g.dispose());
 return head;
}
