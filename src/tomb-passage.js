import { stoneFloorHeight } from './stone-floor.js';
import { createRecordedDoorCreak } from './recorded-door-creak.js';
import { statueExplosionSound } from './statue-explosion-sound.js';
import { createWerewolfEncounter } from './werewolf-encounter.js';
import { createCageReleaseSound } from './cage-release-sound.js';
import * as THREE from 'three';
import { createRealisticTorch } from './realistic-torch.js';
import { addStoneCourses } from './stone-masonry.js';

export function createTombPassage(scene,tomb,prisoner,onArrive){
 const lid=tomb.userData.lid,stone=tomb.userData.stoneMaterial;
 let state='closed',time=0,effectAge=0,phase=0,waypoint=0,triggered=false,segmentAge=0,segmentStart=null,stepIndex=0,footFrom=null,footTo=null;
 const feet=[],legs=prisoner.userData.walkingLegs||[];
 const debris=[],dust=[],path=[];
 const stairs=new THREE.Group();stairs.name='Escalera descendente dentro de la tumba';stairs.visible=false;tomb.add(stairs);
 function block(w,h,d,x,y,z,material=stone){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;stairs.add(mesh);return mesh;}
 // The first steps start at the broken lid; the flight continues below the museum floor.
 for(let i=0;i<29;i++){
  const y=1.2-i*.2,z=1.35-i*.32;
  const step=block(1.18,.18,.32,0,y-.09,z);step.name='Peldano descendente de piedra '+(i+1);
  if(i>0){const h=Math.min(2.3,Math.max(.1,.9-y));block(.14,h,.35,-.68,y+h/2-.1,z);block(.14,h,.35,.68,y+h/2-.1,z);}
 }
 // The exterior steps belong to the permanent tomb, so they are visible before the ray.
 const glow=new THREE.PointLight(0xffb369,9,7,2);glow.position.set(0,-.5,.2);stairs.add(glow);
 const chunkGeometry=new THREE.DodecahedronGeometry(1,0),dustGeometry=new THREE.SphereGeometry(1,10,8);
 function trigger(){
  if(triggered||prisoner.userData.dead||prisoner.userData.georgeCaptured)return;
  triggered=true;state='breaking';time=0;lid.visible=false;stairs.visible=true;prisoner.userData.levelTransition=true;statueExplosionSound.play();
  if(tomb.userData.floorCover)tomb.userData.floorCover.visible=false;
  for(const mesh of tomb.userData.passageEndStones||[])mesh.visible=false;
  tomb.updateWorldMatrix(true,true);
  for(let i=0;i<65;i++){
   const mesh=new THREE.Mesh(chunkGeometry,stone);mesh.name='Piedra de la tumba expulsada al lateral';mesh.userData.tombDebris=true;mesh.position.copy(tomb.localToWorld(new THREE.Vector3((Math.random()-.5)*1.55,1.2+Math.random()*.5,(Math.random()-.5)*3.15)));mesh.scale.set(.07+Math.random()*.19,.06+Math.random()*.15,.08+Math.random()*.2);mesh.castShadow=true;scene.add(mesh);
   const side=i%2===0?-1:1;
   const landing=tomb.parent.localToWorld(new THREE.Vector3(side*(8.65+Math.random()*.4),.1,-8+Math.random()*16));
   debris.push({mesh,start:mesh.position.clone(),landing,age:0,duration:.75+Math.random()*.4,arc:1.5+Math.random()*1.5,spin:new THREE.Vector3(Math.random()*6,Math.random()*6,Math.random()*6),settled:false});
  }
  for(let i=0;i<25;i++){
   const material=new THREE.MeshBasicMaterial({color:0xb1a18b,transparent:true,opacity:.18,depthWrite:false});const mesh=new THREE.Mesh(dustGeometry,material);mesh.position.copy(tomb.localToWorld(new THREE.Vector3((Math.random()-.5)*1.8,1.3,(Math.random()-.5)*3)));mesh.scale.setScalar(.15+Math.random()*.2);scene.add(mesh);dust.push(mesh);
  }
  // Go around the solid sarcophagus before lining up with its front steps.
  const local=tomb.worldToLocal(prisoner.getWorldPosition(new THREE.Vector3()));
  const side=local.x<0?-1:1;
  if(local.z<3.9){
   if(Math.abs(local.x)<1.45)path.push(new THREE.Vector3(side*1.6,.02,local.z));
   path.push(new THREE.Vector3(Math.abs(local.x)<1.45?side*1.6:local.x,.02,3.9));
  }
  path.push(new THREE.Vector3(0,.02,3.9),new THREE.Vector3(0,.02,3.62));
  function tread(y,z){const point=new THREE.Vector3(0,y+.02,z);point.stair=true;path.push(point);}
  for(let i=0;i<6;i++)tread(.2*(i+1),3.3-i*.32);
  for(let i=0;i<29;i++)tread(1.2-i*.2,1.35-i*.32);
  path.at(-1).lastStair=true;
  path.forEach(point=>tomb.localToWorld(point));
  segmentStart=prisoner.position.clone();

 }
 function update(dt){
  if(!triggered||state==='arrived')return;time+=dt;effectAge+=dt;
  // Every fragment crosses the room and lands beside a side wall before descent.
  for(const part of debris){
   if(part.settled)continue;
   part.age+=dt;const t=Math.min(1,part.age/part.duration);
   part.mesh.position.lerpVectors(part.start,part.landing,t);
   part.mesh.position.y+=4*t*(1-t)*part.arc;
   part.mesh.rotation.x+=part.spin.x*dt;part.mesh.rotation.y+=part.spin.y*dt;
   const floor=stoneFloorHeight(part.mesh);
   if(t===1){part.mesh.position.y=floor;part.settled=true;}
   else part.mesh.position.y=Math.max(floor,part.mesh.position.y);
  }
  for(const mesh of dust){mesh.position.y+=dt*.3;mesh.scale.multiplyScalar(Math.exp(dt*.22));mesh.material.opacity=Math.max(0,.18-effectAge*.06);mesh.visible=mesh.material.opacity>0;}
  if(state==='breaking'){if(time>1.3){state='descending';time=0;}return;}
  let remaining=Math.min(dt,.1);
  while(remaining>0&&state!=='arrived'){
   const target=path[waypoint],horizontal=Math.hypot(target.x-segmentStart.x,target.z-segmentStart.z);
   const duration=target.stair?Math.max(.48,horizontal/.85):Math.max(.05,horizontal/1.25);
   const step=Math.min(remaining,duration-segmentAge);segmentAge+=step;remaining-=step;
   const t=Math.min(1,segmentAge/duration),smooth=THREE.MathUtils.smoothstep(t,.12,.88);
   const yaw=Math.atan2(target.x-segmentStart.x,target.z-segmentStart.z);
   prisoner.rotation.y+=Math.atan2(Math.sin(yaw-prisoner.rotation.y),Math.cos(yaw-prisoner.rotation.y))*(1-Math.exp(-step*10));
   prisoner.position.lerpVectors(segmentStart,target,t);prisoner.position.y=THREE.MathUtils.lerp(segmentStart.y,target.y,smooth);
   if(target.stair){
    const halfStance=.115*prisoner.scale.x;
    const lateral=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
    if(!feet.length){
     for(const side of [-1,1])feet.push(segmentStart.clone().addScaledVector(lateral,side*halfStance));
    }
    const moving=stepIndex%2;
    if(!footFrom){
     footFrom=feet[moving].clone();
     footTo=target.clone().addScaledVector(lateral,moving===0?-halfStance:halfStance);
    }
    // Lift before crossing the riser and set the foot down before transferring weight.
    const swing=Math.min(1,t/.82),apex=Math.max(footFrom.y,footTo.y)+.12;
    feet[moving].lerpVectors(footFrom,footTo,THREE.MathUtils.smoothstep(swing,.12,.88));
    feet[moving].y=swing<.5
     ?THREE.MathUtils.lerp(footFrom.y,apex,THREE.MathUtils.smoothstep(swing,0,.5))
     :THREE.MathUtils.lerp(apex,footTo.y,THREE.MathUtils.smoothstep(swing,.5,1));
    const entry=stepIndex===0?THREE.MathUtils.smoothstep(t,0,.45):1;
    const exit=target.lastStair?1-THREE.MathUtils.smoothstep(t,.75,1):1;
    prisoner.position.y-=(.11+.07*Math.sin(Math.PI*t)**2)*entry*exit;
    prisoner.userData.stairFootTargets=feet;
    legs.forEach(leg=>leg.rotation.x=0);
   }else{
    phase+=step*7;legs.forEach((leg,i)=>leg.rotation.x=Math.sin(phase+i*Math.PI)*.32);
   }
   if(t>=1){
    segmentStart.copy(target);segmentAge=0;waypoint++;
    if(target.stair){stepIndex++;footFrom=null;footTo=null;}
    if(waypoint>=path.length){
     state='arrived';prisoner.userData.stairFootTargets=null;legs.forEach(leg=>leg.rotation.x=0);
     for(const part of debris)part.mesh.removeFromParent();for(const mesh of dust){mesh.removeFromParent();mesh.material.dispose();}
     onArrive();
    }
   }
  }

 }
 return {trigger,update,get active(){return triggered;},get state(){return state;}};
}

