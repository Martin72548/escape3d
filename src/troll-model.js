import * as THREE from 'three';

export function createTrollModel(){
 const root=new THREE.Group();root.name='Troll verde encorvado con espada';root.userData.spellTarget='troll';root.scale.setScalar(1.8);
 let seed=817;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(256,256);
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){const patches=Math.sin(x*.055+Math.sin(y*.09)*2)*Math.cos(y*.07),grain=(random()-.5)*24;pixels.data.set([94+patches*24+grain,112+patches*26+grain,53+patches*15+grain,255],(y*256+x)*4);}ctx.putImageData(pixels,0,0);
 for(let i=0;i<110;i++){ctx.fillStyle=i%4?'rgba(27,45,16,.35)':'rgba(185,179,94,.28)';ctx.beginPath();ctx.ellipse(random()*256,random()*256,1+random()*5,1+random()*3,random()*3,0,Math.PI*2);ctx.fill();}
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;
 const skin=new THREE.MeshStandardMaterial({map,bumpMap:map,bumpScale:.025,roughness:.92}),darkSkin=skin.clone();darkSkin.color.set(0x788245);
 const dark=new THREE.MeshStandardMaterial({color:0x252a17,roughness:.95}),hairMaterial=new THREE.MeshStandardMaterial({color:0x151c13,roughness:.95}),ivory=new THREE.MeshStandardMaterial({color:0xc5c087,roughness:.73});
 const leather=new THREE.MeshStandardMaterial({color:0x3d3224,roughness:1,side:THREE.DoubleSide}),cloth=new THREE.MeshStandardMaterial({color:0x2e443f,roughness:1,side:THREE.DoubleSide});
 const sphere=new THREE.SphereGeometry(1,24,18);
 function oval(parent,material,x,y,z,sx,sy,sz){const m=new THREE.Mesh(sphere,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
 function tube(parent,points,radius,material){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const m=new THREE.Mesh(new THREE.TubeGeometry(curve,16,radius,7,false),material);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
 function spike(parent,x,y,z,r,h,material=ivory){const m=new THREE.Mesh(new THREE.ConeGeometry(r,h,10),material);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}
 // A forward neck and an elevated back create the reference's hunched silhouette.
 oval(root,skin,0,1.24,0,.32,.4,.23);oval(root,skin,0,1.58,-.10,.47,.31,.29);oval(root,skin,0,1.03,.055,.28,.29,.2);
 oval(root,darkSkin,0,1.35,.19,.24,.3,.055);oval(root,skin,0,1.75,.17,.18,.23,.16);
 for(const side of [-1,1]){oval(root,skin,side*.18,1.5,.18,.19,.18,.13);tube(root,[[side*.32,1.63,.15],[side*.18,1.67,.23],[0,1.64,.24]],.025,darkSkin);for(let i=0;i<5;i++)oval(root,darkSkin,side*(.27+i*.037),1.7-i*.01,-.12+(i%2)*.09,.03+(i%2)*.012,.018,.032);}
 const head=new THREE.Group();head.position.set(0,1.91,.27);root.add(head);
 oval(head,skin,0,.02,0,.23,.28,.19);oval(head,skin,0,-.16,.085,.22,.16,.17);oval(head,dark,0,-.14,.217,.158,.09,.034);oval(head,darkSkin,0,-.23,.17,.16,.055,.08);
 oval(head,skin,0,.02,.20,.09,.13,.10);oval(head,skin,0,-.05,.265,.12,.055,.065);
 const eyes=new THREE.MeshStandardMaterial({color:0xb3b35b,roughness:.35}),pupil=new THREE.MeshBasicMaterial({color:0x090c04});
 for(const side of [-1,1]){
  oval(head,dark,side*.11,.07,.16,.09,.07,.045);oval(head,eyes,side*.11,.07,.195,.044,.027,.023);oval(head,pupil,side*.11,.07,.216,.013,.022,.006);
  const brow=oval(head,skin,side*.10,.145,.17,.13,.065,.075);brow.rotation.z=side*.2;
  oval(head,skin,side*.175,-.04,.12,.075,.12,.08);oval(head,dark,side*.061,-.065,.31,.024,.012,.009);
  const ear=spike(head,side*.29,.08,-.015,.085,.32,skin);ear.rotation.z=-side*1.1;oval(head,darkSkin,side*.25,.065,.035,.08,.04,.02);
  for(let i=0;i<5;i++){const tooth=spike(head,side*(.025+i*.025),-.13,.255,.014,.052+(i%2)*.02);tooth.rotation.x=Math.PI;}
  const fang=spike(head,side*.12,-.105,.26,.028,.13);fang.rotation.x=Math.PI;fang.rotation.z=-side*.14;
  tube(head,[[side*.035,.21,.165],[side*.08,.235,.14],[side*.15,.21,.12]],.009,darkSkin);
 }
 const hair=new THREE.Group();hair.name='Cabellos negros largos y desordenados';head.add(hair);oval(hair,hairMaterial,0,.23,-.06,.235,.15,.185);
 for(let i=0;i<30;i++){
  const a=-Math.PI*.77+i/29*Math.PI*1.54,x=Math.sin(a),z=-Math.cos(a),length=.65+random()*.5;
  tube(hair,[[x*.19,.28,z*.12-.04],[x*.26,.04,z*.19-.07],[x*.31+Math.sin(i)*.025,-.3,z*.25-.08],[x*.30+Math.cos(i)*.045,-length,z*.27-.08]],.018+random()*.014,hairMaterial);
 }
 const legs=[],arms=[];
 for(const side of [-1,1]){
  const leg=new THREE.Group();leg.position.set(side*.18,.88,0);root.add(leg);legs.push(leg);
  const thigh=oval(leg,skin,side*.035,-.19,.055,.145,.28,.14);thigh.rotation.x=-.2;oval(leg,skin,side*.055,-.4,.12,.11,.10,.115);
  const calf=oval(leg,skin,side*.065,-.59,.015,.08,.24,.08);calf.rotation.x=.4;oval(leg,darkSkin,side*.07,-.80,.09,.11,.055,.22);
  for(let i=0;i<4;i++){const x=side*.07+(i-1.5)*.05;oval(leg,skin,x,-.805,.255,.032,.037,.09);const claw=spike(leg,x,-.805,.335,.02,.09,dark);claw.rotation.x=Math.PI/2;}
  const arm=new THREE.Group();arm.position.set(side*.41,1.62,.02);root.add(arm);arms.push(arm);
  oval(arm,skin,side*.055,-.23,.015,.12,.34,.12);oval(arm,darkSkin,side*.10,-.53,.045,.085,.1,.09);
  const elbow=new THREE.Group();elbow.position.set(side*.10,-.54,.045);arm.add(elbow);arm.userData.elbow=elbow;
  oval(elbow,skin,side*.025,-.25,.015,.075,.30,.08);oval(elbow,skin,side*.045,-.53,.03,.12,.15,.085);
  const hand=new THREE.Group();hand.position.set(side*.045,-.56,.055);elbow.add(hand);arm.userData.hand=hand;
  for(let i=0;i<4;i++){
   const x=(i-1.5)*.065,length=.22+(1-Math.abs(i-1.5)/2)*.12;
   if(side<0)tube(hand,[[x,-.01,.02],[x,-.10,.09],[x,-.15,.04],[x,-.1,-.025]],.024,skin);
   else tube(hand,[[x,-.01,.02],[x*1.3,-length*.5,.055],[x*1.15,-length,.12],[x*.75,-length*.95,.19]],.023,skin);
  }
  tube(hand,[[side*.11,.015,.015],[side*.18,-.08,.09],[side*.12,-.15,.13]],.03,skin);
 }
 for(let i=0;i<7;i++){
  const a=i/7*Math.PI*2,w=.12+random()*.06,length=.33+random()*.17;
  const shape=new THREE.Shape();shape.moveTo(-w,0);shape.lineTo(w,0);shape.lineTo(w*.75,-length);shape.lineTo(0,-length+.09);shape.lineTo(-w*.85,-length-.03);shape.closePath();
  const flap=new THREE.Mesh(new THREE.ShapeGeometry(shape),i%2?cloth:leather);flap.position.set(Math.sin(a)*.27,.96,Math.cos(a)*.20);flap.rotation.y=a;flap.castShadow=true;root.add(flap);
 }
 const belt=new THREE.Mesh(new THREE.TorusGeometry(.285,.018,7,48),leather);belt.rotation.x=Math.PI/2;belt.scale.y=.76;belt.position.y=.96;root.add(belt);
 const sword=new THREE.Group();sword.name='Espada articulada del troll';sword.position.set(0,-.065,.045);sword.rotation.x=1.05;arms[0].userData.hand.add(sword);
 const steel=new THREE.MeshStandardMaterial({color:0xb7c1bf,metalness:.9,roughness:.3}),bronze=new THREE.MeshStandardMaterial({color:0x74613a,metalness:.7,roughness:.55});
 const grip=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.21,10),leather);sword.add(grip);
 const guard=new THREE.Mesh(new THREE.BoxGeometry(.32,.045,.075),bronze);guard.position.y=.13;sword.add(guard);
 const bladeShape=new THREE.Shape();bladeShape.moveTo(-.065,.15);bladeShape.lineTo(.065,.15);bladeShape.lineTo(.052,1.02);bladeShape.lineTo(0,1.20);bladeShape.lineTo(-.052,1.02);bladeShape.closePath();
 const blade=new THREE.Mesh(new THREE.ExtrudeGeometry(bladeShape,{depth:.023,bevelEnabled:true,bevelSize:.007,bevelThickness:.006,bevelSegments:2,steps:1}),steel);blade.position.z=-.011;sword.add(blade);oval(sword,bronze,0,-.13,0,.045,.045,.045);
 sword.traverse(part=>{if(part.isMesh)part.castShadow=part.receiveShadow=true;});
 return {root,legs,arms,sword,head,hair};
}
