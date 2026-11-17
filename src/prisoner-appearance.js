import * as THREE from 'three';

export function createPrisonerMaterials() {
	const size=256, color=new Uint8Array(size*size*4), relief=new Uint8Array(size*size*4);
	let seed=511;
	for(let y=0;y<size;y++)for(let x=0;x<size;x++){
		seed=(Math.imul(seed,1664525)+1013904223)>>>0;
		const grain=(seed>>>24)/255, variation=Math.sin(x*.06+Math.sin(y*.04))*3+Math.cos(y*.09)*2+(grain-.5)*10;
		const pore=grain<.08?-20:0,index=(y*size+x)*4;
		color.set([193+variation,151+variation*.8,125+variation*.65,255],index);
		const height=145+grain*24+pore;relief.set([height,height,height,255],index);
	}
	function texture(data){const t=new THREE.DataTexture(data,size,size);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=t.minFilter=THREE.LinearFilter;t.needsUpdate=true;return t;}
	const map=texture(color);map.colorSpace=THREE.SRGBColorSpace;
	const pores=texture(relief);
	const skin=new THREE.MeshPhysicalMaterial({map,bumpMap:pores,bumpScale:.0018,roughness:.64,metalness:0,sheen:.12,sheenColor:0xc68972,sheenRoughness:.9});
	const shadedSkin=skin.clone();shadedSkin.color.set(0xb7a69e);shadedSkin.roughness=.77;
	const hair=new THREE.MeshStandardMaterial({color:0x30251f,roughness:.88,bumpMap:pores,bumpScale:.004});
	return {skin,shadedSkin,hair};
}

export function addPrisonerFace(person, {skin,shadedSkin,hair}) {
	const sphere=new THREE.SphereGeometry(1,40,28);
	function oval(material,x,y,z,sx,sy,sz){const m=new THREE.Mesh(sphere,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=m.receiveShadow=true;person.add(m);return m;}
	function line(points,radius,material){const m=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),20,radius,8,false),material);m.castShadow=true;person.add(m);return m;}
	const lips=new THREE.MeshStandardMaterial({color:0x94675b,roughness:.78});
	const creases=new THREE.MeshStandardMaterial({color:0x695045,roughness:.95});
	const eyeWhite=new THREE.MeshPhysicalMaterial({color:0xd8cfc0,roughness:.26,clearcoat:.3});
	const iris=new THREE.MeshStandardMaterial({color:0x6c7560,roughness:.36});
	const pupil=new THREE.MeshStandardMaterial({color:0x10100d,roughness:.25});
	const wet=new THREE.MeshBasicMaterial({color:0xeee4d0});
	oval(skin,0,1.665,-.006,.109,.151,.102);
	oval(skin,0,1.588,.026,.083,.076,.073);
	oval(skin,0,1.552,.064,.052,.028,.039);
	const lids=[],brows=[],eyes=[];
	for(const s of [-1,1]){
		oval(skin,s*.108,1.659,-.004,.023,.043,.021);
		oval(shadedSkin,s*.118,1.659,.01,.011,.027,.01);
		line([[s*.113,1.688,.014],[s*.127,1.674,.018],[s*.126,1.645,.015]],.004,skin);
		oval(shadedSkin,s*.045,1.68,.089,.034,.021,.016);
		const white=oval(eyeWhite,s*.043,1.682,.104,.025,.011,.009);eyes.push(white);
		const colored=oval(iris,s*.043,1.682,.112,.0085,.009,.0025);eyes.push(colored);
		const black=oval(pupil,s*.043,1.682,.114,.0038,.0055,.0015);eyes.push(black);
		eyes.push(oval(wet,s*.041,1.685,.115,.0018,.0018,.001));
		line([[s*.019,1.682,.105],[s*.043,1.693,.107],[s*.067,1.681,.1]],.0032,skin);
		line([[s*.02,1.678,.105],[s*.043,1.673,.108],[s*.066,1.677,.1]],.0026,shadedSkin);
		const lid=oval(skin,s*.043,1.686,.111,.026,.012,.004);lid.visible=false;lids.push(lid);
		const brow=oval(hair,s*.044,1.708,.096,.028,.0045,.006);brow.rotation.z=s*.13;brows.push({mesh:brow,side:s});
		oval(skin,s*.068,1.64,.075,.036,.027,.027);
		oval(shadedSkin,s*.075,1.61,.055,.026,.035,.016);
		oval(skin,s*.015,1.64,.12,.014,.013,.015);
		oval(creases,s*.013,1.637,.132,.006,.0035,.004);
		line([[s*.023,1.632,.116],[s*.035,1.612,.103],[s*.041,1.593,.09]],.0018,shadedSkin);
		line([[s*.025,1.714,.099],[s*.048,1.72,.088],[s*.067,1.716,.079]],.0014,shadedSkin);
	}
	oval(skin,0,1.671,.102,.014,.04,.023);
	oval(skin,0,1.646,.127,.018,.016,.018);
	const upperLip=oval(lips,0,1.606,.101,.031,.005,.006);
	const lowerLip=oval(lips,0,1.595,.103,.029,.006,.006);
	const seam=oval(creases,0,1.601,.106,.03,.0015,.002);
	const mouth=oval(new THREE.MeshStandardMaterial({color:0x261611,roughness:.95}),0,1.59,.108,.024,.03,.009);
	mouth.name='screaming-mouth';mouth.visible=false;
	// Fine stubble breaks up the jaw silhouette without a solid beard shell.
	for(let i=0;i<110;i++){
		const angle=(i*2.39996)%(Math.PI*2),y=1.555+(i%11)*.0048;
		const x=Math.sin(angle)*(.048+(y-1.555)*.4),z=.061+Math.cos(angle)*.028;
		if(z<.052||Math.abs(x)<.032&&y>1.588)continue;
		oval(hair,x,y,z,.0012,.0025,.0012);
	}
	const scalp=new THREE.Mesh(new THREE.SphereGeometry(1,40,28,0,Math.PI*2,0,1.55),hair);scalp.position.set(0,1.691,-.016);scalp.scale.set(.113,.128,.106);person.add(scalp);
	for(let i=0;i<42;i++){
		const a=i/42*Math.PI*2,y=1.737+Math.sin(i*3)*.016;
		const lock=oval(hair,Math.sin(a)*.1,y,Math.cos(a)*.08-.018,.012,.045,.012);lock.rotation.z=Math.sin(a)*.4;
	}
	let age=0,headMissing=false;
	return dt=>{
		age+=dt;
		if(person.userData.dead&&person.userData.headParts?.every(part=>!part.visible))headMissing=true;
		if(headMissing)return;
		const dead=!!person.userData.dead, pain=!!person.userData.batBiting||mouth.visible||!!person.userData.waistGrabOwner||!!person.userData.sebastianArrowHits||!!person.userData.denisBiting;
		const phase=age%4.1,blink=!!person.userData.sleeping||!person.userData.haloEyesOpen&&(dead||phase>3.96);
		lids.forEach(lid=>{lid.visible=blink;});eyes.forEach(eye=>{eye.visible=!blink;});
		brows.forEach(({mesh,side})=>{mesh.position.y=1.708+(pain?.006:0);mesh.rotation.z=side*(pain?.32:.13+Math.sin(age*.8)*.035);});
		upperLip.visible=lowerLip.visible=seam.visible=!mouth.visible;
		lowerLip.position.y=1.595+(pain?-.003:Math.sin(age*1.7)*.0005);
	};
}
