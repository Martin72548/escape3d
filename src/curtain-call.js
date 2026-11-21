import { translate } from './language.js';
import { refineHarpyFace } from './harpy-realistic-face.js';
import * as THREE from 'three';
import { createToad } from './cat-encounter.js';
import { createNoFaceEncounter } from './no-face-encounter.js';
import { createHarpyFlight } from './harpy-flight.js';
import { createWerewolfEncounter } from './werewolf-encounter.js';
import { createTrollModel } from './troll-model.js';
import { createKomodoEncounter } from './komodo-encounter.js';
import { addSaintLucia } from './saint-lucia.js';
import { addSaintSebastian } from './saint-sebastian.js';
import { createMummyModel } from './mummy-model.js';
import { createZombie } from './zombie-encounter.js';
import { positionCurtainActors } from './curtain-layout.js';
import { refineHarpyPlumage } from './harpy-final-wings.js';

export const CURTAIN_CAST=['Sin Cara','Sapo','Mujer pajaro','Hombre lobo','Troll','Lagarto','Santa Lucia','San Sebastian','Momia','Zombie'];

// Static visual copies preserve anatomical meshes without running combat.
function bakeActor(source,movableWings=[]){
 source.updateWorldMatrix(true,true);
 const inverse=source.matrixWorld.clone().invert(),actor=new THREE.Group(),point=new THREE.Vector3(),wingMeshes=movableWings.map(()=>[]);
 source.traverse(object=>{
  if(!object.isMesh||!(object.layers.mask&1))return;
  for(let part=object;part&&part!==source;part=part.parent)if(!part.visible)return;
  const geometry=object.geometry.clone();
  if(object.isSkinnedMesh){
   object.skeleton.update();const positions=new Float32Array(geometry.attributes.position.count*3);
   for(let i=0;i<geometry.attributes.position.count;i++)object.getVertexPosition(i,point).toArray(positions,i*3);
   geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.morphAttributes={};geometry.deleteAttribute('skinIndex');geometry.deleteAttribute('skinWeight');
  }
  geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,object.matrixWorld));geometry.computeBoundingSphere();
  const mesh=new THREE.Mesh(geometry,object.material);mesh.name=object.name;mesh.castShadow=mesh.receiveShadow=true;mesh.raycast=()=>{};actor.add(mesh);
  for(let part=object;part&&part!==source;part=part.parent){const index=movableWings.indexOf(part);if(index!==-1){wingMeshes[index].push(mesh);break;}}

 });
 const bounds=new THREE.Box3().setFromObject(actor),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
 const scale=Math.min(2.65/Math.max(size.y,.01),2.05/Math.max(size.x,.01),2.8/Math.max(size.z,.01));
 for(const mesh of actor.children){mesh.geometry.translate(-center.x,-bounds.min.y,-center.z);mesh.geometry.scale(scale,scale,scale);}
 actor.userData.curtainWings=movableWings.map((wing,index)=>{
  const pivot=new THREE.Group();pivot.name='Ala articulada del saludo '+index;
  const origin=wing.getWorldPosition(new THREE.Vector3()).applyMatrix4(inverse).sub(new THREE.Vector3(center.x,bounds.min.y,center.z)).multiplyScalar(scale);
  pivot.position.copy(origin);actor.add(pivot);
  for(const mesh of wingMeshes[index]){mesh.geometry.translate(-origin.x,-origin.y,-origin.z);pivot.add(mesh);}
  return pivot;
 });
 // Preserve wrist pivots beneath their shoulder so the feather fan bends naturally.
 for(const [index,wing]of movableWings.entries())for(let part=wing.parent;part&&part!==source;part=part.parent){
  const parentIndex=movableWings.indexOf(part);
  if(parentIndex!==-1){actor.updateWorldMatrix(true,true);actor.userData.curtainWings[parentIndex].attach(actor.userData.curtainWings[index]);break;}
 }
 return actor;
}

