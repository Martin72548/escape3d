import * as THREE from 'three';

// A hand-built, low-poly storybook adventurer that keeps the game's existing
// shoulder, elbow, wrist, torso and leg controls intact.
export function installStylizedPrisoner(person) {
 const materials={
  skin:new THREE.MeshStandardMaterial({color:0xe9a17d,roughness:1,flatShading:true}),
  skinShade:new THREE.MeshStandardMaterial({color:0xc97960,roughness:1,flatShading:true}),
  hair:new THREE.MeshStandardMaterial({color:0x873b2b,roughness:1,flatShading:true}),
  hairLight:new THREE.MeshStandardMaterial({color:0xa94a34,roughness:1,flatShading:true}),
  coat:new THREE.MeshStandardMaterial({color:0x68734b,roughness:1,flatShading:true}),
  coatLight:new THREE.MeshStandardMaterial({color:0x828358,roughness:1,flatShading:true}),
  coatDark:new THREE.MeshStandardMaterial({color:0x484937,roughness:1,flatShading:true}),
  hood:new THREE.MeshStandardMaterial({color:0xb89b42,roughness:1,flatShading:true}),
  trousers:new THREE.MeshStandardMaterial({color:0xc9903b,roughness:1,flatShading:true}),
  trousersLight:new THREE.MeshStandardMaterial({color:0xe0ac51,roughness:1,flatShading:true}),
  leather:new THREE.MeshStandardMaterial({color:0x342823,roughness:1,flatShading:true}),
  eye:new THREE.MeshStandardMaterial({color:0x2d211d,roughness:1}),
  white:new THREE.MeshStandardMaterial({color:0xf1d8bb,roughness:1}),
 };
 const visualRoot=new THREE.Group();visualRoot.name='Aspecto ilustrado del prisionero';person.add(visualRoot);
 // The original meshes remain as off-camera animation and collision proxies.
 person.traverse(object=>{if(object.isMesh)object.layers.set(2);});
 const torso=person.getObjectByName('prisoner-torso');
 const castArm=person.getObjectByName('casting-arm'),castElbow=person.getObjectByName('casting-elbow'),castWrist=person.getObjectByName('casting-wrist');
 const leftArm=person.getObjectByName('left-arm'),leftElbow=person.getObjectByName('left-elbow'),leftWrist=person.getObjectByName('left-wrist');
 const legs=person.userData.walkingLegs||[];
 function mesh(parent,geometry,material,name,position=[0,0,0]){const object=new THREE.Mesh(geometry,material);object.name=name;object.position.set(...position);object.castShadow=object.receiveShadow=true;parent.add(object);return object;}
 function segment(parent,start,end,rTop,rBottom,material,name,radial=7){const a=new THREE.Vector3(...start),b=new THREE.Vector3(...end),axis=b.clone().sub(a),object=mesh(parent,new THREE.CylinderGeometry(rTop,rBottom,axis.length(),radial,1),material,name);object.position.copy(a).add(b).multiplyScalar(.5);object.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),axis.normalize());return object;}
 function ellipsoid(parent,material,position,scale,name,geometry=new THREE.SphereGeometry(1,9,6)){const object=mesh(parent,geometry,material,name,position);object.scale.set(...scale);return object;}

 // A broad, irregular olive tunic with a dark hem and a mustard shoulder cowl.
 const bodyProfile=[[.235,-.43],[.265,-.31],[.25,-.14],[.235,.08],[.27,.25],[.225,.36],[.145,.43]].map(([r,y])=>new THREE.Vector2(r,y));
 const tunic=mesh(torso,new THREE.LatheGeometry(bodyProfile,14),materials.coat,'Tunica verde de bajo poligonal');tunic.position.y=.02;tunic.material.side=THREE.DoubleSide;
 const hem=mesh(torso,new THREE.CylinderGeometry(.25,.265,.075,14,1,true),materials.coatDark,'Borde oscuro de la tunica',[0,-.355,0]);
 hem.rotation.x=.02;
 // Short cloak panels hang behind and along the left shoulder.
 const cloakShape=new THREE.Shape();cloakShape.moveTo(-.21,.31);cloakShape.lineTo(.19,.32);cloakShape.lineTo(.29,-.31);cloakShape.lineTo(.06,-.40);cloakShape.lineTo(-.29,-.18);cloakShape.lineTo(-.26,.12);cloakShape.closePath();
 const cloak=mesh(torso,new THREE.ShapeGeometry(cloakShape,1),materials.coatDark,'Capa corta oscura',[0,.01,-.17]);cloak.material.side=THREE.DoubleSide;
 const goldPanelShape=new THREE.Shape();goldPanelShape.moveTo(-.3,.31);goldPanelShape.lineTo(-.18,.39);goldPanelShape.lineTo(-.05,.27);goldPanelShape.lineTo(.12,.29);goldPanelShape.lineTo(.22,.20);goldPanelShape.lineTo(.12,.12);goldPanelShape.lineTo(-.12,.2);goldPanelShape.closePath();
 const cowl=mesh(torso,new THREE.ShapeGeometry(goldPanelShape,1),materials.hood,'Capucha dorada sobre el hombro',[0,.01,.03]);cowl.material.side=THREE.DoubleSide;
 const sash=mesh(torso,new THREE.BoxGeometry(.47,.075,.035),materials.leather,'Cinturon ancho de cuero',[0,-.25,.015]);sash.rotation.z=-.12;
 const buckle=mesh(torso,new THREE.BoxGeometry(.075,.105,.035),materials.hood,'Hebilla del cinturon',[.02,-.25,.04]);

 // The raised hood sits behind the head, edged with a warm yellow lining.
 const hoodGroup=new THREE.Group();hoodGroup.name='Capucha del prisionero';hoodGroup.position.set(0,.66,-.045);torso.add(hoodGroup);
 const hoodGeo=new THREE.SphereGeometry(1,9,6,0,Math.PI*2,0,Math.PI*.72);
 const hood=ellipsoid(hoodGroup,materials.coatDark,[0,.015,-.01],[.22,.29,.19],'Capucha verde',hoodGeo);
 hood.rotation.x=-.12;
 const hoodLining=mesh(hoodGroup,new THREE.TorusGeometry(.18,.025,6,14),materials.hood,'Ribete dorado de la capucha',[0,-.07,.015]);
 hoodLining.rotation.x=Math.PI/2;

 // Flat planes and faceted ellipsoids make a clearly readable human face.
 const head=new THREE.Group();head.name='Cabeza ilustrada del prisionero';head.position.set(0,.65,.075);torso.add(head);
 const faceGeo=new THREE.SphereGeometry(1,12,9);
 ellipsoid(head,materials.skin,[0,0,0],[.178,.278,.17],'Rostro anguloso',faceGeo);
 ellipsoid(head,materials.skinShade,[0,-.165,.035],[.13,.09,.145],'Mandibula sombreada',new THREE.SphereGeometry(1,9,6));
 // Hair cap and blocky fringe.
 const hairCap=new THREE.SphereGeometry(1,12,7,0,Math.PI*2,0,Math.PI*.52);
 ellipsoid(head,materials.hair,[0,.19,-.005],[.185,.17,.18],'Pelo corto rojizo',hairCap);
 const fringeShape=new THREE.Shape();fringeShape.moveTo(-.19,.205);fringeShape.lineTo(-.16,.29);fringeShape.lineTo(.11,.30);fringeShape.lineTo(.18,.23);fringeShape.lineTo(.12,.14);fringeShape.lineTo(.055,.20);fringeShape.lineTo(-.005,.13);fringeShape.lineTo(-.07,.2);fringeShape.lineTo(-.13,.14);fringeShape.closePath();
 mesh(head,new THREE.ShapeGeometry(fringeShape),materials.hairLight,'Flequillo cobrizo',[0,0,.168]);
 for(const side of [-1,1]){
  ellipsoid(head,materials.skinShade,[side*.196,-.005,0],[.045,.073,.055],'Oreja',[new THREE.SphereGeometry(1,7,5)][0]);
  const brow=mesh(head,new THREE.BoxGeometry(.075,.023,.018),materials.hair,'Cejas pobladas',[side*.072,.073,.166]);brow.rotation.z=side*.12;
  ellipsoid(head,materials.white,[side*.07,.028,.166],[.027,.018,.014],'Esclerotica');
  ellipsoid(head,materials.eye,[side*.067,.026,.178],[.009,.012,.008],'Ojo');
 }
 const nose=mesh(head,new THREE.ConeGeometry(.047,.105,4),materials.skinShade,'Nariz angular',[0,-.015,.19]);nose.rotation.x=Math.PI/2;
 const mouth=mesh(head,new THREE.BoxGeometry(.064,.009,.012),materials.skinShade,'Boca recta',[0,-.105,.165]);
 // Pointed sideburns and neck join the head cleanly to the cowl.
 for(const side of [-1,1]){const lock=mesh(head,new THREE.ConeGeometry(.055,.15,4),materials.hair,'Patilla',[side*.155,.055,.075]);lock.rotation.z=side*.18;}
 segment(torso,[0,.4,0],[0,.61,.02],.085,.07,materials.skin,'Cuello');

 // Sleeves follow the game's articulated shoulders, elbows and wrists.
 function buildArm(shoulder,elbow,wrist,side,label){
  if(!shoulder||!elbow||!wrist)return;
  const upperEnd=elbow.position.toArray(),foreEnd=wrist.position.toArray();
  ellipsoid(shoulder,materials.coatLight,[0,-.018,0],[.105,.12,.11],`Hombro de ${label}`);
  segment(shoulder,[0,0,0],upperEnd,.067,.084,materials.coatLight,`Manga superior de ${label}`,10);
  ellipsoid(elbow,materials.coatLight,[0,0,0],[.074,.08,.073],`Codo de ${label}`);
  segment(elbow,[0,0,0],foreEnd,.049,.064,materials.coat,`Manga inferior de ${label}`,10);
  const cuff=mesh(wrist,new THREE.CylinderGeometry(.05,.053,.075,9),materials.hood,`Puño ocre de ${label}`,[0,-.015,0]);
  cuff.rotation.z=side*.15;
  ellipsoid(wrist,materials.skin,[0,-.075,.025],[.05,.073,.044],`Mano de ${label}`);
  for(let finger=0;finger<4;finger++)segment(wrist,[((finger-1.5)*.022),-.125,.052],[((finger-1.5)*.025),-.18,.055],.009,.007,materials.skin,`Dedo ${finger+1} de ${label}`,5);
  ellipsoid(wrist,materials.skin,[side*.066,-.082,.045],[.022,.052,.025],`Pulgar de ${label}`);
 }
 buildArm(castArm,castElbow,castWrist,-1,'brazo derecho');
 buildArm(leftArm,leftElbow,leftWrist,1,'brazo izquierdo');

 // Ochre trousers and dark shoes stay attached to the existing walking joints.
 for(let i=0;i<legs.length;i++){
  const leg=legs[i],side=i===0?-1:1;
  ellipsoid(leg,materials.trousers,[side*.01,-.20,0],[.082,.27,.092],`Muslo ocre ${i+1}`);
  segment(leg,[side*.01,-.20,0],[side*.012,-.59,.012],.065,.052,materials.trousers,`Pantalon bajo ${i+1}`,10);
  ellipsoid(leg,materials.trousersLight,[side*.012,-.57,.018],[.06,.075,.064],`Dobladillo ${i+1}`);
  const shoe=ellipsoid(leg,materials.leather,[side*.012,-.70,.055],[.078,.05,.14],`Bota de cuero ${i+1}`);shoe.rotation.x=-.04;
 }
 const headParts=[];head.traverse(object=>{if(object.isMesh)headParts.push(object);});
 person.userData.headParts=headParts;
 person.userData.updateAppearance=()=>{};
 person.userData.stylizedAppearance=visualRoot;
 person.userData.realisticReady=true;
 return visualRoot;
}
