import { translate } from './language.js';
import { createArrowFlightSound } from './arrow-flight-sound.js';
import * as THREE from 'three';
import { createSebastianDestruction } from './sebastian-destruction.js';

export function createSebastianAttack(scene, figure, prisoner, statue) {
	const destruction=createSebastianDestruction(scene,figure,statue);
	const arrowSound=createArrowFlightSound();
	let triggered=false, age=0, launched=0, cycle=-1, released=false, held=null, fall=null, finished=false;
	const arrows=[], up=new THREE.Vector3(0,1,0), forward=new THREE.Vector3(0,0,1);
	const world=new THREE.Vector3(), toward=new THREE.Vector3();
	const wood=new THREE.MeshStandardMaterial({color:0x62472d,roughness:.75});
	const steel=new THREE.MeshStandardMaterial({color:0x74736d,metalness:.65,roughness:.4});
	const feathers=new THREE.MeshStandardMaterial({color:0xcec6b0,side:THREE.DoubleSide,roughness:.9});
	const bow=new THREE.Group();bow.name='Arco de San Sebastian';bow.visible=false;figure.add(bow);
	const bowPath=new THREE.CatmullRomCurve3([new THREE.Vector3(0,-.59,.07),new THREE.Vector3(0,-.34,-.1),new THREE.Vector3(0,0,-.16),new THREE.Vector3(0,.34,-.1),new THREE.Vector3(0,.59,.07)]);
	const bowMesh=new THREE.Mesh(new THREE.TubeGeometry(bowPath,40,.025,10,false),wood);bowMesh.castShadow=true;bow.add(bowMesh);
	const stringGeometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,-.59,.07),new THREE.Vector3(0,0,.07),new THREE.Vector3(0,.59,.07)]);
	const string=new THREE.Line(stringGeometry,new THREE.LineBasicMaterial({color:0xd1c4a7}));bow.add(string);
	const animatedArms=new THREE.Group();animatedArms.visible=false;figure.add(animatedArms);
	const armParts=[];
	for(const side of [-1,1]) {
		const segments=[0,1].map(()=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(1,1,1,20),statue.material);m.castShadow=m.receiveShadow=true;animatedArms.add(m);return m;});
		const joints=[0,1,2].map(()=>{const m=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),statue.material);m.castShadow=true;animatedArms.add(m);return m;});
		const fingers=Array.from({length:4},()=>{const m=new THREE.Mesh(new THREE.CapsuleGeometry(.012,.055,4,8),statue.material);animatedArms.add(m);return m;});
		armParts.push({side,segments,joints,fingers});
	}
	function setSegment(mesh,a,b,radius){const d=b.clone().sub(a);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(up,d.clone().normalize());mesh.scale.set(radius,d.length(),radius);}
	function pose(draw,raise){
		if(statue.poseArms){statue.poseArms(draw,raise);animatedArms.visible=false;}
		const bowHand=new THREE.Vector3(-.35,1.57,.55);
		bow.position.copy(bowHand);bow.rotation.y=Math.PI-.1;
		for(const arm of armParts){
			const {side,segments,joints,fingers}=arm;
			const shoulder=new THREE.Vector3(side*.32,1.67,0);
			const restElbow=new THREE.Vector3(side*.37,1.36,-.22),restHand=new THREE.Vector3(side*.065,1.17,-.43);
			const elbow=side<0?new THREE.Vector3(-.48,1.48,.28):new THREE.Vector3(.45,1.65,.1-draw*.16);
			const hand=side<0?bowHand:new THREE.Vector3(-.27+draw*.43,1.57+draw*.13,.55-draw*.4);
			elbow.lerpVectors(restElbow,elbow,raise);hand.lerpVectors(restHand,hand,raise);
			setSegment(segments[0],shoulder,elbow,.085);setSegment(segments[1],elbow,hand,.06);
			[shoulder,elbow,hand].forEach((point,i)=>{joints[i].position.copy(point);joints[i].scale.setScalar(i===0?.112:i===1?.068:.055);});
			fingers.forEach((finger,i)=>{finger.position.copy(hand).add(new THREE.Vector3((i-1.5)*.022,-.024,.03));finger.rotation.x=.7;});
		}
		const positions=stringGeometry.attributes.position;positions.setXYZ(1,-draw*.43,draw*.13,.07+draw*.4);positions.needsUpdate=true;stringGeometry.computeBoundingSphere();
		if(held){held.position.set(-.35+draw*.43,1.57+draw*.13,1.18-draw*.4);held.rotation.set(0,0,0);}
	}
	function makeArrow(){
		const root=new THREE.Group();root.name='Flecha disparada por San Sebastian '+(launched+1);
		const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.009,.009,.72,10),wood);shaft.rotation.x=Math.PI/2;shaft.position.z=-.36;root.add(shaft);
		const tip=new THREE.Mesh(new THREE.ConeGeometry(.025,.09,4),steel);tip.rotation.x=Math.PI/2;tip.position.z=.015;root.add(tip);
		for(let i=0;i<3;i++){const fin=new THREE.Mesh(new THREE.PlaneGeometry(.065,.14),feathers);fin.rotation.x=Math.PI/2;fin.rotation.z=i*Math.PI*2/3;fin.position.z=-.62;root.add(fin);}
		root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.raycast=()=>{};}});return root;
	}
	function target(number){
		prisoner.updateWorldMatrix(true,true);
		let owner,point;
		if(number===6||number===7){owner=prisoner.getObjectByName(number===6?'left-leg':'right-leg')||prisoner;point=owner.localToWorld(new THREE.Vector3(0,-.23,.08));}
		else if(number===8){owner=prisoner.getObjectByName('prisoner-torso')||prisoner;point=prisoner.localToWorld(new THREE.Vector3(0,1.2,.1));}
		else {owner=prisoner.getObjectByName('head-anchor')||prisoner;point=owner.getWorldPosition(new THREE.Vector3());}
		return {owner,point};
	}
	function launch(){
		arrowSound.play();
		figure.updateWorldMatrix(true,true);const root=held;scene.attach(root);held=null;
		const start=root.getWorldPosition(new THREE.Vector3()),number=++launched;
		let end;
		if(number<=5){
			const center=prisoner.localToWorld(new THREE.Vector3(0,1.1,0));
			const facing=center.clone().sub(start).setY(0).normalize(),side=new THREE.Vector3(-facing.z,0,facing.x);
			const near=center.clone().addScaledVector(side,(number%2?1:-1)*(1.05+number*.035));near.y+=number%2?.22:-.18;
			const direction=near.sub(start).normalize();
			const tx=Math.abs(direction.x)>.0001?((direction.x>0?9.7:-9.7)-start.x)/direction.x:Infinity;
			const tz=Math.abs(direction.z)>.0001?((direction.z>0?9.7:-9.7)-start.z)/direction.z:Infinity;
			end=start.clone().addScaledVector(direction,Math.min(tx,tz));end.y=THREE.MathUtils.clamp(end.y,.3,5.7);
		}else end=target(number).point;
		arrows.push({root,start,end,number,progress:0,stuck:false});
	}
	function trigger(){
		arrowSound.unlock();
		if(triggered||destruction.exploded||prisoner.userData.dead)return;
		triggered=true;bow.visible=animatedArms.visible=true;
		for(const object of [...statue.restingArms,...statue.bindings])object.visible=false;
	}
	function hit(activate=true){
		if(destruction.exploded||prisoner.userData.dead)return false;
		if(activate)trigger();destruction.hit();
		if(destruction.exploded){
			cycle=-1;if(held){held.removeFromParent();held.traverse(object=>object.geometry?.dispose());held=null;}
		}
		return true;
	}
	function endGame(){
		finished=true;prisoner.userData.gameOver=true;
		if(typeof document==='undefined')return;
		const panel=document.createElement('div');panel.id='sebastian-game-over';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');
		panel.style.cssText='position:fixed;inset:0;z-index:1000;display:grid;place-items:center;background:rgba(8,7,6,.78);color:#eee4cf;font-family:system-ui;text-align:center;';
		const card=document.createElement('div'),title=document.createElement('h1'),text=document.createElement('p'),button=document.createElement('button');
		title.textContent=translate('Fin de la partie', 'Fin del juego');text.textContent=translate('Les flèches de saint Sébastien ont atteint le prisonnier.', 'Las flechas de San Sebastián alcanzaron al prisionero.');button.textContent=translate('Recommencer', 'Volver a empezar');
		button.style.cssText='padding:12px 24px;font:inherit;cursor:pointer;border-radius:8px;border:1px solid #bdab85;background:#eadcc0;color:#211b13;';
		button.addEventListener('click',()=>window.location.reload());card.append(title,text,button);panel.append(card);document.body.append(panel);button.focus();
	}
	function update(dt){
		destruction.update(dt);
		if(!triggered||finished)return;age+=dt;
		if(fall){
			fall.age+=dt;const amount=THREE.MathUtils.smoothstep(fall.age,0,1.1);
			prisoner.quaternion.copy(fall.rotation).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-amount*Math.PI/2));
			prisoner.position.copy(fall.position);prisoner.position.y+=Math.sin(amount*Math.PI/2)*.25;
			if(fall.age>=1.3)endGame();return;
		}
		prisoner.getWorldPosition(world);figure.getWorldPosition(toward);toward.subVectors(world,toward);toward.y=0;
		const yaw=Math.atan2(toward.x,toward.z),difference=Math.atan2(Math.sin(yaw-figure.rotation.y),Math.cos(yaw-figure.rotation.y));figure.rotation.y+=difference*(1-Math.exp(-7*dt));
		if(!destruction.exploded&&launched<9&&cycle<0&&age>=.7+launched*1.65){cycle=0;released=false;held=makeArrow();figure.add(held);}
		if(cycle>=0)cycle+=dt;
		const draw=cycle<0?0:cycle<.8?THREE.MathUtils.smoothstep(cycle,0,.8):1-THREE.MathUtils.smoothstep(cycle,.8,1.02);
		if(!destruction.exploded)pose(draw,THREE.MathUtils.smoothstep(age,0,.7));
		if(cycle>=.8&&!released){launch();released=true;}
		if(cycle>=1.35)cycle=-1;
		for(const arrow of arrows){
			if(arrow.stuck)continue;
			if(arrow.number>5)arrow.end.copy(target(arrow.number).point);
			arrow.progress=Math.min(1,arrow.progress+dt*16/Math.max(.01,arrow.start.distanceTo(arrow.end)));
			arrow.root.position.lerpVectors(arrow.start,arrow.end,arrow.progress);
			const direction=arrow.end.clone().sub(arrow.start).normalize();arrow.root.quaternion.setFromUnitVectors(forward,direction);
			if(arrow.progress===1){
				arrow.stuck=true;arrow.root.position.addScaledVector(direction,.05);
				if(arrow.number>5){
					const {owner}=target(arrow.number);owner.attach(arrow.root);
					prisoner.userData.sebastianArrowHits=(prisoner.userData.sebastianArrowHits||0)+1;
					if(arrow.number===9){
						prisoner.userData.dead=prisoner.userData.fallen=true;
						fall={age:0,position:prisoner.position.clone(),rotation:prisoner.quaternion.clone()};
					}
				}
			}
		}
	}
	return {trigger,hit,update,arrows,bow,destruction,unlockAudio:arrowSound.unlock,get hits(){return destruction.hits;},get exploded(){return destruction.exploded;},get launched(){return launched;},get finished(){return finished;},get active(){return triggered;}};
}
