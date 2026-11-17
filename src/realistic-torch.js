import * as THREE from 'three';

let woodMaterial,ironMaterial,sootMaterial,smokeTexture,emberTexture;
function materials(){
 if(woodMaterial)return;
 const width=128,height=512,data=new Uint8Array(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const grain=Math.sin(x*.7+Math.sin(y*.025)*2)*12+Math.sin(x*2.9+y*.012)*5,crack=Math.sin(x*.22+Math.sin(y*.013))>.96?-29:0;const i=(y*width+x)*4;data.set([Math.max(8,72+grain+crack),Math.max(6,43+grain*.65+crack),Math.max(4,24+grain*.4+crack),255],i);}
 const map=new THREE.DataTexture(data,width,height);map.magFilter=map.minFilter=THREE.LinearFilter;map.anisotropy=8;map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.needsUpdate=true;
 woodMaterial=new THREE.MeshStandardMaterial({map,bumpMap:map,bumpScale:.012,roughness:.96});
 ironMaterial=new THREE.MeshStandardMaterial({color:0x443d33,metalness:.82,roughness:.56,bumpMap:map,bumpScale:.003});
 sootMaterial=new THREE.MeshStandardMaterial({color:0x19110c,roughness:1,bumpMap:map,bumpScale:.018,emissive:0xcf2803,emissiveIntensity:.13});
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(64,64,1,64,64,64);gradient.addColorStop(0,'rgba(255,255,255,.45)');gradient.addColorStop(.35,'rgba(255,255,255,.22)');gradient.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);smokeTexture=new THREE.CanvasTexture(canvas);
 const dot=document.createElement('canvas');dot.width=dot.height=32;const dc=dot.getContext('2d'),glow=dc.createRadialGradient(16,16,0,16,16,16);glow.addColorStop(0,'rgba(255,255,255,1)');glow.addColorStop(.2,'rgba(255,255,255,.95)');glow.addColorStop(1,'rgba(255,255,255,0)');dc.fillStyle=glow;dc.fillRect(0,0,32,32);emberTexture=new THREE.CanvasTexture(dot);
}
// A camera-facing flame avoids a multi-step volume integration per pixel.
const vertexShader=`
varying vec2 vUv;
void main(){
 vUv=uv;
 vec4 center=modelViewMatrix*vec4(0.,.49,0.,1.);
 vec2 scale=vec2(length(modelMatrix[0].xyz),length(modelMatrix[1].xyz));
 center.xy+=vec2(position.x,position.y)*scale;
 gl_Position=projectionMatrix*center;
}
`;
const fragmentShader=`
uniform float uTime;
uniform float uSeed;
varying vec2 vUv;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){
 vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);
}
void main(){
 float time=uTime+uSeed*7.13;
 float y=vUv.y;
 float bend=sin(time*3.1-y*7.)*.09*y*y;
 float x=(vUv.x-.5-bend)*2.;
 vec2 flow=vec2(vUv.x*7.,y*9.-time*2.8);
 float turbulence=noise(flow)*.7+noise(flow*2.1+time*.4)*.3;
 float ripple=(turbulence-.5)*.22;
 float radius=pow(max(0.,1.-y),.72)*.72+ripple;
 float edge=1.-smoothstep(radius-.14,radius,abs(x));
 float alpha=edge*smoothstep(0.,.09,y)*(1.-smoothstep(.75,1.,y));
 if(alpha<.008)discard;
 float heat=clamp((1.-y)*.65+(1.-abs(x)/max(radius,.05))*.4+(turbulence-.5)*.16,0.,1.);
 vec3 color=mix(vec3(1.25,.055,.002),vec3(2.1,.65,.025),smoothstep(.1,.7,heat));
 color=mix(color,vec3(2.6,1.8,.55),smoothstep(.7,1.,heat));
 gl_FragColor=vec4(color,alpha*.9);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}
`;

