import { createToadTongueAttack } from './toad-tongue-attack.js';
import { createToadCroakLoop } from './toad-croak-loop.js';
import { updateToadWaterRoutine } from './toad-water-routine.js';
import * as THREE from 'three';

export function createToad(white=false) {
 const root=new THREE.Group();root.name=white?'Sapo verde 2':'Sapo verde 1';root.userData.spellTarget='toad';
 let seed=white?975:416;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(256,256);
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){
  const patch=Math.sin(x*.08+Math.sin(y*.1)*2)*Math.sin(y*.12)+Math.sin(x*.21-y*.14)*.3,grain=(random()-.5)*14;
  pixels.data.set([60+patch*14+grain,100+patch*21+grain+(white?8:0),38+patch*12+grain,255],(y*256+x)*4);
 }ctx.putImageData(pixels,0,0);
 for(let i=0;i<140;i++){ctx.fillStyle=i%3?'rgba(30,52,18,.36)':'rgba(169,172,88,.35)';ctx.beginPath();ctx.ellipse(random()*256,random()*256,2+random()*6,2+random()*4,random()*3,0,Math.PI*2);ctx.fill();}
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;
 const skin=new THREE.MeshPhysicalMaterial({map,bumpMap:map,bumpScale:.014,roughness:.77,clearcoat:.08,clearcoatRoughness:.65});
 const belly=new THREE.MeshStandardMaterial({color:white?0xb3b17a:0x9c9e69,roughness:.87});
 const dark=new THREE.MeshStandardMaterial({color:0x28381c,roughness:.85}),wartMaterial=new THREE.MeshStandardMaterial({color:white?0x708440:0x536a2d,roughness:.95});
 const sphere=new THREE.SphereGeometry(1,24,16);
 function oval(parent,material,x,y,z,sx,sy,sz){const mesh=new THREE.Mesh(sphere,material);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 oval(root,skin,0,.28,-.06,.37,.25,.44);oval(root,belly,0,.16,.04,.30,.12,.34);
 for(let i=0;i<65;i++){
  const angle=random()*Math.PI*2,height=.2+random()*.8,radius=.013+random()*.023,spread=Math.sqrt(1-height*height);
  oval(root,wartMaterial,Math.cos(angle)*.36*spread,.28+height*.25,Math.sin(angle)*.43*spread-.06,radius,radius*.65,radius);
 }
 const headStart=root.children.length;
 oval(root,skin,0,.32,.29,.32,.18,.28);oval(root,belly,0,.25,.39,.26,.075,.19);
 const eyeMaterial=new THREE.MeshPhysicalMaterial({color:0xc7a94f,roughness:.24,clearcoat:.9}),pupil=new THREE.MeshBasicMaterial({color:0x11150c}),shine=new THREE.MeshBasicMaterial({color:0xe8f2ce});
 for(const side of [-1,1]){
  oval(root,skin,side*.225,.45,.33,.12,.12,.13);
  oval(root,eyeMaterial,side*.225,.475,.407,.083,.072,.058);oval(root,pupil,side*.225,.48,.461,.061,.014,.012);oval(root,shine,side*.209,.505,.461,.014,.012,.009);
  oval(root,dark,side*.085,.369,.545,.011,.009,.006);
  oval(root,wartMaterial,side*.302,.337,.19,.025,.065,.065);
  for(let i=0;i<5;i++)oval(root,wartMaterial,side*(.1+i*.037),.42-i*.008,.31+(i%2)*.06,.017,.012,.019);
 }
 const smile=new THREE.CatmullRomCurve3([new THREE.Vector3(-.26,.275,.43),new THREE.Vector3(-.14,.265,.54),new THREE.Vector3(0,.26,.565),new THREE.Vector3(.14,.265,.54),new THREE.Vector3(.26,.275,.43)]);
 root.add(new THREE.Mesh(new THREE.TubeGeometry(smile,24,.005,5,false),dark));
 const headParts=root.children.slice(headStart),head=new THREE.Group();head.position.set(0,.3,.28);head.name='Cabeza del sapo al beber';root.add(head);root.updateMatrixWorld(true);headParts.forEach(part=>head.attach(part));
 const legs=[];
 for(const side of [-1,1])for(const front of [-1,1]){
  const leg=new THREE.Group();leg.position.set(side*.235,.245,front*.22);root.add(leg);
  if(front<0){oval(leg,skin,side*.11,-.015,-.035,.16,.13,.20);oval(leg,skin,side*.16,-.115,.025,.075,.11,.11);}
  else{const upper=oval(leg,skin,side*.025,-.07,.015,.055,.11,.065);upper.rotation.z=side*.25;oval(leg,skin,side*.055,-.16,.055,.043,.085,.055);}
  const footX=side*(front<0?.12:.07),footZ=front<0?.15:.09;
  oval(leg,skin,footX,-.21,footZ,.065,.025,.08);
  const toes=front>0?4:5;
  for(let i=0;i<toes;i++){
   const spread=(i-(toes-1)/2)*.037,end=new THREE.Vector3(footX+spread*1.6,-.225,footZ+.1+(.08-Math.abs(spread)));
   const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(footX+spread*.3,-.21,footZ),new THREE.Vector3(footX+spread,-.22,footZ+.075),end]);
   const toe=new THREE.Mesh(new THREE.TubeGeometry(curve,8,.009,5,false),skin);toe.castShadow=true;leg.add(toe);oval(leg,skin,end.x,end.y,end.z,.011,.008,.014);
  }
  legs.push({leg,front});
 }
 // This empty balance control preserves the encounter's existing jump and drinking timing.
 const tail=new THREE.Group();root.add(tail);root.scale.setScalar(1.08);
 return {root,legs,tail,head,white,defeated:false,targeted:false,age:0,phase:0,route:0,start:new THREE.Vector3(),end:new THREE.Vector3(),duration:1,height:1,drinkInterval:4,nextDrinkAt:4,drinkCount:0,state:'jumping'};
}

