import { translate } from './language.js';
import { createRecordedChasmFallSound } from './recorded-chasm-fall-sound.js';
import * as THREE from 'three';

export function createChasmFall(parent,prisoner,depth,birds){
 const root=new THREE.Group();root.name='Derrota por caida al precipicio';parent.add(root);
 const canvas=document.createElement('canvas');canvas.width=1400;canvas.height=256;const ctx=canvas.getContext('2d');ctx.fillStyle='#180c15';ctx.fillRect(0,0,1400,256);ctx.strokeStyle='#e77871';ctx.lineWidth=9;ctx.strokeRect(9,9,1382,238);ctx.font='bold 78px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff0e9';ctx.fillText(translate('Fin de la partie', 'El juego ha terminado'),700,128);
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
 const banner=new THREE.Mesh(new THREE.PlaneGeometry(10,1.85),new THREE.MeshBasicMaterial({map,side:THREE.DoubleSide,depthTest:false,fog:false}));banner.name=translate('Fin de la partie', 'El juego ha terminado');banner.visible=false;banner.renderOrder=100;banner.raycast=()=>{};root.add(banner);
 const sound=createRecordedChasmFallSound();
 const cloth=new THREE.Mesh(new THREE.ConeGeometry(.08,.16,6),new THREE.MeshStandardMaterial({color:0x626358,roughness:1}));cloth.name='Pliegue de la ropa agarrado por las garras';cloth.position.set(0,1.22,-.18);cloth.visible=false;prisoner.add(cloth);
 const splash=new THREE.Group();splash.name='Impacto del prisionero en el rio';splash.visible=false;root.add(splash);
 const ring=new THREE.Mesh(new THREE.RingGeometry(.7,1,48),new THREE.MeshBasicMaterial({color:0xe5f7f1,transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.raycast=()=>{};splash.add(ring);
 const sprayPositions=new Float32Array(180*3),sprayGeometry=new THREE.BufferGeometry();sprayGeometry.setAttribute('position',new THREE.BufferAttribute(sprayPositions,3));
 const spray=new THREE.Points(sprayGeometry,new THREE.PointsMaterial({color:0xecfffb,size:.18,transparent:true,opacity:.9,depthWrite:false}));spray.frustumCulled=false;splash.add(spray);
 let active=false,completed=false,age=0,start=null,side=1,birdStart=null,yaw=0,released=false,drop=null,escape=null,splashAge=0,announced=false;
 let liftDuration=1.8;
 let cryOnRelease=true;
 const fallDuration=3,grip=new THREE.Vector3(0,-.96,1.05);
 function begin(direction,{cry=true}={}){
  if(active||prisoner.userData.gameWon)return;active=true;start=prisoner.position.clone();side=direction>=0?1:-1;yaw=prisoner.rotation.y;
  cryOnRelease=cry;
  if(direction===undefined){liftDuration=0;birds.stop();}
  else{birdStart=birds.bird.position.clone();birds.capture();cloth.visible=true;}
  prisoner.userData.fallen=true;prisoner.userData.gameOver=true;prisoner.userData.chasmFalling=false;
  banner.position.copy(start).add(new THREE.Vector3(0,5,0));banner.rotation.x=-Math.PI/3;
 }
 function finish(){
  if(announced)return;announced=true;banner.visible=true;
  const panel=document.createElement('div');panel.id='chasm-game-over';panel.setAttribute('role','alert');panel.textContent=translate('Fin de la partie', 'El juego ha terminado');panel.style.cssText='position:fixed;inset:0;z-index:80;display:grid;place-items:center;background:rgba(13,7,18,.65);color:#fff0e9;font:bold clamp(28px,5vw,64px) system-ui;text-align:center;text-shadow:0 3px 18px #000;padding:24px;pointer-events:none;';document.body.append(panel);
 }
 function updateSplash(dt){
  splashAge+=dt;ring.scale.setScalar(.5+splashAge*2.6);ring.material.opacity=Math.max(0,.8-splashAge*.4);spray.material.opacity=Math.max(0,1-splashAge*.5);
  for(let i=0;i<180;i++){const angle=i*2.39996,speed=1.3+(i%9)*.22,t=Math.min(splashAge,2);sprayPositions[i*3]=Math.cos(angle)*speed*t;sprayPositions[i*3+1]=Math.max(0,(3+(i%7)*.35)*t-4*t*t);sprayPositions[i*3+2]=Math.sin(angle)*speed*t;}sprayGeometry.attributes.position.needsUpdate=true;
  if(splashAge>=.7)finish();if(splashAge>2.5)splash.visible=false;
 }
 function update(dt){
  if(!active)return;if(completed){updateSplash(dt);return;}age+=dt;
  for(const [index,name]of ['casting-arm','left-arm'].entries()){const arm=prisoner.getObjectByName(name);if(arm)arm.rotation.z=(index===0?-1:1)*(1.3+Math.sin(age*7)*.15);}
  (prisoner.userData.walkingLegs||[]).forEach((leg,i)=>leg.rotation.x=Math.sin(age*8+i*Math.PI)*.25);
  if(age<liftDuration){
   const lift=THREE.MathUtils.smoothstep(age,.4,liftDuration);prisoner.position.set(start.x+side*2.4*lift,start.y+4.8*lift,THREE.MathUtils.lerp(start.z,0,lift));prisoner.rotation.set(0,yaw,Math.sin(age*5)*.045);
   const clothPoint=prisoner.localToWorld(new THREE.Vector3(0,1.28,-.18));
   const gripOffset=grip.clone().applyAxisAngle(new THREE.Vector3(0,1,0),yaw),birdTarget=clothPoint.sub(gripOffset);
   birds.carryAt(birdStart.clone().lerp(birdTarget,THREE.MathUtils.smoothstep(age,0,.4)),yaw);return;
  }
  if(!released){
   released=true;cloth.visible=false;prisoner.userData.chasmFalling=true;
   drop=liftDuration?new THREE.Vector3(start.x+side*2.4,start.y+4.8,0):start;
   prisoner.position.copy(drop);if(liftDuration)escape=birds.bird.position.clone();if(cryOnRelease)sound.startScream();
  }
  const t=Math.min(fallDuration,age-liftDuration),fraction=t/fallDuration;
  const z=THREE.MathUtils.lerp(drop.z,THREE.MathUtils.clamp(drop.z,-4.8,4.8),fraction);
  prisoner.position.set(drop.x+side*t*.16,THREE.MathUtils.lerp(drop.y,-depth+.2,fraction*fraction),z+Math.sin(t*2)*.12);
  prisoner.rotation.z=side*Math.min(Math.PI*.65,t*2);prisoner.rotation.x=Math.sin(t*3)*.35;
  if(escape){if(t<2)birds.carryAt(escape.clone().add(new THREE.Vector3(side*t*10.8,t*2.5,0)),yaw);else birds.stop();}
  if(t>=fallDuration){
   sound.playSplash();
   prisoner.userData.dead=true;prisoner.userData.chasmFalling=false;completed=true;splash.position.set(prisoner.position.x,-depth+.4,prisoner.position.z);splash.visible=true;splashAge=0;birds.stop();
  }
 }

 return {root,banner,sound,cloth,splash,begin,update,get phase(){return completed?'impact':released?'falling':active?(age<.4?'grabbing':'lifting'):'idle';},get active(){return active;},get completed(){return completed;}};
}
