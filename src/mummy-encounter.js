import { spawnWallFragments } from './wall-fragments.js';
import { wallBricksSound } from './falling-bricks-sound.js';
import { holdMummyNeck } from './mummy-neck-grab.js';
import { createRecordedMaleScream } from './recorded-male-scream.js';
import { createWaistGrab } from './waist-grab.js';
import * as THREE from 'three';
import { createMummyModel } from './mummy-model.js';

export function createMummyEncounter(scene, prisoner) {
	let triggered=false,age=0,mummy=null;
	let hits=0,knockdown=null;
	const clouds=[];
	function emitCloud(dust=false){
		mummy.root.updateWorldMatrix(true,true);
		const count=dust?180:18;
		const geometry=dust?new THREE.IcosahedronGeometry(1,0):new THREE.SphereGeometry(1,10,8);
		const material=new THREE.MeshBasicMaterial({color:dust?0xc4b28b:0x737078,transparent:true,opacity:dust?.85:.4,depthWrite:false});
		const mesh=new THREE.InstancedMesh(geometry,material,count);
		mesh.name=dust?'Polvo de la momia llevado por el aire':'Humo del primer impacto a la momia';
		const particles=Array.from({length:count},()=>({
			position:mummy.root.localToWorld(new THREE.Vector3((Math.random()-.5)*.5,.12+Math.random()*1.6,(Math.random()-.5)*.3)),
			velocity:new THREE.Vector3((dust?1.2:.1)+Math.random()*.7,.25+Math.random()*.6,(Math.random()-.5)*.6),
			size:dust?.018+Math.random()*.03:.16+Math.random()*.2
		}));
		const dummy=new THREE.Object3D();
		for(let i=0;i<count;i++){dummy.position.copy(particles[i].position);dummy.scale.setScalar(particles[i].size);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}
		mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();scene.add(mesh);
		clouds.push({mesh,particles,age:0,duration:dust?3.5:1.8,dust,dummy});
	}
	const grab=createWaistGrab(prisoner,createRecordedMaleScream,{backArch:.08});
	const debris=[],matrix=new THREE.Matrix4(),position=new THREE.Vector3(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3(),direction=new THREE.Vector3();
	function validPoint(point) { return Math.abs(point.z-10)<.6 && Math.abs(point.x)<=9 && point.y<3.5; }
	function breakWall(point) {
		if(triggered||!validPoint(point))return;
		triggered=true;age=0;wallBricksSound.play(); spawnWallFragments(scene,point);
		const centerX=THREE.MathUtils.clamp(point.x,-8,8);
		scene.updateMatrixWorld(true);
		scene.traverse(wall=>{
			if(!wall.isInstancedMesh||wall.userData.spellTarget!=='mummy-wall')return;
			for(let i=0;i<wall.count;i++) {
				wall.getMatrixAt(i,matrix);const world=new THREE.Matrix4().multiplyMatrices(wall.matrixWorld,matrix);world.decompose(position,rotation,scale);
				if(Math.abs(position.x-centerX)>1.2||position.y>3.4)continue;
				const block=new THREE.Mesh(wall.geometry,wall.material);block.position.copy(position);block.quaternion.copy(rotation);block.scale.copy(scale);block.castShadow=block.receiveShadow=true;
				debris.push({block,velocity:new THREE.Vector3(((i%5)-2)*.4,.3+(i%3)*.25,-1.1-(i%4)*.3),spin:.8+(i%3),settled:false});
				matrix.elements[14]-=4;wall.setMatrixAt(i,matrix);
			}
			wall.instanceMatrix.needsUpdate=true;wall.computeBoundingBox();wall.computeBoundingSphere();
		});
		debris.forEach(piece=>scene.add(piece.block));
		const hole=new THREE.Mesh(new THREE.PlaneGeometry(2.7,3.5),new THREE.MeshBasicMaterial({color:0x000000,fog:false,toneMapped:false}));hole.name='Brecha de la momia';hole.position.set(centerX,1.75,9.97);hole.rotation.y=Math.PI;scene.add(hole);
		mummy=createMummyModel();mummy.root.userData.spellTarget='mummy';mummy.root.position.set(centerX,.03,10.5);mummy.root.rotation.y=Math.PI;mummy.root.visible=false;scene.add(mummy.root);
	}
	function update(dt) {
		for(let i=clouds.length-1;i>=0;i--){
			const cloud=clouds[i];cloud.age+=dt;
			cloud.mesh.material.opacity=(cloud.dust?.85:.4)*Math.max(0,1-cloud.age/cloud.duration);
			cloud.particles.forEach((p,index)=>{
				p.position.addScaledVector(p.velocity,dt);
				if(cloud.dust){p.position.x+=Math.sin(cloud.age*3+index)*dt*.16;p.position.y+=Math.sin(cloud.age*4+index)*dt*.08;}
				cloud.dummy.position.copy(p.position);cloud.dummy.rotation.set(cloud.age+index,cloud.age*.7,0);
				cloud.dummy.scale.setScalar(p.size*(cloud.dust?1:1+cloud.age*.9));cloud.dummy.updateMatrix();cloud.mesh.setMatrixAt(index,cloud.dummy.matrix);
			});
			cloud.mesh.instanceMatrix.needsUpdate=true;cloud.mesh.computeBoundingSphere();
			if(cloud.age>=cloud.duration){scene.remove(cloud.mesh);cloud.mesh.geometry.dispose();cloud.mesh.material.dispose();clouds.splice(i,1);}
		}
		if(!triggered)return;age+=dt;
		for(const piece of debris) {
			if(piece.settled)continue;
			piece.velocity.y-=9.8*dt;piece.block.position.addScaledVector(piece.velocity,dt);piece.block.rotation.x+=piece.spin*dt;piece.block.rotation.z+=dt;
			const floor=Math.max(.15,piece.block.scale.y*.35);
			if(piece.block.position.y<floor){piece.block.position.y=floor;piece.velocity.multiplyScalar(.35);piece.velocity.y=Math.abs(piece.velocity.y)*.35;if(piece.velocity.length()<.6||age>3)piece.settled=true;}
		}
		if(mummy.defeated)return;
        if(knockdown){
            knockdown.age+=dt;const t=knockdown.age;
            const fall=THREE.MathUtils.smoothstep(t,0,.55);
            const rise=THREE.MathUtils.smoothstep(t,1.15,2.65);
            const amount=fall*(1-rise),angle=amount*Math.PI/2;
            // Roll around the feet, keeping the side of the body above the floor.
            const offset=new THREE.Vector3(-.55*amount,0,0).applyQuaternion(knockdown.rotation);
            mummy.root.position.copy(knockdown.position).add(offset);
            mummy.root.position.y=.03+Math.sin(angle)*.30;
            mummy.root.quaternion.copy(knockdown.rotation).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),angle));
            const pushUp=Math.sin(rise*Math.PI)*fall;
            mummy.legs.forEach((leg,i)=>leg.rotation.x=pushUp*(i===0?-.65:.25));
            mummy.knees.forEach(knee=>knee.rotation.x=pushUp*1.15);
            mummy.arms.forEach((arm,i)=>{arm.rotation.x=-.3*amount-pushUp*.6;arm.rotation.z=(i===0?-.55:.25)*amount;arm.userData.elbow.rotation.y=0;});
            mummy.head.rotation.z=-.035+amount*.12;
            mummy.strips.forEach((strip,i)=>strip.rotation.x=Math.sin(t*12+i)*.18*amount);
            if(t>=2.65){
                mummy.root.position.copy(knockdown.position);mummy.root.position.y=.03;
                direction.copy(prisoner.position).sub(mummy.root.position);
                mummy.root.rotation.set(0,Math.atan2(direction.x,direction.z),0);
                mummy.legs.forEach(leg=>leg.rotation.set(0,0,0));mummy.knees.forEach(knee=>knee.rotation.set(0,0,0));
                mummy.arms.forEach(arm=>arm.rotation.set(0,0,0));mummy.head.rotation.z=-.035;knockdown=null;
            }
            return;
        }
		if(mummy.targeted)return;
		if(age<.6)return;mummy.root.visible=true;
		let running=true;
		if(age<1.2)mummy.root.position.z=THREE.MathUtils.lerp(10.5,8.8,THREE.MathUtils.smoothstep(age,.6,1.2));
		else {
			direction.copy(prisoner.position).sub(mummy.root.position);direction.y=0;const distance=direction.length();running=distance>.9;
			if(distance>.001)mummy.root.rotation.set(0,Math.atan2(direction.x,direction.z),0);
            if(running){direction.normalize();mummy.root.position.addScaledVector(direction,Math.min(distance-.9,3.2*dt));}
		}
		mummy.legs.forEach((leg,i)=>leg.rotation.x=running?Math.sin(age*13+i*Math.PI)*.6:0);
		mummy.arms.forEach((arm,i)=>{arm.rotation.x=running?Math.sin(age*13+i*Math.PI)*.28:-.12;arm.rotation.z=(i===0?-1:1)*.1;});
		mummy.strips.forEach((strip,i)=>strip.rotation.x=Math.sin(age*17+i)*.25);
		mummy.root.position.y=.03+(running?Math.abs(Math.sin(age*13))*.075:0);
		if(age>1.2 && mummy.root.position.distanceTo(prisoner.position)<.92) grab.begin(mummy);
		grab.update(dt);
        if(grab.active)holdMummyNeck(mummy,prisoner);
	}
	function target(root) {
		if(!mummy||mummy.root!==root||mummy.defeated||mummy.targeted||!root.visible)return false;
		mummy.targeted=true;grab.end();return true;
	}
	function release(root) {if(mummy&&mummy.root===root&&!mummy.defeated)mummy.targeted=false;}
	function defeat(root) {
		if(!mummy||mummy.root!==root||mummy.defeated)return;
		grab.end();mummy.targeted=false;hits++;
		if(hits===1){emitCloud();return;}
		if(hits===2){knockdown={age:0,position:root.position.clone(),rotation:root.quaternion.clone()};return;}
		emitCloud(true);mummy.defeated=true;root.visible=false;knockdown=null;
	}
	return {breakWall,update,target,release,defeat,releaseGrab:grab.end,validPoint,unlockAudio:grab.unlockAudio,get hits(){return hits;},get grabbing(){return grab.active;},get triggered(){return triggered;},get mummy(){return mummy;},debris};
}
