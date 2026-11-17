import * as THREE from 'three';

// Damage effects use world space so the thrown sword and sparks keep moving
// independently of the knight's animated skeleton.
export function createGeorgeDamage(scene,rider,sword){
 let hits=0,flight=null,burnAge=-1,meltAge=-1,rest=null,pool=null;
 const particles=[],hotMaterials=[];
 const ball=new THREE.SphereGeometry(1,8,6);
 const sparkMaterial=new THREE.MeshBasicMaterial({color:0xffd365,toneMapped:false});
 const flameMaterial=new THREE.MeshBasicMaterial({color:0xff671b,transparent:true,opacity:.8,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
 const light=new THREE.PointLight(0xff671b,0,7,2);scene.add(light);
 function burst(point,count,fire=false){
  for(let i=0;i<count;i++){
   const mesh=new THREE.Mesh(ball,fire?flameMaterial.clone():sparkMaterial);mesh.position.copy(point).add(new THREE.Vector3((Math.random()-.5)*.7,Math.random()*.8,(Math.random()-.5)*.7));
   const size=fire?.08+Math.random()*.12:.018+Math.random()*.025;mesh.scale.set(size,fire?size*2:size,size);scene.add(mesh);
   particles.push({mesh,fire,life:fire?.5+Math.random()*.5:.7+Math.random()*.7,velocity:new THREE.Vector3((Math.random()-.5)*(fire?1:7),fire?1+Math.random()*2:2+Math.random()*5,(Math.random()-.5)*(fire?1:7))});
  }
 }
 function hit(){
  if(hits>=3)return;hits++;
  if(hits===2){
   scene.updateMatrixWorld(true);scene.attach(sword);sword.userData.georgeThrown=true;
   flight={velocity:new THREE.Vector3(3.5,7,-2),landed:false};burst(sword.getWorldPosition(new THREE.Vector3()),65);
  }
  if(hits===3){
   burnAge=0;
   rider.traverse(object=>{if(!object.isMesh)return;const materials=Array.isArray(object.material)?object.material:[object.material];const clones=materials.map(material=>{const clone=material.clone();if(clone.emissive){clone.emissive.set(0xff4108);hotMaterials.push(clone);}return clone;});object.material=Array.isArray(object.material)?clones:clones[0];});
  }
 }
 function update(dt){
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;p.velocity.y-=dt*(p.fire?-1:9);p.mesh.position.addScaledVector(p.velocity,dt);if(p.fire){p.mesh.material.opacity=Math.min(.8,p.life);p.mesh.scale.multiplyScalar(Math.exp(-dt*.7));}if(p.life<=0||p.mesh.position.y<.02){scene.remove(p.mesh);if(p.fire)p.mesh.material.dispose();particles.splice(i,1);}}
  if(flight&&!flight.landed){flight.velocity.y-=9.8*dt;sword.position.addScaledVector(flight.velocity,dt);sword.rotation.x+=dt*9;sword.rotation.z+=dt*5;if(sword.position.y<.17){sword.position.y=.17;sword.rotation.set(Math.PI/2,0,.45);flight.landed=true;burst(sword.position,24);}}
  if(burnAge<0)return false;burnAge+=dt;
  const center=rider.getWorldPosition(new THREE.Vector3());center.y+=.5;light.position.copy(center);light.intensity=(meltAge>3?Math.max(0,5-meltAge):7)*(1+Math.sin(burnAge*24)*.15);
  for(const material of hotMaterials)material.emissiveIntensity=Math.min(2,burnAge*.9);
  if(burnAge<5&&Math.random()<Math.min(1,dt*50))burst(center,3,true);
  // A short final rush makes the third impact's acceleration visible before collapse.
  if(burnAge<1.1)return false;
  if(!rest){rest={position:rider.position.clone(),scale:rider.scale.clone()};meltAge=0;
   const material=new THREE.MeshStandardMaterial({color:0xa15c19,metalness:.9,roughness:.26,emissive:0xff5707,emissiveIntensity:2});
   pool=new THREE.Mesh(new THREE.SphereGeometry(1,48,20),material);pool.name='Charco de metal fundido de San Jorge';pool.position.set(rest.position.x,.055,rest.position.z);pool.scale.set(.1,.035,.1);scene.add(pool);
  }
  meltAge+=dt;const t=THREE.MathUtils.smoothstep(meltAge,0,2.6);
  rider.position.y=THREE.MathUtils.lerp(rest.position.y,.07,t);rider.scale.set(rest.scale.x*(1+t*.7),rest.scale.y*Math.max(.005,1-t),rest.scale.z*(1+t*.7));
  pool.scale.set(.15+t*1.3,.045,.15+t*1.05);pool.material.emissiveIntensity=Math.max(.08,2-(meltAge-2)*.4);
  if(t===1)rider.visible=false;
  return true;
 }
 return {hit,update,get hits(){return hits;},get speed(){return hits>=3?2.5:1;},get burning(){return burnAge>=0;},get melted(){return meltAge>=2.6;}};
}