export function createCurtainCall(parent,prisoner){
 const root=new THREE.Group();root.name='Saludo teatral de los diez personajes';root.visible=false;parent.add(root);
 const staging=new THREE.Scene(),actors=[],stones=[],arrivals=[],sparks=[];let started=false,ready=false,clock=0,bowStarted=null,bowAmount=0;
 const sources=new Map(),pending=[];
 const noFace=createNoFaceEncounter(staging,prisoner,{openWall:false});noFace.spawn(new THREE.Vector3(0,2,0));noFace.update(.5);sources.set('Sin Cara',noFace.root.children[0]);
 sources.set('Sapo',createToad(false).root);
 const harpy=createHarpyFlight(staging);harpy.update(0);harpy.update(0);
 const harpyWrists=refineHarpyPlumage(harpy);
 harpy.wings.forEach((wing,index)=>{wing.rotation.set(0,0,(index===0?-1:1)*Math.PI*.31);});
 sources.set('Mujer pajaro',harpy.bird);
 pending.push(refineHarpyFace(harpy).catch(error=>console.warn('No se pudo mejorar el rostro de la mujer pajaro:',error)));
 sources.set('Hombre lobo',createWerewolfEncounter(staging,prisoner,()=>{}).root);
 sources.set('Troll',createTrollModel().root);
 sources.set('Lagarto',createKomodoEncounter(staging,prisoner).root);
 const lucia=new THREE.Group();staging.add(lucia);
 pending.push(addSaintLucia(lucia).then(model=>sources.set('Santa Lucia',model)).catch(error=>console.warn('No se pudo preparar Santa Lucia para el saludo:',error)));
 const sebastian=new THREE.Group();staging.add(sebastian);const saint=addSaintSebastian(sebastian);sources.set('San Sebastian',sebastian);pending.push(saint.appearanceReady);
 const mummy=createMummyModel();sources.set('Momia',mummy.root);pending.push(mummy.appearanceReady);
 const zombie=createZombie();sources.set('Zombie',zombie.root);pending.push(zombie.root.userData.appearanceReady);
 const preparation=Promise.allSettled(pending).then(()=>{
  for(const [index,name] of CURTAIN_CAST.entries()){
   const source=sources.get(name);if(!source)continue;
   const pivot=new THREE.Group();pivot.name='Saludo: '+name;pivot.position.set((index-4.5)*2.35,.22,-15.2);const visual=bakeActor(source,name==='Mujer pajaro'?[...harpy.wings,...harpyWrists]:[]);if(name==='Mujer pajaro')visual.scale.setScalar(3);pivot.add(visual);pivot.visible=false;root.add(pivot);actors.push(pivot);
  }
  positionCurtainActors(actors);
  ready=true;
 });
 const stoneGeometry=new THREE.DodecahedronGeometry(.48,1);
 const sparkGeometry=new THREE.SphereGeometry(.025,6,4),sparkMaterial=new THREE.MeshBasicMaterial({color:0xffdc6c,toneMapped:false});
 const colors=[0xffbc40,0xff507d,0x72e8ff,0xb3ff66,0xc89bff];
 for(let index=0;index<CURTAIN_CAST.length;index++){
  const stone=new THREE.Mesh(stoneGeometry,new THREE.MeshStandardMaterial({color:0x8b8070,roughness:.84,emissive:0x9b7028,emissiveIntensity:.22}));
  stone.name='Piedra del saludo '+(index+1);stone.position.set((index-4.5)*2.35,.52,-12);stone.scale.set(1.2,.65,.95);stone.castShadow=stone.receiveShadow=true;stone.userData.curtainStone=index;root.add(stone);stones.push(stone);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 84px Georgia';ctx.fillStyle='#ffe9a4';ctx.fillText(String(index+1),64,68);
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
  const label=new THREE.Mesh(new THREE.PlaneGeometry(.42,.42),new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false}));label.position.set(0,.15,.42);label.raycast=()=>{};stone.add(label);
 }
 const cueCanvas=document.createElement('canvas');cueCanvas.width=1536;cueCanvas.height=160;
 const cueContext=cueCanvas.getContext('2d'),cueMap=new THREE.CanvasTexture(cueCanvas);cueMap.colorSpace=THREE.SRGBColorSpace;
 const cue=new THREE.Mesh(new THREE.PlaneGeometry(13,1.35),new THREE.MeshBasicMaterial({map:cueMap,transparent:true,depthWrite:false,side:THREE.DoubleSide}));cue.position.set(0,4.2,-15.7);cue.raycast=()=>{};root.add(cue);
 function updateCue(){
  const count=arrivals.filter(Boolean).length;
  if(count===10){
   cueCanvas.width=1120;cueCanvas.height=160;
   cue.geometry.dispose();cue.geometry=new THREE.PlaneGeometry(7,1);
   cue.name='Boton Volver al comienzo';cue.userData.returnToStart=true;
   cue.raycast=THREE.Mesh.prototype.raycast;
   cueContext.clearRect(0,0,1120,160);
   const gradient=cueContext.createLinearGradient(0,0,0,160);gradient.addColorStop(0,'#35515c');gradient.addColorStop(1,'#152d38');
   cueContext.fillStyle=gradient;cueContext.beginPath();cueContext.roundRect(5,5,1110,150,24);cueContext.fill();
   cueContext.strokeStyle='#ffe9a4';cueContext.lineWidth=5;cueContext.stroke();
   cueContext.fillStyle='#ffe9a4';cueContext.font='bold 64px Georgia';cueContext.textAlign='center';cueContext.textBaseline='middle';
   cueContext.fillText(translate('Revenir au début', 'Volver al comienzo'),560,80,1040);cueMap.needsUpdate=true;
   return;
  }
  cueContext.clearRect(0,0,1536,160);cueContext.fillStyle='rgba(12,20,30,.88)';cueContext.fillRect(0,0,1536,160);cueContext.fillStyle='#ffe9a4';cueContext.font='bold 60px Georgia';cueContext.textAlign='center';cueContext.textBaseline='middle';
  cueContext.fillText(translate(`Lance un rayon sur chaque pierre · ${count} / 10`, `Lanza un rayo a cada piedra · ${count} / 10`),768,80,1460);cueMap.needsUpdate=true;
 }
 updateCue();
 const light=new THREE.DirectionalLight(0xffe8c9,2.2);light.position.set(0,7,-7);light.target.position.set(0,1,-15);root.add(light,light.target);
 function fireworks(stone,index){
  const origin=stone.position.clone().add(new THREE.Vector3(0,.4,0));
  for(let i=0;i<75;i++){
   const mesh=new THREE.Mesh(sparkGeometry,sparkMaterial.clone());mesh.material.color.set(colors[(i+index)%colors.length]);mesh.position.copy(origin);mesh.raycast=()=>{};root.add(mesh);
   const angle=i*2.39996,speed=1.3+Math.random()*2.3;
   sparks.push({mesh,age:0,life:1.1+Math.random()*.8,velocity:new THREE.Vector3(Math.cos(angle)*speed,2+Math.random()*4,Math.sin(angle)*speed*.6)});
  }
 }
 function start(){started=true;root.visible=true;}
 function hit(hit){
  if(!started||!ready||!hit?.mesh)return false;
  let object=hit.mesh;while(object&&object.parent!==root)object=object.parent;
  const index=object?.userData.curtainStone;
  if(index==null||arrivals[index])return false;
  const actor=actors[index],stone=stones[index];
  if(!actor)return false;
  arrivals[index]={start:clock,from:stone.position.clone().setY(.22),to:actor.position.clone(),arrived:false};
  actor.position.copy(arrivals[index].from);actor.scale.setScalar(.001);actor.visible=true;
  updateCue();stone.material.emissiveIntensity=0;stone.material.color.set(0x514c45);fireworks(stone,index);
  return true;
 }
 function update(age){
  const dt=Math.max(0,Math.min(.1,age-clock));clock=age;
  if(!started)return;
  for(let i=sparks.length-1;i>=0;i--){
   const p=sparks[i];p.age+=dt;p.velocity.y-=3*dt;p.mesh.position.addScaledVector(p.velocity,dt);p.mesh.scale.setScalar(Math.max(0,1-p.age/p.life));
   if(p.age>=p.life){p.mesh.removeFromParent();p.mesh.material.dispose();sparks.splice(i,1);}
  }
  if(!ready)return;
  for(const [index,actor] of actors.entries()){
   const arrival=arrivals[index];if(!arrival)continue;
   const t=THREE.MathUtils.clamp((age-arrival.start)/1.8,0,1),travel=THREE.MathUtils.smoothstep(t,.2,1);
   actor.scale.setScalar(Math.max(.001,THREE.MathUtils.smoothstep(t,0,.3)));
   actor.position.lerpVectors(arrival.from,arrival.to,travel);
   actor.position.y+=Math.sin(t*Math.PI)*.22;
   actor.rotation.y=t<1?Math.sin(t*Math.PI*6)*.035:0;
   arrival.arrived=t===1;
   const wings=actor.children[0].userData.curtainWings||[];
   const flap=(age-arrival.start)*2.6;
   wings.slice(0,2).forEach((wing,i)=>{wing.rotation.z=(i===0?-1:1)*Math.sin(flap)*.16;});
   wings.slice(2).forEach((wrist,i)=>{wrist.rotation.z=(i===0?-1:1)*Math.sin(flap-.55)*.1;wrist.rotation.y=Math.sin(flap-.8)*.06;});
  }
  if(bowStarted===null&&arrivals.filter(a=>a?.arrived).length===CURTAIN_CAST.length)bowStarted=age+.35;
  if(bowStarted!==null){
   const t=age-bowStarted,bow=cycle=>THREE.MathUtils.smoothstep(cycle,0,.85)*(1-THREE.MathUtils.smoothstep(cycle,1.55,2.55));
   bowAmount=t<3.2?bow(t):bow(t-3.2);
   actors.forEach(actor=>actor.rotation.x=.48*bowAmount);
  }
 }
 return {root,actors,stones,sparks,preparation,start,hit,update,get ready(){return ready;},get revealed(){return arrivals.filter(Boolean).length;},get bowing(){return bowStarted!==null;},get bowAmount(){return bowAmount;}};
}
