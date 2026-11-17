import * as THREE from 'three';
import { installDenisAnatomy } from './denis-anatomy.js';

export function addSaintDenis(parent){
 parent.name='San Denis sosteniendo su cabeza';
 const size=256,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  let hash=Math.imul(x+17,374761393)^Math.imul(y+29,668265263);hash=Math.imul(hash^(hash>>>13),1274126177);const grain=((hash^(hash>>>16))>>>0)/4294967295,vein=Math.sin(x*.032+Math.sin(y*.018)*2),pore=grain<.025?-12:0,v=232+vein*3+(grain-.5)*6+pore;data.set([v,v-3,v-8,255],(y*size+x)*4);
 }
 const texture=new THREE.DataTexture(data,size,size);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.magFilter=texture.minFilter=THREE.LinearFilter;texture.needsUpdate=true;texture.colorSpace=THREE.SRGBColorSpace;
 const stone=new THREE.MeshStandardMaterial({color:0xf4f0e5,map:texture,bumpMap:texture,bumpScale:.0014,roughness:.91});
 const trim=new THREE.MeshPhysicalMaterial({name:'Pan de oro envejecido de San Denis',color:0xcda33a,map:texture,bumpMap:texture,bumpScale:.00065,metalness:.78,roughness:.39,clearcoat:.06});
 const recess=stone.clone();recess.color.set(0x62594a);
 const sphere=new THREE.SphereGeometry(1,40,28);
 function mesh(geometry,material=stone,container=parent){const object=new THREE.Mesh(geometry,material);object.castShadow=object.receiveShadow=true;container.add(object);return object;}
 function oval(x,y,z,sx,sy,sz,material=stone,container=parent){const object=mesh(sphere,material,container);object.position.set(x,y,z);object.scale.set(sx,sy,sz);return object;}
 function tube(points,radius,material=trim,container=parent){return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),48,radius,12,false),material,container);}
 function robe(profile,outer=false){
  const geometry=new THREE.LatheGeometry(new THREE.SplineCurve(profile.map(p=>new THREE.Vector2(...p))).getPoints(112),128),p=geometry.attributes.position;
  for(let i=0;i<p.count;i++){
   const x=p.getX(i),y=p.getY(i),z=p.getZ(i),angle=Math.atan2(x,z),front=Math.max(0,Math.cos(angle));
   const lower=1-THREE.MathUtils.smoothstep(y,.3,1.65);
   const vertical=(Math.sin(angle*(outer?9:16)+Math.sin(y*1.8+angle*2)*.5)*(.012+.018*lower)+Math.sin(angle*29+y*2.6)*.004*lower);

   // Broad U-shaped folds sag under the supporting forearm rather than forming a regular cone.
   const sag=.22+.65*(x/.45)*(x/.45),swag=outer?Math.cos((y-sag)*24)*.026*front*front*(1-THREE.MathUtils.smoothstep(y,.9,1.45)):0;
   const chest=Math.exp(-(((y-1.65)/.21)**2))*Math.cos(angle*2)*.009;
   const radius=Math.hypot(x,z),offset=vertical+swag+chest;
   p.setXYZ(i,x*(1+offset/Math.max(radius,.1)),y,z*(1+offset/Math.max(radius,.1))*(outer?.77:.71));
  }
  geometry.computeVertexNormals();const object=mesh(geometry);object.name=outer?'Casulla tallada con pliegues suspendidos':'Alba de piedra con pliegues verticales';return object;
 }
 robe([[.36,.025],[.39,.13],[.33,.55],[.285,1.05],[.29,1.5],[.35,1.72],[.235,1.88],[.12,1.94]]);
 robe([[.32,.25],[.38,.48],[.40,.9],[.43,1.35],[.405,1.68],[.29,1.85],[.14,1.94]],true);
 for(const side of [-1,1])oval(side*.145,.045,.13,.095,.045,.165,stone);
 // A tilted, genuinely hollow collar and a stone halo match the reference silhouette.
 const neck=new THREE.Group();neck.name='Cuello vacio inclinado y decorado';neck.position.set(.015,1.945,.005);neck.rotation.set(.1,0,-.22);parent.add(neck);
 const collar=mesh(new THREE.CylinderGeometry(.145,.155,.105,64,1,true),trim,neck);
 for(const y of [-.05,.05]){const rim=mesh(new THREE.TorusGeometry(y>0?.145:.155,.009,10,64),stone,neck);rim.rotation.x=Math.PI/2;rim.position.y=y;}
 const interior=mesh(new THREE.CylinderGeometry(.127,.127,.12,48,1,true),recess,neck);interior.material=recess.clone();interior.material.side=THREE.BackSide;
 const hollow=mesh(new THREE.CircleGeometry(.128,48),recess,neck);hollow.rotation.x=-Math.PI/2;hollow.position.y=-.045;
 for(let i=0;i<12;i++){const angle=i/12*Math.PI*2;const carving=mesh(new THREE.TorusGeometry(.017,.0035,6,12),stone,neck);carving.position.set(Math.sin(angle)*.155,0,Math.cos(angle)*.155);carving.rotation.y=angle;carving.scale.y=1.15;}
 const halo=mesh(new THREE.CylinderGeometry(.29,.29,.035,96),stone);halo.name='Halo de piedra detras del cuello vacio';halo.rotation.x=Math.PI/2;halo.position.set(-.025,2.12,-.15);
 const haloRim=mesh(new THREE.TorusGeometry(.283,.007,10,96),trim);haloRim.position.copy(halo.position);haloRim.position.z+=.025;
 const handPoses=[
  {side:-1,position:new THREE.Vector3(-.14,1.29,.61),forward:new THREE.Vector3(.88,.12,.3),elbow:new THREE.Vector3(-.44,1.42,.19)},
  {side:1,position:new THREE.Vector3(.205,1.49,.65),forward:new THREE.Vector3(-.8,.18,-.04),elbow:new THREE.Vector3(.46,1.48,.18)}
 ];
 function sleeve(points,startRadius,endRadius){
  const curve=new THREE.CatmullRomCurve3(points),geometry=new THREE.TubeGeometry(curve,64,1,24,false),p=geometry.attributes.position;
  for(let ring=0;ring<=64;ring++){const t=ring/64,center=curve.getPointAt(t),radius=THREE.MathUtils.lerp(startRadius,endRadius,t)+Math.sin(t*Math.PI)*.018;
   for(let j=0;j<=24;j++){const id=ring*25+j,v=new THREE.Vector3().fromBufferAttribute(p,id).sub(center),fold=1+Math.sin(j/24*Math.PI*2*9+t*6)*.035;v.multiplyScalar(radius*fold).add(center);p.setXYZ(id,v.x,v.y,v.z);}
  }
  geometry.computeVertexNormals();return mesh(geometry);
 }
 const handFallback=[];
 for(const pose of handPoses){
  const {side,position,elbow}=pose,shoulder=new THREE.Vector3(side*.305,1.73,0),mid=elbow.clone().lerp(position,.65);
  sleeve([shoulder,elbow,mid,position],.145,.073);
  const axis=position.clone().sub(mid).normalize(),cuff=mesh(new THREE.CylinderGeometry(.077,.093,.11,40,1,true),trim);cuff.position.copy(position).addScaledVector(axis,-.025);cuff.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),axis);
  const wristEnd=position.clone().addScaledVector(pose.forward.clone().normalize(),.045),wristStart=position.clone().addScaledVector(axis,-.04);tube([wristStart.toArray(),position.toArray(),wristEnd.toArray()],.033,stone);

  for(const shift of [-.055,.03]){const edge=mesh(new THREE.TorusGeometry(shift<0?.09:.078,.006,8,40));edge.position.copy(position).addScaledVector(axis,shift);edge.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),axis);}
  handFallback.push(oval(position.x,position.y,position.z,.06,.045,.07));
  if(side<0){
   // A long fabric lappet falls from the supporting sleeve, as on the sculpture.
   const geometry=new THREE.PlaneGeometry(.21,.55,18,32),p=geometry.attributes.position;
   for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);p.setZ(i,Math.sin(x*85+y*2)*.011);p.setX(i,x+(.275-y)*.06);}
   geometry.computeVertexNormals();const material=stone.clone();material.side=THREE.DoubleSide;const lappet=mesh(geometry,material);lappet.position.copy(position).add(new THREE.Vector3(-.055,-.27,-.035));
  }
 }
 const head=new THREE.Group();head.name='Tete de San Denis dans ses mains';head.position.set(0,1.425,.5);head.rotation.set(-.035,.06,-.035);parent.add(head);
 const faceFallback=[oval(0,.035,0,.14,.185,.125,stone,head)];
 const jaw=new THREE.Group();jaw.name='Mandibula articulada de San Denis';jaw.position.set(0,-.035,.025);head.add(jaw);faceFallback.push(oval(0,-.055,.08,.09,.07,.07,stone,jaw));
 // Curved mitre faces, fine edging and a shallow relief cross replace the thick block shape.
 const outline=new THREE.Shape();outline.moveTo(-.165,.135);outline.quadraticCurveTo(-.19,.24,-.155,.31);outline.quadraticCurveTo(-.085,.405,0,.505);outline.quadraticCurveTo(.085,.405,.155,.31);outline.quadraticCurveTo(.19,.24,.165,.135);outline.closePath();
 const mitre=mesh(new THREE.ExtrudeGeometry(outline,{depth:.19,bevelEnabled:true,bevelThickness:.009,bevelSize:.009,bevelSegments:4,steps:1}),stone,head);mitre.position.z=-.065;
 tube([[-.16,.155,.139],[0,.14,.15],[.16,.155,.139]],.007,trim,head);
 tube([[0,.16,.14],[0,.31,.14],[0,.455,.132]],.006,trim,head);tube([[-.04,.335,.139],[.04,.335,.139]],.005,trim,head);
 for(const side of [-1,1]){
  tube([[side*.155,.18,.127],[side*.14,.3,.128],[0,.493,.127]],.0045,trim,head);
  tube([[side*.085,.18,-.075],[side*.1,-.005,-.12],[side*.12,-.16,-.11]],.013,trim,head);
 }
 // Raised foliate panels and beaded edging, inspired by the carved mitre.
 for(const side of [-1,1]){
  tube([[side*.018,.185,.144],[side*.064,.21,.146],[side*.118,.255,.143],[side*.09,.323,.141],[side*.031,.384,.138]],.0032,trim,head);
  tube([[side*.037,.23,.149],[side*.071,.246,.151],[side*.088,.275,.149],[side*.068,.296,.148],[side*.051,.276,.15],[side*.073,.265,.151]],.003,trim,head);
  tube([[side*.035,.344,.146],[side*.057,.335,.147],[side*.073,.35,.146],[side*.051,.378,.143]],.0025,trim,head);
  for(let i=0;i<12;i++){
   const t=i/11;
   oval(side*(.148*(1-t)),.182+t*.281,.14-t*.012,.0035,.004,.003,trim,head);
  }
 }
 tube([[-.155,.174,.145],[0,.161,.154],[.155,.174,.145]],.004,trim,head);
 const jewel=oval(0,.305,.149,.012,.018,.007,trim,head);jewel.name='Medallon central tallado de la mitra';
 const mouth=oval(0,-.075,.126,.073,.055,.025,new THREE.MeshStandardMaterial({color:0x180e0c,roughness:.9}),head);mouth.visible=false;
 const fangs=[],toothMaterial=new THREE.MeshStandardMaterial({color:0xe7d6af,roughness:.48});
 for(const side of [-1,1]){const upper=mesh(new THREE.ConeGeometry(.018,.085,12),toothMaterial,head);upper.position.set(side*.053,-.073,.16);upper.rotation.z=Math.PI;upper.visible=false;fangs.push(upper);const lower=mesh(new THREE.ConeGeometry(.014,.06,12),toothMaterial,jaw);lower.position.set(side*.045,-.065,.125);lower.visible=false;fangs.push(lower);}
 // Slender crozier behind the lifted arm; all details share the carved stone finish.
 tube([[.59,.035,-.05],[.59,1.4,-.05],[.59,2.39,-.05]],.018,trim);
 tube([[.59,2.39,-.05],[.59,2.57,-.05],[.46,2.63,-.05],[.37,2.52,-.05],[.45,2.46,-.05],[.49,2.52,-.05]],.018,trim);
 for(let i=0;i<3;i++){const ring=mesh(new THREE.TorusGeometry(.032,.007,8,24),stone);ring.rotation.x=Math.PI/2;ring.position.set(.59,2.3+i*.035,-.05);}
 addDenisVestmentDetails(parent,stone,trim);
 const statue={head,collar,jaw,mouth,fangs,handPoses};
 statue.appearanceReady=installDenisAnatomy(parent,statue,faceFallback,handFallback,stone,trim).catch(error=>{console.warn('No se pudo cargar la anatomia de San Denis:',error);return null;});parent.userData.appearanceReady=statue.appearanceReady;
 return statue;
}

