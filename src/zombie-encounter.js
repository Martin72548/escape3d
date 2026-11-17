import { spawnWallFragments } from './wall-fragments.js';
import { wallBricksSound } from './falling-bricks-sound.js';
import { createRecordedMaleScream } from './recorded-male-scream.js';
import { createZombieFire } from './zombie-fire.js';
import { installZombieAppearance } from './zombie-appearance.js';
import { createZombieGrowl } from './zombie-growl.js';
import { createBlackSmoke } from './black-smoke.js';
import { createWaistGrab } from './waist-grab.js';
import { holdMummyNeck as holdZombieNeck } from './mummy-neck-grab.js';
import { createZombieVictimDeath } from './zombie-victim-death.js';
import * as THREE from 'three';

export function createZombie() {
	const root = new THREE.Group(); root.name = 'Zombi de la pared derecha';
	const skin = new THREE.MeshStandardMaterial({ color: 0x849174, roughness: 0.95 });
	const cloth = new THREE.MeshStandardMaterial({ color: 0x4a493e, roughness: 1 });
	const dark = new THREE.MeshStandardMaterial({ color: 0x2e3027, roughness: 1 });
	const eyes = new THREE.MeshStandardMaterial({ color: 0xc6c878, emissive: 0x787824, emissiveIntensity: 0.65 });
	function oval(parent, material, x, y, z, sx, sy, sz) {
		const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), material);
		mesh.position.set(x,y,z); mesh.scale.set(sx,sy,sz); mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh); return mesh;
	}
	oval(root, cloth, 0,1.05,0, .25,.35,.15);
	oval(root, skin, 0,1.41,0, .075,.12,.075);
	oval(root, skin, 0,1.6,0, .12,.17,.105);
	oval(root, dark, 0,1.54,.089, .068,.026,.017);
	for(const side of [-1,1]) {
		oval(root,dark,side*.045,1.63,.092,.037,.028,.014);
		oval(root,eyes,side*.045,1.63,.106,.018,.012,.008);
		oval(root,skin,side*.115,1.6,0,.022,.04,.022);
	}
	oval(root,skin,0,1.6,.111,.02,.038,.024);
	const legs=[], arms=[];
	for(const side of [-1,1]) {
		const leg=new THREE.Group();leg.position.set(side*.12,.83,0);root.add(leg);legs.push(leg);
		oval(leg,cloth,0,-.19,0,.09,.23,.09);oval(leg,skin,0,-.54,0,.063,.2,.065);oval(leg,dark,0,-.77,.065,.08,.045,.15);
		const arm=new THREE.Group();arm.position.set(side*.23,1.43,0);root.add(arm);arms.push(arm);
		oval(arm,cloth,side*.025,-.025,.16,.085,.085,.2);
		const elbow=new THREE.Group();elbow.position.set(side*.025,-.025,.32);arm.add(elbow);arm.userData.elbow=elbow;
		oval(elbow,skin,side*.02,-.03,.12,.057,.057,.17);
		oval(elbow,skin,side*.02,-.045,.32,.065,.03,.09);
		const hand=new THREE.Object3D();hand.name='Punto de agarre del zombi';hand.position.set(side*.02,0,.305);elbow.add(hand);arm.userData.hand=hand;
		for(let finger=0;finger<4;finger++)oval(elbow,skin,side*.02+(finger-1.5)*.026,-.06,.42,.012,.015,.07);
	}
	const head=new THREE.Group();head.name='Cabeza convulsiva del zombi';head.position.set(0,1.6,0);root.add(head);root.updateMatrixWorld(true);
	for(const part of [...root.children])if(part.isMesh&&part.position.y>1.44)head.attach(part);
	const torso=new THREE.Group();torso.name='Torso convulsivo del zombi';torso.position.y=1.05;root.add(torso);root.updateMatrixWorld(true);
	for(const part of [...root.children])if(part!==torso&&(part===head||arms.includes(part)||part.isMesh&&part.position.y>.84))torso.attach(part);
	root.scale.setScalar(1.85);
	const zombie={root,legs,arms,head,torso,ready:false,updateAppearance(){}};
	root.userData.appearanceReady=installZombieAppearance(zombie).catch(error=>console.warn('No se pudo cargar el zombi anatomico:',error));
	return zombie;
}