export function createCatEncounter(scene, prisoner) {
 const tongueAttack=createToadTongueAttack(scene,prisoner);
	const cats=[],croak=createToadCroakLoop();let spawned=false,seed=491;
 function syncSound(){if(cats.some(toad=>!toad.defeated&&toad.root.visible))croak.start();else croak.stop();}
	const speedMultiplier=2*.95;
	const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
	function nextJump(cat){
		cat.start.copy(cat.root.position).setY(.03);
		const angle=random()*Math.PI*2,distance=2+random()*3.5;
		cat.end.set(THREE.MathUtils.clamp(cat.start.x+Math.sin(angle)*distance,-8.5,8.5),.03,THREE.MathUtils.clamp(cat.start.z+Math.cos(angle)*distance,-8.5,8.5));
		if(cat.end.distanceTo(cat.start)<.7)cat.end.set(-cat.start.x*.75,.03,-cat.start.z*.75);
		cat.duration=THREE.MathUtils.clamp(cat.start.distanceTo(cat.end)/6,.4,.9)/speedMultiplier;cat.height=THREE.MathUtils.clamp(.22+cat.start.distanceTo(cat.end)*.075,.28,.65);cat.phase=0;
		cat.jumpYawFrom=cat.root.rotation.y;cat.jumpYawTo=cat.jumpYawFrom+Math.atan2(Math.sin(Math.atan2(cat.end.x-cat.start.x,cat.end.z-cat.start.z)-cat.jumpYawFrom),Math.cos(Math.atan2(cat.end.x-cat.start.x,cat.end.z-cat.start.z)-cat.jumpYawFrom));
	}
	function spawn(point){
		if(spawned)return;spawned=true;
		for(const white of [false,true]){
			const cat=createToad(white);
			cat.root.position.set(THREE.MathUtils.clamp(point.x+(white ? .4 : -.4),-8.5,8.5),.03,THREE.MathUtils.clamp(point.z,-8.5,8.5));
			scene.add(cat.root);cats.push(cat);
		}
		syncSound();
	}
	function update(dt){
		syncSound();
		const bowl=scene.getObjectByName('Cuenco grande con agua');
		const waterAvailable=bowl?.visible&&bowl.userData.spellTarget==='water-bowl';
		for(const cat of cats){
			if(cat.defeated || cat.targeted || cat.tongueAttacking)continue;
			cat.age+=dt;
			if(!waterAvailable&&cat.state!=='jumping'){
				cat.state='jumping';cat.head.rotation.x=0;cat.root.rotation.x=0;nextJump(cat);
			}
			if(waterAvailable&&(cat.state!=='jumping'||cat.age>=cat.nextDrinkAt)){
    if(updateToadWaterRoutine(cat,bowl))continue;
   }
			if(!cat.jumping){cat.jumping=true;nextJump(cat);}
			let remaining=dt;
   while(remaining>0){
    const step=Math.min(remaining,(1-cat.phase)*cat.duration);
    cat.phase=Math.min(1,cat.phase+step/cat.duration);remaining-=step;
    if(cat.phase>=1){cat.root.position.copy(cat.end);nextJump(cat);}
   }
   const phase=cat.phase,flight=THREE.MathUtils.clamp((phase-.12)/.74,0,1);
   const preparing=phase<.12,landing=phase>.86;
   const compression=preparing?Math.sin(phase/.12*Math.PI):landing?Math.sin((phase-.86)/.14*Math.PI):0;
   cat.root.position.lerpVectors(cat.start,cat.end,flight);
   // Ballistic arc: a steady horizontal flight with gravity-driven rise and fall.
   cat.root.position.y+=4*flight*(1-flight)*cat.height;
   cat.root.rotation.y=THREE.MathUtils.lerp(cat.jumpYawFrom,cat.jumpYawTo,THREE.MathUtils.smoothstep(phase,0,.12));
   cat.root.rotation.x=preparing?-.09*compression:landing?.1*compression:THREE.MathUtils.lerp(-.23,.16,flight);
   cat.root.scale.set(1.08*(1+compression*.035),1.08*(1-compression*.12),1.08*(1+compression*.025));
   cat.legs.forEach(({leg,front})=>{
    if(preparing||landing){leg.rotation.x=front*compression*.42;return;}
    // Hind legs extend on takeoff, fold in flight, then forelegs reach for the floor.
    leg.rotation.x=front<0?THREE.MathUtils.lerp(-.85,.62,THREE.MathUtils.smoothstep(flight,.06,.52)):
     THREE.MathUtils.lerp(.38,-.48,THREE.MathUtils.smoothstep(flight,.5,.95));
   });
   cat.tail.rotation.z=0;
		}
		tongueAttack.update(dt,cats);
	}
	function target(root){
		const cat=cats.find(cat=>cat.root===root);
		if(!cat || cat.defeated || cat.targeted || !root.visible)return false;
		cat.targeted=true;return true;
	}
	function release(root){
		const cat=cats.find(cat=>cat.root===root);
		if(cat && !cat.defeated)cat.targeted=false;
	}
	function defeat(root){
		const cat=cats.find(cat=>cat.root===root);
		if(!cat || cat.defeated)return;
		cat.defeated=true;cat.targeted=false;root.visible=false;syncSound();
	}
	return {spawn,update,cats,target,release,defeat,unlockAudio(){croak.unlock();tongueAttack.unlock();},stopAudio:croak.stop,get audioPlaying(){return croak.playing;}};
}
