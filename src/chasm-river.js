import * as THREE from 'three';

export function createChasmRockMaterial(){
 const size=512,canvas=document.createElement('canvas');canvas.width=canvas.height=size;
 const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(size,size);
 function hash(x,y){let n=Math.imul(x,374761393)^Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;}
 function noise(x,y){const ix=Math.floor(x),iy=Math.floor(y),u=x-ix,v=y-iy,a=u*u*(3-2*u),b=v*v*(3-2*v);return THREE.MathUtils.lerp(THREE.MathUtils.lerp(hash(ix,iy),hash(ix+1,iy),a),THREE.MathUtils.lerp(hash(ix,iy+1),hash(ix+1,iy+1),a),b);}
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const layers=Math.sin(y*.15+noise(x*.016,y*.014)*5),mineral=noise(x*.035,y*.052)*25+noise(x*.11,y*.14)*13;
  const shade=94+mineral+layers*9+(hash(x,y)-.5)*19;
  pixels.data.set([shade+8,shade+7,shade+2,255],(y*size+x)*4);
 }
 ctx.putImageData(pixels,0,0);
 for(let i=0;i<55;i++){
  ctx.strokeStyle=i%3?'rgba(25,24,22,.45)':'rgba(205,196,167,.3)';ctx.lineWidth=i%3?1:2;
  let x=hash(i,12)*size,y=hash(i,71)*size;ctx.beginPath();ctx.moveTo(x,y);
  for(let j=0;j<12;j++){x+=(hash(i,j)-.5)*13;y+=7+hash(j,i)*9;ctx.lineTo(x,y);}ctx.stroke();
 }
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(20,12);map.anisotropy=8;
 return new THREE.MeshStandardMaterial({map,bumpMap:map,bumpScale:.18,roughness:.97,vertexColors:true});
}

