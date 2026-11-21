import { translate } from './language.js';
import { addMuseumBackWall } from './museum-back-wall.js';
import { addMedievalVault } from './medieval-vault.js';
import { createMuseumBatSwarm } from './museum-bat-swarm.js';
import { createGoldenSerpent } from './golden-serpent.js';
import { createGregorianAmbience } from './gregorian-ambience.js';
import { createMuseumSpellRays } from './museum-spell-rays.js';
import { showFireMessage } from './fire-message.js';
import { addMuseumFloorMessage } from './museum-floor-message.js';
import { addMuseumWallPhrases } from './museum-wall-phrases.js';
import { createCeramicBreakSound } from './ceramic-break-sound.js';
import { buildChasmScene } from './chasm-scene.js';
import { statueExplosionSound } from './statue-explosion-sound.js';
import { createRealisticTorch } from './realistic-torch.js';
import { createTombPassage, buildLowerChamber } from './tomb-passage.js';
import { createStoneSarcophagus } from './stone-sarcophagus.js';
import { createEffigyEncounter } from './effigy-encounter.js';
import { addSaintDenis } from './saint-denis.js';
import { createDenisAttack } from './saint-denis-attack.js';
import { addSaintSebastian } from './saint-sebastian.js';
import { createSebastianAttack } from './saint-sebastian-attack.js';
import { addTripalium } from './tripalium.js';
import { addFallbackLuciaHair, addSaintLucia, preloadSaintLucia } from './saint-lucia.js';
import { createLuciaHaloAttack } from './lucia-halo-attack.js';
import { addSaintGeorge } from './saint-george.js';
import { createGeorgeEncounter } from './saint-george-encounter.js';
import * as THREE from 'three';
import { createStoneMaterial, addStoneCourses } from './stone-masonry.js';