const cageWarningSequence = "Une louve affamée qu'on a enfermée ici t'attend pour se nourrir.".split(' ');

// Place each word on the face of one existing masonry block.
function addCageWarning(stones){
 const labels=[];stones.userData.warningWords={};
 const words=[10,2,0,7,4,9,1,8,5,3,6].map(index=>cageWarningSequence[index]);
 const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3(),blocks=[];
 for(let i=0;i<stones.count;i++){
  stones.getMatrixAt(i,matrix);matrix.decompose(position,rotation,scale);
  if(position.x> -6.5&&position.x< -2.4&&position.y> -1.7&&position.y< .8&&scale.x>.65)
   blocks.push({index:i,x:position.x,y:position.y});
 }
 blocks.sort((a,b)=>Math.round(b.y/.53)-Math.round(a.y/.53)||a.x-b.x);
 words.forEach((word,i)=>{
  const block=blocks[i];if(!block)return;
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=192;
  const ctx=canvas.getContext('2d');ctx.font='bold 92px Georgia, serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle='#211b14';ctx.fillText(word,256,100,460);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  const label=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));
  stones.getMatrixAt(block.index,matrix);matrix.decompose(position,rotation,scale);
  label.position.set(0,0,.515).applyMatrix4(matrix);label.quaternion.copy(rotation);label.scale.set(scale.x*.9,scale.y*.72,1);
  label.name='Palabra en piedra: '+word;label.userData.warningWord=word;label.userData.stoneIndex=block.index;
  stones.parent.add(label);labels.push(label);stones.userData.warningWords[block.index]=word;
 });
 return labels;
}

