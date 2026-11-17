import { spawnWallFragments } from './wall-fragments.js';
import * as THREE from 'three';
import { createTrollModel } from './troll-model.js';
import { createZombieGrowl } from './zombie-growl.js';
import { createAirborneDust } from './airborne-dust.js';
import { createRecordedOuch } from './recorded-ouch.js';
import { createRecordedMaleScream } from './recorded-male-scream.js';
import { wallBricksSound as bricksSound } from './falling-bricks-sound.js';

export function createTrollEncounter(scene,prisoner,beforeHit=()=>{}) {
	const dust=createAirborneDust(scene);
	const growl=createZombieGrowl();
	const ouch=createRecordedOuch();
	const scream=createRecordedMaleScream({fileName:'male-short-wounded-scream.mp3',offset:0,duration:1.99});
	let triggered=false,age=0,troll=null,hits=0,attackAge=0,windup=false,knockdown=null;
	let rayHits=0,trollFall=null;
	let attackStartHand=null;
	let attackStartArm=null,attackStartElbow=null;
	const debris=[],matrix=new THREE.Matrix4(),position=new THREE.Vector3(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3(),direction=new THREE.Vector3();
	function breakWall(point){
		if(triggered)return;triggered=true;age=0;
		bricksSound.play(); spawnWallFragments(scene,point);
		const centerZ=THREE.MathUtils.clamp(point.z,-7,7);scene.updateMatrixWorld(true);
		scene.traverse(wall=>{
			if(!wall.isInstancedMesh||wall.userData.spellTarget!=='troll-wall')return;
			for(let i=0;i<wall.count;i++){
				wall.getMatrixAt(i,matrix);const world=new THREE.Matrix4().multiplyMatrices(wall.matrixWorld,matrix);world.decompose(position,rotation,scale);
				if(Math.abs(position.z-centerZ)>1.4||position.y>4.1)continue;
				const block=new THREE.Mesh(wall.geometry,wall.material);block.position.copy(position);block.quaternion.copy(rotation);block.scale.copy(scale);block.castShadow=block.receiveShadow=true;
				debris.push({block,velocity:new THREE.Vector3(1.2+(i%4)*.3,.4,((i%5)-2)*.3),settled:false});matrix.elements[14]-=4;wall.setMatrixAt(i,matrix);
			}
			wall.instanceMatrix.needsUpdate=true;wall.computeBoundingBox();wall.computeBoundingSphere();
		});debris.forEach(piece=>scene.add(piece.block));
		const hole=new THREE.Mesh(new THREE.PlaneGeometry(3,4.2),new THREE.MeshBasicMaterial({color:0,fog:false,toneMapped:false}));hole.rotation.y=Math.PI/2;hole.position.set(-9.97,2.1,centerZ);hole.name='Brecha del troll';scene.add(hole);
		troll=createTrollModel();troll.root.position.set(-10.5,.03,centerZ);troll.root.rotation.y=Math.PI/2;troll.root.visible=false;scene.add(troll.root);
	}
	function aimThrust(ready,progress){
		prisoner.updateWorldMatrix(true,true);
		const torso=prisoner.localToWorld(new THREE.Vector3(0,1.15,0));
		// Draw the hand behind the shoulder before driving the blade forward.
		const withdrawn=troll.root.localToWorld(new THREE.Vector3(-.5,1.27,-.35));
		const extended=torso.clone().addScaledVector(direction,-.8);
		const goal=progress>0?withdrawn.clone().lerp(extended,progress):attackStartHand.clone().lerp(withdrawn,ready);
		aimThrustArm(goal);
		if(ready<1){
			troll.arms[0].quaternion.slerpQuaternions(attackStartArm,troll.arms[0].quaternion.clone(),ready);
			troll.arms[0].userData.elbow.quaternion.slerpQuaternions(attackStartElbow,troll.arms[0].userData.elbow.quaternion.clone(),ready);
			troll.root.updateWorldMatrix(true,true);
		}
		pointSword(torso.sub(troll.sword.getWorldPosition(new THREE.Vector3())).normalize());
	}
	function aimThrustArm(goal){
		const arm=troll.arms[0],elbow=arm.userData.elbow,hand=arm.userData.hand;
		troll.root.updateWorldMatrix(true,true);
		// Solve a two-bone arm with an outward elbow, avoiding the free twisting
		// and elbow reversals of an unconstrained iterative solver.
		const origin=arm.getWorldPosition(new THREE.Vector3());
		const scale=arm.getWorldScale(new THREE.Vector3()).x;
		const upperLength=elbow.position.length()*scale,lowerLength=hand.position.length()*scale;
		const axis=goal.clone().sub(origin);
		const distance=THREE.MathUtils.clamp(axis.length(),Math.abs(upperLength-lowerLength)+.05,(upperLength+lowerLength)*.97);
		if(axis.lengthSq()<1e-8)axis.copy(direction);axis.normalize();
		const target=origin.clone().addScaledVector(axis,distance);
		const pole=new THREE.Vector3(-1,-.25,-.3).transformDirection(troll.root.matrixWorld);
		pole.addScaledVector(axis,-pole.dot(axis));
		if(pole.lengthSq()<1e-8)pole.set(0,-1,0).addScaledVector(axis,axis.y);
		pole.normalize();
		const along=(upperLength*upperLength-lowerLength*lowerLength+distance*distance)/(2*distance);
		const bend=Math.sqrt(Math.max(0,upperLength*upperLength-along*along));
		const elbowTarget=origin.clone().addScaledVector(axis,along).addScaledVector(pole,bend);
		const upperDirection=arm.parent.worldToLocal(elbowTarget).sub(arm.position).normalize();
		arm.quaternion.setFromUnitVectors(elbow.position.clone().normalize(),upperDirection);
		troll.root.updateWorldMatrix(true,true);
		const lowerDirection=arm.worldToLocal(target).sub(elbow.position).normalize();
		elbow.quaternion.setFromUnitVectors(hand.position.clone().normalize(),lowerDirection);
		troll.root.updateWorldMatrix(true,true);
	}
	function aimSwordHand(goal){
		const arm=troll.arms[0],elbow=arm.userData.elbow,hand=arm.userData.hand;
		for(let i=0;i<20;i++)for(const joint of [elbow,arm]){
			troll.root.updateWorldMatrix(true,true);
			const origin=joint.getWorldPosition(new THREE.Vector3());
			const from=hand.getWorldPosition(new THREE.Vector3()).sub(origin),to=goal.clone().sub(origin);
			if(from.lengthSq()<1e-8||to.lengthSq()<1e-8)continue;
			const turn=new THREE.Quaternion().setFromUnitVectors(from.normalize(),to.normalize());
			const parent=joint.parent.getWorldQuaternion(new THREE.Quaternion());
			joint.quaternion.premultiply(parent.clone().invert().multiply(turn).multiply(parent));
		}
		troll.root.updateWorldMatrix(true,true);
	}
	function pointSword(axis){
		const world=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),axis);
		troll.sword.quaternion.copy(troll.sword.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(world));
	}
	function aimHeadStrike(ready,swing){
		prisoner.updateWorldMatrix(true,true);
		const head=prisoner.getObjectByName('head-anchor')?.getWorldPosition(new THREE.Vector3())??prisoner.localToWorld(new THREE.Vector3(0,1.68,0));
		// Raise the hand over the troll's head, then chop downward at the victim.
		const raised=troll.root.localToWorld(new THREE.Vector3(-.35,2.65,.12));
		const contact=head.clone().add(new THREE.Vector3(0,.18,0));
		const goal=raised.clone().lerp(contact,swing);
		// Interpolate from a fixed starting pose, not the previous frame's hand.
		aimSwordHand(attackStartHand.clone().lerp(goal,ready));
		const up=new THREE.Vector3(0,.65,0).addScaledVector(direction,-1).normalize();
		const turn=new THREE.Quaternion().setFromUnitVectors(up,new THREE.Vector3(0,1,0));
		pointSword(up.applyQuaternion(new THREE.Quaternion().slerp(turn,swing)).normalize());
	}
	function impact(){
		if(prisoner.userData.dead||prisoner.userData.fallen)return;
		beforeHit();hits++;prisoner.userData.setBackArch?.(0);
		const mouth=prisoner.getObjectByName('screaming-mouth');if(mouth)mouth.visible=false;
		knockdown={age:0,position:prisoner.position.clone(),rotation:prisoner.quaternion.clone(),fatal:hits===3};
		prisoner.userData.fallen=true;prisoner.userData.trollStunned=true;
		if(hits<3){ouch.play();if(mouth)mouth.visible=true;}
		if(hits===3){
			scream.play();
			if(mouth)mouth.visible=true;
			const torso=prisoner.localToWorld(new THREE.Vector3(0,1.15,0));
			const thrust=direction.clone().normalize();
			scene.attach(troll.sword);
			troll.sword.position.copy(torso).addScaledVector(thrust,-.8);
			troll.sword.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),thrust);
			prisoner.attach(troll.sword);
			prisoner.userData.dead=prisoner.userData.gameOver=true;
		}
	}
	function update(dt){
		dust.update(dt);
		if(!triggered)return;age+=dt;
		for(const piece of debris){if(piece.settled)continue;piece.velocity.y-=9.8*dt;piece.block.position.addScaledVector(piece.velocity,dt);piece.block.rotation.x+=dt;const floor=Math.max(.15,piece.block.scale.y*.35);if(piece.block.position.y<floor){piece.block.position.y=floor;piece.velocity.multiplyScalar(.3);piece.velocity.y=Math.abs(piece.velocity.y)*.3;if(age>3||piece.velocity.length()<.6)piece.settled=true;}}
		if(knockdown){
			knockdown.age+=dt;const t=knockdown.age;
			if(!knockdown.fatal){
				const amount=THREE.MathUtils.smoothstep(t,0,.45)*(1-THREE.MathUtils.smoothstep(t,1,1.9));
				prisoner.position.copy(knockdown.position);prisoner.position.y-=.4*prisoner.scale.y*amount;
				prisoner.quaternion.copy(knockdown.rotation).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),.12*amount));
				prisoner.userData.trollKneeBend=Math.PI*.5*amount;
				const mouth=prisoner.getObjectByName('screaming-mouth');if(mouth&&t>.65)mouth.visible=false;
				if(t>=1.9){prisoner.position.copy(knockdown.position);prisoner.quaternion.copy(knockdown.rotation);prisoner.userData.fallen=false;prisoner.userData.trollStunned=false;prisoner.userData.trollKneeBend=0;knockdown=null;}
				return;
			}
			const ease=x=>{x=THREE.MathUtils.clamp(x,0,1);return x*x*(3-2*x);};
			const amount=t<.55?ease(t/.55):knockdown.fatal?1:1-ease((t-1)/.9);
			prisoner.quaternion.copy(knockdown.rotation).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-amount*Math.PI/2));
			prisoner.position.copy(knockdown.position);prisoner.position.y+=Math.sin(amount*Math.PI/2)*.24;
			const mouth=prisoner.getObjectByName('screaming-mouth');if(mouth&&t>.65)mouth.visible=false;
			if(!knockdown.fatal&&t>=1.9){prisoner.position.copy(knockdown.position);prisoner.quaternion.copy(knockdown.rotation);prisoner.userData.fallen=false;prisoner.userData.trollStunned=false;knockdown=null;}
			else return;
		}
		if(prisoner.userData.dead)return;
		if(troll.defeated||troll.targeted)return;
		if(trollFall){
			trollFall.age+=dt;const t=trollFall.age;
			const ease=x=>{x=THREE.MathUtils.clamp(x,0,1);return x*x*(3-2*x);};
			const amount=t<.6?ease(t/.6):1-ease((t-1)/.9);
			troll.root.quaternion.copy(trollFall.rotation).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-amount*Math.PI/2));
			troll.root.position.copy(trollFall.position);troll.root.position.y+=Math.sin(amount*Math.PI/2)*.75;
			if(t>=1.9){troll.root.position.copy(trollFall.position);troll.root.quaternion.copy(trollFall.rotation);trollFall=null;}
			return;
		}
		if(age<.65)return;
		if(!troll.root.visible){troll.root.visible=true;growl.play(1.25);}
		if(age<1.7){troll.root.position.x=THREE.MathUtils.lerp(-10.5,-8.35,THREE.MathUtils.smoothstep(age,.65,1.7));return;}
		direction.copy(prisoner.position).sub(troll.root.position);direction.y=0;const distance=direction.length();direction.normalize();troll.root.rotation.y=Math.atan2(direction.x,direction.z);
		if(distance>2.35){
			troll.root.position.addScaledVector(direction,Math.min(distance-2.35,1.4*dt));
			troll.legs.forEach((leg,i)=>leg.rotation.x=Math.sin(age*6+i*Math.PI)*.3);
			attackAge=0;troll.arms[0].rotation.set(-.12+Math.sin(age*6)*.13,0,-.1);troll.arms[0].userData.elbow.rotation.x=-.12+Math.sin(age*6+.8)*.08;troll.sword.rotation.z=Math.sin(age*6)*.09;troll.arms[1].rotation.x=Math.sin(age*6+Math.PI)*.22;return;
		}
		troll.legs.forEach(leg=>leg.rotation.x=0);
		if(hits<3&&!prisoner.userData.fallen&&!prisoner.userData.dead){
			if(attackAge===0){attackStartHand=troll.arms[0].userData.hand.getWorldPosition(new THREE.Vector3());attackStartArm=troll.arms[0].quaternion.clone();attackStartElbow=troll.arms[0].userData.elbow.quaternion.clone();}
			attackAge+=dt;
			const swing=THREE.MathUtils.smoothstep(attackAge,.9,1.65);
			const ready=THREE.MathUtils.smoothstep(attackAge,0,.8);
			troll.arms[1].rotation.x=-.2-Math.sin(swing*Math.PI)*.3;
			if(hits===2)aimThrust(ready,swing);
			else aimHeadStrike(ready,swing);
			if(attackAge>=1.65){impact();attackAge=0;}
		}

	}
	function target(root){
		if(!troll||troll.root!==root||troll.defeated||troll.targeted||!root.visible)return false;
		troll.targeted=true;return true;
	}
	function release(root){if(troll&&troll.root===root&&!troll.defeated)troll.targeted=false;}
	function defeat(root){
		if(!troll||troll.root!==root||troll.defeated)return;
		rayHits++;troll.targeted=false;attackAge=0;windup=false;troll.sword.rotation.z=0;troll.arms[0].rotation.x=0;troll.arms[0].userData.elbow.rotation.x=0;
		if(rayHits===3){dust.emit(root);growl.stop();troll.defeated=true;root.visible=false;trollFall=null;return;}
		const rest=trollFall??{position:root.position.clone(),rotation:root.quaternion.clone()};
		trollFall={age:0,position:rest.position.clone(),rotation:rest.rotation.clone()};
	}
	return {breakWall,update,target,release,defeat,unlockAudio(){growl.unlock();ouch.unlock();scream.unlock();bricksSound.unlock();},get rayHits(){return rayHits;},get triggered(){return triggered;},get troll(){return troll;},get hits(){return hits;},get stunned(){return !!prisoner.userData.trollStunned;},get dead(){return !!prisoner.userData.dead;},debris};
}
