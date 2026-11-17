import * as THREE from 'three';

export function createZombieFire(scene){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,'rgba(255,255,210,1)');gradient.addColorStop(.22,'rgba(255,215,55,.95)');gradient.addColorStop(.55,'rgba(255,65,5,.6)');gradient.addColorStop(1,'rgba(100,10,0,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);const texture=new THREE.CanvasTexture(canvas);
 const particles=[];let burning=null,clock=0,spawn=0;
 const light=new THREE.PointLight(0xff6b16,0,8);scene.add(light);
 function particle(position,smoke=false,velocity=null){const material=new THREE.SpriteMaterial({map:texture,color:smoke?0x49443e:0xffffff,transparent:true,opacity:smoke?.24:1,depthWrite:false,blending:smoke?THREE.NormalBlending:THREE.AdditiveBlending});const sprite=new THREE.Sprite(material);sprite.name=smoke?'Humo del zombi':'Llama del zombi';sprite.position.copy(position);sprite.raycast=()=>{};scene.add(sprite);particles.push({sprite,age:0,life:smoke?2.4:.65,smoke,velocity:velocity??new THREE.Vector3((Math.random()-.5)*.45,smoke?1.6:1.3,(Math.random()-.5)*.45),size:smoke?.5:.25+Math.random()*.25});}
 function ignite(root){burning=root;}
 function beam(start,end){for(let i=0;i<45;i++)particle(start.clone().lerp(end,i/44),false,new THREE.Vector3((Math.random()-.5)*.25,.5,(Math.random()-.5)*.25));}
 function stop(){burning=null;light.intensity=0;}
 function update(dt){clock+=dt;if(burning){burning.updateWorldMatrix(true,false);spawn+=dt;while(spawn>.025){spawn-=.025;for(let j=0;j<3;j++)particle(burning.localToWorld(new THREE.Vector3((Math.random()-.5)*.48,.3+Math.random()*1.35,(Math.random()-.5)*.3)));particle(burning.localToWorld(new THREE.Vector3((Math.random()-.5)*.3,1.4,(Math.random()-.5)*.2)),true);}light.position.copy(burning.localToWorld(new THREE.Vector3(0,1,0)));light.intensity=8+Math.sin(clock*29)*2;}
 for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.age+=dt;if(p.age>=p.life){scene.remove(p.sprite);p.sprite.material.dispose();particles.splice(i,1);continue;}const t=p.age/p.life;p.sprite.position.addScaledVector(p.velocity,dt);p.sprite.scale.set(p.size*(1+t*(p.smoke?3:.5)),p.size*(p.smoke?1+t*3:2+t),1);p.sprite.material.opacity=(p.smoke?.24:1)*Math.sin(Math.PI*t);p.sprite.material.rotation=Math.sin(clock*7+i)*.25;}}
 return {ignite,beam,stop,update};
}