export function createZombieEncounter(scene, prisoner) {
	const dust = createBlackSmoke(scene);
	let triggered=false,age=0,zombie=null,hits=0,jaw=null,jawVelocity=new THREE.Vector3(0,0,.7);
	const fire=createZombieFire(scene);
	function dropJaw(){if(jaw||!zombie?.detachJaw)return;jaw=zombie.detachJaw(scene);}
	const victimDeath=createZombieVictimDeath(scene,prisoner);
	const grab=createWaistGrab(prisoner,createRecordedMaleScream,{backArch:.08,liftHeight:.55,killAfter:4,onDeath:victimDeath.begin,shakeBody:true});
	const growl=createZombieGrowl();let nextGrowl=.65;
	const debris=[], direction=new THREE.Vector3(),matrix=new THREE.Matrix4(),position=new THREE.Vector3(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3();
	function breakWall(point) {
		if(triggered)return;
		triggered=true; age=0; wallBricksSound.play(); spawnWallFragments(scene,point);
		const centerZ=THREE.MathUtils.clamp(point.z,-7,7);
		scene.updateMatrixWorld(true);
		scene.traverse(wall=>{
			if(!wall.isInstancedMesh||wall.userData.spellTarget!=='right-wall')return;
			for(let i=0;i<wall.count;i++) {
				wall.getMatrixAt(i,matrix);const world=new THREE.Matrix4().multiplyMatrices(wall.matrixWorld,matrix);world.decompose(position,rotation,scale);
				if(Math.abs(position.z-centerZ)>1.35||position.y>3.4)continue;
				const block=new THREE.Mesh(wall.geometry,wall.material);block.position.copy(position);block.quaternion.copy(rotation);block.scale.copy(scale);block.castShadow=block.receiveShadow=true;
				debris.push({block,velocity:new THREE.Vector3(-1.2-(i%4)*.35,.3+(i%3)*.25,((i%5)-2)*.35),spin:new THREE.Vector3(.8+(i%3),.6,1.2),settled:false});
				matrix.elements[14]-=4;wall.setMatrixAt(i,matrix);
			}
			wall.instanceMatrix.needsUpdate=true;wall.computeBoundingBox();wall.computeBoundingSphere();
		});
		debris.forEach(piece=>scene.add(piece.block));
		const hole=new THREE.Mesh(new THREE.PlaneGeometry(2.8,3.5),new THREE.MeshBasicMaterial({color:0x000000,fog:false,toneMapped:false}));
		hole.name='Brecha en la pared derecha';hole.rotation.y=-Math.PI/2;hole.position.set(9.97,1.75,centerZ);scene.add(hole);
		zombie=createZombie();zombie.root.userData.spellTarget='zombie';zombie.root.position.set(10.5,.03,centerZ);zombie.root.rotation.y=-Math.PI/2;zombie.root.visible=false;scene.add(zombie.root);
	}
	function update(dt) {
		dust.update(dt);fire.update(dt);
		victimDeath.update(dt);
        if(hits>0&&hits<3&&!jaw)dropJaw();
        if(jaw&&jaw.position.y>.12){jawVelocity.y-=9.8*dt;jaw.position.addScaledVector(jawVelocity,dt);jaw.rotation.x+=dt*3;if(jaw.position.y<=.12){jaw.position.y=.12;jaw.rotation.x=Math.PI/2;}}

		if(!triggered)return;age+=dt;
		for(const piece of debris) {
			if(piece.settled)continue;
			piece.velocity.y-=9.8*dt;piece.block.position.addScaledVector(piece.velocity,dt);
			piece.block.rotation.x+=piece.spin.x*dt;piece.block.rotation.z+=piece.spin.z*dt;
			const floor=Math.max(.15,piece.block.scale.y*.35);
			if(piece.block.position.y<floor) {piece.block.position.y=floor;piece.velocity.multiplyScalar(.35);piece.velocity.y=Math.abs(piece.velocity.y)*.35;if(piece.velocity.length()<.6||age>3)piece.settled=true;}
		}
		if(zombie.defeated || zombie.targeted || prisoner.userData.dead)return;
		if(grab.active){
			const lifting=grab.age<.65;
			grab.update(dt);
			if(lifting)holdZombieNeck(zombie,prisoner);
			zombie.updateAppearance(age,zombie.jawDetached?1:.5);
			return;
		}
		if(age<.65)return;
		zombie.root.visible=true;
		if(age>=nextGrowl){const distance=zombie.root.position.distanceTo(prisoner.position);if(growl.play(Math.max(.3,1-distance/24)))nextGrowl=age+3.8;}
		if(age<1.7)zombie.root.position.x=THREE.MathUtils.lerp(10.5,8.65,THREE.MathUtils.smoothstep(age,.65,1.7));
		else if(hits<2) {
			direction.copy(prisoner.position).sub(zombie.root.position);direction.y=0;const distance=direction.length();
			if(distance>.9){direction.normalize();zombie.root.position.addScaledVector(direction,Math.min(distance-.9,1.7*dt));zombie.root.rotation.y=Math.atan2(direction.x,direction.z);}
		}
		const walking=hits<2&&(age<1.7||zombie.root.position.distanceTo(prisoner.position)>.91);
		zombie.legs.forEach((leg,i)=>leg.rotation.x=walking?Math.sin(age*10+i*Math.PI)*.3:0);
		const spasm=Math.sin(age*27)*Math.pow(Math.max(0,Math.sin(age*4.7)),7);
		zombie.arms.forEach((arm,i)=>{arm.rotation.x=-.15+Math.sin(age*11+i*2)*.18+spasm*.22;arm.rotation.z=(i===0?-1:1)*(.1+Math.sin(age*9+i)*.07);arm.userData.elbow.rotation.x=Math.sin(age*13+i)*.12;});
		zombie.torso.rotation.set(.06+Math.sin(age*7)*.07+spasm*.08,Math.sin(age*5)*.055,Math.sin(age*9)*.04+spasm*.05);
		zombie.head.rotation.set(Math.sin(age*11)*.10+spasm*.12,Math.sin(age*8)*.23,Math.sin(age*13)*.12+spasm*.12);
		const mouthOpening=.22+.78*Math.pow(Math.max(0,Math.sin(age*4.3)),.7);
		zombie.root.position.y=.03+(walking?Math.abs(Math.sin(age*10))*.025:0);
		if(hits<2 && age>1.7 && zombie.root.position.distanceTo(prisoner.position)<.92) grab.begin(zombie);
		grab.update(dt);
		if(grab.active)holdZombieNeck(zombie,prisoner);
		if(hits>=2){zombie.torso.rotation.x+=Math.sin(age*24)*.24;zombie.head.rotation.z+=Math.sin(age*31)*.32;zombie.arms.forEach((arm,i)=>{arm.rotation.x=-.7+Math.sin(age*25+i*2)*.7;arm.rotation.z=Math.sin(age*19+i)*.4;});}
        zombie.updateAppearance(age,zombie.jawDetached?1:mouthOpening);
	}
	function target(root) {
		if(!zombie||zombie.root!==root||zombie.defeated||zombie.targeted||!root.visible||prisoner.userData.dead)return false;
		zombie.targeted=true;grab.end();return true;
	}
	function release(root) {if(zombie&&zombie.root===root&&!zombie.defeated)zombie.targeted=false;}
	function defeat(root) {
		if(!zombie||zombie.root!==root||zombie.defeated)return;
		grab.end();zombie.targeted=false;hits++;
        if(hits===1){dropJaw();return;}
        if(hits===2){fire.ignite(root);return;}
        growl.stop();fire.stop();dust.emit(root);if(jaw)jaw.visible=false;zombie.defeated=true;root.visible=false;
	}
	return {get hits(){return hits;},get jaw(){return jaw;},fireBeam:fire.beam,breakWall,update,target,release,defeat,releaseGrab:grab.end,unlockAudio(){grab.unlockAudio();growl.unlock();},get grabbing(){return grab.active;},get triggered(){return triggered;},get zombie(){return zombie;},debris};
}
