import * as THREE from 'three';

// Sculptural chitin, fine sensory hairs and mouthparts stay attached to the
// existing eight-leg rig, keeping the established wall/floor behavior.
export function detailArachnidNoFace(creature,thorax,face,material){
 const size=128,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const grain=Math.sin(x*43.13+y*17.7)*Math.cos(x*13.9-y*29.3),ridges=Math.sin(y*.35+Math.sin(x*.14))*12,value=108+grain*23+ridges;data.set([value,value,value,255],(y*size+x)*4);}
 const relief=new THREE.DataTexture(data,size,size);relief.wrapS=relief.wrapT=THREE.RepeatWrapping;relief.magFilter=relief.minFilter=THREE.LinearFilter;relief.needsUpdate=true;
 material.color.set(0x1c1718);material.bumpMap=relief;material.bumpScale=.008;material.roughness=.46;material.metalness=.08;material.needsUpdate=true;
 const shell=material.clone();shell.color.set(0x28201b);shell.roughness=.57;
 const hairMaterial=new THREE.LineBasicMaterial({color:0x54443a,transparent:true,opacity:.62});
 function oval(container,mat,position,scale){const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,32,24),mat);mesh.position.set(...position);mesh.scale.set(...scale);mesh.castShadow=mesh.receiveShadow=true;container.add(mesh);return mesh;}
 function fuzz(mesh,count){const vertices=[];for(let i=0;i<count;i++){const y=1-2*(i+.5)/count,a=i*2.39996,r=Math.sqrt(1-y*y),v=new THREE.Vector3(Math.cos(a)*r,y,Math.sin(a)*r);vertices.push(...v.toArray(),...v.clone().multiplyScalar(1.025+(i%5)*.004).toArray());}const lines=new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(vertices,3)),hairMaterial);lines.raycast=()=>{};mesh.add(lines);}
 const abdomen=oval(creature,shell,[0,-.52,.29],[.39,.56,.34]);abdomen.name='Abdomen de aracnido con vello sensorial';fuzz(abdomen,800);fuzz(thorax,400);
 const lineMaterial=new THREE.MeshStandardMaterial({color:0x4d3b2c,roughness:.77});
 for(let i=0;i<5;i++){const t=i/4;const seam=new THREE.Mesh(new THREE.TorusGeometry(.28-t*.025,.007,6,40,Math.PI*1.15),lineMaterial);seam.position.set(0,-.25-t*.15,.48);seam.scale.set(1,.5,1);seam.rotation.z=Math.PI*.925;creature.add(seam);}
 const fangMaterial=new THREE.MeshStandardMaterial({color:0x71634b,roughness:.35,metalness:.15});
 for(const side of [-1,1]){
  oval(creature,shell,[side*.13,-.13,.52],[.11,.15,.12]);
  const fangCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(side*.14,-.18,.61),new THREE.Vector3(side*.17,-.3,.69),new THREE.Vector3(side*.06,-.38,.69)]);
  const fang=new THREE.Mesh(new THREE.TubeGeometry(fangCurve,16,.018,8,false),fangMaterial);creature.add(fang);
  for(let i=0;i<3;i++)oval(creature,shell,[side*(.2+i*.08),.13-i*.12,.38],[.055,.07,.065]);
 }
 // Keep the characteristic pale mask, with a less polished stone surface.
 face.children.filter(object=>object.isMesh&&object.material.color?.getHex()===0xf2ead7).forEach(object=>{object.material.bumpMap=relief;object.material.bumpScale=.002;object.material.roughness=.48;object.material.needsUpdate=true;});
 const bristles=[];for(let i=0;i<60;i++){const a=i*2.39996,y=(i+.5)/60-.5,r=1.02;const x=Math.cos(a)*r,z=Math.sin(a)*r;bristles.push(x,y,z,x*1.38,y+.012,z*1.38);}
 const bristleGeometry=new THREE.BufferGeometry();bristleGeometry.setAttribute('position',new THREE.Float32BufferAttribute(bristles,3));
 return {decorateLeg(mesh){const hairs=new THREE.LineSegments(bristleGeometry,hairMaterial);hairs.raycast=()=>{};mesh.add(hairs);},shell};
}
