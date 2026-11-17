import { createRecordedMaleScream } from './recorded-male-scream.js';
import { createSnakeBody } from './snake-body.js';
import * as THREE from 'three';

export function createSnakeEncounter(scene, prisoner) {
 const scream=createRecordedMaleScream();
	const snake = new THREE.Group();
	snake.name = 'Serpiente del calabozo';
	snake.scale.setScalar(1);
	snake.userData.spellTarget = 'snake';
	const skin = new THREE.MeshStandardMaterial({ color: 0x586236, roughness: 0.67, metalness: 0.05 });
	const belly = new THREE.MeshStandardMaterial({ color: 0xafa16a, roughness: 0.9 });
	const eye = new THREE.MeshStandardMaterial({ color: 0xe3ae26, roughness: 0.25 });
	const pupil = new THREE.MeshBasicMaterial({ color: 0x080806 });
	const body = createSnakeBody(snake, skin, belly);
	const head = new THREE.Group(); snake.add(head);
	const skull = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), skin);
	skull.scale.set(0.105, 0.065, 0.15); head.add(skull);
	for (const side of [-1, 1]) {
		const orb = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 8), eye);
		orb.position.set(side * 0.082, 0.045, 0.06); head.add(orb);
		const slit = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 8), pupil);
		slit.scale.set(0.004, 0.014, 0.009); slit.position.set(side * 0.09, 0.048, 0.07); head.add(slit);
	}
	const jaw = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), belly);
	jaw.scale.set(0.085, 0.023, 0.13); jaw.position.set(0, -0.046, 0.02); head.add(jaw);
	for (const side of [-1, 1]) {
		const fang = new THREE.Mesh(new THREE.ConeGeometry(0.009, 0.045, 8), new THREE.MeshStandardMaterial({ color: 0xe8e1c7 }));
		fang.rotation.x = Math.PI; fang.position.set(side * 0.044, -0.04, 0.105); head.add(fang);
	}
	snake.visible = false; scene.add(snake);
	let headingYaw = 0;
	let state = 'hidden', age = 0, elapsed = 0, spawned = false, reaction = null;
	const roamTarget=new THREE.Vector3();
	let roamSeed=821;
	function nextRoamTarget(){
		const random=()=>{roamSeed=(Math.imul(roamSeed,1664525)+1013904223)>>>0;return roamSeed/4294967296;};
		roamTarget.set((random()-.5)*16,.085,(random()-.5)*16);
	}
	const ankle = new THREE.Vector3(), direction = new THREE.Vector3();
	const travelDirection = new THREE.Vector3(), lateral = new THREE.Vector3();

	const speed = 2.3;
	function spawn(point) {
		if (spawned) return;
		spawned = true; state = 'emerging'; age = 0; elapsed = 0;nextRoamTarget();
		snake.position.set(point.x, -0.18, point.z); snake.visible = true;
		travelDirection.copy(prisoner.position).sub(snake.position).setY(0).normalize();
		headingYaw = Math.atan2(travelDirection.x, travelDirection.z);
		body.reset(travelDirection);
	}
	function target() {
		if (!snake.visible || state === 'hidden' || state === 'defeated') return false;
		state = 'targeted'; snake.position.y = 0.085; return true;
	}
	function defeat() {
		if (state !== 'targeted') return;
		releaseReaction();
		state = 'defeated'; snake.visible = false; jaw.rotation.x = 0;
	}
	function beginBite(){
  state='biting';age=0;scream.play();
  const leg=prisoner.getObjectByName('right-leg'),support=prisoner.getObjectByName('left-leg');
  const away=prisoner.position.clone().sub(snake.position).setY(0);if(away.lengthSq()<.001)away.set(0,0,1);away.normalize();
  // Choose an escape heading with room for the hops, including near a wall.
  const endpoint=prisoner.position.clone().addScaledVector(away,3.5);
  if(Math.abs(endpoint.x)>8.6||Math.abs(endpoint.z)>8.6)away.copy(prisoner.position).multiplyScalar(-1).setY(0).normalize();
  reaction={baseY:prisoner.position.y,leg,support,legRest:leg?.quaternion.clone(),supportRest:support?.quaternion.clone(),away};
  prisoner.userData.snakeHopping=true;prisoner.userData.snakeLiftedLeg='right-leg';
 }
 function releaseReaction(){
  if(!reaction)return;
  prisoner.position.y=reaction.baseY;reaction.leg?.quaternion.copy(reaction.legRest);reaction.support?.quaternion.copy(reaction.supportRest);
  prisoner.userData.snakeHopping=false;prisoner.userData.snakeKneeBend=0;prisoner.userData.snakeLiftedLeg=null;reaction=null;
 }
 function updateReaction(dt){
  if(!reaction)return;
  const lift=THREE.MathUtils.smoothstep(age,0,.22)*(1-THREE.MathUtils.smoothstep(age,2.9,3.15));
  const hoppingTime=Math.max(0,age-.25),duration=.5,hopping=age>.25&&hoppingTime<5*duration;
  const height=hopping?Math.sin((hoppingTime%duration)/duration*Math.PI)*.33:0;
  reaction.leg?.quaternion.copy(reaction.legRest).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-1.05*lift));
  reaction.support?.quaternion.copy(reaction.supportRest).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-.12*height/.33));
  prisoner.userData.snakeKneeBend=.95*lift;prisoner.position.y=reaction.baseY+height;
  if(hopping){prisoner.position.addScaledVector(reaction.away,dt*1.35);const yaw=Math.atan2(reaction.away.x,reaction.away.z);prisoner.rotation.y+=Math.atan2(Math.sin(yaw-prisoner.rotation.y),Math.cos(yaw-prisoner.rotation.y))*(1-Math.exp(-dt*10));}
  if(age>=3.15){releaseReaction();state='recovering';age=0;}
 }
	function update(dt) {
		if(reaction&&(prisoner.userData.dead||prisoner.userData.waistGrabOwner)){releaseReaction();state='recovering';age=0;}
		age += dt;if(spawned && state!=='defeated')elapsed+=dt;
		prisoner.updateMatrixWorld(true);
		ankle.set(-0.115, 0.12, 0.04); prisoner.localToWorld(ankle);
		if (state === 'emerging') {
			snake.position.y = THREE.MathUtils.lerp(-0.18, 0.085, Math.min(1, age / 1.2));
			if (age >= 1.2) { state = elapsed>=30?'chasing':'roaming'; age = 0; }
		}
		if(state==='recovering'&&age>2.5){state='chasing';age=0;}
		if(state==='roaming' && elapsed>=30){state='chasing';age=0;}
		if (state === 'chasing' || state==='roaming') {
			const roaming=state==='roaming';
			if(roaming && snake.position.distanceTo(roamTarget)<.4)nextRoamTarget();
			direction.copy(roaming?roamTarget:ankle).sub(snake.position); direction.y = 0;
			const distance = direction.length();
			if (!roaming && distance < 0.23 && !prisoner.userData.fallen) { beginBite(); }
			else {
				direction.normalize();
				lateral.set(direction.z, 0, -direction.x);
				// Alternate sharp feints with broader detours. Fade lateral motion
				// near the ankle so the snake can still finish its attack.
				const feint = Math.sin(age * 5.6) * 1.15 + Math.sin(age * 2.1 + 0.8) * 0.5;
				const taper = THREE.MathUtils.smoothstep(distance, 0.25, 1.4);
				travelDirection.copy(direction).addScaledVector(lateral, feint * taper).normalize();
				const burst = 1 + 0.22 * Math.sin(age * 4.2);
				snake.position.addScaledVector(travelDirection, Math.max(0,Math.min(distance - (roaming ? .1 : .2), speed * burst * dt)));
				snake.position.x = THREE.MathUtils.clamp(snake.position.x, -9.5, 9.5);
				snake.position.z = THREE.MathUtils.clamp(snake.position.z, -9.5, 9.5);
			}
		}
		if (['emerging', 'roaming', 'chasing', 'targeted', 'biting', 'hopping', 'recovering'].includes(state)) {
			direction.copy(ankle).sub(snake.position);
			const heading = (state === 'chasing'||state==='roaming') ? travelDirection : direction;
			const yaw = Math.atan2(heading.x, heading.z);
			const turn = Math.atan2(Math.sin(yaw - headingYaw), Math.cos(yaw - headingYaw));
			headingYaw += turn * (1 - Math.exp(-12 * dt));
			head.rotation.y = headingYaw;
			head.position.set(0, 0.015, 0.07);
		}
		if (snake.visible) body.update();
		if (state === 'biting') {
			head.position.y += Math.sin(Math.min(1, age / 0.4) * Math.PI) * 0.13;
			jaw.rotation.x = Math.sin(Math.min(1, age / 0.4) * Math.PI) * 0.65;
			if(age>.4){state='hopping';jaw.rotation.x=0;}
		}
		if(state==='biting'||state==='hopping')updateReaction(dt);
	}
	return { snake, spawn, target, defeat,unlockAudio:scream.unlock, release(){if(state==='targeted')state=elapsed>=30?'chasing':'roaming';}, update, get state() { return state; }, get incapacitated() { return ['biting', 'hopping'].includes(state); } };
}
