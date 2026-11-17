import * as THREE from 'three';

export function createWerewolfCageBlood(parent){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d');
 let seed=4917;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 ctx.fillStyle='#711019';
 ctx.beginPath();
 for(let i=0;i<=90;i++){
  const angle=i/90*Math.PI*2,r=80+random()*72,x=256+Math.cos(angle)*r,y=220+Math.sin(angle)*r*.78;
  if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
 }
 ctx.closePath();ctx.fill();
 for(let i=0;i<160;i++){
  const angle=random()*Math.PI*2,r=45+random()*194,x=256+Math.cos(angle)*r,y=220+Math.sin(angle)*r*.8,size=2+random()*12;
  ctx.fillStyle=i%3?'#85141d':'#4c0a12';ctx.beginPath();ctx.ellipse(x,y,size,size*(.5+random()),angle,0,Math.PI*2);ctx.fill();
 }
 for(let i=0;i<22;i++){
  const x=150+random()*210,y=220+random()*70,length=40+random()*150;
  ctx.strokeStyle=i%2?'#76111b':'#5d0c15';ctx.lineWidth=2+random()*5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x-3,y+length*.35,x+2,y+length*.7,x,y+length);ctx.stroke();
 }
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
 const material=new THREE.MeshStandardMaterial({map,transparent:true,opacity:0,depthWrite:false,roughness:.58,emissive:0x420309,emissiveIntensity:.35,polygonOffset:true,polygonOffsetFactor:-2});
 const root=new THREE.Group();root.name='Salpicon de sangre en las paredes interiores de la jaula';root.visible=false;parent.add(root);
 const walls=[];
 for(const [x,y,z,yaw,w,h] of [[0,2,-16.62,0,3.35,3.1],[1.735,1.85,-14,-Math.PI/2,4.6,2.9]]){
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),material.clone());mesh.position.set(x,y,z);mesh.rotation.y=yaw;mesh.raycast=()=>{};root.add(mesh);walls.push(mesh);
 }
 const origin=new THREE.Vector3(-1.78,1.85,-14.4),dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0);
 const liquid=new THREE.MeshPhysicalMaterial({color:0x960d1c,roughness:.32,clearcoat:.3,emissive:0x49050c,emissiveIntensity:.45});
 const droplets=new THREE.InstancedMesh(new THREE.SphereGeometry(1,8,6),liquid,220);droplets.name='Chorro y gotas que salen de la puerta lateral';droplets.frustumCulled=false;droplets.raycast=()=>{};root.add(droplets);
 const particles=Array.from({length:220},(_,i)=>{
  const wall=i%4===0?0:1,target=walls[wall].position.clone();
  if(wall===0){target.x+=(random()-.5)*2;target.y+=(random()-.5)*1.4;}
  else {target.z+=(random()-.5)*2.8;target.y+=(random()-.5)*1.6;}
  return {wall,target,launch:i<25?0:random()*.3,duration:.3+random()*.22,size:.023+random()*.047};
 });
 const streams=walls.map((wall,i)=>{
  const path=new THREE.CatmullRomCurve3([origin,origin.clone().lerp(wall.position,.33).add(new THREE.Vector3(0,.22,0)),origin.clone().lerp(wall.position,.7).add(new THREE.Vector3(0,.18,0)),wall.position]);
  const mesh=new THREE.Mesh(new THREE.TubeGeometry(path,32,i===1?.075:.035,8,false),liquid.clone());mesh.name='Chorro desde la puerta hacia la pared';mesh.geometry.setDrawRange(0,0);mesh.raycast=()=>{};root.add(mesh);return mesh;
 });
 let age=0;
 function trigger(){if(root.visible)return;root.visible=true;age=0;walls.forEach(wall=>wall.material.opacity=0);update(0);}
 function update(dt){
  if(!root.visible)return;age+=dt;
  particles.forEach((particle,i)=>{
   const t=(age-particle.launch)/particle.duration;
   if(t<0||t>=1){dummy.scale.setScalar(0);if(t>=1)walls[particle.wall].material.opacity=Math.min(1,walls[particle.wall].material.opacity+.13);}
   else{
    dummy.position.copy(origin).lerp(particle.target,t);dummy.position.y+=Math.sin(t*Math.PI)*.28;
    dummy.quaternion.setFromUnitVectors(up,particle.target.clone().sub(origin).normalize());
    dummy.scale.set(particle.size,particle.size*(2.5+Math.sin(t*Math.PI)*2),particle.size);
   }
   dummy.updateMatrix();droplets.setMatrixAt(i,dummy.matrix);
  });
  droplets.instanceMatrix.needsUpdate=true;
  streams.forEach(mesh=>{
   mesh.visible=age<.86;
   mesh.geometry.setDrawRange(0,Math.floor(THREE.MathUtils.clamp(age/.4,0,1)*32)*8*6);
   mesh.material.transparent=true;mesh.material.opacity=1-THREE.MathUtils.smoothstep(age,.48,.86);
  });
 }
 return {root,trigger,update,walls,droplets,origin};
}