function addDenisVestmentDetails(parent,stone,trim){
 const robes=parent.children.filter(object=>object.name.startsWith('Casulla tallada')||object.name.startsWith('Alba de piedra'));
 parent.updateWorldMatrix(true,true);
 // A reduced sampling mesh keeps the gilding projection fast at scene startup.
 const samplingRobes=robes.map(robe=>{
  const geometry=new THREE.BufferGeometry(),indices=[];
  geometry.setAttribute('position',robe.geometry.attributes.position);
  const radial=128,rows=112;
  // LatheGeometry stores one complete vertical profile per angular segment.
  const profile=rows+1;
  for(let col=0;col<radial;col+=4)for(let row=0;row<rows;row+=4){
   const a=col*profile+row,b=(col+4)*profile+row;
   indices.push(a,b,a+4,b,b+4,a+4);
  }
  geometry.setIndex(indices);geometry.computeBoundingSphere();
  const sample=new THREE.Mesh(geometry,robe.material);sample.matrixWorld.copy(robe.matrixWorld);return sample;
 });
 const ray=new THREE.Raycaster(),direction=new THREE.Vector3(0,0,-1).transformDirection(parent.matrixWorld);
 const shade=trim.clone();shade.color.set(0x866324);shade.roughness=.57;
 function surface(x,y){
  ray.set(parent.localToWorld(new THREE.Vector3(x,y,1.1)),direction);
  const hit=ray.intersectObjects(samplingRobes,false)[0];
  return hit?parent.worldToLocal(hit.point.clone()).add(new THREE.Vector3(0,0,.004)):null;
 }
 function relief(points,radius=.003,material=trim){
  const samples=points.map(([x,y])=>surface(x,y)).filter(Boolean);if(samples.length<3)return;
  const mesh=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(samples),Math.max(16,samples.length*3),radius,6,false),material);
  mesh.name='Broderie de pierre sur la chasuble';mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);
 }
 // Narrow gilded cloth panels follow the deep ivory folds of the reference.
 function ribbon(path,width,name){
  const positions=[],indices=[],rows=64,columns=6;
  for(let row=0;row<=rows;row++){
   const t=row/rows,[x,y]=path(t);
   for(let col=0;col<=columns;col++){
    const point=surface(x+(col/columns-.5)*width,y);
    if(!point)return;
    positions.push(point.x,point.y,point.z+.001);
   }
  }
  for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
   const i=row*(columns+1)+col;indices.push(i,i+1,i+columns+1,i+1,i+columns+2,i+columns+1);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  const material=trim.clone();material.side=THREE.DoubleSide;
  const band=new THREE.Mesh(geometry,material);band.name=name;band.castShadow=band.receiveShadow=true;parent.add(band);
 }
 ribbon(t=>[.06-.22*t+Math.sin(t*7)*.025,1.68-t*1.26],.052,'Orfroi frontal de pan de oro');
 for(let i=0;i<15;i++){
  const t=i/14,x=.06-.22*t+Math.sin(t*7)*.025,y=1.68-t*1.26;
  relief([[x-.018,y-.02],[x,y+.016],[x+.018,y-.02],[x,y-.03],[x-.018,y-.02]],.0018,shade);
 }
 // Broad curved mantle hem with a gold edge and small quatrefoil ornaments.
 const hem=x=>.29+.85*(x/.43)**2;
 for(const dy of [0,.022])relief(Array.from({length:65},(_,i)=>{const x=-.36+i/64*.72;return [x,hem(x)+dy];}),.005);
 for(let i=0;i<15;i++){
  const x=-.33+i/14*.66,y=hem(x)+.06;
  relief([[x,y-.017],[x-.012,y],[x,y+.017],[x+.012,y],[x,y-.017]],.0022);
 }
 for(const y of [.1,.26])relief(Array.from({length:65},(_,i)=>[-.33+i/64*.66,y]),.005);
 for(let i=0;i<13;i++){
  const x=-.3+i*.05;
  ribbon(t=>[x,.12+t*.12],.027,'Bordado dorado del alba');
  relief([[x-.013,.17],[x,.192],[x+.013,.17],[x,.15],[x-.013,.17]],.002,shade);
 }
 samplingRobes.forEach(mesh=>mesh.geometry.dispose());
 // Subtle age deposits sit in the deeper folds rather than painting black cracks.
 for(const robe of robes){
  const geometry=robe.geometry,p=geometry.attributes.position,colors=[];
  for(let i=0;i<p.count;i++){
   const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=Math.atan2(x,z);
   const fold=.5+.5*Math.sin(a*16+Math.sin(y*1.8+a*2)*.5);
   const dust=(1-THREE.MathUtils.smoothstep(y,.12,.48))*.07;
   const tone=.94+fold*.06-dust+Math.sin(x*53+y*37+z*29)*.008;
   colors.push(tone,tone*.993,tone*.975);
  }
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  robe.material=stone.clone();robe.material.vertexColors=true;
 }
}
