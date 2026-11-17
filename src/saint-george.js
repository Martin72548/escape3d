import * as THREE from 'three';

export function addSaintGeorge(parent) {
	parent.name='San Jorge con espada sobre caballo encabritado';
	// Fine casting pits and rubbed highlights give the sculpture an aged bronze finish.
 const size=256,pixels=new Uint8Array(size*size*4);let seed=317;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const grain=(seed>>>24)/255,patina=Math.sin(x*.09+Math.sin(y*.045))*Math.sin(y*.071),value=137+grain*38+patina*27;const i=(y*size+x)*4;pixels.set([value,value*.88,value*.67,255],i);}
 const casting=new THREE.DataTexture(pixels,size,size);casting.colorSpace=THREE.SRGBColorSpace;casting.wrapS=casting.wrapT=THREE.RepeatWrapping;casting.needsUpdate=true;
 const bronze=new THREE.MeshStandardMaterial({color:0x84795d,map:casting,bumpMap:casting,bumpScale:.008,metalness:.86,roughness:.36});
	const armor=new THREE.MeshStandardMaterial({color:0xa99b79,map:casting,bumpMap:casting,bumpScale:.003,metalness:.92,roughness:.29});
	const dark=new THREE.MeshStandardMaterial({color:0x29281f,map:casting,bumpMap:casting,bumpScale:.007,metalness:.72,roughness:.5});
	const gold=new THREE.MeshStandardMaterial({color:0xc2a56a,map:casting,metalness:.9,roughness:.3});
	const ivory=new THREE.MeshStandardMaterial({color:0x625741,map:casting,metalness:.85,roughness:.38});
	const red=new THREE.MeshStandardMaterial({color:0x6b482b,metalness:.65,roughness:.4});
	const sphere=new THREE.SphereGeometry(1,36,24);
	function mesh(geometry,material,container=parent){const m=new THREE.Mesh(geometry,material);m.castShadow=m.receiveShadow=true;container.add(m);return m;}
	function oval(material,x,y,z,sx,sy,sz,container=parent){const m=mesh(sphere,material,container);m.position.set(x,y,z);m.scale.set(sx,sy,sz);return m;}
	function limb(a,b,r1,r2,material=bronze){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),d=end.clone().sub(start);const m=mesh(new THREE.CylinderGeometry(r2,r1,d.length(),20),material);m.position.copy(start).add(end).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return m;}
	function tube(points,radius,material=dark,container=parent){return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),36,radius,10,false),material,container);}
	const horse=new THREE.Group();horse.name='Torso erguido del caballo';horse.position.set(0,1.13,-.05);horse.rotation.x=-.65;parent.add(horse);
 const horseGold=new THREE.MeshPhysicalMaterial({color:0xa67a43,metalness:.88,roughness:.36,bumpMap:casting,bumpScale:.0008,clearcoat:.07,clearcoatRoughness:.45});
 const horseShade=horseGold.clone();horseShade.color.set(0x493c2b);horseShade.roughness=.46;
 // Elliptical sections form continuous barrel, neck and head surfaces.
 function anatomy(sections,name,container=horse){
  const points=sections.map(s=>new THREE.Vector3(s[0],s[1],s[2])),curve=new THREE.CatmullRomCurve3(points);
  const radii=new THREE.SplineCurve(sections.map(s=>new THREE.Vector2(s[3],s[4])));
  const geometry=new THREE.TubeGeometry(curve,80,1,48,false),positions=geometry.attributes.position,frames=curve.computeFrenetFrames(80,false);
  for(let i=0;i<=80;i++){
   const t=i/80,center=curve.getPointAt(t),r=radii.getPoint(curve.getUtoTmapping(t));
   r.x=Math.max(.002,r.x);r.y=Math.max(.002,r.y);
   for(let j=0;j<=48;j++){
    const angle=j/48*Math.PI*2;
    const normal=frames.normals[i],binormal=frames.binormals[i];
    const offset=normal.clone().multiplyScalar(Math.cos(angle)*r.x).addScaledVector(binormal,Math.sin(angle)*r.y);
    positions.setXYZ(i*49+j,center.x+offset.x,center.y+offset.y,center.z+offset.z);
   }
  }
  geometry.computeVertexNormals();const object=mesh(geometry,horseGold,container);object.name=name;return object;
 }
 anatomy([[0,.025,-.64,.005,.005],[0,.035,-.51,.22,.24],[0,.015,-.29,.32,.33],[0,-.005,.04,.285,.33],[0,.045,.32,.285,.37],[0,.12,.49,.18,.26],[0,.14,.56,.005,.005]],'Anatomia continua del pecho y los cuartos traseros');
 anatomy([[0,.11,.3,.07,.1],[0,.25,.39,.23,.28],[0,.45,.43,.205,.26],[0,.64,.51,.14,.205],[0,.78,.6,.115,.15],[0,.85,.64,.045,.07]],'Cuello arqueado con cresta muscular');
 anatomy([[0,.84,.54,.012,.015],[0,.79,.6,.145,.16],[0,.7,.73,.125,.16],[0,.64,.88,.085,.105],[0,.6,1.03,.095,.11],[0,.59,1.085,.01,.01]],'Cabeza equina alargada y hocico modelado');
 oval(horseGold,0,.565,.91,.098,.057,.16,horse);
 oval(horseShade,0,.56,1.015,.092,.006,.049,horse);
 for(const side of [-1,1]){
  const shoulderMuscle=oval(horseGold,side*.215,.025,.33,.095,.275,.225,horse);shoulderMuscle.rotation.x=-.24;
  const haunch=oval(horseGold,side*.23,.025,-.37,.115,.265,.25,horse);haunch.rotation.x=.22;
  tube([[side*.24,.22,.29],[side*.28,.05,.39],[side*.22,-.17,.35]],.006,horseGold,horse);
  tube([[side*.08,.7,.77],[side*.066,.663,.89],[side*.063,.63,.99]],.007,horseGold,horse);
  oval(horseShade,side*.072,.635,1.035,.024,.014,.012,horse);
  tube([[side*.068,.621,1.038],[side*.092,.632,1.036],[side*.086,.647,1.02]],.004,horseGold,horse);
  tube([[side*.1,.575,.96],[side*.112,.579,.89],[side*.105,.59,.82]],.0026,horseShade,horse);
 }
	const mountedLegs=[],mountedArms=[];
	for(const side of [-1,1]){
		oval(horseGold,side*.12,.7,.66,.07,.12,.1,horse);
		oval(horseShade,side*.142,.77,.69,.025,.019,.028,horse);
		oval(horseGold,side*.157,.772,.699,.007,.006,.009,horse);
  tube([[side*.135,.786,.66],[side*.15,.792,.69],[side*.142,.78,.725]],.0045,horseGold,horse);
  tube([[side*.137,.754,.668],[side*.151,.751,.694],[side*.14,.762,.721]],.0032,horseGold,horse);
		oval(horseShade,side*.074,.64,1.035,.025,.018,.009,horse);
		const earGeometry=new THREE.SphereGeometry(1,28,20),earPosition=earGeometry.attributes.position;
  for(let i=0;i<earPosition.count;i++){
   const y=earPosition.getY(i),t=(y+1)/2;
   earPosition.setXYZ(i,earPosition.getX(i)*.044*(1-t*.65),y*.125,earPosition.getZ(i)*.04*(1-t*.6)+t*t*.024);
  }
  earGeometry.computeVertexNormals();const ear=mesh(earGeometry,horseGold,horse);ear.position.set(side*.09,.99,.58);ear.rotation.z=-side*.21;
		oval(horseShade,side*.09,1.005,.615,.022,.075,.012,horse);
  // Separate stifle, hock, cannon and pastern produce the folded equine silhouette.
  const hip=new THREE.Vector3(side*.22,-.04,-.38).applyEuler(horse.rotation).add(horse.position);
  const stagger=side<0?.045:-.035;
  anatomy([[hip.x,hip.y,hip.z,.13,.14],[side*.25,.72,-.29,.115,.15],[side*.265,.49,-.5,.075,.075],[side*.27,.36,-.55,.045,.05],[side*.27,.19,-.55,.035,.043],[side*.27,.105,-.49,.047,.052]],'Pata posterior con corvejon y tendones '+side,parent);
  const shoulder=new THREE.Vector3(side*.215,-.1,.36).applyEuler(horse.rotation).add(horse.position);
  anatomy([[shoulder.x,shoulder.y,shoulder.z,.105,.115],[side*.245,1.55+stagger,.44,.082,.09],[side*.26,1.45+stagger,.61,.056,.06],[side*.265,1.31+stagger,.72,.033,.039],[side*.265,1.22+stagger,.81,.035,.04],[side*.265,1.19+stagger,.855,.043,.048]],'Pata anterior flexionada '+side,parent);
  function hoof(x,y,z,tilt,name){
   const outline=new THREE.Shape();outline.moveTo(-.057,-.06);outline.quadraticCurveTo(-.08,.03,-.035,.09);outline.quadraticCurveTo(0,.105,.035,.09);outline.quadraticCurveTo(.08,.03,.057,-.06);outline.closePath();
   const geometry=new THREE.ExtrudeGeometry(outline,{depth:.082,bevelEnabled:true,bevelSize:.012,bevelThickness:.008,bevelSegments:3,steps:1});
   geometry.rotateX(Math.PI/2);geometry.translate(0,.06,0);
   const object=mesh(geometry,horseShade);object.position.set(x,y,z);object.rotation.x=tilt;object.name=name;
   return object;
  }
  hoof(side*.27,.045,-.48,0,'Casco posterior de apoyo '+side);
  hoof(side*.265,1.16+stagger,.88,.6,'Casco delantero levantado '+side);
  tube([[side*.29,.49,-.46],[side*.297,.34,-.5],[side*.293,.19,-.505]],.006,horseGold);
  tube([[side*.285,1.44+stagger,.64],[side*.288,1.32+stagger,.735],[side*.285,1.23+stagger,.82]],.005,horseGold);

	}
 // Flowing, individually carved locks follow the crest and swept tail.
 for(let i=0;i<24;i++){
  const t=i/23,y=.24+t*.66,z=.21+t*.32;
  for(const side of [-1,1])tube([[side*.015,y,z],[side*.055,y-.035,z-.055],[side*(.07+Math.sin(t*8)*.018),y-.13,z-.1],[side*.045,y-.17,z-.075]],.009+(1-t)*.004,i%4===0?horseShade:horseGold,horse);
 }
 tube([[0,.99,-.5],[.08,.82,-.81],[.16,.5,-.95],[.14,.22,-1.02],[.055,.115,-.96]],.052,horseGold);
 for(let i=0;i<18;i++){
  const angle=i/18*Math.PI*2,x=Math.cos(angle)*.04;
  tube([[x,.98,-.5],[.08+x,.8,-.81+Math.sin(angle)*.035],[.16+x,.48,-.95+Math.sin(angle)*.045],[.14+x*.7,.22,-1.02],[.055+x*.3,.115,-.96]],.006,i%4===0?horseShade:horseGold);
 }
	// Bridle and reins follow the raised neck back to the rider's hand.
	tube([[-.145,.68,.81],[-.15,.83,.64],[0,.9,.57],[.15,.83,.64],[.145,.68,.81]],.012,dark,horse);
	tube([[-.115,.61,.94],[0,.66,1.03],[.115,.61,.94]],.013,gold,horse);
	const cheek=new THREE.Vector3(.15,.7,.84).applyEuler(horse.rotation).add(horse.position);
	tube([cheek.toArray(),[.29,1.82,.4],[.22,1.95,.16]],.012);
	tube([[-cheek.x,cheek.y,cheek.z],[-.28,1.81,.39],[.19,1.95,.16]],.012);
	oval(horseShade,0,1.46,-.12,.32,.11,.35);oval(gold,0,1.54,-.29,.29,.07,.095);
 const horseParts=[...parent.children];
 // Copper-brown bronze, faint verdigris in casting recesses and rubbed edges.
 const patinaMaterials=new Map();
 for(const part of horseParts)part.traverse(object=>{
  if(!object.isMesh||![horseGold,horseShade].includes(object.material))return;
  const original=object.material;
  if(!patinaMaterials.has(original)){const material=original.clone();material.vertexColors=true;patinaMaterials.set(original,material);}
  object.material=patinaMaterials.get(original);object.geometry=object.geometry.clone();
  const p=object.geometry.attributes.position,n=object.geometry.attributes.normal,colors=[];
  for(let i=0;i<p.count;i++){
   const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
   const cloud=Math.sin(x*23+Math.sin(z*17))*Math.sin(y*19+z*11);
   const fine=Math.sin(x*173+y*217+z*131)*.018;
   const deposit=THREE.MathUtils.smoothstep(cloud,.38,.92)*.2;
   const polish=.91+Math.max(0,n.getY(i))*.09+fine;
   colors.push(polish*(1-deposit*.7),polish*(1-deposit*.18),polish*(1-deposit*.05));
  }
  object.geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 });
	const rider=new THREE.Group();rider.name='San Jorge con armadura';parent.add(rider);
	oval(armor,0,2.04,-.19,.23,.34,.15,rider);
	oval(dark,0,1.76,-.16,.22,.14,.17,rider);
	const crossV=mesh(new THREE.BoxGeometry(.045,.25,.018),red,rider);crossV.position.set(0,2.1,-.032);
	const crossH=mesh(new THREE.BoxGeometry(.18,.045,.018),red,rider);crossH.position.set(0,2.14,-.027);
	for(const side of [-1,1]){
		const legStart=parent.children.length;
		limb([side*.13,1.78,-.14],[side*.35,1.5,.03],.105,.08,armor);
		oval(gold,side*.35,1.49,.04,.095,.09,.09);
		limb([side*.35,1.46,.03],[side*.39,1.2,.13],.078,.055,armor);
		oval(dark,side*.39,1.17,.18,.075,.07,.15);
		const stirrup=mesh(new THREE.TorusGeometry(.08,.012,8,24),gold);stirrup.position.set(side*.4,1.15,.13);stirrup.rotation.y=Math.PI/2;
		mountedLegs.push(...parent.children.slice(legStart));
		mountedArms.push(oval(armor,side*.24,2.21,-.18,.135,.105,.14));
	}
	const armStart=parent.children.length;
	limb([-.24,2.2,-.18],[-.46,2.43,-.06],.085,.065,armor);
	oval(gold,-.46,2.43,-.06,.075,.075,.075);
	limb([-.46,2.43,-.06],[-.55,2.68,.08],.065,.045,armor);oval(armor,-.55,2.69,.08,.055,.07,.055);
	limb([.25,2.2,-.18],[.4,1.98,-.02],.085,.06,armor);limb([.4,1.98,-.02],[.22,1.94,.17],.06,.04,armor);oval(armor,.22,1.94,.17,.055,.055,.055);
	mountedArms.push(...parent.children.slice(armStart));
	oval(dark,0,2.4,-.18,.09,.12,.09);
	oval(armor,0,2.55,-.18,.15,.19,.145);
	oval(dark,0,2.57,-.046,.11,.014,.009);
	const noseGuard=mesh(new THREE.BoxGeometry(.022,.17,.025),gold);noseGuard.position.set(0,2.51,-.023);
	for(const side of [-1,1])for(let i=0;i<4;i++)oval(dark,side*(.035+i*.019),2.48,-.05,.004,.018,.005);
	tube([[0,2.39,-.3],[0,2.6,-.335],[0,2.74,-.18],[0,2.65,-.05]],.014,gold);
	const sword=new THREE.Group();sword.name='Espada alzada en la mano de San Jorge';sword.position.set(-.55,2.68,.08);sword.rotation.z=.2;parent.add(sword);
	const bladeShape=new THREE.Shape();bladeShape.moveTo(-.035,.14);bladeShape.lineTo(.035,.14);bladeShape.lineTo(.03,.73);bladeShape.lineTo(0,.88);bladeShape.lineTo(-.03,.73);bladeShape.closePath();
	const blade=mesh(new THREE.ExtrudeGeometry(bladeShape,{depth:.016,bevelEnabled:true,bevelSize:.008,bevelThickness:.006,bevelSegments:2,steps:1}),armor,sword);blade.position.z=-.008;
	const guard=mesh(new THREE.BoxGeometry(.25,.035,.045),gold,sword);guard.position.y=.115;
	const grip=mesh(new THREE.CylinderGeometry(.024,.024,.17,12),dark,sword);grip.position.y=.01;
	oval(gold,-.55,2.59,.08,.034,.034,.034);
	const shieldOutline=new THREE.Shape();shieldOutline.moveTo(-.18,.2);shieldOutline.lineTo(.18,.2);shieldOutline.lineTo(.17,-.09);shieldOutline.quadraticCurveTo(.12,-.22,0,-.3);shieldOutline.quadraticCurveTo(-.12,-.22,-.17,-.09);shieldOutline.closePath();
	const shield=mesh(new THREE.ExtrudeGeometry(shieldOutline,{depth:.035,bevelEnabled:true,bevelSize:.015,bevelThickness:.01,bevelSegments:2,steps:1}),ivory);shield.position.set(.38,1.96,.13);shield.rotation.y=-.35;
	const vertical=mesh(new THREE.BoxGeometry(.045,.42,.012),red,shield);vertical.position.set(0,-.025,.05);const horizontal=mesh(new THREE.BoxGeometry(.3,.045,.012),red,shield);horizontal.position.set(0,.07,.05);
	// Overlapping cuirass plates, rolled edges and fasteners follow the anatomy.
 for(let i=0;i<5;i++){
  const y=1.72+i*.062,w=.225-Math.abs(i-2)*.009;
  oval(armor,0,y,-.135,w,.047,.174,rider);
  tube([[-w*.92,y-.015,-.07],[-w*.6,y-.028,.025],[0,y-.035,.046],[w*.6,y-.028,.025],[w*.92,y-.015,-.07]],.008,gold,rider);
  for(const side of [-1,1])oval(gold,side*w*.78,y,.003,.009,.009,.006,rider);
 }
 // Raised central keel and engraved scrollwork on the breastplate.
 tube([[0,1.98,-.024],[0,2.1,-.026],[0,2.23,-.045],[0,2.31,-.105]],.009,gold,rider);
 for(const side of [-1,1]){
  tube([[side*.02,2.27,-.037],[side*.11,2.27,-.047],[side*.17,2.19,-.048],[side*.12,2.12,-.033],[side*.065,2.17,-.026],[side*.115,2.2,-.028]],.006,gold,rider);
  for(let i=0;i<3;i++){
   const plate=oval(armor,side*(.225+i*.021),2.235-i*.035,-.18,.145-i*.008,.055,.163-i*.006);
   mountedArms.push(plate);
   const edge=tube([[side*.12,2.24-i*.035,-.065],[side*.26,2.25-i*.035,-.014],[side*.37,2.22-i*.035,-.11]],.007,gold);mountedArms.push(edge);
  }
  for(let i=0;i<5;i++)oval(gold,side*.2,2.02+i*.052,-.099,.008,.008,.008,rider);
 }
 // Sculpted visor, breathing holes and a swept, ribbed helmet crest.
 tube([[-.13,2.59,-.095],[-.08,2.61,-.025],[0,2.615,-.012],[.08,2.61,-.025],[.13,2.59,-.095]],.009,gold);
 tube([[-.12,2.43,-.08],[0,2.405,-.025],[.12,2.43,-.08]],.009,gold);
 for(let i=0;i<11;i++){
  const shift=(i-5)*.006;
  tube([[shift,2.73,-.19],[shift,2.9,-.23],[shift,2.94,-.38],[shift,2.87,-.47],[shift,2.81,-.43]],.013,i%3===0?gold:dark);
 }
 // A cast cloak with broad folds keeps its silhouette behind the articulated arms.
 const capeGeometry=new THREE.PlaneGeometry(.66,.89,28,32),positions=capeGeometry.attributes.position;
 for(let i=0;i<positions.count;i++){const x=positions.getX(i),y=positions.getY(i),t=(.445-y)/.89;positions.setXYZ(i,x*(.65+t*.7),y,Math.sin(x*34+t*2)*(.018+t*.055)-t*t*.27);}
 capeGeometry.computeVertexNormals();
 const capeMaterial=bronze.clone();capeMaterial.side=THREE.DoubleSide;
 const cape=mesh(capeGeometry,capeMaterial,rider);cape.position.set(0,1.97,-.365);cape.rotation.x=-.15;
 for(const side of [-1,1])oval(gold,side*.19,2.27,-.09,.035,.035,.018,rider);
 const riderParts=parent.children.filter(part=>!horseParts.includes(part));
	const horseScale=new THREE.Group();horseScale.name='Caballo encabritado de mayor tamano';parent.add(horseScale);
	const riderScale=new THREE.Group();riderScale.name='San Jorge de mayor altura';riderScale.position.set(0,1.54,-.12);parent.add(riderScale);
	parent.updateWorldMatrix(true,true);
	horseParts.forEach(part=>horseScale.attach(part));riderParts.forEach(part=>riderScale.attach(part));
	horseScale.scale.set(1.25,1.22,1.25);
	riderScale.scale.set(1.15,1.25,1.15);riderScale.position.y*=1.22;riderScale.position.z*=1.25;
	parent.userData.georgeRig={rider:riderScale,horse:horseScale,sword,shield,mountedLegs,mountedArms,armor,dark,gold};
	return parent;
}
