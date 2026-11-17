import * as THREE from 'three';
import { createRecordedMaleScream } from './recorded-male-scream.js';

export function createBowlPlant(scene, prisoner) {
 const scream=createRecordedMaleScream();
 const mouth=prisoner.getObjectByName('screaming-mouth');
 let painTime=0,screamCooldown=0;
 const bloodGeometry=new THREE.SphereGeometry(.025,7,5);
 const bloodMaterial=new THREE.MeshStandardMaterial({color:0xa30818,roughness:.55});
 const droplets=Array.from({length:24},()=>{
  const mesh=new THREE.Mesh(bloodGeometry,bloodMaterial);mesh.visible=false;scene.add(mesh);
  return {mesh,velocity:new THREE.Vector3(),life:0};
 });
 let nextDrop=0;
 function bite(position){
  if(screamCooldown<=0){scream.play();screamCooldown=2;painTime=1.65;if(mouth)mouth.visible=true;}
  for(let i=0;i<7;i++){
   const drop=droplets[nextDrop++%droplets.length];drop.mesh.position.copy(position);drop.mesh.visible=true;
   drop.mesh.scale.set(.7,1.3,.7);drop.life=.65+Math.random()*.3;
   drop.velocity.set((Math.random()-.5)*1.1,.5+Math.random()*.65,(Math.random()-.5)*1.1);
  }
 }
 // Corner placement leaves room along the wall for the toads to drink.
 const origin = new THREE.Vector3(8.4, .035, -8.4);
 const bowl = new THREE.Group();
 bowl.name = 'Cuenco grande con agua';
 bowl.userData.spellTarget = 'water-bowl';
 bowl.userData.drinkingAxis = 'z';
 bowl.position.copy(origin);
 bowl.scale.setScalar(.5);
 scene.add(bowl);
 const clay = new THREE.MeshStandardMaterial({color:0x986141, roughness:.86, side:THREE.DoubleSide});
 const profile = [[0,.09],[.35,.07],[.62,.15],[.87,.39],[1,.68],[1.04,.73],[1.1,.72],[1.08,.63],[.94,.34],[.69,.08],[.4,.015],[0,.015]].map(([x,y])=>new THREE.Vector2(x,y));
 const shards = [];
 for(let i=0;i<12;i++) {
  const mesh = new THREE.Mesh(new THREE.LatheGeometry(profile,8,i*Math.PI/6,Math.PI/6),clay);
  mesh.castShadow=mesh.receiveShadow=true;
  bowl.add(mesh);
  const angle=(i+.5)*Math.PI/6;
  shards.push({mesh,velocity:new THREE.Vector3(Math.sin(angle)*1.7,1.5+(i%3)*.3,Math.cos(angle)*1.7),spin:(i%2?1:-1)*1.5});
 }
 const waterMaterial = new THREE.MeshPhysicalMaterial({color:0x429ba9,metalness:.25,roughness:.13,transparent:true,opacity:.78,clearcoat:1,side:THREE.DoubleSide});
 const water = new THREE.Mesh(new THREE.CircleGeometry(.96,64),waterMaterial);
 water.rotation.x=-Math.PI/2;water.position.y=.59;bowl.add(water);
 const pool = new THREE.Mesh(new THREE.CircleGeometry(1,64),waterMaterial.clone());
 pool.rotation.x=-Math.PI/2;pool.position.copy(origin);pool.position.y=.018;pool.visible=false;scene.add(pool);
 // A broken stone rim surrounds a dark opening beneath the shattered bowl.
 const hole=new THREE.Group();hole.name='Agujero de las tres plantas carnivoras';hole.position.set(origin.x,.065,origin.z);hole.visible=false;scene.add(hole);
 const outline=new THREE.Shape(),rimPositions=[],rimIndices=[],edgeCount=48;
 for(let i=0;i<=edgeCount;i++){const angle=i/edgeCount*Math.PI*2,r=.79+.055*Math.sin(i*2.4)+.025*Math.cos(i*5.1),x=Math.cos(angle),z=Math.sin(angle);if(i===0)outline.moveTo(x*r,z*r);else outline.lineTo(x*r,z*r);rimPositions.push(x*r,.002,z*r,x*(r+.16),.055+(i%3)*.008,z*(r+.16));if(i<edgeCount){const k=i*2;rimIndices.push(k,k+2,k+1,k+1,k+2,k+3);}}
 const darkness=new THREE.Mesh(new THREE.ShapeGeometry(outline),new THREE.MeshBasicMaterial({color:0x080604,side:THREE.DoubleSide,fog:false}));darkness.rotation.x=Math.PI/2;darkness.raycast=()=>{};hole.add(darkness);
 const rimGeometry=new THREE.BufferGeometry();rimGeometry.setAttribute('position',new THREE.Float32BufferAttribute(rimPositions,3));rimGeometry.setIndex(rimIndices);rimGeometry.computeVertexNormals();const rockMaterial=new THREE.MeshStandardMaterial({color:0x615543,roughness:1,side:THREE.DoubleSide});const rim=new THREE.Mesh(rimGeometry,rockMaterial);rim.receiveShadow=true;hole.add(rim);
 const stoneChips=[];
 for(let i=0;i<16;i++){const angle=i*2.4,chip=new THREE.Mesh(new THREE.DodecahedronGeometry(.06+(i%4)*.018,0),rockMaterial);chip.position.set(origin.x+Math.cos(angle)*.65,.08,origin.z+Math.sin(angle)*.65);chip.scale.set(1.4,.65,1);chip.visible=false;chip.castShadow=true;scene.add(chip);stoneChips.push({mesh:chip,velocity:new THREE.Vector3(Math.cos(angle)*.7,1+(i%4)*.2,Math.sin(angle)*.7)});}
 const plant=new THREE.Group();plant.name='Planta de hojas y tentaculos';plant.position.copy(origin);plant.visible=false;scene.add(plant);
 const green=new THREE.MeshStandardMaterial({color:0x386c29,roughness:.75});
 const vineMaterial=new THREE.MeshStandardMaterial({color:0x536d32,roughness:.8});
 const leafShape=new THREE.Shape();leafShape.moveTo(0,0);leafShape.bezierCurveTo(-.45,.25,-.3,.65,0,1);leafShape.bezierCurveTo(.3,.65,.45,.25,0,0);
 const leafGeometry=new THREE.ShapeGeometry(leafShape,12);
 const leafMaterial=green.clone();leafMaterial.side=THREE.DoubleSide;
 const segmentGeometry=new THREE.CylinderGeometry(1,1,1,8);
 const mouthMaterial=new THREE.MeshStandardMaterial({color:0x8b243b,roughness:.5,side:THREE.DoubleSide});
 const toothMaterial=new THREE.MeshStandardMaterial({color:0xffebbd,roughness:.25,metalness:.25});
 const vines=[],flowers=[],branchLeaves=[];
 for(let v=0;v<3;v++){
  const segments=[];
  for(let i=0;i<48;i++){const part=new THREE.Mesh(segmentGeometry,vineMaterial);part.castShadow=true;plant.add(part);segments.push(part);}
  vines.push(segments);
  const leaves=[];
  for(let i=0;i<10;i++){
   const leaf=new THREE.Mesh(leafGeometry,leafMaterial);leaf.rotation.set(.85,v*2+i*2.4,0);plant.add(leaf);leaves.push(leaf);
  }
  branchLeaves.push(leaves);
  const flower=new THREE.Group();flower.name='Flor carnivora '+(v+1);flower.userData.spellTarget='plant-flower';plant.add(flower);
  for(let i=0;i<6;i++){
   const petal=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),green);const angle=i*Math.PI/3;
   petal.position.set(Math.cos(angle)*.32,Math.sin(angle)*.32,-.1);petal.scale.set(.2,.3,.09);petal.rotation.z=angle-Math.PI/2;flower.add(petal);
  }
  const jaws=[];
  for(const side of [1,-1]){
   const jaw=new THREE.Group();jaw.position.z=-.18;flower.add(jaw);
   const shell=new THREE.Mesh(new THREE.SphereGeometry(.37,24,12,0,Math.PI*2,side===1?0:Math.PI/2,Math.PI/2),mouthMaterial);
   shell.scale.z=1.25;shell.position.z=.18;jaw.add(shell);
   const lining=new THREE.Mesh(new THREE.CircleGeometry(.35,24),mouthMaterial);lining.rotation.x=-Math.PI/2;lining.position.z=.18;jaw.add(lining);
   for(let i=0;i<12;i++){
    const angle=(i+(side===1?0:.5))*Math.PI/6;
    const tooth=new THREE.Mesh(new THREE.ConeGeometry(.038,.18,7),toothMaterial);
    tooth.position.set(Math.cos(angle)*.32,-side*.075,.18+Math.sin(angle)*.4);
    if(side===1)tooth.rotation.z=Math.PI;
    jaw.add(tooth);
   }
   jaws.push(jaw);
  }
  flowers.push({root:flower,jaws,defeated:false,wasOpen:true});
 }
 let broken=false,age=0;
 const up=new THREE.Vector3(0,1,0),a=new THREE.Vector3(),b=new THREE.Vector3(),delta=new THREE.Vector3();
 function breakBowl(){
  if(broken)return false;
  broken=true;water.visible=false;pool.visible=true;hole.visible=true;hole.scale.setScalar(.01);stoneChips.forEach(chip=>chip.mesh.visible=true);
  delete bowl.userData.spellTarget;
  return true;
 }
 function update(dt){
  screamCooldown=Math.max(0,screamCooldown-dt);
  if(painTime>0){painTime=Math.max(0,painTime-dt);if(mouth&&painTime===0)mouth.visible=false;}
  for(const drop of droplets){
   if(drop.life<=0)continue;
   drop.life-=dt;drop.velocity.y-=3.8*dt;drop.mesh.position.addScaledVector(drop.velocity,dt);
   if(drop.life<=0||drop.mesh.position.y<.025){drop.life=0;drop.mesh.visible=false;}
  }
  if(!broken)return;
  age+=dt;
  hole.scale.setScalar(THREE.MathUtils.smoothstep(age,0,.65));
  for(const chip of stoneChips){if(chip.mesh.position.y<=.065&&chip.velocity.y<=0)continue;chip.velocity.y-=5*dt;chip.mesh.position.addScaledVector(chip.velocity,dt);chip.mesh.rotation.x+=dt*2;chip.mesh.rotation.z+=dt*3;if(chip.mesh.position.y<.065){chip.mesh.position.y=.065;chip.velocity.set(0,0,0);}}
  for(const shard of shards){
   if(shard.mesh.position.y<=-.015 && shard.velocity.y<=0)continue;
   shard.velocity.y-=5*dt;shard.mesh.position.addScaledVector(shard.velocity,dt);
   shard.mesh.rotation.x+=shard.spin*dt;shard.mesh.rotation.z+=shard.spin*.5*dt;
   if(shard.mesh.position.y<-.015){shard.mesh.position.y=-.015;shard.velocity.set(0,0,0);}
  }
  const absorption=THREE.MathUtils.clamp(age/3,0,1);
  pool.scale.setScalar((.65+Math.min(age,1)*.3)*(1-absorption));
  pool.material.opacity=.75*(1-absorption);pool.visible=absorption<1;
  if(age<.65)return;
  plant.visible=true;
  const growth=THREE.MathUtils.clamp((age-.65)/6,0,1);
  const legTargets=flowers.map((_,v)=>{
   const leg=prisoner.getObjectByName(v===1?'left-leg':'right-leg');
   const world=leg?leg.localToWorld(new THREE.Vector3(0,-.38,v===2?-.045:.045)):prisoner.localToWorld(new THREE.Vector3(.115,.4,0));
   return plant.worldToLocal(world);
  });
  function point(t,v,out){
   const target=legTargets[v],distance=Math.hypot(target.x,target.z);
   const envelope=Math.sin(t*Math.PI);
   const zigzag=Math.sin(t*Math.PI*8+v*1.7)-Math.sin(v*1.7);
   const spread=envelope*((v-1)*2.7+zigzag*.6);
   const dx=distance ? -target.z/distance : 1,dz=distance ? target.x/distance : 0;
   out.set(target.x*t+dx*spread,-.08*(1-t)+envelope*(.2+v*.12)+t*target.y,target.z*t+dz*spread);
  }
  for(let v=0;v<vines.length;v++)for(let i=0;i<48;i++){
   if(flowers[v].defeated)continue;
   const part=vines[v][i],t0=i/48,t1=Math.min((i+1)/48,growth);
   part.visible=t0<growth;
   if(!part.visible)continue;
   point(t0,v,a);point(t1,v,b);delta.subVectors(b,a);
   part.position.copy(a).add(b).multiplyScalar(.5);part.quaternion.setFromUnitVectors(up,delta.clone().normalize());
   const radius=.07*(1-t0*.7);part.scale.set(radius,delta.length(),radius);
  }
  for(let v=0;v<3;v++){
   const flower=flowers[v];if(flower.defeated)continue;point(growth,v,flower.root.position);
   flower.root.scale.setScalar(Math.min(1,growth*5));
   const facing=prisoner.getWorldPosition(new THREE.Vector3()).sub(plant.getWorldPosition(new THREE.Vector3()));
   flower.root.rotation.y=Math.atan2(facing.x,facing.z);
   const cycle=(age-.65)*1.1+v*.33;
   const phase=cycle%1;
   const opening=phase<.65?Math.sin(phase/.65*Math.PI)*.85:0;
   flower.jaws[0].rotation.x=-opening;flower.jaws[1].rotation.x=opening;
   const isOpen=phase<.65;
   if(growth===1&&flower.wasOpen&&!isOpen){
    bite(flower.root.getWorldPosition(new THREE.Vector3()));
   }
   flower.wasOpen=isOpen;
   for(let i=0;i<10;i++){
    const leaf=branchLeaves[v][i],t=(i+1)/12;
    leaf.visible=t<growth;
    if(leaf.visible){point(t,v,leaf.position);leaf.scale.setScalar(Math.min(1,(growth-t)*8)*.65);leaf.rotation.z=Math.sin(age*1.7+i)*.1;}
   }
  }
 }
 function defeatFlower(root){
  const index=flowers.findIndex(flower=>flower.root===root);
  if(index<0 || flowers[index].defeated)return false;
  flowers[index].defeated=true;root.visible=false;
  for(const segment of vines[index])segment.visible=false;
  for(const leaf of branchLeaves[index])leaf.visible=false;
  return true;
 }
 return {bowl,plant,pool,hole,breakBowl,defeatFlower,update,unlockAudio:scream.unlock,get broken(){return broken;}};
}