export function createChasmRiver(root,depth=78,{length=180,width=13.5,centerZ=-8.5}={}){
 const half=length/2,wiggle=width*.11,boulderCount=Math.max(8,Math.round(length/6));
 let seed=8021;function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
 const time={value:0};
 const geometry=new THREE.PlaneGeometry(length,width,Math.max(80,Math.round(length*2)),38);geometry.rotateX(-Math.PI/2);
 const vertices=geometry.attributes.position;
 for(let i=0;i<vertices.count;i++){const x=vertices.getX(i),z=vertices.getZ(i);vertices.setXYZ(i,x,Math.sin(x*.16+z)*.12,z+Math.sin(x*.055)*wiggle);}
 geometry.computeVertexNormals();
 const material=new THREE.MeshStandardMaterial({color:0x386d6c,roughness:.38,metalness:.08,emissive:0x173b3a,emissiveIntensity:.32});
 material.onBeforeCompile=shader=>{
  shader.uniforms.riverTime=time;
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float riverTime;\nvarying vec2 riverPosition;');
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   riverPosition=position.xz;
   transformed.y+=sin(position.x*1.7-riverTime*8.0+sin(position.z*2.0))*.17+sin(position.x*3.3+position.z*2.4-riverTime*12.0)*.09;`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform float riverTime;\nvarying vec2 riverPosition;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   vec2 p=riverPosition;
   float current=sin(p.x*.8-riverTime*5.0+sin(p.y*6.0))*sin(p.y*11.0+sin(p.x*.3-riverTime*2.0));
   float ripples=sin(p.x*4.5+p.y*15.0-riverTime*17.0)*.3;
   float whitewater=smoothstep(.68,1.15,current+ripples);
   float eddy=sin(p.x*.6-riverTime*2.5+sin(p.y*2.0))*.5+.5;
   diffuseColor.rgb=mix(vec3(.025,.09,.10),vec3(.08,.24,.22),eddy);
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.82,.92,.87),whitewater*.92);`);
 };
 const water=new THREE.Mesh(geometry,material);water.position.set(0,-depth,centerZ);water.name='Rio tumultuoso en el fondo del abismo';water.frustumCulled=false;root.add(water);
 const bed=new THREE.Mesh(new THREE.BoxGeometry(length+2,4,width+5),new THREE.MeshStandardMaterial({color:0x343c38,roughness:1}));bed.position.set(0,-depth-2.5,centerZ);root.add(bed);
 const rockMaterial=new THREE.MeshStandardMaterial({color:0x414b45,roughness:.65}),rockGeometry=new THREE.DodecahedronGeometry(1,2),boulders=[];
 for(let i=0;i<boulderCount;i++){
  const x=-half+(i+.5)*length/boulderCount,z=centerZ+(random()-.5)*width*.7,size=.3+random()*Math.min(1.05,width*.12);
  const rock=new THREE.Mesh(rockGeometry,rockMaterial);rock.position.set(x,-depth-.2,z);rock.scale.set(size*1.2,size,size*.8);rock.rotation.set(random(),random()*3,random());root.add(rock);boulders.push(rock.position.clone());
 }
 const gravel=new THREE.InstancedMesh(rockGeometry,rockMaterial,180),gravelDummy=new THREE.Object3D();gravel.name='Riberas rocosas en el fondo del canon';
 for(let i=0;i<180;i++){
  const x=random()*length-half,side=i%2?1:-1,size=.25+random()*.8;
  gravelDummy.position.set(x,-depth-.25+random()*.2,centerZ+side*(width*.54+random()*.8));gravelDummy.scale.set(size*1.5,size*.65,size);gravelDummy.rotation.set(random(),random()*6,random());gravelDummy.updateMatrix();gravel.setMatrixAt(i,gravelDummy.matrix);
 }root.add(gravel);
 // Short, ragged foam ribbons flow downstream around the boulders.
 const canvas=document.createElement('canvas');canvas.width=128;canvas.height=64;const ctx=canvas.getContext('2d');
 for(let i=0;i<250;i++){ctx.fillStyle=`rgba(228,246,237,${.1+random()*.65})`;ctx.beginPath();ctx.ellipse(random()*128,16+random()*32,2+random()*10,1+random()*3,0,0,Math.PI*2);ctx.fill();}
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
 const foamMaterial=new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false,opacity:.65,side:THREE.DoubleSide});
 const foamGeometry=new THREE.PlaneGeometry(1,1);foamGeometry.rotateX(-Math.PI/2);
 const foam=new THREE.InstancedMesh(foamGeometry,foamMaterial,220);foam.name='Espuma y corrientes rapidas';foam.instanceMatrix.setUsage(THREE.DynamicDrawUsage);foam.frustumCulled=false;root.add(foam);
 const streaks=Array.from({length:220},()=>({x:random()*length-half,z:(random()-.5)*width*.9,length:.6+random()*Math.min(3,width*.3),width:.15+random()*.45,speed:5+random()*5,phase:random()*6}));
 const sprayGeometry=new THREE.BufferGeometry(),sprayPositions=new Float32Array(360*3);sprayGeometry.setAttribute('position',new THREE.BufferAttribute(sprayPositions,3));
 const spray=new THREE.Points(sprayGeometry,new THREE.PointsMaterial({color:0xe0eeea,size:.16,transparent:true,opacity:.55,depthWrite:false}));spray.name='Salpicaduras de los rapidos';spray.frustumCulled=false;root.add(spray);
 const dummy=new THREE.Object3D();
 function update(dt){
  time.value+=dt;
  streaks.forEach((s,i)=>{s.x=((s.x+dt*s.speed+half)%length)-half;dummy.position.set(s.x,-depth+.28+Math.sin(s.x*1.7-time.value*8+s.phase)*.15,centerZ+s.z+Math.sin(s.x*.055)*1.5);if(i<112){const rock=boulders[i%boulders.length],wake=(time.value*.8+s.phase)%1;dummy.position.x=Math.min(half,rock.x+.3+wake*Math.min(5,length*.18));dummy.position.z=rock.z+Math.sin(s.phase)*wake;dummy.scale.set(s.length,1,s.width*(1+wake));}else dummy.scale.set(s.length,1,s.width);dummy.rotation.y=Math.sin(s.x*.07+s.phase)*.2;dummy.updateMatrix();foam.setMatrixAt(i,dummy.matrix);});foam.instanceMatrix.needsUpdate=true;
  for(let i=0;i<360;i++){const boulder=boulders[i%boulders.length],t=(time.value*1.5+i*.137)%1;const offset=i*3;sprayPositions[offset]=boulder.x+t*1.8;sprayPositions[offset+1]=-depth+.3+Math.sin(t*Math.PI)*(.5+(i%5)*.13);sprayPositions[offset+2]=boulder.z+Math.sin(i*2.4)*t*.8;}
  sprayGeometry.attributes.position.needsUpdate=true;
 }
 update(0);
 return {water,foam,spray,depth,update};
}
