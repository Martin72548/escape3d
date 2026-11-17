import * as THREE from 'three';
import { statueExplosionSound } from './statue-explosion-sound.js';

export function createHarpyFlight(parent,{limit=29,centerZ=-8.5,laneVariation=1.5,initialDirection=1}={}){
 const root=new THREE.Group();root.name='Pajaros gigantes con cabeza de mujer';parent.add(root);
 const bird=new THREE.Group();bird.name='Pajaro de cabeza femenina y cabellos largos';bird.userData.spellTarget='flying-harpy';root.add(bird);
 const plumage=new THREE.MeshStandardMaterial({color:0x393c48,roughness:.68,metalness:.12});
 const lighter=new THREE.MeshStandardMaterial({color:0x777782,roughness:.8});
 const skin=new THREE.MeshStandardMaterial({color:0xd1a28b,roughness:.66});
 const shadow=new THREE.MeshStandardMaterial({color:0x9b6f5c,roughness:.8});
 const hairMaterial=new THREE.MeshStandardMaterial({color:0x493025,roughness:.73});
 const hairLight=new THREE.MeshStandardMaterial({color:0x71503a,roughness:.75});
 const lips=new THREE.MeshStandardMaterial({color:0x8b4946,roughness:.7});
 const black=new THREE.MeshStandardMaterial({color:0x19151a,roughness:.65});
 const ivory=new THREE.MeshStandardMaterial({color:0xe9dfbf,roughness:.7});
 const sphere=new THREE.SphereGeometry(1,24,18);
 function oval(parent,material,x,y,z,sx,sy,sz){const m=new THREE.Mesh(sphere,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
 const shape=new THREE.Shape();shape.moveTo(0,0);shape.bezierCurveTo(-.18,.2,-.2,.65,0,1);shape.bezierCurveTo(.2,.65,.18,.2,0,0);
 const featherGeometry=new THREE.ShapeGeometry(shape,8);featherGeometry.rotateX(Math.PI/2);
 const featherCanvas=document.createElement('canvas');featherCanvas.width=128;featherCanvas.height=256;const featherCtx=featherCanvas.getContext('2d');
 featherCtx.fillStyle='#a4a5ad';featherCtx.fillRect(0,0,128,256);featherCtx.strokeStyle='#dedad1';featherCtx.lineWidth=2;featherCtx.beginPath();featherCtx.moveTo(64,0);featherCtx.lineTo(64,256);featherCtx.stroke();
 for(let y=12;y<250;y+=7){featherCtx.strokeStyle=y%3?'rgba(35,38,49,.55)':'rgba(220,216,203,.4)';featherCtx.lineWidth=1;featherCtx.beginPath();featherCtx.moveTo(64,y);featherCtx.lineTo(0,y+35);featherCtx.moveTo(64,y);featherCtx.lineTo(128,y+35);featherCtx.stroke();}
 const featherMap=new THREE.CanvasTexture(featherCanvas);featherMap.colorSpace=THREE.SRGBColorSpace;featherMap.anisotropy=4;
 const featherMaterial=plumage.clone();featherMaterial.map=featherMap;featherMaterial.side=THREE.DoubleSide;
 const paleFeather=lighter.clone();paleFeather.map=featherMap;paleFeather.side=THREE.DoubleSide;
 function feather(parent,x,y,z,width,length,angle=0,pale=false){const f=new THREE.Mesh(featherGeometry,pale?paleFeather:featherMaterial);f.position.set(x,y,z);f.scale.set(width,1,length);f.rotation.y=angle;f.castShadow=true;parent.add(f);return f;}
 oval(bird,plumage,0,0,0,.72,.65,1.45);oval(bird,lighter,0,-.13,.67,.58,.48,.68);
 for(let row=0;row<5;row++)for(let side=-1;side<=1;side+=2)for(let j=0;j<4;j++)feather(bird,side*(.25+j*.1),.38-j*.11,.7-row*.36,.9,.85,Math.PI+side*.3,row%3===0);
 for(let i=0;i<9;i++)feather(bird,(i-4)*.12,.05,-1.1,1.2,1.8+Math.sin(i/8*Math.PI)*.7,Math.PI+(i-4)*.1,i%3===0);
 const wings=[];
 for(const side of [-1,1]){
  const wing=new THREE.Group();wing.position.set(side*.52,.2,.15);wing.scale.x=side;bird.add(wing);wings.push(wing);
  const outline=new THREE.Shape();outline.moveTo(0,.6);outline.quadraticCurveTo(1.7,1,3.7,.5);outline.lineTo(4.1,-.15);outline.quadraticCurveTo(2.1,-1.7,0,-.7);outline.closePath();
  const g=new THREE.ShapeGeometry(outline,14);g.rotateX(Math.PI/2);const membrane=new THREE.Mesh(g,featherMaterial);wing.add(membrane);
  for(let i=0;i<15;i++)feather(wing,.15+i*.25,.025,.25-i*.035,1.1,1.25+i*.045,Math.PI-.25-i*.018,i%4===0);
  for(let i=0;i<12;i++)feather(wing,.15+i*.27,.055,.6-i*.025,.8,.9,Math.PI-.1,i%4===0);
 }
 // A human face, with no beak, rises above the bird's feathered breast.
 oval(bird,skin,0,.73,.7,.21,.46,.22);
 const head=new THREE.Group();head.position.set(0,1.26,.8);head.name='Cabeza de mujer';bird.add(head);
 oval(head,skin,0,.08,0,.36,.46,.32);oval(head,skin,0,-.2,.1,.27,.24,.25);
 oval(head,skin,0,-.31,.18,.15,.09,.15);
 for(const side of [-1,1]){
  oval(head,skin,side*.34,.03,-.015,.055,.11,.07);
  oval(head,shadow,side*.145,.12,.27,.115,.065,.04);
  oval(head,ivory,side*.145,.13,.297,.09,.035,.023);
  oval(head,black,side*.145,.13,.318,.032,.032,.014);
  const brow=oval(head,hairMaterial,side*.145,.23,.28,.115,.018,.025);brow.rotation.z=side*.12;
  oval(head,skin,side*.21,-.04,.21,.10,.10,.06);
  const lash=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(side*.06,.15,.32),new THREE.Vector3(side*.145,.18,.326),new THREE.Vector3(side*.245,.17,.30)]),12,.009,5,false),hairMaterial);head.add(lash);
  oval(head,hairMaterial,side*.31,.13,-.04,.065,.28,.16);
 }
 oval(head,skin,0,.04,.315,.045,.13,.06);oval(head,skin,0,-.055,.36,.065,.045,.07);
 oval(head,lips,0,-.19,.302,.115,.023,.025);oval(head,lips,0,-.23,.3,.105,.025,.025);
 const cap=oval(head,hairMaterial,0,.27,-.055,.38,.31,.32);
 const hair=[];
 for(let strand=0;strand<22;strand++){
  const g=new THREE.BufferGeometry(),points=[],indices=[],rings=18,sides=6;
  for(let j=0;j<=rings;j++)for(let k=0;k<sides;k++)points.push(0,0,0);
  for(let j=0;j<rings;j++)for(let k=0;k<sides;k++){const a=j*sides+k,b=j*sides+(k+1)%sides,c=a+sides,d=b+sides;indices.push(a,c,b,b,c,d);}
  g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));g.setIndex(indices);
  const lock=new THREE.Mesh(g,strand%4===0?hairLight:hairMaterial);lock.frustumCulled=false;lock.castShadow=true;bird.add(lock);hair.push({mesh:lock,phase:strand*.61,rings,sides});
 }
 const talons=[],birdLegs=[];
 for(const side of [-1,1]){
  const leg=oval(bird,plumage,side*.35,-.66,.05,.12,.38,.13);leg.rotation.x=-.6;birdLegs.push(leg);
  for(let i=0;i<3;i++){const claw=new THREE.Mesh(new THREE.ConeGeometry(.045,.3,8),ivory);claw.position.set(side*.35+(i-1)*.09,-.96,.32);claw.rotation.x=Math.PI*.65;bird.add(claw);talons.push(claw);}
 }
 let carrying=false,enabled=true,active=true,direction=initialDirection,pass=0,age=0,pause=0,burstAge=0,flash=null;
 const feathers=[],sparks=[];
 const sparkGeometry=new THREE.SphereGeometry(1,8,6),sparkMaterial=new THREE.MeshBasicMaterial({color:0xffba60,transparent:true,opacity:.9});
 bird.position.set(-direction*limit,4.5,centerZ);bird.rotation.y=direction*Math.PI/2;
 function target(mesh){for(let o=mesh;o;o=o.parent)if(o===bird)return active?bird:null;return null;}
 function explode(mesh){
  if(!target(mesh))return false;
  const center=bird.position.clone();active=false;bird.visible=false;pause=3;burstAge=0;statueExplosionSound.play();
  for(let i=0;i<150;i++){
   const f=new THREE.Mesh(featherGeometry,(i%4===0?paleFeather:featherMaterial).clone());f.material.transparent=true;f.name='Pluma de la explosion';f.position.copy(center).add(new THREE.Vector3((Math.random()-.5)*2,(Math.random()-.5)*1.6,(Math.random()-.5)*2));f.scale.setScalar(.4+Math.random()*.65);f.rotation.set(Math.random()*6,Math.random()*6,Math.random()*6);f.raycast=()=>{};root.add(f);
   const velocity=new THREE.Vector3(Math.random()-.5,Math.random()*.85+.1,Math.random()-.5).normalize().multiplyScalar(3+Math.random()*9);
   feathers.push({mesh:f,velocity,age:0,life:5+Math.random()*2,phase:i*.7,spin:(Math.random()-.5)*5});
  }
  for(let i=0;i<28;i++){const spark=new THREE.Mesh(sparkGeometry,sparkMaterial.clone());spark.position.copy(center);spark.scale.setScalar(.08+Math.random()*.15);spark.raycast=()=>{};root.add(spark);sparks.push({mesh:spark,velocity:new THREE.Vector3((Math.random()-.5)*10,(Math.random()-.3)*8,(Math.random()-.5)*10),age:0});}
  flash=new THREE.PointLight(0xff9f35,45,16);flash.position.copy(center);root.add(flash);return true;
 }
 function beginPass(){direction=-direction;pass++;active=true;bird.visible=true;bird.position.set(-direction*limit,4.5+(pass%3)*.45,centerZ+(pass%2?laneVariation:-laneVariation));bird.rotation.y=direction*Math.PI/2;}
 function update(dt){
  age+=dt;
  if(active||carrying){
   if(active){bird.position.x+=direction*10.8*dt;bird.position.y=4.5+(pass%3)*.45+Math.sin(age*3.8)*.24;bird.rotation.z=Math.sin(age*3.8)*.035;}
   const flap=Math.sin(age*5.4);wings.forEach((wing,i)=>wing.rotation.z=(i===0?-1:1)*(.1+flap*.65));
   head.rotation.x=.06+Math.sin(age*2)*.035;
   for(const lock of hair){const p=lock.mesh.geometry.attributes.position;
    for(let j=0;j<=lock.rings;j++){const t=j/lock.rings,radius=(1-t*.82)*.065,anchor=Math.sin(lock.phase)*.31;
     const x=anchor*(1-t*.2)+Math.sin(age*5-t*8+lock.phase)*t*.12;
     const y=1.48+Math.cos(lock.phase)*.16-t*.8+Math.sin(age*4-t*7+lock.phase)*t*.07;
     const z=.63+Math.cos(lock.phase)*.16-t*2.7;
     for(let k=0;k<lock.sides;k++){const a=k/lock.sides*Math.PI*2;p.setXYZ(j*lock.sides+k,x+Math.cos(a)*radius,y+Math.sin(a)*radius,z);}
    }p.needsUpdate=true;lock.mesh.geometry.computeVertexNormals();
   }
   if(active&&Math.abs(bird.position.x)>limit+1){active=false;bird.visible=false;pause=1.5;}
  }else if(enabled){pause-=dt;if(pause<=0)beginPass();}
  for(let i=feathers.length-1;i>=0;i--){const f=feathers[i];f.age+=dt;f.velocity.multiplyScalar(Math.exp(-dt*.65));f.velocity.y-=dt*2.5;f.mesh.position.addScaledVector(f.velocity,dt);f.mesh.position.x+=Math.sin(f.age*5+f.phase)*dt*.7;f.mesh.rotation.x+=dt*f.spin;f.mesh.rotation.z+=dt*(1+Math.sin(f.age*4+f.phase));f.mesh.material.opacity=Math.min(1,(f.life-f.age)/1.4);if(f.age>=f.life){f.mesh.removeFromParent();f.mesh.material.dispose();feathers.splice(i,1);}}
  for(let i=sparks.length-1;i>=0;i--){const s=sparks[i];s.age+=dt;s.mesh.position.addScaledVector(s.velocity,dt);s.mesh.material.opacity=Math.max(0,1-s.age/.55);if(s.age>=.55){s.mesh.removeFromParent();s.mesh.material.dispose();sparks.splice(i,1);}}
  if(flash){burstAge+=dt;flash.intensity=45*Math.max(0,1-burstAge/.45);if(burstAge>=.45){flash.removeFromParent();flash.dispose();flash=null;}}
 }
 update(0);
 return {root,bird,wings,hair,feathers,target,hit:explode,capture(){enabled=false;active=false;carrying=true;bird.visible=true;talons.forEach(claw=>claw.position.z=1.05);birdLegs.forEach(leg=>{leg.position.z=.45;leg.scale.y=.55;leg.rotation.x=-1;});},carryAt(position,yaw){bird.position.copy(position);bird.rotation.set(0,yaw,0);},stop(){carrying=false;enabled=false;active=false;bird.visible=false;},unlockAudio:statueExplosionSound.unlock,update,get active(){return active;},get direction(){return direction;},get pass(){return pass;}};
}
