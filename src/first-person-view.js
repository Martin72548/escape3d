import * as THREE from 'three';

export function enableFirstPersonView({ camera, prisoner, renderer, orbitControls }) {
	const button = document.querySelector('#first-person-toggle');
	const hint = document.querySelector('#first-person-hint');
	const savedPosition = new THREE.Vector3(), savedTarget = new THREE.Vector3();
	const eye = new THREE.Vector3(), direction = new THREE.Vector3();
	let active = false, yaw = 0, pitch = 0, drag = null;
	const headLayers = new Map();
	function hideHeadParts() {
		for (const part of prisoner.userData.headParts ?? []) {
			if (!headLayers.has(part)) headLayers.set(part, part.userData.firstPersonLayerMask ?? part.layers.mask);
			part.layers.set(1);
		}
	}
	function setActive(value) {
		if (active === value) return;
		active = value; drag = null;
		prisoner.userData.firstPersonActive = active;
		if (active) {
			orbitControls.update();
			savedPosition.copy(camera.position); savedTarget.copy(orbitControls.target);
			yaw = prisoner.rotation.y; pitch = 0;
			hideHeadParts();
			orbitControls.enabled = false;
			update();
		} else {
			for (const [part, mask] of headLayers) part.layers.mask = mask;
			headLayers.clear();
			camera.position.copy(savedPosition); orbitControls.target.copy(savedTarget);
			orbitControls.enabled = true; orbitControls.update();
		}
		const label = active ? 'Revenir à la vue extérieure' : 'Première personne';
		button.setAttribute('aria-label', label);
		button.title = label;
		button.setAttribute('aria-pressed', String(active));
		hint.hidden = !active;
	}
	button.addEventListener('click', () => setActive(!active));
	renderer.domElement.addEventListener('pointerdown', event => {
		if (active && event.button === 0) drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
	});
	window.addEventListener('pointermove', event => {
		if (!active || !drag || event.pointerId !== drag.id) return;
		yaw -= (event.clientX - drag.x) * .005;
		pitch = THREE.MathUtils.clamp(pitch - (event.clientY - drag.y) * .005, -1.35, 1.35);
		drag.x = event.clientX; drag.y = event.clientY;
	});
	const stopDrag = () => { drag = null; };
	window.addEventListener('pointerup', stopDrag);
	window.addEventListener('pointercancel', stopDrag);
	window.addEventListener('blur', stopDrag);
	renderer.xr.addEventListener('sessionstart', () => { setActive(false); button.disabled = true; });
	renderer.xr.addEventListener('sessionend', () => { button.disabled = false; });
	function update() {
		if (!active || renderer.xr.isPresenting) return;
		hideHeadParts();
		prisoner.updateWorldMatrix(true, false);
		eye.set(0, 1.68, .1); prisoner.localToWorld(eye); camera.position.copy(eye);
		direction.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
		camera.lookAt(eye.clone().add(direction)); camera.updateMatrixWorld(true);
	}
	return { update, setActive, get active() { return active; } };
}
