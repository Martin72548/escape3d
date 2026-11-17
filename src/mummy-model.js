import * as THREE from 'three';
import { installMummyFace } from './mummy-realistic-face.js';

export function createMummyModel(){
 const root=new THREE.Group();root.name='Momia de la pared opuesta al lagarto';root.userData.spellTarget='mummy';root.scale.setScalar(1.85);
 let seed=517;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(256,256);
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){const weave=(x%3===0?-15:0)+(y%4===0?-9:0),stain=Math.sin(x*.037+Math.sin(y*.04))*Math.cos(y*.045)*14,grain=(random()-.5)*17,shade=181+weave+stain+grain;pixels.data.set([shade+7,shade+3,shade-13,255],(y*256+x)*4);}ctx.putImageData(pixels,0,0);
 for(let i=0;i<100;i++){ctx.fillStyle='rgba(64,53,39,.17)';ctx.fillRect(random()*256,random()*256,1+random()*2,4+random()*22);}
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=4;
 const linen=new THREE.MeshStandardMaterial({map,bumpMap:map,bumpScale:.007,roughness:1,side:THREE.DoubleSide}),aged=linen.clone();aged.color.set(0xb6ad9a);
 const skin=new THREE.MeshStandardMaterial({color:0x625b49,roughness:1}),bone=new THREE.MeshStandardMaterial({color:0xb7ae94,roughness:.9}),dark=new THREE.MeshStandardMaterial({color:0x171811,roughness:1});
 const sphere=new THREE.SphereGeometry(1,24,18);
 function oval(parent,material,x,y,z,sx,sy,sz){const m=new THREE.Mesh(sphere,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
 // Real strips overlap the dried body, with small gaps and uneven cloth edges.
 function wrap(parent,x,y,z,rx,rz,height,turns,width,phase=0,faceOpen=false,profile=null){
  const points=[],uv=[],indices=[],steps=Math.ceil(turns*72);
  for(let i=0;i<=steps;i++){
   const t=i/steps,a=t*turns*Math.PI*2+phase,r=profile?profile(t):1;
   for(const side of [-1,1]){const edge=side*width*.5*(1+.08*Math.sin(a*11)+.025*Math.sin(a*37)),yy=(t-.5)*height+edge+Math.sin(a*3+t*8)*.003;
    points.push(x+Math.cos(a)*(rx*r+.002*side),y+yy,z+Math.sin(a)*(rz*r+.002*side));uv.push(t*turns*3,side<0?0:1);
   }
   if(i<steps){const yy=(t-.5)*height;if(!(faceOpen&&Math.sin(a)>.42&&yy>-.16&&yy<.075)){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}}
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();const mesh=new THREE.Mesh(geometry,phase%2?aged:linen);mesh.name='Venda de lino superpuesta';mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);
  // Thin raised hems and individual loose linen fibres catch side lighting.
  for(const side of [0,1]){const line=[];for(let i=0;i<=steps;i++){const k=(i*2+side)*3;line.push(new THREE.Vector3(points[k],points[k+1],points[k+2]));}const edge=new THREE.Line(new THREE.BufferGeometry().setFromPoints(line),new THREE.LineBasicMaterial({color:0x776d58,transparent:true,opacity:.34}));parent.add(edge);}
  const fibres=[];for(let i=0;i<26;i++){const k=(Math.floor(random()*steps)*2+(i%2))*3;const start=new THREE.Vector3(points[k],points[k+1],points[k+2]);fibres.push(start,start.clone().add(new THREE.Vector3((random()-.5)*.009,-.006-random()*.009,(random()-.5)*.009)));}
  parent.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(fibres),new THREE.LineBasicMaterial({color:0xb8ae94,transparent:true,opacity:.65})));
  return mesh;
 }
 function limb(parent,a,b,rx,rz,turns){
  const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),group=new THREE.Group(),length=start.distanceTo(end);group.position.copy(start).add(end).multiplyScalar(.5);group.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.sub(start).normalize());parent.add(group);
  oval(group,skin,0,0,0,rx*.9,length*.55,rz*.9);wrap(group,0,0,0,rx,rz,length,turns,length/turns*.88,random()*5,false,t=>.72+.28*Math.sin(t*Math.PI));return group;
 }
 oval(root,skin,0,1.17,0,.205,.34,.12);oval(root,skin,0,.91,0,.18,.15,.13);
 wrap(root,0,1.20,0,.235,.148,.61,12,.049,.4,false,t=>.72+Math.sin(t*Math.PI)*.34);
 wrap(root,0,.92,0,.19,.14,.20,5,.037,1.5);
 // Diagonal chest wraps match the crisscross pattern in the reference.
 for(let strip=0;strip<5;strip++){
  const vertices=[],uv=[],indices=[],side=strip%2?1:-1;
  for(let j=0;j<=20;j++)for(const edge of [-1,1]){
   const t=j/20,x=THREE.MathUtils.lerp(side*.18,-side*.15,t)+edge*.023,y=1.46-t*.46-strip*.015+edge*.014;
   const profile=.72+Math.sin(THREE.MathUtils.clamp((y-.895)/.61,0,1)*Math.PI)*.34,rx=.235*profile,rz=.148*profile;
   vertices.push(x,y,rz*Math.sqrt(Math.max(.12,1-(x/rx)**2))+.012+strip*.001);uv.push(t*2,edge<0?0:1);
   if(j<20&&edge<0){const k=j*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();const band=new THREE.Mesh(geometry,strip%2?aged:linen);band.castShadow=true;root.add(band);
 }

 oval(root,skin,0,1.48,0,.064,.12,.06);wrap(root,0,1.48,0,.074,.07,.17,5,.029,.5);
 const head=new THREE.Group();head.name='Cabeza vendada con rostro hundido';head.position.set(0,1.68,.02);head.rotation.z=-.035;root.add(head);
 oval(head,bone,0,.015,0,.112,.16,.10);oval(head,skin,0,-.09,.025,.078,.075,.08);
 wrap(head,0,.012,0,.118,.108,.30,10,.027,1.8,true,t=>.24+Math.sin(t*Math.PI)*.78);
 for(const side of [-1,1]){
  oval(head,skin,side*.046,.035,.092,.045,.045,.021);oval(head,dark,side*.046,.036,.111,.027,.029,.012);
  oval(head,bone,side*.085,-.025,.074,.022,.043,.024);oval(head,aged,side*.078,.081,.096,.037,.014,.022);
 }
 const noseShape=new THREE.Shape();noseShape.moveTo(0,.015);noseShape.lineTo(-.019,-.025);noseShape.lineTo(.019,-.025);noseShape.closePath();const nose=new THREE.Mesh(new THREE.ShapeGeometry(noseShape),dark);nose.position.set(0,-.018,.119);head.add(nose);
 oval(head,dark,0,-.09,.1,.049,.029,.016);oval(head,bone,0,-.127,.081,.055,.025,.029);
 for(let i=0;i<7;i++)for(const sign of [-1,1])oval(head,bone,(i-3)*.012,-.09+sign*.015,.115,.0045,.009,.005);
 const faceProxies=head.children.filter(part=>part.isMesh&&part.name!=='Venda de lino superpuesta');
 const appearanceReady=installMummyFace(head,faceProxies).catch(error=>console.warn('No se pudo cargar el rostro de la momia:',error));root.userData.appearanceReady=appearanceReady;
 const legs=[],knees=[],arms=[],strips=[];
 for(const side of [-1,1]){
  const leg=new THREE.Group();leg.position.set(side*.115,.85,0);root.add(leg);legs.push(leg);
  limb(leg,[0,0,0],[side*.012,-.38,.012],.077,.077,8);oval(leg,skin,side*.012,-.38,.012,.058,.064,.059);wrap(leg,side*.012,-.38,.012,.061,.062,.10,3,.034,.8);
  const knee=new THREE.Group();knee.position.set(side*.012,-.4,.012);leg.add(knee);knees.push(knee);
  limb(knee,[0,0,0],[0,-.35,-.012],.049,.051,9);oval(knee,skin,0,-.385,.07,.055,.04,.13);wrap(knee,0,-.35,0,.053,.055,.12,4,.026,.5);
  for(let i=0;i<5;i++)oval(knee,bone,(i-2)*.021,-.397,.16,.012,.018,.04);
  const arm=new THREE.Group();arm.position.set(side*.225,1.43,0);root.add(arm);arms.push(arm);
  limb(arm,[0,0,0],[side*.018,-.235,.095],.059,.062,7);const elbow=new THREE.Group();elbow.position.set(side*.018,-.25,.10);arm.add(elbow);arm.userData.elbow=elbow;
  limb(elbow,[0,0,0],[side*.015,-.235,.12],.041,.043,7);const hand=new THREE.Group();hand.position.set(side*.015,-.265,.14);elbow.add(hand);arm.userData.hand=hand;
  oval(hand,skin,0,0,0,.046,.073,.021);wrap(hand,0,.005,0,.049,.024,.10,3,.029,1);
  for(let i=0;i<4;i++){const curve=new THREE.CatmullRomCurve3([new THREE.Vector3((i-1.5)*.022,-.04,0),new THREE.Vector3((i-1.5)*.026,-.09,.02),new THREE.Vector3((i-1.5)*.022,-.14,.038)]);hand.add(new THREE.Mesh(new THREE.TubeGeometry(curve,10,.009,5,false),bone));}
  const thumb=new THREE.Mesh(new THREE.CapsuleGeometry(.012,.065,4,7),bone);thumb.position.set(side*.055,-.025,.015);thumb.rotation.z=side*.4;hand.add(thumb);
 }
 for(const [parent,x,y,z,length]of [[root,-.18,1.35,.17,.28],[root,.18,1.03,.16,.23],[knees[0],.035,-.12,.055,.2],[arms[1].userData.elbow,.04,-.07,.1,.24]]){
  const geometry=new THREE.PlaneGeometry(.043,length,3,12);geometry.translate(0,-length/2,0);const p=geometry.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,Math.sin(p.getY(i)*21)*.012);geometry.computeVertexNormals();const strip=new THREE.Mesh(geometry,aged);strip.position.set(x,y,z);strip.name='Extremo de venda deshilachada';strip.castShadow=true;parent.add(strip);strips.push(strip);
 }
 return {root,legs,arms,knees,strips,head,appearanceReady};
}
