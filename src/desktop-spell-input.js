import * as THREE from 'three';

// Select spell targets without moving floor slabs.
export function enableSpellClicks({ scene, camera, renderer, onSlabClick }) {
 const canvas = renderer.domElement;
 const raycaster = new THREE.Raycaster();
 const pointer = new THREE.Vector2();
 const candidates = [];
 let press = null;
 // Fire on press; releasing or holding the button never adds another shot.
 canvas.addEventListener('pointerdown', event => {
  if (event.button !== 0 || renderer.xr.isPresenting || press !== null) return;
  press = event.pointerId;
  const rect = canvas.getBoundingClientRect();
  pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
  camera.updateMatrixWorld();
  scene.updateMatrixWorld();
  raycaster.setFromCamera(pointer, camera);
  candidates.length = 0;
  scene.traverseVisible(object => {
   if (object.isMesh || object.isSprite || object.isLine || object.isPoints) candidates.push(object);
  });
  const hit = raycaster.intersectObjects(candidates, false)[0];
  let target = hit?.object;
  while (target && !target.userData.spellTarget) target = target.parent;
  onSlabClick?.({
   mesh: hit?.object, instanceId: hit?.instanceId, target,
   point: hit?.point.clone() ?? raycaster.ray.at(25, new THREE.Vector3()),
  });
 }, { capture: true });
 const cancel = event => { if (!event || event.pointerId == null || event.pointerId === press) press = null; };
 canvas.addEventListener('pointercancel', cancel);
 window.addEventListener('pointerup', cancel);
 window.addEventListener('blur', cancel);
 renderer.xr.addEventListener('sessionstart', cancel);
}
