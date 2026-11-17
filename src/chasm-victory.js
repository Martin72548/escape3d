import { createCurtainCall } from './curtain-call.js';
import * as THREE from 'three';
import { createRetroVictoryMusic } from './retro-victory-music.js';

export function createChasmVictory(parent,prisoner,{compact=false,horizontalScale=1}={}){
 const root=new THREE.Group();root.name='Festejo final con arco iris y papel picado';root.visible=false;parent.add(root);
 const curtain=createCurtainCall(root,prisoner);
 const music=createRetroVictoryMusic(),colors=[0xff425b,0xff9a38,0xffe55d,0x69df74,0x55c9ff,0x7372ff,0xca79ed];
 const rainbow=new THREE.Group();rainbow.name='Arco iris de la victoria';rainbow.position.set(0,.7,compact?-9.4*horizontalScale:-34);if(compact)rainbow.scale.setScalar(.58*horizontalScale);root.add(rainbow);
 colors.forEach((color,i)=>{const band=new THREE.Mesh(new THREE.RingGeometry(14-i*.35,14.34-i*.35,128,1,0,Math.PI),new THREE.MeshBasicMaterial({color,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,fog:false}));band.raycast=()=>{};rainbow.add(band);});
 const confetti=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),new THREE.MeshStandardMaterial({side:THREE.DoubleSide,roughness:.55,metalness:.1}),850);confetti.name='Papel picado de colores';confetti.instanceMatrix.setUsage(THREE.DynamicDrawUsage);confetti.frustumCulled=false;confetti.raycast=()=>{};root.add(confetti);
 let seed=991;function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
 const pieces=Array.from({length:850},(_,i)=>{confetti.setColorAt(i,new THREE.Color(colors[i%colors.length]));return {x:(random()-.5)*(compact?18*horizontalScale:23),y:5+random()*(compact?9:17),z:(compact?-7*horizontalScale:-26)+(random()-.5)*(compact?5*horizontalScale:15),fall:2.3+random()*3,size:.09+random()*.17,phase:random()*6.28,spin:1+random()*5};});
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=320;const ctx=canvas.getContext('2d');
 ctx.fillStyle='#111936';ctx.fillRect(0,0,1024,320);ctx.strokeStyle='#ffe275';ctx.lineWidth=12;ctx.strokeRect(12,12,1000,296);ctx.strokeStyle='#73e6e0';ctx.lineWidth=3;ctx.strokeRect(30,30,964,260);
 ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 160px monospace';ctx.fillStyle='#0a0e21';ctx.fillText('Ganaste',520,174);ctx.fillStyle='#ffe275';ctx.fillText('Ganaste',512,162);
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
 const banner=new THREE.Mesh(new THREE.PlaneGeometry(6.4,2),new THREE.MeshBasicMaterial({map,side:THREE.DoubleSide,fog:false}));banner.name='Cartel Ganaste';banner.position.set(0,compact?6:8.5,compact?-8*horizontalScale:-27);banner.visible=false;banner.raycast=()=>{};root.add(banner);
 const arms=[prisoner.getObjectByName('casting-arm'),prisoner.getObjectByName('left-arm')],elbows=[prisoner.getObjectByName('casting-elbow'),prisoner.getObjectByName('left-elbow')];
 const legs=prisoner.userData.walkingLegs||[],dummy=new THREE.Object3D();let active=false,age=0,baseY=0,startYaw=0,announced=false;
 const torso=prisoner.getObjectByName('prisoner-torso'),torsoRest=torso?.quaternion.clone(),bowAxis=new THREE.Vector3(1,0,0);
 const status=document.createElement('div');status.setAttribute('role','status');status.style.cssText='position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);';document.body.append(status);
 function start(){
  if(active)return;active=true;root.visible=true;curtain.start();baseY=prisoner.position.y;startYaw=prisoner.rotation.y;prisoner.userData.victoryCelebrating=true;prisoner.userData.gameWon=true;
 }
 function update(dt){
  if(!active)return;age+=dt;curtain.update(age);
  const lift=THREE.MathUtils.smoothstep(age,0,.5)*(1-THREE.MathUtils.smoothstep(age,3.4,4.1)),wobble=Math.sin(age*5)*.055;
  arms.forEach((arm,i)=>{if(arm)arm.rotation.set(-.12*lift,0,(i===0?-1:1)*(2.65+wobble)*lift);});
  if(elbows[0])elbows[0].rotation.set(1.4*lift,0,0);if(elbows[1])elbows[1].rotation.set(-.2*lift,0,0);
  const jumpTime=Math.max(0,age-.45),jumpDuration=.78,jumping=jumpTime<jumpDuration*4;
  const t=jumping?(jumpTime%jumpDuration)/jumpDuration:0,height=jumping?4*t*(1-t)*.72:0;
  prisoner.position.y=baseY+height;
  if(torso)torso.quaternion.copy(torsoRest).multiply(new THREE.Quaternion().setFromAxisAngle(bowAxis,.48*curtain.bowAmount));
  prisoner.rotation.y=startYaw+Math.atan2(Math.sin(-startYaw),Math.cos(-startYaw))*THREE.MathUtils.smoothstep(age,0,1);
  legs.forEach((leg,i)=>leg.rotation.x=jumping?Math.sin(t*Math.PI)*.12*(i===0?-1:1):0);
  rainbow.children.forEach(band=>band.material.opacity=THREE.MathUtils.smoothstep(age,.5,2)*.8);
  pieces.forEach((p,i)=>{
   p.y-=dt*p.fall;if(p.y<.4&&age<11)p.y=15+random()*6;
   dummy.position.set(p.x+Math.sin(age*1.3+p.phase)*1.4,p.y,p.z+Math.cos(age+p.phase)*.5);dummy.rotation.set(age*p.spin+p.phase,age*.8+p.phase,age*p.spin*.7);dummy.scale.set(p.size,p.size*.65,p.y<.3?0:1);if(p.y<.3)dummy.scale.setScalar(0);dummy.updateMatrix();confetti.setMatrixAt(i,dummy.matrix);
  });confetti.instanceMatrix.needsUpdate=true;
  if(age>=4.1&&!announced){announced=true;banner.visible=true;status.textContent='Ganaste. Lanza un rayo a cada una de las diez piedras para convocar a los personajes.';music.play();}
 }
 return {root,rainbow,confetti,banner,music,curtain,start,update,get active(){return active;},get age(){return age;},get completed(){return announced;}};
}
