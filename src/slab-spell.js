import { updateWallFragments } from './wall-fragments.js';
import { wallBricksSound } from './falling-bricks-sound.js';
import { createCeramicBreakSound } from './ceramic-break-sound.js';
import { createFoodTrayEncounter } from './food-tray-encounter.js';
import { createMantisEncounter } from './mantis-encounter.js';
import { createScorpionEncounter } from './scorpion-encounter.js';
import { createBowlPlant } from './bowl-plant.js';
import { createKomodoEncounter } from './komodo-encounter.js';
import { createCobraEncounter } from './cobra-encounter.js';
import { createCatEncounter } from './cat-encounter.js';
import { createSpiderEncounter } from './spider-encounter.js';
import { createTrollEncounter } from './troll-encounter.js';
import { createHeadScratch } from './head-scratch.js';
import { createMummyEncounter } from './mummy-encounter.js';
import { createNoFaceEncounter } from './no-face-encounter.js';
import { createZombieEncounter } from './zombie-encounter.js';
import { createBatEncounter } from './bat-encounter.js';
import { createRoachEncounter } from './roach-encounter.js';
import { createSnakeEncounter } from './snake-encounter.js';
import { createSlabHoles } from './slab-holes.js';
import * as THREE from 'three';
import { syncHandSpellRay } from './hand-spell-ray.js';
import { createSlabImpacts } from './slab-impact.js';
import { statueExplosionSound } from './statue-explosion-sound.js';