function addPuzzleInstruction(stones,labels){
 if(!labels.length)return;
 const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3();
 const top=Math.max(...labels.map(label=>label.position.y)),targetY=top+2*.53;
 const centerX=labels.reduce((sum,label)=>sum+label.position.x,0)/labels.length;
 let best=-1,distance=Infinity;
 for(let i=0;i<stones.count;i++){
  stones.getMatrixAt(i,matrix);matrix.decompose(position,rotation,scale);
  if(scale.x<.7||Math.abs(position.y-targetY)>.09)continue;
  const d=Math.abs(position.x-centerX);if(d<distance){distance=d;best=i;}
 }
 if(best<0)return;
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=384;
 const ctx=canvas.getContext('2d');ctx.font='bold 112px Georgia, serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#211b14';
 ctx.fillText('Descubre el',512,120,940);ctx.fillText('mensaje',512,264,940);
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
 const label=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));
 stones.getMatrixAt(best,matrix);matrix.decompose(position,rotation,scale);
 label.position.set(0,0,.515).applyMatrix4(matrix);label.quaternion.copy(rotation);label.scale.set(scale.x*.92,scale.y*.8,1);
 label.name='Descubre el mensaje';label.userData.stoneIndex=best;label.raycast=()=>{};stones.parent.add(label);
}