export function createRealisticTorch(parent,{position=[0,3,0],rotationY=0,intensity=45,seed=1,interactive=false}={}){
 materials();
 const root=new THREE.Group();root.name='Antorcha de hierro y madera con fuego animado';root.position.set(...position);root.rotation.y=rotationY;if(interactive)root.userData.spellTarget='torch';parent.add(root);
 function mesh(geometry,material,x,y,z){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;root.add(m);return m;}
 // Forged wall plate, rivets, bent support, charred stave and iron basket.
 const plate=mesh(new THREE.BoxGeometry(.19,.38,.045),ironMaterial,0,-.48,-.2);
 for(const y of [-.62,-.35])mesh(new THREE.SphereGeometry(.022,10,8),ironMaterial,0,y,-.168);
 const support=new THREE.CatmullRomCurve3([new THREE.Vector3(0,-.58,-.18),new THREE.Vector3(0,-.68,-.02),new THREE.Vector3(0,-.56,.055)]);
 mesh(new THREE.TubeGeometry(support,16,.022,8,false),ironMaterial,0,0,0);
 const stem=mesh(new THREE.CylinderGeometry(.06,.045,.74,18,6),woodMaterial,0,-.43,.035);stem.rotation.x=-.055;
 mesh(new THREE.CylinderGeometry(.09,.066,.2,20,3),sootMaterial,0,-.025,.02);
 for(let i=0;i<4;i++){const ring=mesh(new THREE.TorusGeometry(.071+i*.005,.009,8,28),ironMaterial,0,-.16+i*.043,.022);ring.rotation.x=Math.PI/2;}
 for(let i=0;i<7;i++){const angle=i/7*Math.PI*2;mesh(new THREE.CylinderGeometry(.007,.01,.22,8),ironMaterial,Math.sin(angle)*.085,-.055,Math.cos(angle)*.085+.02);}
 const geometry=new THREE.PlaneGeometry(.72,1.12);
 const material=new THREE.ShaderMaterial({vertexShader,fragmentShader,uniforms:{uTime:{value:0},uSeed:{value:seed}},transparent:true,depthWrite:false,side:THREE.FrontSide});
 const flame=new THREE.Mesh(geometry,material);flame.name='Llama animada';flame.position.z=.02;flame.renderOrder=2;flame.frustumCulled=false;root.add(flame);
 const light=new THREE.PointLight(0xffb25b,intensity,18,2);light.position.set(0,.2,.22);root.add(light);
 const emberPositions=new Float32Array(9*3),emberGeometry=new THREE.BufferGeometry();emberGeometry.setAttribute('position',new THREE.BufferAttribute(emberPositions,3));
 const emberMaterial=new THREE.PointsMaterial({color:0xffa13c,map:emberTexture,transparent:true,opacity:.9,size:.035,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
 const embers=new THREE.Points(emberGeometry,emberMaterial);embers.name='Brasas ascendentes';embers.frustumCulled=false;root.add(embers);
 const smoke=Array.from({length:3},()=>{const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:smokeTexture,color:0x51463c,transparent:true,opacity:.13,depthWrite:false}));sprite.name='Humo tenue de la antorcha';root.add(sprite);return sprite;});
 // The volume and smoke must not intercept the torch's interaction or other rays.
 for(const object of [flame,embers,...smoke])object.raycast=()=>{};
 let age=seed*.731;
 function update(dt){
  age+=dt;material.uniforms.uTime.value=age;
  const pulse=Math.sin(age*7.1+seed)*.08+Math.sin(age*13.73+seed*3)*.055+Math.sin(age*23.91)*.025;
  light.intensity=intensity*(.96+pulse);light.color.setRGB(1,.47+pulse*.3,.17+pulse*.15);light.position.x=Math.sin(age*5.7+seed)*.024;light.position.y=.19+Math.sin(age*8.3)*.025;
  for(let i=0;i<9;i++){const t=(age*(.18+i*.007)+i*.137)%1;emberPositions[i*3]=Math.sin(age*1.7+i*13)*(.025+t*.12);emberPositions[i*3+1]=.06+t*1.45;emberPositions[i*3+2]=.02+Math.cos(age*1.3+i*7)*(.025+t*.1);}
  emberGeometry.attributes.position.needsUpdate=true;
  for(let i=0;i<smoke.length;i++){const t=(age*.16+i/3)%1,s=.15+t*.47;smoke[i].position.set(Math.sin(age*.8+i)*t*.13,.65+t*.95,.015+Math.cos(age*.6+i)*t*.08);smoke[i].scale.set(s,s*1.2,1);smoke[i].material.opacity=Math.sin(t*Math.PI)*.12;smoke[i].material.rotation=age*.08+i;}
 }
 update(0);return {root,flame,light,update};
}