export function createSlabSpell(scene, prisoner) {
	const slabImpacts = createSlabImpacts(scene);
	let score = 0;
	const scoredTargets = new WeakSet();
	function addPoint(){
		score++;
		const counter=document.querySelector('#score-value');
		if(counter)counter.textContent=String(score);
	}
	function awardPoint(target, wasVisible) {
		if (!wasVisible || target.visible || scoredTargets.has(target)) return;
		scoredTargets.add(target);
		addPoint();
	}
	const ceramicBreak=createCeramicBreakSound();
 async function prepare() {}
 function unlockAudio() {
	ceramicBreak.unlock();wallBricksSound.unlock();
  encounter.unlockAudio();batEncounter.unlockAudio();catEncounter.unlockAudio();
  scorpionEncounter.unlockAudio();bowlPlant.unlockAudio();
 }
	const bowlPlant = createBowlPlant(scene, prisoner);
	const komodoEncounter = createKomodoEncounter(scene, prisoner);
	const cobraEncounter = createCobraEncounter(scene, prisoner);
	const foodTray = createFoodTrayEncounter(scene);
	const catEncounter=createCatEncounter(scene,prisoner);
	const scorpionEncounter=createScorpionEncounter(scene,prisoner);
	const mantisEncounter=createMantisEncounter(scene);
	const spiderEncounter = createSpiderEncounter(scene);
	const mummyEncounter = createMummyEncounter(scene, prisoner);
	const zombieEncounter = createZombieEncounter(scene, prisoner);
	const noFaceEncounters = [
		createNoFaceEncounter(scene, prisoner),
		createNoFaceEncounter(scene, prisoner, { direction: -1, openWall: false, delay: .45 }),
	];
	const doorNoFaceEncounters=[createNoFaceEncounter(scene,prisoner,{entrance:'door',arachnid:true}),createNoFaceEncounter(scene,prisoner,{entrance:'door',arachnid:true,direction:-1,openWall:false,delay:.45})];
 const allNoFaces=[...noFaceEncounters,...doorNoFaceEncounters];
	const trollEncounter = createTrollEncounter(scene,prisoner,()=>{zombieEncounter.releaseGrab();mummyEncounter.releaseGrab();});
	const batEncounter = createBatEncounter(scene);
	const headScratch = createHeadScratch(prisoner,batEncounter.bats);
	const roachEncounter = createRoachEncounter(scene);
	let destroyedSlabs = 0;
	const encounter = createSnakeEncounter(scene, prisoner);
	const addHole = createSlabHoles(scene);
	const matrix = new THREE.Matrix4();
	const activeRays = [];
	function emitRay(point) {
		prisoner.userData.castWand?.(point);
		const ray = new THREE.Mesh(
			new THREE.CylinderGeometry(0.012, 0.045, 1, 8, 1, true),
			new THREE.MeshBasicMaterial({ color: 0x8cecff, transparent: true, opacity: 0.92, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
		);
		ray.name = 'Rayo mágico del prisionero';
		syncHandSpellRay(ray, prisoner, point);
		ray.frustumCulled = false;
		scene.add(ray);
		const flash = new THREE.PointLight(0x62dfff, 4, 1.8);
		flash.position.copy(point);
		scene.add(flash);
		activeRays.push({ ray, flash, target: point.clone(), life: 0.18 });
	}
	function updateRays() {
		for (const effect of activeRays) syncHandSpellRay(effect.ray, prisoner, effect.target);
	}
	function targetEncounter(target) {
		const noFace = allNoFaces.find(encounter => target === encounter.root);
		if (noFace) return noFace;
		if (target === cobraEncounter.root) return cobraEncounter;
		if (target === komodoEncounter.root) return komodoEncounter;
		if (target === encounter.snake) return encounter;
		if (target?.userData.spellTarget === 'toad') return catEncounter;
		if (target?.userData.spellTarget === 'scorpion') return scorpionEncounter;
		if (target?.userData.spellTarget === 'mantis') return mantisEncounter;
		if (target?.userData.spellTarget === 'green-bug') return foodTray;
		if (target?.userData.spellTarget === 'roach') return roachEncounter;
		if (target?.userData.spellTarget === 'bat') return batEncounter;
		if (target?.userData.spellTarget === 'zombie') return zombieEncounter;
		if (target?.userData.spellTarget === 'mummy') return mummyEncounter;
		if (target?.userData.spellTarget === 'troll') return trollEncounter;
		if (target?.userData.spellTarget === 'spider') return spiderEncounter;
		return null;
	}
	function aimPoint(target) {
		if (target.userData.spellTarget === 'toad') return target.localToWorld(new THREE.Vector3(0, .3, 0));
		if (target === cobraEncounter.root) return target.localToWorld(new THREE.Vector3(0, 1.5, 0));
		if (target === komodoEncounter.root) {
			const head = target.children[0];
			target.updateWorldMatrix(true, true);
			return head.localToWorld(new THREE.Vector3(0, .5, .6));
		}
		if (['zombie','mummy','troll'].includes(target.userData.spellTarget)) {
			target.updateWorldMatrix(true,false);
			return target.localToWorld(new THREE.Vector3(0,1.15,0));
		}
		return target.position.clone();
	}
	function crushWithBroom() {
		const broom = prisoner.getObjectByName('Escoba mágica del prisionero');
		const strikeOrigin = (broom?.getObjectByName('broom-ground-contact') ?? broom)?.getWorldPosition(new THREE.Vector3()) ?? prisoner.localToWorld(new THREE.Vector3(0, 1, 0));
		const insects = [
			...roachEncounter.roaches.filter(roach => !roach.defeated).map(roach => ({ root: roach.root, encounter: roachEncounter })),
			...spiderEncounter.spiders.filter(spider => !spider.defeated).map(spider => ({ root: spider.root, encounter: spiderEncounter })),
			{ root: scorpionEncounter.root, encounter: scorpionEncounter },
			{ root: mantisEncounter.root, encounter: mantisEncounter },
			...(foodTray.transformed ? [{ root: foodTray.greenBug, encounter: foodTray }] : []),
		].filter(({ root }) => root.visible && !root.userData.broomCrushed)
			.map(insect => ({ ...insect, distance: insect.root.getWorldPosition(new THREE.Vector3()).distanceTo(strikeOrigin) }))
			.filter(insect => insect.distance <= 2.4)
			.sort((a, b) => a.distance - b.distance);

		if (insects.length) {
			const { root, encounter: handler } = insects[0];
			if (handler.target(root)) {
				handler.defeat(root);
				scene.attach(root);
				root.visible = true;
				root.rotation.x = 0; root.rotation.z = 0;
				root.scale.y = Math.min(root.scale.y, 0.09);
				root.scale.x *= 1.15; root.scale.z *= 1.15;
				root.updateWorldMatrix(true, true);
				const bounds = new THREE.Box3().setFromObject(root);
				root.position.y += .035 - bounds.min.y;
				root.userData.broomCrushed = true;
				delete root.userData.spellTarget;
				prisoner.userData.recordBroomCrush?.();
				return true;
			}
		}

		const ant = foodTray.nearbyAnt(strikeOrigin);
		if (ant && ant.point.distanceTo(strikeOrigin) <= 2.4 && foodTray.crushAnt(ant.mesh, ant.instanceId)) {
			prisoner.userData.recordBroomCrush?.();
			return true;
		}
		return false;
	}
	function cast(hit) {
		if (prisoner.userData.broomMode) {
			prisoner.userData.swingBroom?.(crushWithBroom);
			return;
		}
		ceramicBreak.unlock();
		statueExplosionSound.unlock();
  wallBricksSound.unlock();
		encounter.unlockAudio();
		batEncounter.unlockAudio();
		catEncounter.unlockAudio();
		scorpionEncounter.unlockAudio();
		if (hit.target?.userData.spellTarget === 'cobra-wall') cobraEncounter.unlockAudio();
		if (hit.target?.userData.spellTarget === 'komodo-wall') komodoEncounter.unlockAudio();
		if (hit.target?.userData.spellTarget === 'troll-wall') trollEncounter.unlockAudio();
		bowlPlant.unlockAudio();
		if (hit.target?.userData.spellTarget === 'right-wall') zombieEncounter.unlockAudio();
		if (hit.target?.userData.spellTarget === 'mummy-wall') mummyEncounter.unlockAudio();
		if (hit.mesh?.userData.draggableSlabs && hit.point) {
			const direction = hit.point.clone().sub(prisoner.getWorldPosition(new THREE.Vector3())).setY(0);
			if (direction.lengthSq() > 0.0001) prisoner.rotation.y = Math.atan2(direction.x, direction.z);
		}
		const shot = { ...hit, point: hit.point.clone() };
		if(trollEncounter.dead)return;
		if(trollEncounter.stunned){emit({point:shot.point});return;}
		if (encounter.incapacitated && shot.target !== encounter.snake) { emit({point:shot.point}); return; }
		if ((zombieEncounter.grabbing || mummyEncounter.grabbing) && hit.target !== prisoner.userData.waistGrabOwner) { emit(shot); return; }
		const handler=targetEncounter(shot.target);
		if(handler){if(handler.target(shot.target))shot.point.copy(aimPoint(shot.target));else{shot.target=null;shot.mesh=null;}}
		emit(shot);

	}
	function emit({ mesh, instanceId, point, target }) {
		emitRay(point);
		if (target?.userData.spellTarget === 'plant-flower') point = target.getWorldPosition(new THREE.Vector3());
		const removeSlab = mesh?.isInstancedMesh && mesh.userData.draggableSlabs && instanceId !== undefined && !mesh.userData.removedSlabs?.has(instanceId);
		if (target?.userData.spellTarget === 'oval-mirror') {
			prisoner.userData.transformWandToBroom?.();
		} else if (target === encounter.snake) {
			const wasVisible = target.visible;
			encounter.target();
			encounter.defeat();
			awardPoint(target, wasVisible);
		} else if (target?.userData.spellTarget === 'plant-flower') {
			bowlPlant.defeatFlower(target);
		} else if (target?.userData.spellTarget === 'ant-army') {
			foodTray.hitAnt(mesh, instanceId);
		} else if (target?.userData.spellTarget === 'food-tray') {
			foodTray.hit();
		} else if (target?.userData.spellTarget === 'water-bowl') {
			bowlPlant.breakBowl();
		} else if (target?.userData.spellTarget === 'torch') {
			spiderEncounter.spawn();
		} else if (target?.userData.spellTarget === 'troll-wall') {
			trollEncounter.breakWall(point);
		} else if (target?.userData.spellTarget === 'door-overhead') {
   doorNoFaceEncounters.forEach(encounter=>encounter.spawn(point));
		} else if (target?.userData.spellTarget === 'right-wall') {
			if (point.z > 0) noFaceEncounters.forEach(encounter => encounter.spawn(point));
			else zombieEncounter.breakWall(point);
		} else if (target?.userData.spellTarget === 'komodo-wall') {
			komodoEncounter.spawn(point);
		} else if (target?.userData.spellTarget === 'cobra-wall') {
			cobraEncounter.spawn(point);
		} else if (target?.userData.spellTarget === 'mummy-wall') {
			mummyEncounter.breakWall(point);
		} else if (targetEncounter(target)) {
			const wasVisible = target.visible;
			targetEncounter(target).defeat(target);
			awardPoint(target, wasVisible);
		} else if (removeSlab) {
		// Remove just the selected instance; keep the remaining slab identifiers stable.
		mesh.getMatrixAt(instanceId, matrix);
		addHole(mesh, matrix);
		matrix.elements[14] -= 3;
		mesh.setMatrixAt(instanceId, matrix);
		mesh.instanceMatrix.needsUpdate = true;
		mesh.userData.removedSlabs ??= new Set();
		mesh.userData.removedSlabs.add(instanceId);
		ceramicBreak.play();
		mesh.computeBoundingBox();
		mesh.computeBoundingSphere();
		destroyedSlabs++;
		if (destroyedSlabs < 2 || destroyedSlabs > 6) {
			slabImpacts.emit(point);
			statueExplosionSound.play();
		}
		if (destroyedSlabs === 4) encounter.spawn(point);
		if (destroyedSlabs === 5) scorpionEncounter.spawn(point);
		if (destroyedSlabs === 6) mantisEncounter.spawn(point);
		if (destroyedSlabs === 2) roachEncounter.spawn(point);
		if (destroyedSlabs === 3) batEncounter.spawn(point);
		}
		if (!target && (mesh?.userData.draggableSlabs || mesh?.name === 'floor')) catEncounter.spawn(point);
	}
	function update(dt) {
		slabImpacts.update(dt);
  for (let index = activeRays.length - 1; index >= 0; index--) {
   const effect = activeRays[index];
   effect.life -= dt;
   effect.ray.material.opacity = Math.max(0, effect.life / 0.18);
   effect.flash.intensity = Math.max(0, 4 * effect.life / 0.18);
   if (effect.life <= 0) {
    scene.remove(effect.ray, effect.flash);
    effect.ray.geometry.dispose(); effect.ray.material.dispose();
    activeRays.splice(index, 1);
   }
  }
  updateWallFragments(scene,dt);
		cobraEncounter.update(dt);
		komodoEncounter.update(dt);
		bowlPlant.update(dt);
		foodTray.update(dt);
		encounter.update(dt);
		roachEncounter.update(dt);
		spiderEncounter.update(dt);
		batEncounter.update(dt);
		zombieEncounter.update(dt);
		allNoFaces.forEach(encounter => encounter.update(dt));
		mummyEncounter.update(dt);
		trollEncounter.update(dt);
		catEncounter.update(dt);
		scorpionEncounter.update(dt);
		mantisEncounter.update(dt);
		headScratch.update(dt);
	}
	return { cast, update, updateRays, prepare, unlockAudio, addPoint, get score(){return score;}, get isCasting(){return false;}, encounter, roachEncounter, batEncounter, zombieEncounter, mummyEncounter, trollEncounter, spiderEncounter, catEncounter, headScratch };
}