function addEscapeWord(stones,labels){
 const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3();
 const bottom=Math.min(...labels.map(label=>label.position.y)),targetY=bottom-2*.53;
 const centerX=labels.reduce((sum,label)=>sum+label.position.x,0)/labels.length;
 let best=-1,distance=Infinity;
 for(let i=0;i<stones.count;i++){
  stones.getMatrixAt(i,matrix);matrix.decompose(position,rotation,scale);
  if(scale.x<.7||Math.abs(position.y-targetY)>.09)continue;
  const d=Math.abs(position.x-centerX);if(d<distance){distance=d;best=i;}
 }
 if(best<0)throw new Error('No se encontro el ladrillo para Fuis !');
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=192;
 const ctx=canvas.getContext('2d');ctx.font='bold 92px Georgia, serif';ctx.textAlign='center';ctx.textBaseline='middle';
 ctx.shadowColor='#ff3100';ctx.shadowBlur=28;ctx.fillStyle='#ff6505';ctx.fillText('Fuis !',256,100,460);
 ctx.shadowColor='#ff9900';ctx.shadowBlur=12;
 const fire=ctx.createLinearGradient(0,55,0,145);fire.addColorStop(0,'#fffde8');fire.addColorStop(.5,'#ffe974');fire.addColorStop(.8,'#ffad21');fire.addColorStop(1,'#ff4c05');ctx.fillStyle=fire;ctx.fillText('Fuis !',256,100,460);
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
 const label=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-1}));
 stones.getMatrixAt(best,matrix);matrix.decompose(position,rotation,scale);
 label.position.set(0,0,.515).applyMatrix4(matrix);label.quaternion.copy(rotation);label.scale.set(scale.x*.9,scale.y*.72,1);
 label.name='Ladrillo Fuis !';label.userData.escapeWord=true;label.userData.stoneIndex=best;label.visible=false;stones.parent.add(label);
 const halo=new THREE.Mesh(new THREE.PlaneGeometry(1.12,1.3),new THREE.MeshBasicMaterial({map,color:0xff6508,transparent:true,opacity:.38,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));halo.position.z=.003;halo.raycast=()=>{};label.add(halo);
 const glow=new THREE.PointLight(0xff700a,2.5,2.5,2);glow.position.set(0,0,.65);label.add(glow);
 let fireAge=0;
 function update(dt){
  if(!label.visible)return;fireAge+=dt;
  const flicker=.85+Math.sin(fireAge*11)*.08+Math.sin(fireAge*23)*.05;
  label.material.color.setRGB(1,.9+flicker*.1,.78+flicker*.22);halo.material.opacity=.28+flicker*.15;glow.intensity=2+flicker*1.6;
 }
 function matches(hit){
  if(hit.mesh===label)return true;if(hit.mesh!==stones)return false;
  if(hit.instanceId!=null)return hit.instanceId===best;
  if(!hit.point)return false;
  const local=stones.worldToLocal(hit.point.clone()).applyMatrix4(matrix.clone().invert());return Math.abs(local.x)<=.5&&Math.abs(local.y)<=.5;
 }
 return {label,matches,update};
}