export function createMedievalMuseum(scene, prisoner, onPointEarned=()=>{}) {
 preloadSaintLucia().catch(error=>console.warn('Prechargement de sainte Lucie :',error));
 let active=false,age=0,nextStatue=0;
 const root=new THREE.Group();root.name='Museo medieval de piedra';
 const torches=[];
 const shots=[];
 const spellRays=createMuseumSpellRays(scene,prisoner);
 const statueImpact=createCeramicBreakSound();
 const chant=createGregorianAmbience();
 let pending=null,sebastianAttack=null,denisAttack=null,luciaAttack=null,georgeEncounter=null,tombPassage=null,lowerChamber=null,chasm=null;
 const scoredStatues=new Set();
 let wallPhrases;
 let effigyEncounter=null,goldenSerpent=null;
 const batSwarm=createMuseumBatSwarm(root,prisoner,scene);
 function awardDestroyedStatues(){
  for(const [name,destroyed]of [['sebastian',sebastianAttack?.exploded],['denis',denisAttack?.state==='exploded'],['lucia',luciaAttack?.exploded],['george',georgeEncounter?.state==='melted']]){
   if(destroyed&&!scoredStatues.has(name)){scoredStatues.add(name);onPointEarned(name);}
  }
  if(!wallPhrases&&scoredStatues.size===4&&effigyEncounter?.defeated){
   wallPhrases=addMuseumWallPhrases(root);
   addMuseumFloorMessage(root);
  }
 }

 function cast(hit){
  if(chasm?.rescue.active){
   chasm.takeRescueWord(hit?.mesh);
   return;
  }
  if(active&&hit?.point&&!hit.mesh&&!prisoner.userData.dead&&!prisoner.userData.gameOver&&!prisoner.userData.haloTrapped&&!tombPassage?.active){spellRays.emit(hit.point);return;}
  if(active&&!tombPassage&&!lowerChamber&&!chasm&&!prisoner.userData.dead&&!prisoner.userData.gameOver&&!chant.playing)chant.start();
  if(chasm){
   if(chasm.victory.active){
    if(hit?.mesh&&!prisoner.userData.dead){emitShot({point:hit.point.clone(),curtainHit:hit});}
    return;
   }
   if(!hit?.mesh||prisoner.userData.dead||prisoner.userData.gameOver)return;
   for(let word=hit.mesh;word;word=word.parent)if(word.userData.spellTarget==='trunk-word'){chasm.takeWord(word);return;}
   chasm.birds.unlockAudio();const flight=chasm.birds.flightFor(hit.mesh),bird=flight?.target(hit.mesh);
   shots.push({point:hit.point.clone(),chasmTarget:bird,chasmFlight:flight,harpyPass:flight?.pass});return;
  }
  if(lowerChamber){if(lowerChamber.tryExit(hit))return;lowerChamber.unlockAudio();if(hit?.mesh&&!prisoner.userData.dead&&!prisoner.userData.gameOver)shots.push({point:hit.point.clone(),lowerHit:hit});return;}if(tombPassage?.active)return;
  if(!active || !hit?.mesh || prisoner.userData.dead || prisoner.userData.gameOver || prisoner.userData.haloTrapped)return;
  let object=hit.mesh;
  let isDenisHead=false;
  for(let ancestor=hit.mesh;ancestor;ancestor=ancestor.parent)if(ancestor===denisAttack?.head&&denisAttack.active)isDenisHead=true;
  while(object && object!==root)object=object.parent;
  const detachedGeorge=!!georgeEncounter&&(()=>{for(let ancestor=hit.mesh;ancestor;ancestor=ancestor.parent)if(ancestor===georgeEncounter.rider)return true;return false;})();
  const isWhiteBat=batSwarm.isWhiteTarget(hit.mesh);
  if(object!==root&&!isDenisHead&&!detachedGeorge&&!isWhiteBat)return;
  if(isDenisHead&&denisAttack.state==='exploded')return;
  let target=hit.mesh,isSebastian=false,isDenis=false,isLucia=false,isGeorge=false,isTomb=false,isExitPhrase=false,isHorsePhrase=false,isSerpent=false,isBatPhrase=false;
  for(let ancestor=hit.mesh;ancestor;ancestor=ancestor.parent){if(ancestor.userData.museumBatPhrase)isBatPhrase=true;if(ancestor.userData.museumHorsePhrase)isHorsePhrase=true;if(ancestor.userData.goldenSerpent)isSerpent=true;}
  for(let ancestor=hit.mesh;ancestor;ancestor=ancestor.parent)if(ancestor.userData.museumExitPhrase)isExitPhrase=true;
  for(let ancestor=hit.mesh;ancestor;ancestor=ancestor.parent)if(ancestor.userData.museumTomb)isTomb=true;
  for(let ancestor=hit.mesh;ancestor;ancestor=ancestor.parent)if(ancestor.userData.museumGeorge)isGeorge=true;
  for(let ancestor=hit.mesh;ancestor;ancestor=ancestor.parent)if(ancestor.userData.museumLucia)isLucia=true;
  statueExplosionSound.unlock();
  statueImpact.unlock();
  if(isLucia)luciaAttack.unlockAudio();
  for(let ancestor=hit.mesh;ancestor;ancestor=ancestor.parent)if(ancestor.userData.museumDenis)isDenis=true;
  while(target&&target!==root){if(target.userData.museumSebastian){isSebastian=true;break;}target=target.parent;}
  if(isSebastian)sebastianAttack.unlockAudio();
  if(isTomb)effigyEncounter?.unlockAudio();
  if(isBatPhrase)batSwarm.unlockAudio();
  const shot={point:hit.point.clone(),isSebastian,isDenis,isDenisHead,isLucia,isGeorge,isTomb,isExitPhrase,isHorsePhrase,isSerpent,isBatPhrase,isWhiteBat,isStatue:isSebastian||isDenis||isDenisHead||isLucia||isGeorge||detachedGeorge};
  if(prisoner.userData.georgeCaptured){if(isGeorge)emitShot(shot);return;}
  shots.push(shot);
 }
 function emitShot(shot){
   spellRays.emit(shot.point);
   if(shot.isWhiteBat){batSwarm.hitWhite();return;}
   if(shot.isBatPhrase){
    if(batSwarm.trigger()){
     showFireMessage(translate('Tue la chauve-souris blanche !', '¡Mata al murciélago blanco!'), {
      duration: 4, verticalPosition: .24, centered: true, multiline: true,
     });
    }
    return;
   }
   if(shot.isHorsePhrase){goldenSerpent.trigger();return;}
   if(shot.isSerpent){goldenSerpent.hit();return;}
   if(shot.isExitPhrase){shots.length=0;tombPassage.trigger();return;}
   if(shot.curtainHit)chasm.victory.curtain.hit(shot.curtainHit);
   if(shot.isStatue)statueImpact.play();
   if(shot.chasmTarget&&shot.chasmFlight&&shot.harpyPass===shot.chasmFlight.pass)chasm.birds.hit(shot.chasmTarget);if(shot.lowerHit)lowerChamber.cast(shot.lowerHit);if(shot.isSebastian)sebastianAttack.hit(false);if(shot.isDenisHead)denisAttack.hit();if(shot.isLucia)luciaAttack.hit(false);if(shot.isGeorge)georgeEncounter.trigger({activate:false});if(shot.isTomb)effigyEncounter?.hit();awardDestroyedStatues();
 }
 function updateSpell(dt){
  spellRays.update(dt);
  if(prisoner.userData.dead||prisoner.userData.haloTrapped||prisoner.userData.georgeCaptured){shots.length=0;pending=null;}
  // Consume each click once without waiting for the previous arm animation.
  while(shots.length){
   const shot=shots.shift();
   emitShot(shot);
  }
 }
 const stone=new THREE.MeshStandardMaterial({color:0x8e8476,roughness:1});
 const darkStone=new THREE.MeshStandardMaterial({color:0x5c554c,roughness:.95});
 const iron=new THREE.MeshStandardMaterial({color:0x292725,metalness:.7,roughness:.5});
 const wood=new THREE.MeshStandardMaterial({color:0x4b2a17,roughness:.9});
 function mesh(parent,geometry,material,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
 function box(parent,w,h,d,material,x,y,z){return mesh(parent,new THREE.BoxGeometry(w,h,d),material,x,y,z);}
 function oval(parent,material,x,y,z,sx,sy,sz){const m=mesh(parent,new THREE.SphereGeometry(1,24,16),material,x,y,z);m.scale.set(sx,sy,sz);return m;}
 function limb(parent,material,a,b,r=.08){const delta=b.clone().sub(a);const m=mesh(parent,new THREE.CylinderGeometry(r*.8,r,delta.length(),12),material);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;}
 function robe(parent,material){
  const profile=[[.52,0],[.48,.15],[.34,.8],[.27,1.3],[.35,1.65],[.19,1.8]].map(([r,y])=>new THREE.Vector2(r,y));
  mesh(parent,new THREE.LatheGeometry(profile,32),material);
  for(let i=0;i<12;i++){const a=i*Math.PI/6;const fold=mesh(parent,new THREE.ConeGeometry(.055,1.3,7),material,Math.sin(a)*.36,.65,Math.cos(a)*.36);fold.rotation.z=Math.cos(a)*.1;fold.rotation.x=Math.sin(a)*.1;}
 }
 function face(parent,material,y=2){
  oval(parent,material,0,y,0,.19,.25,.18);
  oval(parent,material,0,y-.02,.18,.045,.075,.06);
  const shadow=material.clone();shadow.color.multiplyScalar(.5);
  for(const side of [-1,1])oval(parent,shadow,side*.075,y+.04,.164,.032,.018,.016);
 }
 function pedestal(x,z,name,color){
  const group=new THREE.Group();group.name=name;group.position.set(x,0,z);root.add(group);
  box(group,1.8,.22,1.8,darkStone,0,.11,0);box(group,1.42,.85,1.42,stone,0,.64,0);box(group,1.7,.16,1.7,darkStone,0,1.145,0);
  const figure=new THREE.Group();figure.position.y=1.23;figure.name=name+' sobre pedestal';group.add(figure);
  const material=new THREE.MeshStandardMaterial({color,roughness:.68,metalness:.12});
  return {figure,material};
 }
 function build(){
  const tombX=-5;
  const wallStone=createStoneMaterial();
  const mortar=new THREE.MeshStandardMaterial({color:0x34312b,roughness:1});
  // The open stairwell leaves room for the full-height prisoner through the final tread.
  // Align the stairwell opening with the tomb on the left, keeping the centre solid.
  for(const [w,d,x,z]of [[10+tombX-1.4,20,(-10+tombX-1.4)/2,0],[10-tombX-1.4,20,(10+tombX+1.4)/2,0],[2.8,1.4,tombX,-9.3],[2.8,8.4,tombX,5.8]]){
   box(root,w,.15,d,stone,x,-.08,z);addStoneCourses(root,stone,w,d,x,0,z,-Math.PI/2,0,801+Math.round(x*10+z*10),true);
  }
  for(const [x,z,rotation] of [[0,-10,0],[-10,0,Math.PI/2],[10,0,-Math.PI/2],[0,10,Math.PI]]){
   if(z===-10){
    addMuseumBackWall(root,wallStone);
    continue;
   }
   box(root,x===0?20:.3,6,x===0?.3:20,mortar,x,3,z);
   // Keep the relief in front of the backing wall so the individual blocks are visible.
   const courses=addStoneCourses(root,wallStone,20,6,x-Math.sign(x)*.17,3,z-Math.sign(z)*.17,0,rotation,802+Math.round(rotation*10),false);
   courses.name='Bloques de piedra de la pared del museo';
  }
  addMedievalVault(root,wallStone);
  for(const x of [-8.8,8.8])for(const z of [-8,-2,4]){
   mesh(root,new THREE.CylinderGeometry(.28,.34,5.7,12),stone,x,2.85,z);
   box(root,.85,.22,.85,darkStone,x,.11,z);box(root,.85,.25,.85,darkStone,x,5.65,z);
  }
  for(const x of [-9.49,9.49])for(const z of [-6,1,7])torches.push(createRealisticTorch(root,{position:[x,3.25,z],rotationY:x<0?Math.PI/2:-Math.PI/2,intensity:65,seed:torches.length+11}));
  root.add(new THREE.HemisphereLight(0xc6aa83,0x30261e,.85));
  const tomb=createStoneSarcophagus(root);
  tomb.position.x=tombX;
  effigyEncounter=createEffigyEncounter(scene,tomb,prisoner);
  const floorCover=new THREE.Group();floorCover.name='Suelo que se rompe sobre la escalera de la cripta';root.add(floorCover);
  floorCover.position.x=tombX;
  box(floorCover,2.8,.15,7,stone,0,-.08,-5.1);addStoneCourses(floorCover,stone,2.8,7,0,0,-5.1,-Math.PI/2,0,819,true);
  // Keep the floor beneath both long sides of the tomb intact during the descent.
  const tombSideFloor=new THREE.Group();tombSideFloor.name='Suelo permanente bajo los costados de la tumba';root.add(tombSideFloor);
  tombSideFloor.position.x=tombX;
  for(const x of [-1.09,1.09]){box(tombSideFloor,.62,.15,3.2,stone,x,-.08,0);addStoneCourses(tombSideFloor,stone,.62,3.2,x,0,0,-Math.PI/2,0,820+Math.round(x*10),true);}
  tomb.userData.floorCover=floorCover;
  tombPassage=createTombPassage(scene,tomb,prisoner,()=>{
   chant.stop();
   for(const object of scene.children){if(object===prisoner||object.isCamera||object.name.startsWith('XR')||object.name.includes('controller'))continue;object.visible=false;}
   shots.length=0;pending=null;prisoner.userData.currentLevel=3;
   lowerChamber=buildLowerChamber(scene,prisoner,enterChasm,()=>onPointEarned());
   showFireMessage(translate(
    "Cage de la louve.\nN'ouvre pas la cage si tu ne veux pas être mangé.",
    'Jaula de la loba.\nNo abras la jaula si no quieres que te devore.',
   ), { duration: 6, verticalPosition: .18, multiline: true, centered: true });
  });
  const lucia=pedestal(6,-4,'Santa Lucia azul con halo',0x648dcc);robe(lucia.figure,lucia.material);face(lucia.figure,lucia.material);
  addFallbackLuciaHair(lucia.figure);
  lucia.figure.userData.appearanceReady=addSaintLucia(lucia.figure).catch(error=>console.warn('No se pudo cargar Santa Lucia:',error));
  lucia.figure.userData.museumLucia=true;luciaAttack=createLuciaHaloAttack(scene,lucia.figure,prisoner);
  const george=pedestal(0,-7.5,'San Jorge sobre caballo encabritado',0x4f6257);addSaintGeorge(george.figure);
  george.figure.userData.museumGeorge=true;georgeEncounter=createGeorgeEncounter(scene,george.figure,prisoner,root);
  for(const base of george.figure.parent.children)if(base.isMesh){base.scale.x=1.25;base.scale.z=1.25;}
  const denis=pedestal(0,0,'San Denis con la cabeza en las manos',0xc7bba5);
  goldenSerpent=createGoldenSerpent(root,george.figure,prisoner,denis.figure.parent.position);
  const denisStatue=addSaintDenis(denis.figure);denis.figure.userData.museumDenis=true;denisAttack=createDenisAttack(scene,denisStatue,prisoner);
  const saint=pedestal(5,3,'San Sebastian con flechas',0xc9baa0);const sebastian=addSaintSebastian(saint.figure);
  saint.figure.userData.museumSebastian=true;sebastianAttack=createSebastianAttack(scene,saint.figure,prisoner,sebastian);
  const tripalium=addTripalium(root);
  // Foreground left, beside the left-wall torch at (-9.49, 3.25, 7).
  tripalium.position.set(-7.7,0,6.8);
  const accent=new THREE.PointLight(0xffcc87,25,9,2);accent.position.set(0,3.8,-6.8);root.add(accent);
 }
 function enterChasm(){
  if(chasm)return;
  if(lowerChamber)lowerChamber.root.visible=false;
  else{
   for(const object of scene.children){if(object===prisoner||object.isCamera||object.name.startsWith('XR')||object.name.includes('controller'))continue;object.visible=false;}
   prisoner.userData.sleeping=false;
  }
  active=true;
  shots.length=0;pending=null;
  chasm=buildChasmScene(scene,prisoner,()=>onPointEarned());
  showFireMessage(translate(
   'Gare aux harpies qui veillent sur le chemin vers la victoire.',
   'Cuidado con las arpías que vigilan el camino hacia la victoria.',
  ), {
   title: translate('Le gouffre des harpies', 'El abismo de las arpías'),
   duration: 5,
   verticalPosition: .22,
   multiline: true,
   centered: true,
  });
 }
 function enter(){
  if(active)return;active=true;
  age=0;nextStatue=0;
  chant.start();
  for(const object of scene.children){if(object===prisoner||object.isCamera||object.name.startsWith('XR')||object.name.includes('controller'))continue;object.visible=false;}
  prisoner.userData.waistGrabOwner=null;prisoner.userData.dead=false;prisoner.userData.gameOver=false;prisoner.userData.fallen=false;prisoner.userData.trollStunned=false;
  prisoner.position.set(0,.02,6);prisoner.rotation.set(0,Math.PI,0);
  scene.background=new THREE.Color(0x211c17);scene.fog=new THREE.Fog(0x211c17,20,45);
  build();scene.add(root);
  showFireMessage(translate('Chapelle du saut périlleux\nGare aux statues !', 'Capilla del salto peligroso\n¡Cuidado con las estatuas!'), { duration: 4, verticalPosition: .18, multiline: true, centered: true });
 }
 function updateStatueSequence(dt){
  if(prisoner.userData.dead||prisoner.userData.gameOver)return;
  age+=dt;
  const sequence=[luciaAttack,denisAttack,sebastianAttack,georgeEncounter,effigyEncounter];
  while(nextStatue<sequence.length&&age>=(nextStatue+1)*10){
   const index=nextStatue++,statue=sequence[index];
   if(index===3)statue?.trigger({damageOnTrigger:false});
   else statue?.trigger();
  }
 }
 function update(dt,inXR=false){if(!active)return;batSwarm.update(dt);if(prisoner.userData.dead||prisoner.userData.gameOver)chant.stop();if(chasm){updateSpell(dt);chasm.update(dt,inXR);return;}if(lowerChamber){updateSpell(dt);lowerChamber.update(dt);return;}effigyEncounter?.update(dt);torches.forEach(torch=>torch.update(dt));if(tombPassage?.active){updateSpell(dt);tombPassage.update(dt);return;}updateSpell(dt);updateStatueSequence(dt);sebastianAttack?.update(dt);denisAttack?.update(dt);luciaAttack?.update(dt);if(!goldenSerpent?.active)georgeEncounter?.update(dt);goldenSerpent?.update(dt);awardDestroyedStatues();}
 return {enter,enterChasm,update,cast,root,get statuePoints(){return scoredStatues.size;},get level(){return chasm?4:lowerChamber?3:2;},get passageState(){return tombPassage?.state;},get isCasting(){return false;},get active(){return active;}};
}
