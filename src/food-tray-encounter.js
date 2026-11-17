import { publicAssetBase } from './public-asset-base.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export function createFoodTrayEncounter(scene) {
 const tray=new THREE.Group();tray.name='Bandeja de madera con pan y sopa oscura';tray.userData.spellTarget='food-tray';tray.position.set(5,.08,-4);scene.add(tray);
 const wood=new THREE.MeshStandardMaterial({color:0x76502d,roughness:.85});
 const breadMaterial=new THREE.MeshStandardMaterial({color:0xc89448,roughness:.95});
 const meatMaterial=new THREE.MeshStandardMaterial({color:0x8e302e,roughness:.75});
 function box(parent,w,h,d,material,x,y,z){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 function oval(parent,material,x,y,z,sx,sy,sz){const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,18,12),material);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;parent.add(mesh);return mesh;}
 box(tray,2,.12,1.3,wood,0,0,0);
 for(const x of [-1,1])box(tray,.08,.17,1.38,wood,x,.11,0);
 for(const z of [-.65,.65])box(tray,2,.17,.08,wood,0,.11,z);
 const bread=new THREE.Group();bread.position.set(-.48,.18,0);bread.name='Pan';tray.add(bread);
 bread.name='Pedazo de pan partido';
 const crumb=new THREE.MeshStandardMaterial({color:0xd9bc81,roughness:1});
 const cut=new THREE.Shape();cut.moveTo(-.28,-.10);cut.lineTo(.25,-.12);cut.lineTo(.31,.02);cut.lineTo(.23,.18);cut.quadraticCurveTo(0,.31,-.25,.16);cut.lineTo(-.32,.02);cut.closePath();
 const breadGeometry=new THREE.ExtrudeGeometry(cut,{depth:.48,bevelEnabled:true,bevelSize:.018,bevelThickness:.018,bevelSegments:2,steps:1,curveSegments:12});
 const chunk=new THREE.Mesh(breadGeometry,[crumb,breadMaterial]);chunk.position.set(0,.13,-.24);chunk.rotation.y=-.22;chunk.castShadow=chunk.receiveShadow=true;bread.add(chunk);
 const poreMaterial=new THREE.MeshStandardMaterial({color:0x9b7b49,roughness:1});
 for(let i=0;i<34;i++){const x=Math.sin(i*127.1)*.24,y=.02+(Math.sin(i*79.3)*.5+.5)*.18;if(Math.abs(x)>.24-Math.max(0,y-.12)*.5)continue;const pore=oval(chunk,poreMaterial,x,y,-.021,.009+(i%3)*.004,.006+(i%4)*.003,.002);pore.rotation.z=i*1.7;}
 for(let i=0;i<7;i++){const c=oval(bread,crumb,Math.sin(i*2.3)*.33,-.06,Math.cos(i*3.1)*.27,.012,.009,.015);c.rotation.y=i;}
 const breadFallback=new THREE.Group();breadFallback.name='Pan anterior (respaldo)';
 for(const part of [...bread.children])breadFallback.add(part);
 bread.add(breadFallback);
 const assetBase=publicAssetBase;
 bread.userData.appearanceReady=new GLTFLoader().loadAsync(`${assetBase}objets/bread.glb`).then(gltf=>{
  const model=gltf.scene;model.name='Modelo de pan';
  model.traverse(object=>{if(object.isMesh){object.castShadow=object.receiveShadow=true;object.frustumCulled=false;}});
  const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  const scale=Math.min(.68/(size.x||1),.5/(size.y||1),.54/(size.z||1));
  model.scale.setScalar(scale);
  model.position.set(-center.x*scale,.2-center.y*scale,-center.z*scale);
  bread.add(model);breadFallback.visible=false;
  return model;
 }).catch(error=>{console.warn('No se pudo cargar bread.glb:',error);return null;});
 const meat=new THREE.Group();meat.position.set(.5,.18,0);meat.name='Plato de sopa oscura';tray.add(meat);
 const pottery=new THREE.MeshStandardMaterial({color:0x8b8270,roughness:.72,side:THREE.DoubleSide});
 const plate=new THREE.Mesh(new THREE.LatheGeometry([[0,0],[.22,0],[.30,.025],[.37,.11],[.405,.15],[.425,.16],[.44,.145],[.425,.12],[.39,.09],[.32,-.008],[.22,-.025],[0,-.025]].map(([r,y])=>new THREE.Vector2(r,y)),48),pottery);plate.castShadow=plate.receiveShadow=true;meat.add(plate);
 const soupMaterial=new THREE.MeshStandardMaterial({color:0x211b10,roughness:.24,metalness:.05});
 const soup=new THREE.Mesh(new THREE.CircleGeometry(.358,48),soupMaterial);soup.name='Caldo oscuro';soup.rotation.x=-Math.PI/2;soup.position.y=.097;meat.add(soup);
 const oil=new THREE.MeshStandardMaterial({color:0x655028,roughness:.14,transparent:true,opacity:.45,depthWrite:false});
 for(let i=0;i<12;i++){const spot=new THREE.Mesh(new THREE.CircleGeometry(.009+(i%4)*.007,12),oil);spot.rotation.x=-Math.PI/2;spot.position.set(Math.sin(i*2.4)*.27,.098,Math.cos(i*4.1)*.24);meat.add(spot);}
 const ants=new THREE.Group();ants.name='Ejercito de hormigas';ants.userData.spellTarget='ant-army';ants.visible=false;scene.add(ants);
 const antMaterial=new THREE.MeshStandardMaterial({color:0x29180e,roughness:.7});
 const antBodies=new THREE.InstancedMesh(new THREE.SphereGeometry(1,8,6),antMaterial,48*3);
 const antLegs=new THREE.InstancedMesh(new THREE.CylinderGeometry(.009,.009,1,5),antMaterial,48*6);ants.add(antBodies,antLegs);
 const antStates=Array.from({length:48},(_,i)=>({alive:true,x:0,z:0,angle:i*2.399,speed:.55+(i%5)*.13}));
 const greenBug=new THREE.Group();greenBug.name='Chinche verde grande';greenBug.userData.spellTarget='green-bug';greenBug.visible=false;scene.add(greenBug);
 const green=new THREE.MeshStandardMaterial({color:0x529c2d,roughness:.5,metalness:.12});
 const brightGreen=new THREE.MeshStandardMaterial({color:0x8cbb42,roughness:.65});
 const darkGreen=new THREE.MeshStandardMaterial({color:0x23431a,roughness:.75});
 function bugLimb(parent,a,b,r){const d=b.clone().sub(a);const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r*.7,r,d.length(),8),darkGreen);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());mesh.castShadow=true;parent.add(mesh);}
 oval(greenBug,darkGreen,0,.2,0,.47,.17,.64);
 const shield=new THREE.Shape();shield.moveTo(-.28,-.5);shield.lineTo(.28,-.5);shield.lineTo(.58,-.2);shield.lineTo(.5,.34);shield.lineTo(0,.73);shield.lineTo(-.5,.34);shield.lineTo(-.58,-.2);shield.closePath();
 const shell=new THREE.Mesh(new THREE.ExtrudeGeometry(shield,{depth:.1,bevelEnabled:true,bevelSize:.07,bevelThickness:.06,bevelSegments:3,steps:1}),green);shell.rotation.x=-Math.PI/2;shell.position.y=.28;shell.castShadow=true;greenBug.add(shell);
 oval(greenBug,brightGreen,0,.26,.68,.24,.13,.23);
 const legs=[];
 for(const side of [-1,1]){
  oval(greenBug,darkGreen,side*.2,.32,.77,.065,.065,.055);
  const antenna=new THREE.CatmullRomCurve3([new THREE.Vector3(side*.12,.3,.82),new THREE.Vector3(side*.3,.4,1.04),new THREE.Vector3(side*.48,.42,1.25)]);
  greenBug.add(new THREE.Mesh(new THREE.TubeGeometry(antenna,16,.016,6,false),darkGreen));
  for(let i=0;i<3;i++){
   const leg=new THREE.Group();leg.position.set(side*.38,.2,.36-i*.34);greenBug.add(leg);
   const joint=new THREE.Vector3(side*.3,.02,.2-i*.15);
   bugLimb(leg,new THREE.Vector3(),joint,.035);bugLimb(leg,joint,new THREE.Vector3(side*.55,-.17,.28-i*.22),.023);
   legs.push({leg,side,phase:i*Math.PI+(side<0?Math.PI:0)});
  }
 }
 const seam=new THREE.CatmullRomCurve3([new THREE.Vector3(-.44,.41,.17),new THREE.Vector3(0,.43,-.25),new THREE.Vector3(.44,.41,.17)]);
 greenBug.add(new THREE.Mesh(new THREE.TubeGeometry(seam,16,.012,5,false),darkGreen));
 greenBug.scale.setScalar(.35);
 const stops=[[-6,.06,-5,0,1,0],[5,.06,-4,0,1,0],[6,.06,5,0,1,0],[-5,.06,5,0,1,0],[-9.4,3,-5,1,0,0],[-7,5.4,-4,0,-1,0],[3,5.4,-6,0,-1,0],[9.4,4,-5,-1,0,0],[9.4,2,4,-1,0,0],[5,5.4,5,0,-1,0],[-6,5.4,4,0,-1,0],[-9.4,3,5,1,0,0]];
 let triggered=false,age=0,transformed=false,greenBugDead=false,targeted=false,flight=0,stopIndex=0,duration=1;
 const from=new THREE.Vector3(),to=new THREE.Vector3(),normalFrom=new THREE.Vector3(0,1,0),normalTo=new THREE.Vector3(),matrix=new THREE.Matrix4(),dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0);
 function hit(){if(triggered)return;triggered=true;delete tray.userData.spellTarget;}
 function nextJump(){from.copy(greenBug.position);const stop=stops[stopIndex++%stops.length];to.set(...stop.slice(0,3));normalTo.set(...stop.slice(3));flight=0;duration=THREE.MathUtils.clamp(from.distanceTo(to)/17,.35,.8);}
 function transform(){
  transformed=true;bread.visible=false;meat.visible=false;ants.visible=true;greenBug.visible=true;
  const breadPoint=bread.getWorldPosition(new THREE.Vector3());
  for(const ant of antStates){ant.x=breadPoint.x+Math.cos(ant.angle)*.3;ant.z=breadPoint.z+Math.sin(ant.angle)*.3;}
  greenBug.position.copy(meat.getWorldPosition(new THREE.Vector3()));nextJump();
 }
 function update(dt){
  if(!triggered)return;age+=dt;
  if(age<1.25){const t=age/1.25;bread.position.set(-.48-t*.6,.18+Math.sin(t*Math.PI)*2.5,0);meat.position.set(.5+t*.6,.18+Math.sin(t*Math.PI)*2.8,.3*t);bread.rotation.z=t*5;meat.rotation.x=t*6;tray.rotation.z=Math.sin(t*Math.PI)*.1;return;}
  tray.rotation.z=0;if(!transformed)transform();
  for(let i=0;i<antStates.length;i++){
   const ant=antStates[i];if(!ant.alive)continue;ant.angle+=Math.sin(age*.9+i)*dt*.55;ant.x+=Math.sin(ant.angle)*ant.speed*dt;ant.z+=Math.cos(ant.angle)*ant.speed*dt;
   if(Math.abs(ant.x)>8.8||Math.abs(ant.z)>8.8){ant.angle+=Math.PI;ant.x=THREE.MathUtils.clamp(ant.x,-8.8,8.8);ant.z=THREE.MathUtils.clamp(ant.z,-8.8,8.8);}
   for(let j=0;j<3;j++){dummy.position.set(ant.x+Math.sin(ant.angle)*(j-1)*.09,.065,ant.z+Math.cos(ant.angle)*(j-1)*.09);dummy.rotation.set(0,ant.angle,0);dummy.scale.set(.045,.045,j===0?.085:.055);dummy.updateMatrix();antBodies.setMatrixAt(i*3+j,dummy.matrix);}
   for(let side=0;side<2;side++)for(let j=0;j<3;j++){
    const s=side?1:-1,along=(j-1)*.07,wave=Math.sin(age*18+i+j)*.04;
    const a=new THREE.Vector3(ant.x+Math.sin(ant.angle)*along,.06,ant.z+Math.cos(ant.angle)*along);
    const b=new THREE.Vector3(a.x+Math.cos(ant.angle)*s*.12+Math.sin(ant.angle)*wave,.015,a.z-Math.sin(ant.angle)*s*.12+Math.cos(ant.angle)*wave);
    dummy.position.copy(a).add(b).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(up,b.clone().sub(a).normalize());dummy.scale.set(1,a.distanceTo(b),1);dummy.updateMatrix();antLegs.setMatrixAt(i*6+side*3+j,dummy.matrix);
   }
  }
  antBodies.instanceMatrix.needsUpdate=true;antLegs.instanceMatrix.needsUpdate=true;antBodies.computeBoundingSphere();antLegs.computeBoundingSphere();
  if(greenBugDead||targeted)return;
  flight=Math.min(1,flight+dt/duration);greenBug.position.lerpVectors(from,to,flight);
  const normal=normalFrom.clone().lerp(normalTo,flight).normalize();const runningOnFloor=from.y<.1 && to.y<.1;
  greenBug.position.addScaledVector(normal,Math.sin(flight*Math.PI)*(runningOnFloor?.015:.5));
  const forward=to.clone().sub(from);forward.addScaledVector(normal,-forward.dot(normal));if(forward.lengthSq()<.001)forward.set(0,0,1);forward.normalize();
  const right=new THREE.Vector3().crossVectors(normal,forward).normalize();forward.crossVectors(right,normal).normalize();matrix.makeBasis(right,normal,forward);greenBug.quaternion.setFromRotationMatrix(matrix);
  for(const {leg,side,phase} of legs){leg.rotation.y=Math.sin(age*18+phase)*.35;leg.rotation.z=side*Math.max(0,Math.cos(age*18+phase))*.25;}
  if(flight>=1){normalFrom.copy(normalTo);nextJump();}
 }
 function hitAnt(mesh,instanceId){
  if(!transformed || !ants.visible || !Number.isInteger(instanceId))return 0;
  const parts=mesh===antBodies?3:mesh===antLegs?6:0;
  if(!parts)return 0;
  const selected=antStates[Math.floor(instanceId/parts)];
  if(!selected?.alive)return 0;
  const group=antStates.map((ant,index)=>({ant,index})).filter(({ant})=>ant.alive)
   .sort((a,b)=>Math.hypot(a.ant.x-selected.x,a.ant.z-selected.z)-Math.hypot(b.ant.x-selected.x,b.ant.z-selected.z)).slice(0,10);
  const hidden=new THREE.Matrix4().makeScale(0,0,0);
  for(const {ant,index} of group){ant.alive=false;for(let j=0;j<3;j++)antBodies.setMatrixAt(index*3+j,hidden);for(let j=0;j<6;j++)antLegs.setMatrixAt(index*6+j,hidden);}
  antBodies.instanceMatrix.needsUpdate=true;antLegs.instanceMatrix.needsUpdate=true;
  antBodies.computeBoundingSphere();antLegs.computeBoundingSphere();
  ants.visible=antStates.some(ant=>ant.alive||ant.crushed);
  return group.length;
 }
 function crushAnt(mesh,instanceId){
  const parts=mesh===antBodies?3:mesh===antLegs?6:0;
  if(!transformed||!parts||!Number.isInteger(instanceId))return false;
  const index=Math.floor(instanceId/parts),ant=antStates[index];
  if(!ant?.alive)return false;
  ant.alive=false;ant.crushed=true;
  const flatten=new THREE.Matrix4().makeScale(1.2,.1,1.2);
  // Flatten around this ant's own position, keeping the body and all six legs.
  flatten.elements[12]=-.2*ant.x;flatten.elements[13]=.025;flatten.elements[14]=-.2*ant.z;
  for(const [mesh,count] of [[antBodies,3],[antLegs,6]]){
   for(let j=0;j<count;j++){mesh.getMatrixAt(index*count+j,matrix);matrix.premultiply(flatten);mesh.setMatrixAt(index*count+j,matrix);}
   mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();
  }
  return true;
 }
 function nearbyAnt(origin){
  if(!transformed||!ants.visible)return null;
  for(let part=ants;part;part=part.parent)if(!part.visible)return null;
  let nearest=null,distance=Infinity;
  antStates.forEach((ant,index)=>{
   if(!ant.alive)return;
   const point=ants.localToWorld(new THREE.Vector3(ant.x,.065,ant.z)),d=point.distanceToSquared(origin);
   if(d<distance){distance=d;nearest={target:ants,point,mesh:antBodies,instanceId:index*3};}
  });
  return nearest;
 }
 function target(object){if(object!==greenBug||!transformed||greenBugDead||targeted)return false;targeted=true;return true;}
 function release(object){if(object===greenBug&&!greenBugDead)targeted=false;}
 function defeat(object){if(object!==greenBug||greenBugDead)return;greenBugDead=true;targeted=false;greenBug.visible=false;}
 return {hit,hitAnt,crushAnt,nearbyAnt,get antsRemaining(){return antStates.filter(ant=>ant.alive).length;},update,target,release,defeat,tray,bread,meat,ants,greenBug,get transformed(){return transformed;}};
}
