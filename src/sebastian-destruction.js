import { stoneFloorHeight } from './stone-floor.js';
import { statueExplosionSound } from './statue-explosion-sound.js';
import * as THREE from 'three';

export function createSebastianDestruction(scene,figure,statue) {
	let hits=0,exploded=false,age=0,light=null;
	const dropped=[],fragments=[],particles=[];
	const stoneGeometry=new THREE.IcosahedronGeometry(1,0),puffGeometry=new THREE.SphereGeometry(1,10,8),bounds=new THREE.Box3();
	function drop(part,side){
		scene.updateMatrixWorld(true);scene.attach(part);
		part.traverse(object=>{object.raycast=()=>{};});
		dropped.push({part,age:0,rest:false,velocity:new THREE.Vector3(side*1.5,1.2,1.7),spin:new THREE.Vector3(2,side,1.4)});
	}
	function explode(){
		statueExplosionSound.play();exploded=true;bounds.setFromObject(figure);figure.visible=false;
		const center=bounds.getCenter(new THREE.Vector3());
		for(let i=0;i<85;i++){
			const radius=.035+Math.random()*.08,mesh=new THREE.Mesh(stoneGeometry,statue.material);
			mesh.name='Fragmento de piedra de San Sebastian';mesh.position.set(THREE.MathUtils.lerp(bounds.min.x,bounds.max.x,Math.random()),THREE.MathUtils.lerp(bounds.min.y,bounds.max.y,Math.random()),THREE.MathUtils.lerp(bounds.min.z,bounds.max.z,Math.random()));
			mesh.scale.set(radius,radius*(.7+Math.random()),radius);mesh.castShadow=mesh.receiveShadow=true;mesh.raycast=()=>{};scene.add(mesh);
			const angle=i*2.39996,speed=2+Math.random()*5;
			fragments.push({mesh,radius,rest:false,velocity:new THREE.Vector3(Math.sin(angle)*speed,2+Math.random()*5,Math.cos(angle)*speed)});
		}
		for(let i=0;i<80;i++){
			const fire=i<42,material=new THREE.MeshBasicMaterial({color:fire?(i%2?0xffd000:0xffa800):0x605b53,transparent:true,opacity:fire?.95:.55,depthWrite:false});
			const mesh=new THREE.Mesh(puffGeometry,material);mesh.name=fire?'Fuego amarillo de San Sebastian':'Humo de San Sebastian';mesh.position.copy(center).add(new THREE.Vector3((Math.random()-.5)*1.2,(Math.random()-.5)*1.4,(Math.random()-.5)*.8));mesh.raycast=()=>{};scene.add(mesh);
			particles.push({mesh,fire,age:0,life:fire?.7+Math.random()*.8:2.5+Math.random(),size:.12+Math.random()*.22,velocity:new THREE.Vector3((Math.random()-.5)*2,1+Math.random()*2,(Math.random()-.5)*2)});
		}
		light=new THREE.PointLight(0xffd000,35,9);light.position.copy(center);scene.add(light);
	}
	function hit(){
		if(exploded)return false;
		hits++;
		if(hits===1)drop(statue.head,1);
		else if(hits===2)drop(statue.legs[1],-1);
		else explode();
		return true;
	}
	function update(dt){
		for(const piece of dropped){
			if(piece.rest)continue;
			piece.age+=dt;piece.velocity.y-=12*dt;piece.part.position.addScaledVector(piece.velocity,dt);
			piece.part.rotation.x+=piece.spin.x*dt;piece.part.rotation.y+=piece.spin.y*dt;piece.part.rotation.z+=piece.spin.z*dt;
			bounds.setFromObject(piece.part);
			// The plinth remains a solid support while pieces tumble off its edge.
			const onPlinth=Math.abs(piece.part.position.x-figure.parent.position.x)<.78&&Math.abs(piece.part.position.z-figure.parent.position.z)<.78;
			const floor=.025;
			if(bounds.min.y<floor){piece.part.position.y+=floor-bounds.min.y;piece.velocity.multiplyScalar(.3);piece.velocity.y=Math.abs(piece.velocity.y);piece.spin.multiplyScalar(.5);if(piece.age>2.5||piece.velocity.length()<.35)piece.rest=true;}
		}
		for(const piece of fragments){
			if(piece.rest)continue;piece.velocity.y-=12*dt;piece.mesh.position.addScaledVector(piece.velocity,dt);piece.mesh.rotation.x+=dt*5;piece.mesh.rotation.z+=dt*3;
			piece.mesh.position.x=THREE.MathUtils.clamp(piece.mesh.position.x,-9.7,9.7);piece.mesh.position.z=THREE.MathUtils.clamp(piece.mesh.position.z,-9.7,9.7);
			const onPlinth=Math.abs(piece.mesh.position.x-figure.parent.position.x)<.85&&Math.abs(piece.mesh.position.z-figure.parent.position.z)<.85;
			const floor=stoneFloorHeight(piece.mesh);
			if(piece.mesh.position.y<floor){piece.mesh.position.y=floor;piece.velocity.multiplyScalar(.35);piece.velocity.y=Math.abs(piece.velocity.y);if(piece.velocity.length()<.5)piece.rest=true;}
		}
		for(let i=particles.length-1;i>=0;i--){
			const p=particles[i];p.age+=dt;p.mesh.position.addScaledVector(p.velocity,dt);const size=p.size*(1+p.age);p.mesh.scale.set(p.fire?size*.6:size,p.fire?size*2.3:size,p.fire?size*.6:size);p.mesh.material.opacity=(p.fire?.95:.55)*Math.max(0,1-p.age/p.life);
			if(p.age>=p.life){p.mesh.removeFromParent();p.mesh.material.dispose();particles.splice(i,1);}
		}
		if(light){age+=dt;light.intensity=35*Math.max(0,1-age/1.6);if(age>=1.6){light.removeFromParent();light.dispose();light=null;}}
	}
	return {hit,update,dropped,fragments,particles,get hits(){return hits;},get exploded(){return exploded;}};
}
