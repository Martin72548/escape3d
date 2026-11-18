import { isStandingOnGoalCross } from './goal-cross.js';
import { addTrunkWords } from './trunk-words.js';
import { createChasmFall } from './chasm-fall.js';
import { createChasmVictory } from './chasm-victory.js';
import { createHarpyFlock } from './harpy-flock.js';
import { createChasmRockMaterial, createChasmRiver } from './chasm-river.js';
import * as THREE from 'three';

export function buildChasmScene(scene,prisoner){
 const root=new THREE.Group();root.name='Nivel 4 - Precipicio y puente de tronco';root.userData.dimensions={width:35,length:35};scene.add(root);
 const cliffStone=createChasmRockMaterial(),stone=cliffStone.clone();stone.vertexColors=false;
 const earth=new THREE.MeshStandardMaterial({color:0x534d3c,roughness:1});
 const moss=new THREE.MeshStandardMaterial({color:0x48543b,roughness:1});
 const rockGeometry=new THREE.DodecahedronGeometry(1,1);
 function mesh(geometry,material,x,y,z){const object=new THREE.Mesh(geometry,material);object.position.set(x,y,z);object.castShadow=object.receiveShadow=true;root.add(object);return object;}
 function box(w,h,d,x,y,z,material=stone){return mesh(new THREE.BoxGeometry(w,h,d),material,x,y,z);}
 // Two separate banks: the space between them has no floor.
 box(35,82,7,0,-41,14,stone);box(35,.35,7,0,.025,14,earth);
 box(35,82,7,0,-41,-14,stone);box(35,.35,7,0,.025,-14,earth);
 let seed=4071;function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
 for(const [edge,direction]of [[10.5,1],[-10.5,-1]]){
  const faceGeometry=new THREE.PlaneGeometry(35,82,100,136),vertices=faceGeometry.attributes.position;
  const colors=new Float32Array(vertices.count*3);
  for(let i=0;i<vertices.count;i++){
   const x=vertices.getX(i),y=vertices.getY(i),worldY=y-41,deep=-worldY/82;
   const strata=Math.sin(y*.9+Math.sin(x*.12)*2)*.15+Math.sin(y*2.9+x*.05)*.08;
   const buttress=Math.pow(.5+.5*Math.sin(x*.24+Math.sin(y*.09)),3)*1.5;
   const depth=.12+(buttress+strata+Math.sin(x*.85+y*.35)*.14)*.2+deep*.35;
   vertices.setZ(i,depth);
   const shade=1-deep*.46+Math.sin(y*.55+x*.06)*.055;
   colors.set([shade,shade*.97,shade*.88],i*3);
  }
  faceGeometry.setAttribute('color',new THREE.BufferAttribute(colors,3));faceGeometry.computeVertexNormals();
  const face=mesh(faceGeometry,cliffStone,0,-41,edge);face.name='Pared rocosa estratificada del abismo';if(direction>0)face.rotation.y=Math.PI;
 }
 const river=createChasmRiver(root,78,{length:35,width:12.5,centerZ:0});
 for(let i=0;i<45;i++){
  const bank=i%2?1:-1,z=bank>0?11.5+random()*4.5:-11.5-random()*4.5,x=(random()-.5)*31.5;
  if(Math.abs(x)<2.3)continue;
  const rock=mesh(rockGeometry,i%3?stone:moss,x,.22,z),size=.25+random()*.85;rock.scale.set(size,size*.5,size*.8);rock.rotation.set(random(),random()*6,random());
 }
 const goalCross=new THREE.Group();goalCross.name='Cruz que marca la llegada';goalCross.position.set(0,.245,-14.2);root.add(goalCross);
 const goalMaterial=new THREE.MeshStandardMaterial({color:0xffdf68,emissive:0xffad24,emissiveIntensity:.65,roughness:.55});
 for(const angle of [-Math.PI/4,Math.PI/4]){const bar=new THREE.Mesh(new THREE.BoxGeometry(.24,.045,2.7),goalMaterial);bar.rotation.y=angle;bar.receiveShadow=true;goalCross.add(bar);}
 goalCross.userData.destination=true;
 // Longitudinal bark ridges and pores wrap around a single fallen tree.
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=1024;const ctx=canvas.getContext('2d');
 ctx.fillStyle='#60422a';ctx.fillRect(0,0,512,1024);
 for(let i=0;i<190;i++){
  const x=random()*512;ctx.strokeStyle=i%3?'rgba(24,15,9,.55)':'rgba(175,132,77,.5)';ctx.lineWidth=1+random()*6;ctx.beginPath();ctx.moveTo(x,0);
  for(let y=0;y<=1024;y+=20)ctx.lineTo(x+Math.sin(y*.018+i)*3+Math.sin(y*.049+i)*1.2,y);ctx.stroke();
 }
 const barkMap=new THREE.CanvasTexture(canvas);barkMap.colorSpace=THREE.SRGBColorSpace;barkMap.wrapS=barkMap.wrapT=THREE.RepeatWrapping;barkMap.repeat.set(2,3);barkMap.anisotropy=8;
 const bark=new THREE.MeshStandardMaterial({map:barkMap,bumpMap:barkMap,bumpScale:.08,roughness:1});
 const trunkGeometry=new THREE.CylinderGeometry(1.05,1.05,27,36,40,true),positions=trunkGeometry.attributes.position;
 for(let i=0;i<positions.count;i++){
  const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i),angle=Math.atan2(z,x),ridge=1+Math.sin(angle*17+y*.4)*.018;
  positions.setXYZ(i,x*ridge,y,z*ridge);
 }trunkGeometry.computeVertexNormals();
 const trunk=mesh(trunkGeometry,bark,0,-.85,0);trunk.rotation.x=Math.PI/2;trunk.name='Tronco que cruza el precipicio';
 root.userData.wordsReady=addTrunkWords(root).catch(error=>console.warn('Mots du tronc indisponibles :',error));
 const endCanvas=document.createElement('canvas');endCanvas.width=endCanvas.height=512;const endCtx=endCanvas.getContext('2d');endCtx.fillStyle='#bc925b';endCtx.fillRect(0,0,512,512);
 for(let i=0;i<34;i++){endCtx.strokeStyle=i%2?'#725131':'#a27a46';endCtx.lineWidth=1+i%3;endCtx.beginPath();endCtx.ellipse(256,256,5+i*7,5+i*7*.94,.15,0,Math.PI*2);endCtx.stroke();}
 const endMap=new THREE.CanvasTexture(endCanvas);endMap.colorSpace=THREE.SRGBColorSpace;const cutWood=new THREE.MeshStandardMaterial({map:endMap,roughness:1});
 for(const z of [13.5,-13.5]){const end=mesh(new THREE.CircleGeometry(1.05,36),cutWood,0,-.85,z);if(z<0)end.rotation.y=Math.PI;}
 for(const [x,y,z,angle]of [[.95,-.8,1.5,-.8],[-.9,-.7,-2,.9]]){
  const branch=mesh(new THREE.CylinderGeometry(.12,.32,1.9,12),bark,x,y,z);branch.rotation.z=angle;
 }
 // Light, feathered haze gives depth cues while leaving the whitewater visible.
 const hazeCanvas=document.createElement('canvas');hazeCanvas.width=hazeCanvas.height=128;const hazeCtx=hazeCanvas.getContext('2d');
 const gradient=hazeCtx.createRadialGradient(64,64,0,64,64,64);gradient.addColorStop(0,'rgba(160,184,182,.35)');gradient.addColorStop(1,'rgba(160,184,182,0)');hazeCtx.fillStyle=gradient;hazeCtx.fillRect(0,0,128,128);
 const hazeMap=new THREE.CanvasTexture(hazeCanvas);hazeMap.colorSpace=THREE.SRGBColorSpace;
 const mistMaterial=new THREE.MeshBasicMaterial({map:hazeMap,transparent:true,opacity:.22,depthWrite:false,side:THREE.DoubleSide});
 const mist=[];for(let i=0;i<3;i++){const layer=mesh(new THREE.PlaneGeometry(35,12.25),mistMaterial,0,-28-i*19,0);layer.rotation.x=-Math.PI/2;layer.raycast=()=>{};mist.push(layer);}
 root.add(new THREE.HemisphereLight(0xc8e2df,0x29281e,2));
 const daylight=new THREE.DirectionalLight(0xffe2b4,2.4);daylight.position.set(-12,25,-18);root.add(daylight);
 const fill=new THREE.DirectionalLight(0x99c9dc,1.3);fill.position.set(10,8,12);root.add(fill);
 scene.background=new THREE.Color(0x263b40);scene.fog=new THREE.Fog(0x52696b,55,230);
 prisoner.position.set(0,.22,14);prisoner.rotation.set(0,Math.PI,0);prisoner.visible=true;
 prisoner.userData.victoryCelebrating=false;prisoner.userData.gameWon=false;prisoner.userData.currentLevel=4;prisoner.userData.levelTransition=false;prisoner.userData.lowerPassageOpen=false;prisoner.userData.stairFootTargets=null;
 prisoner.userData.constrainMovement=(x,z)=>{
  z=THREE.MathUtils.clamp(z,-16.5,16.5);const onLog=z<10.7&&z> -10.7;
  if(onLog&&Math.abs(x)>.42){
   if(prisoner.position.z>=10.7)return {x:THREE.MathUtils.clamp(x,-16.5,16.5),y:.22,z:10.7};
   if(prisoner.position.z<=-10.7)return {x:THREE.MathUtils.clamp(x,-16.5,16.5),y:.22,z:-10.7};
  }
  x=THREE.MathUtils.clamp(x,onLog?-.42:-16.5,onLog?.42:16.5);
  const y=onLog?Math.sqrt(1.05*1.05-x*x)-.85+.02:.22;
  return {x,y,z};
 };
 const birds=createHarpyFlock(root),victory=createChasmVictory(root,prisoner,{compact:true,horizontalScale:1.75}),fall=createChasmFall(root,prisoner,river.depth,birds);
 const bodyBox=new THREE.Box3(),partBox=new THREE.Box3(),sweep=new THREE.Vector3();
 function checkBirdContact(flight,previous){
  if(fall.active||victory.active||!flight.active||prisoner.userData.dead||prisoner.position.z>10.5||prisoner.position.z< -10.5)return;
  const scale=prisoner.scale.y;
  bodyBox.min.set(prisoner.position.x-.25*scale,prisoner.position.y+.12*scale,prisoner.position.z-.22*scale);
  bodyBox.max.set(prisoner.position.x+.25*scale,prisoner.position.y+1.82*scale,prisoner.position.z+.22*scale);
  flight.bird.updateWorldMatrix(true,true);sweep.copy(previous).sub(flight.bird.position);
  let touched=false;
  flight.bird.traverse(part=>{if(touched||!part.isMesh)return;partBox.setFromObject(part);const oldBox=partBox.clone().translate(sweep);partBox.union(oldBox);if(partBox.intersectsBox(bodyBox))touched=true;});
  if(touched){birds.select(flight);fall.begin(flight.direction);}
 }
 let age=0;
 return {root,trunk,river,birds,victory,fall,goalCross,update(dt){age+=dt;river.update(dt);const previous=birds.flights.map(flight=>({position:flight.bird.position.clone(),pass:flight.pass}));birds.update(dt);birds.flights.forEach((flight,index)=>checkBirdContact(flight,flight.pass!==previous[index].pass?flight.bird.position:previous[index].position));fall.update(dt);
 if(!victory.active&&!fall.active&&isStandingOnGoalCross(prisoner,goalCross)){birds.stop();victory.start();}
 victory.update(dt);mist.forEach((layer,i)=>layer.position.x=Math.sin(age*.08+i)*2);}};
}
