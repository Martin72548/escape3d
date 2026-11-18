import * as THREE from 'three';
import { createPrisonerMovement } from './prisoner-movement.js';

export function enablePrisonerKeyboard({prisoner,camera,renderer,canTurn=()=>true}) {
	const pressed=new Set(),forward=new THREE.Vector3(),right=new THREE.Vector3(),direction=new THREE.Vector3();
	const movement=createPrisonerMovement(prisoner),keys=['KeyW','KeyA','KeyS','KeyD'];
	let jumpRequested=false;
	function typing(event){return event.target?.closest?.('input,textarea,select,[contenteditable="true"],[role="textbox"]');}
	window.addEventListener('keydown',event=>{
		if(typing(event)||event.ctrlKey||event.metaKey||event.altKey||renderer.xr.isPresenting)return;
		if(event.code==='Space'&&prisoner.userData.jumpAcrossChasm){
			event.preventDefault();
			if(!event.repeat)jumpRequested=true;
			return;
		}
		if(!keys.includes(event.code))return;
		event.preventDefault();pressed.add(event.code);
	});
	window.addEventListener('keyup',event=>pressed.delete(event.code));
	function clearInput(){pressed.clear();jumpRequested=false;}
	window.addEventListener('blur',clearInput);
	document.addEventListener('visibilitychange',()=>{if(document.hidden)clearInput();});
	renderer.xr.addEventListener('sessionstart',clearInput);
	function update(dt){
		if(prisoner.userData.wakingUp || prisoner.userData.sleeping) return;
		direction.set(0,0,0);
		if(!renderer.xr.isPresenting){
			camera.getWorldDirection(forward);forward.y=0;if(forward.lengthSq()<.00001)forward.set(0,0,-1);forward.normalize();right.crossVectors(forward,new THREE.Vector3(0,1,0)).normalize();
			if(pressed.has('KeyW'))direction.add(forward);if(pressed.has('KeyS'))direction.sub(forward);
			if(pressed.has('KeyD'))direction.add(right);if(pressed.has('KeyA'))direction.sub(right);
		}
		if(jumpRequested){
			jumpRequested=false;
			prisoner.userData.jumpAcrossChasm?.(direction);
		}
		movement.update(dt,direction,canTurn());
	}
	return {update};
}
