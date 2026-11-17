import * as THREE from 'three';

export function createBlackSmoke(scene) {
 const size=64,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const radius=Math.hypot((x+.5-size/2)/(size/2),(y+.5-size/2)/(size/2));
  const index=(y*size+x)*4;
  data[index]=data[index+1]=data[index+2]=255;
  data[index+3]=Math.round(255*Math.pow(Math.max(0,1-radius),1.5));
 }
 const texture=new THREE.DataTexture(data,size,size);texture.needsUpdate=true;
 const particles=[];
 function emit(root){
  root.updateWorldMatrix(true,true);
  for(let i=0;i<70;i++){
   const material=new THREE.SpriteMaterial({map:texture,color:0x080808,transparent:true,opacity:0,depthWrite:false,blending:THREE.NormalBlending});
   const sprite=new THREE.Sprite(material);sprite.name='Humo negro al morir el zombi';sprite.raycast=()=>{};
   sprite.position.copy(root.localToWorld(new THREE.Vector3((Math.random()-.5)*.55,.1+Math.random()*1.7,(Math.random()-.5)*.4)));
   const size=.6+Math.random()*.7;sprite.scale.setScalar(size);scene.add(sprite);
   particles.push({sprite,age:0,life:2.4+Math.random()*1.2,size,velocity:new THREE.Vector3((Math.random()-.5)*.6,.6+Math.random()*.7,(Math.random()-.5)*.6)});
  }
 }
 function update(dt){
  for(let i=particles.length-1;i>=0;i--){
   const p=particles[i];p.age+=dt;
   if(p.age>=p.life){p.sprite.removeFromParent();p.sprite.material.dispose();particles.splice(i,1);continue;}
   const t=p.age/p.life;
   p.sprite.position.addScaledVector(p.velocity,dt);
   p.sprite.scale.setScalar(p.size*(1+t*2.5));
   p.sprite.material.opacity=.8*THREE.MathUtils.smoothstep(t,0,.08)*(1-THREE.MathUtils.smoothstep(t,.25,1));
   p.sprite.material.rotation+=dt*.12;
  }
 }
 return {emit,update};
}
