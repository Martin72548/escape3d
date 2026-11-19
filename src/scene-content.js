import { createRealisticTorch } from './realistic-torch.js';
import { createMedievalMuseum } from './medieval-museum.js';
import { createDungeonExit } from './dungeon-exit.js';
import { createSlabSpell } from './slab-spell.js';
import { createPrisoner } from './prisoner.js';
import { installPrisonerSleep } from './prisoner-sleep.js';
import { hideKeyUnderSlab } from './hidden-key.js';
import * as THREE from 'three';
import { createStoneMaterial, addStoneCourses } from './stone-masonry.js';
import { createMedievalFloorMaterial } from './medieval-floor-material.js';
import { addOvalMirror } from './oval-mirror.js';
import { addAncientKeyMarks } from './ancient-key-marks.js';
import { showFireMessage } from './fire-message.js';
import { translate } from './language.js';

export function addSceneContent(scene) {
	scene.background = new THREE.Color(0x191817);
	scene.fog = new THREE.Fog(0x191817, 16, 32);
	scene.add(new THREE.HemisphereLight(0xb5bac2, 0x383024, 0.9));
	const stoneMaterial = createStoneMaterial();
	const floorMaterial = createMedievalFloorMaterial();
	let masonrySeed = 100;
	let floorStones;
	const wallStones = [];
	function masonry(width, height, x, y, z, rotationX = 0, rotationY = 0) {
		const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshStandardMaterial({ color: 0x34312b, roughness: 1 }));
		mesh.position.set(x, y, z);
		mesh.rotation.set(rotationX, rotationY, 0);
		mesh.receiveShadow = true;
		scene.add(mesh);
		const stones = addStoneCourses(scene, rotationX < 0 ? floorMaterial : stoneMaterial, width, height, x, y, z, rotationX, rotationY, masonrySeed++, width === height, { jointed: rotationX < 0 });
		if (rotationX < 0) floorStones = stones;
		if (rotationX === 0) wallStones.push(stones);
		if (rotationX < 0) mesh.material.color.set(0x211c16);
		if (x === 10 && height === 6) {
			mesh.userData.spellTarget = stones.userData.spellTarget = 'right-wall';
		}
		if (x === -10 && height === 6) mesh.userData.spellTarget = stones.userData.spellTarget = 'troll-wall';
		if (z === -10 && height === 6) mesh.userData.spellTarget = stones.userData.spellTarget = 'komodo-wall';
		if (z === -10 && height === 6 && x > 0) mesh.userData.spellTarget = stones.userData.spellTarget = 'cobra-wall';
		if (z === 10 && height === 6) mesh.userData.spellTarget = stones.userData.spellTarget = 'mummy-wall';
		if(z===-10&&width===2.4&&height===2.4)mesh.userData.spellTarget=stones.userData.spellTarget='door-overhead';
		return mesh;
	}
	const floor = masonry(20, 20, 0, 0, 0, -Math.PI / 2);
	floor.name = 'floor';
	const floorGeometry = floor.geometry;
	// The locomotion toolkit consumes geometry in world coordinates.
	const teleportGeometry = floorGeometry.clone().rotateX(-Math.PI / 2);
	masonry(8.8, 6, -5.6, 3, -10);
	masonry(8.8, 6, 5.6, 3, -10);
	masonry(2.4, 2.4, 0, 4.8, -10);
	masonry(20, 6, -10, 3, 0, 0, Math.PI / 2);
	masonry(20, 6, 10, 3, 0, 0, -Math.PI / 2);
	masonry(20, 6, 0, 3, 10, 0, Math.PI);
	masonry(20, 20, 0, 6, 0, Math.PI / 2);
	addOvalMirror(scene);

 const torches=[];
 for(const x of [-6,6])for(const z of [-9.65,9.65])torches.push(createRealisticTorch(scene,{position:[x,3,z],rotationY:z<0?0:Math.PI,intensity:32,seed:torches.length+1,interactive:true}));
	const grid = new THREE.GridHelper(20, 20, 0x60708a, 0xaab7c8);
	grid.name = 'scene-grid';
	grid.position.y = 0.006;
	grid.visible = false;
	scene.add(grid);
	const axes = new THREE.AxesHelper(2.5);
	axes.name = 'scene-axes';
	axes.position.y = 0.012;
	axes.visible = false;
	scene.add(axes);
	const prisoner = createPrisoner();
	prisoner.scale.setScalar(2);
	prisoner.position.set(-3, 0.02, -1);
	scene.add(prisoner);
	const movableObjects = [];
	const slabSpell = createSlabSpell(scene, prisoner);
	const museum = createMedievalMuseum(scene, prisoner,()=>slabSpell.addPoint());
	installPrisonerSleep(prisoner);
	function showRibbonMessage(hasAllRibbons) {
		const message = hasAllRibbons
			? translate("Tresse une corde pour atteindre l'autre bout.", 'Trenza una cuerda para llegar al otro lado.')
			: translate("On dirait que tu n'as pas assez de rubans. Les as-tu tous pris ?", 'Parece que no tienes suficientes cintas. ¿Las has recogido todas?');
		showFireMessage(message, { duration: 5, verticalPosition: .18, centered: true, multiline: true });
	}
	function showThrowHint() {
		showFireMessage(translate('Appuie sur Espace pour lancer la corde.', 'Pulsa Espacio para lanzar la cuerda.'), { duration: 4, verticalPosition: .18, centered: true });
	}
	const dungeonExit = createDungeonExit(scene, stoneMaterial, floorMaterial, prisoner, () => museum.enter(), slabSpell.addPoint, showRibbonMessage, showThrowHint);
	let corridorHintShown = false;
	function onSceneClick(hit) {
		if (prisoner.userData.sleeping || prisoner.userData.wakingUp || prisoner.userData.crossingDungeonExit) return;
		for(let object=hit?.mesh;object;object=object.parent)if(object.userData.returnToStart){window.location.reload();return;}
		dungeonExit.unlockAudio();
		if (museum.active) { museum.cast(hit); return; }
		slabSpell.cast(hit);
	}
	const revealKey = hideKeyUnderSlab(scene, new THREE.Vector3(3.4, 0, -1), dungeonExit.open);
	addAncientKeyMarks(floorStones, wallStones);
	function updateHiddenKey(dt = 0) {
		if (museum.active) return;
		torches.forEach(torch=>torch.update(dt));
		revealKey(slabSpell.score, dt);
		const wasCrossing = prisoner.userData.crossingDungeonExit;
		dungeonExit.update(dt);
		if (!corridorHintShown && prisoner.userData.inExitCorridor) {
			corridorHintShown = true;
			showFireMessage(translate('Appuie sur Espace pour sauter et attraper les rubans rouges.', 'Pulsa Espacio para saltar y recoger las cintas rojas.'), { duration: 5, verticalPosition: .18, centered: true });
		}
		if (!wasCrossing && prisoner.userData.crossingDungeonExit) {
			slabSpell.batEncounter.stopAudio();
			slabSpell.catEncounter.stopAudio();
		}
	}
	return { floor, floorGeometry: teleportGeometry, grid, axes, movableObjects, updateHiddenKey, slabSpell, prisoner, museum, onSceneClick };
}
