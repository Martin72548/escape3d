import * as THREE from 'three';

function createSpider(index) {
	const root=new THREE.Group();root.name=`Arana ${index+1}`;root.userData.spellTarget='spider';root.scale.setScalar(1.35);
	const shell=new THREE.MeshStandardMaterial({color:0x30251f,roughness:.66});
	const joints=new THREE.MeshStandardMaterial({color:0x49372a,roughness:.85});
	function oval(parent,x,y,z,sx,sy,sz,material=shell){const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),material);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;}
	oval(root,0,.025,-.15,.17,.12,.23);oval(root,0,0,.12,.12,.085,.13);
	const eye=new THREE.MeshStandardMaterial({color:0x110c09,roughness:.15});
	for(const side of [-1,1])for(let i=0;i<3;i++)oval(root,side*(.025+i*.025),.035+i*.005,.22-i*.008,.012,.014,.012,eye);
	const legs=[];
	for(const side of [-1,1])for(let i=0;i<4;i++){
		const pivot=new THREE.Group();pivot.position.set(side*.08,0,.16-i*.085);root.add(pivot);
		const knee=new THREE.Vector3(side*.22,.09,.18-i*.12),foot=new THREE.Vector3(side*.36,-.14,.28-i*.19);
		for(const [a,b] of [[new THREE.Vector3(),knee],[knee,foot]]){
			const direction=b.clone().sub(a);const bone=new THREE.Mesh(new THREE.CylinderGeometry(.012,.017,direction.length(),7),joints);bone.position.copy(a).add(b).multiplyScalar(.5);bone.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());pivot.add(bone);
		}
		oval(pivot,knee.x,knee.y,knee.z,.024,.024,.024,joints);legs.push({pivot,side,phase:(i%2+(side<0?1:0))*Math.PI});
	}
	const thread=new THREE.Mesh(new THREE.CylinderGeometry(.004,.004,1,5),new THREE.MeshBasicMaterial({color:0xa9a59d,transparent:true,opacity:.5}));thread.name='Hilo de arana';
	return {root,legs,thread,index,age:0,phase:0,target:new THREE.Vector3(),normal:new THREE.Vector3(0,1,0),side:index%4,defeated:false,targeted:false};
}

export function createSpiderEncounter(scene) {
	const spiders=[];let spawned=false,seed=915;
	const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
	const forward=new THREE.Vector3(),right=new THREE.Vector3(),up=new THREE.Vector3(),basis=new THREE.Matrix4(),quaternion=new THREE.Quaternion();
	function wallPoint(spider,height,along,margin=9.72){
		if(spider.side===0){spider.target.set(-margin,height,along);spider.normal.set(1,0,0);}
		if(spider.side===1){spider.target.set(margin,height,along);spider.normal.set(-1,0,0);}
		if(spider.side===2){spider.target.set(along,height,-margin);spider.normal.set(0,0,1);}
		if(spider.side===3){spider.target.set(along,height,margin);spider.normal.set(0,0,-1);}
	}
	function nextTarget(spider){
		const phase=spider.phase++%7;
		if(phase<2){spider.target.set((random()-.5)*16,.2,(random()-.5)*16);spider.normal.set(0,1,0);}
		if(phase===2){spider.along=(random()-.5)*15;wallPoint(spider,.2,spider.along);spider.normal.set(0,1,0);}
		if(phase===3){spider.height=2.5+random()*2.5;wallPoint(spider,spider.height,spider.along);}
		if(phase===4){spider.along=-spider.along;wallPoint(spider,spider.height,spider.along);}
		if(phase===5)wallPoint(spider,.2,spider.along);
		if(phase===6){wallPoint(spider,.2,spider.along,8.8);spider.normal.set(0,1,0);spider.side=(spider.side+1)%4;}
	}
	function spawn(){
		if(spawned)return;spawned=true;
		for(let i=0;i<10;i++){
			const spider=createSpider(i);spider.root.position.set((random()-.5)*15,5.65,(random()-.5)*15);scene.add(spider.root,spider.thread);spiders.push(spider);nextTarget(spider);
		}
	}
	function update(dt){
		for(const spider of spiders){
			if(spider.defeated||spider.targeted)continue;spider.age+=dt;
			const fallTime=Math.max(0,spider.age-spider.index*.085),height=Math.max(.2,5.65-4.9*fallTime*fallTime);
			if(height>.2){
				spider.root.position.y=height;spider.thread.visible=true;spider.thread.position.set(spider.root.position.x,(5.9+height)/2,spider.root.position.z);spider.thread.scale.y=5.9-height;
			}else{
				spider.thread.visible=false;
				let remaining=dt*(4.5+(spider.index%3)*.35);
				for(let step=0;step<8&&remaining>0;step++){
					forward.copy(spider.target).sub(spider.root.position);const distance=forward.length();
					if(distance<.001){nextTarget(spider);continue;}
					forward.divideScalar(distance);const travel=Math.min(remaining,distance);spider.root.position.addScaledVector(forward,travel);remaining-=travel;
					right.crossVectors(spider.normal,forward);
					if(right.lengthSq()>.00001){right.normalize();up.crossVectors(forward,right).normalize();basis.makeBasis(right,up,forward);quaternion.setFromRotationMatrix(basis);spider.root.quaternion.slerp(quaternion,1-Math.exp(-16*dt));}
				}
			}
			for(const leg of spider.legs){const gait=spider.age*34+leg.phase;leg.pivot.rotation.y=Math.sin(gait)*.3;leg.pivot.rotation.z=leg.side*Math.max(0,Math.cos(gait))*.25;}
		}
	}
	function target(root){const spider=spiders.find(s=>s.root===root);if(!spider||spider.defeated||spider.targeted)return false;spider.targeted=true;return true;}
	function release(root){const spider=spiders.find(s=>s.root===root);if(spider&&!spider.defeated)spider.targeted=false;}
	function defeat(root){const spider=spiders.find(s=>s.root===root);if(!spider||spider.defeated)return;spider.defeated=true;spider.targeted=false;root.visible=false;spider.thread.visible=false;}
	return {spawn,update,target,release,defeat,spiders};
}