function createWordBrickLayout(stones,labels){
 const slots=labels.map(label=>{const matrix=new THREE.Matrix4();stones.getMatrixAt(label.userData.stoneIndex,matrix);return matrix;});
 const order=[...labels],motions=new Map();
 function move(label,slot){
  const start=new THREE.Matrix4();stones.getMatrixAt(label.userData.stoneIndex,start);
  const position=new THREE.Vector3(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3();start.decompose(position,rotation,scale);
  const targetPosition=new THREE.Vector3(),targetRotation=new THREE.Quaternion(),targetScale=new THREE.Vector3();slots[slot].decompose(targetPosition,targetRotation,targetScale);
  motions.set(label,{age:0,position,rotation,scale,targetPosition,targetRotation,targetScale});
 }
 function place(word,slot){
  const index=order.findIndex(label=>label.userData.warningWord===word);if(index===slot)return;
  const chosen=order[index],displaced=order[slot];[order[slot],order[index]]=[chosen,displaced];move(chosen,slot);move(displaced,index);
 }
 function update(dt){
  if(!motions.size)return;
  for(const [label,motion]of motions){
   motion.age=Math.min(1,motion.age+dt/.75);const t=THREE.MathUtils.smoothstep(motion.age,0,1);
   const position=motion.position.clone().lerp(motion.targetPosition,t);position.z+=Math.sin(Math.PI*t)*.3;
   const rotation=motion.rotation.clone().slerp(motion.targetRotation,t),scale=motion.scale.clone().lerp(motion.targetScale,t);
   const matrix=new THREE.Matrix4().compose(position,rotation,scale);stones.setMatrixAt(label.userData.stoneIndex,matrix);
   label.position.set(0,0,.515).applyMatrix4(matrix);label.quaternion.copy(rotation);label.scale.set(scale.x*.9,scale.y*.72,1);
   if(motion.age===1)motions.delete(label);
  }
  stones.instanceMatrix.needsUpdate=true;stones.computeBoundingSphere();
 }
 function reset(){order.splice(0,order.length,...labels);labels.forEach((label,index)=>move(label,index));}
 return {place,update,reset,get settled(){return motions.size===0;},get order(){return order.map(label=>label.userData.warningWord);}};
}

export function buildLowerChamber(scene,prisoner,onExit=()=>{},onWordCorrect=()=>{}){
 const root=new THREE.Group();root.name='Nivel 3 - Camara subterranea';scene.add(root);
 const sequence=cageWarningSequence;
 let progress=0,opened=false,opening=0,labels=[],warningStones=null,wordLayout=null,escapeWord=null;
 let mistakes=0,gateTarget=0,released=false,releaseAge=0,silentRelease=false,gateFalling=false,fallSpeed=0;
 const doorCreak=createRecordedDoorCreak(),releaseSound=createCageReleaseSound(),gateHeights=[0,.65,1.3,1.95,2.8,4.1];
 const gate=new THREE.Group();gate.name='Reja que se eleva con los errores';root.add(gate);
 const werewolf=createWerewolfEncounter(root,prisoner,()=>{gateTarget=0;gateFalling=true;fallSpeed=0;});
 const secretDoor=new THREE.Group();secretDoor.userData.cryptExit=true;secretDoor.name='Puerta del pasadizo secreto izquierdo';root.add(secretDoor);
 const stone=new THREE.MeshStandardMaterial({color:0x736f65,roughness:.94}),dark=new THREE.MeshStandardMaterial({color:0x373936,roughness:1}),iron=new THREE.MeshStandardMaterial({color:0x35312a,metalness:.75,roughness:.55});
 function box(w,h,d,x,y,z,material=stone){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);return mesh;}
 box(20,.2,20,0,-.12,0);addStoneCourses(root,stone,20,20,0,0,0,-Math.PI/2,0,920,true,{jointed:true});
 for(const [x,z,yaw]of [[0,-10,0],[10,0,-Math.PI/2],[0,10,Math.PI]]){if(z===-10){box(8.35,6,.3,-5.825,3,z,dark);box(8.35,6,.3,5.825,3,z,dark);box(3.3,2,.3,0,5,z,dark);}else box(x===0?20:.3,6,x===0?.3:20,x,3,z,dark);const courses=addStoneCourses(root,stone,20,6,x-Math.sign(x)*.18,3,z-Math.sign(z)*.18,0,yaw,930+Math.round(yaw*10));if(z===-10){
  const matrix=new THREE.Matrix4(),center=new THREE.Vector3(),scale=new THREE.Vector3(),rotation=new THREE.Quaternion();
  for(let i=0;i<courses.count;i++){courses.getMatrixAt(i,matrix);matrix.decompose(center,rotation,scale);if(Math.abs(center.x)<1.9&&center.y<1.05){scale.set(0,0,0);matrix.compose(center,rotation,scale);courses.setMatrixAt(i,matrix);}}
  courses.instanceMatrix.needsUpdate=true;courses.computeBoundingSphere();warningStones=courses;labels=addCageWarning(courses);addPuzzleInstruction(courses,labels);wordLayout=createWordBrickLayout(courses,labels);escapeWord=addEscapeWord(courses,labels);}}
 // The left wall has a real opening, initially filled by a rising stone panel.
 for(const [width,height,z,y]of [[5,6,-7.5,3],[12,6,4,3],[3,2.3,-3.5,4.85]]){
  box(.3,height,width,-10,y,z,dark);addStoneCourses(root,stone,width,height,-9.82,y,z,0,Math.PI/2,952+Math.round(z*10));
 }
 const panel=box(.3,3.7,3,-10,1.85,-3.5,dark);secretDoor.attach(panel);
 const panelStones=addStoneCourses(root,stone,3,3.7,-9.82,1.85,-3.5,0,Math.PI/2,958);secretDoor.attach(panelStones.parent);
 const corridor=new THREE.Group();corridor.name='Pasillo hacia el precipicio';corridor.userData.cryptExit=true;root.add(corridor);
 const passageBox=(...args)=>{const object=box(...args);corridor.attach(object);return object;};
 passageBox(6,.2,3,-13,-.12,-3.5);passageBox(6,.2,3,-13,3.8,-3.5,dark);
 for(const z of [-5.15,-1.85]){passageBox(6,3.8,.3,-13,1.9,z,dark);const courses=addStoneCourses(root,stone,6,3.8,-13,1.9,z+(z< -3.5?.18:-.18),0,z< -3.5?0:Math.PI,960+Math.round(z*10));corridor.attach(courses.parent);}
 passageBox(.3,3.8,3.6,-16,1.9,-3.5,dark);
 let exited=false;
 function tryExit(hit){
  if(!opened||exited||!hit?.mesh||prisoner.userData.dead||prisoner.userData.gameOver)return false;
  for(let object=hit.mesh;object;object=object.parent)if(object.userData.cryptExit){exited=true;doorCreak.stop();onExit();return true;}
  return false;
 }
 const passageLight=new THREE.PointLight(0xffc585,20,8);passageLight.position.set(-12.5,2.7,-3.5);root.add(passageLight);
 function cast(hit){
  if(!hit?.mesh||prisoner.userData.dead||prisoner.userData.gameOver)return;
  if(werewolf.hit(hit.mesh))return;
  if(escapeWord.label.visible&&escapeWord.matches(hit)){if(!opened){opened=true;prisoner.userData.lowerPassageOpen=true;doorCreak.play();}return;}
  if(progress===sequence.length||gateFalling||werewolf.state==='thrown')return;
  let word=hit.mesh.userData.warningWord;
  if(!word&&hit.mesh===warningStones){
   let index=hit.instanceId;
   if(index==null&&hit.point){const local=warningStones.worldToLocal(hit.point.clone()),matrix=new THREE.Matrix4(),center=new THREE.Vector3();let nearest=Infinity;
    for(const id of Object.keys(warningStones.userData.warningWords)){warningStones.getMatrixAt(Number(id),matrix);center.setFromMatrixPosition(matrix);const distance=Math.hypot(center.x-local.x,center.y-local.y);if(distance<nearest){nearest=distance;index=Number(id);}}
    if(nearest>.65)return;
   }
   word=warningStones.userData.warningWords[index];
  }
  if(!word)return;
  if(word===sequence[progress]){wordLayout.place(word,progress);onWordCorrect(word,progress);}
  if(word!==sequence[progress]){mistakes=Math.min(5,mistakes+1);gateTarget=gateHeights[mistakes];}
  progress=word===sequence[progress]?progress+1:word===sequence[0]?1:0;
  if(progress===sequence.length){escapeWord.label.visible=true;if(werewolf.rage(gate))releaseSound.play();}
  labels.forEach(label=>label.material.color.set(sequence.slice(0,progress).includes(label.userData.warningWord)?0x66ffbb:0xffffff));
 }

 box(20,.2,20,0,6,0,dark);
 for(const x of [-7,7])for(const z of [-6,1,7]){box(.7,5.8,.7,x,2.9,z);box(1,.25,1,x,.13,z,dark);box(1,.25,1,x,5.7,z,dark);}
 // Blocked stone arch and iron door give the next room a distinct destination.
 box(3.8,.2,7,0,-.12,-13.3);box(3.8,.2,7,0,4.1,-13.3,dark);
 box(3.8,4.2,.3,0,2.1,-16.8,dark);box(.3,4.2,7,1.9,2.1,-13.3,dark);
 // A left-hand bend inside the cage hides the captor and victim from the cell.
 box(.3,4.2,3.4,-1.9,2.1,-11.5,dark);box(.3,4.2,1.2,-1.9,2.1,-16.2,dark);
 box(.3,.7,2.4,-1.9,3.85,-14.4,dark);
 box(5.8,.2,2.4,-4.65,-.12,-14.4);box(5.8,.2,2.4,-4.65,4.1,-14.4,dark);
 for(const z of [-13.2,-15.6])box(5.8,4.2,.3,-4.65,2.1,z,dark);
 box(.3,4.2,2.4,-7.55,2.1,-14.4,dark);
 for(const x of [-1.75,1.75])for(let row=0;row<9;row++)box(.48,.44,.5,x,.23+row*.46,-9.55);
 for(let i=0;i<11;i++){const a=i/10*Math.PI,mesh=box(.44,.48,.5,Math.cos(a)*1.75,4.05+Math.sin(a)*1.75,-9.55);mesh.rotation.z=a-Math.PI/2;}
 for(let i=0;i<9;i++)gate.attach(box(.065,3.9,.08,-1.36+i*.34,1.95,-9.55,iron));for(const y of [.5,2,3.5])gate.attach(box(2.85,.09,.1,0,y,-9.49,iron));
 const flames=[];
 for(const x of [-9.5,9.5])for(const z of [-6,2,7])flames.push(createRealisticTorch(root,{position:[x,3,z],rotationY:x<0?Math.PI/2:-Math.PI/2,intensity:55,seed:flames.length+21}));
 root.add(new THREE.HemisphereLight(0xb8c4cf,0x30261b,.9));
 prisoner.userData.lowerPassageOpen=false;prisoner.position.set(0,.02,6);prisoner.rotation.set(0,Math.PI,0);prisoner.visible=true;prisoner.userData.levelTransition=false;prisoner.userData.currentLevel=3;
 scene.background=new THREE.Color(0x171d20);scene.fog=new THREE.Fog(0x171d20,18,38);
 return {root,cast,tryExit,unlockAudio(){releaseSound.unlock();doorCreak.unlock();},werewolf,get wordOrder(){return wordLayout.order;},get mistakes(){return mistakes;},get gateHeight(){return gate.position.y;},get released(){return released;},get progress(){return progress;},get opened(){return opened;},get passageReady(){return opening>=1;},update(dt){wordLayout.update(dt);escapeWord.update(dt);flames.forEach(torch=>torch.update(dt));werewolf.update(dt);
 if(gateFalling){fallSpeed+=dt*18;gate.position.y=Math.max(0,gate.position.y-fallSpeed*dt);if(gate.position.y===0){
  gateFalling=false;progress=0;mistakes=0;released=false;releaseAge=0;silentRelease=false;fallSpeed=0;
  escapeWord.label.visible=false;wordLayout.reset();labels.forEach(label=>label.material.color.set(0xffffff));
 }}
 else gate.position.y=Math.min(gateTarget,gate.position.y+dt*2.8);
 if(released&&silentRelease&&(werewolf.state==='hidden'||werewolf.state==='caged')){releaseAge+=dt;if(releaseAge>=releaseSound.duration)werewolf.spawn();}
 if(mistakes===5&&!released&&gate.position.y>=gateHeights[5]){released=true;releaseAge=0;silentRelease=!releaseSound.play(werewolf.spawn);}if(opened){opening=Math.min(1,opening+dt/doorCreak.duration);secretDoor.position.y=THREE.MathUtils.smoothstep(opening,0,1)*4;}}};
}
