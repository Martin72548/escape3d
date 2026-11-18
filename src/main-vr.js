import { createAdaptiveResolution } from './adaptive-resolution.js';
import { createDungeonMusic } from './dungeon-music.js';
import { enableFullscreen } from './desktop-fullscreen.js';
import { enableDungeonRestart } from './restart-dungeon.js';

enableDungeonRestart();
import { enableFirstPersonView } from './first-person-view.js';
import { enablePrisonerKeyboard } from './desktop-prisoner-controls.js';
import { enableSpellClicks } from './desktop-spell-input.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CMEventTypes, ControllersManager, XRControllerLabelHelper, XRSessionModeButton, XRTeleportMoveControl } from './vendor/threexrtoolkit.js';
import { addSceneContent } from './scene-content.js';
import { createGameOverControls } from './game-over-controls.js';

const container = document.querySelector('#scene-container');
const dungeonIntro = document.querySelector('#dungeon-intro');
enableFullscreen();
const buttonContainer = document.querySelector('#xr-button-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbfd7ea);
scene.fog = new THREE.Fog(0xbfd7ea, 18, 42);

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
camera.position.set(7, 5, 9);

const renderer = new THREE.WebGLRenderer({ antialias: true });
const updateResolution = createAdaptiveResolution(renderer);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType('local-floor');
container.appendChild(renderer.domElement);

// OrbitControls permite recorrer la versión de pantalla antes de entrar en VR.
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.target.set(0, 0.8, -1);
orbitControls.enableDamping = true;
orbitControls.enablePan = false;
orbitControls.minDistance = 2;
orbitControls.maxDistance = 14;
orbitControls.zoomSpeed = 0.6;
orbitControls.maxPolarAngle = Math.PI * 0.49;

const { floorGeometry, grid, axes, updateHiddenKey, slabSpell, prisoner, museum, onSceneClick } = addSceneContent(scene);
const dungeonMusic = createDungeonMusic();
function startDungeonMusic(event) {
 if (museum.active || prisoner.userData.dead) return;
 if (dungeonIntro?.open && !event.target.closest?.('#dungeon-intro-close')) return;
 dungeonMusic.start();
}
window.addEventListener('pointerdown', startDungeonMusic, { capture: true });
window.addEventListener('keydown', startDungeonMusic, { capture: true });
renderer.xr.addEventListener('sessionstart', () => dungeonMusic.start());
// Prepare spell resources during startup so the first click is responsive.
slabSpell.prepare(renderer,camera).catch(error=>console.warn('Preparacion del rayo:',error));
document.querySelector('#dungeon-intro-close')?.addEventListener('pointerdown',()=>slabSpell.unlockAudio(),{once:true});
document.querySelector('#dungeon-intro-close')?.addEventListener('keydown',event=>{
 if(event.key==='Enter'||event.key===' ')slabSpell.unlockAudio();
});
const firstPerson=enableFirstPersonView({camera,prisoner,renderer,orbitControls});
// Keep desktop orbit and wheel zoom inside the current scene.
orbitControls.addEventListener('change', () => {
 if (renderer.xr.isPresenting || firstPerson.active) return;
 const outdoors = museum.active && museum.level === 4;
 orbitControls.maxDistance = outdoors ? 24 : 14;
 camera.position.clamp(
  new THREE.Vector3(outdoors ? -17 : -9.4, 0.5, outdoors ? -22 : -9.4),
  new THREE.Vector3(outdoors ? 17 : 9.4, outdoors ? 14 : 5.5, outdoors ? 22 : 9.4)
 );
 camera.lookAt(orbitControls.target);
});
const prisonerKeyboard=enablePrisonerKeyboard({prisoner,camera,renderer,canTurn:()=>!firstPerson.active && (museum.active ? !museum.isCasting : !slabSpell.isCasting)});
enableSpellClicks({ scene, camera, renderer, onSlabClick: onSceneClick });

// XR Components crea los controladores y resuelve teleportación, movimiento
// continuo con joystick y giro por saltos. El piso es la superficie caminable.
const controllers = new ControllersManager(renderer.xr, scene, {});
const locomotion = new XRTeleportMoveControl(renderer.xr, controllers, scene, {
	enabledHands: 'both',
	enableContinousMotion: true,
	enableControllerTeleport: true,
	restrictVerticalMovement: true,
});
locomotion.setTeleportSurfaces(floorGeometry);

// A canvas texture keeps the map readable in-headset without adding a DOM menu.
function createMapPanel() {
	const canvas = document.createElement('canvas');
	canvas.width = 640;
	canvas.height = 440;
	const ctx = canvas.getContext('2d');
	ctx.fillStyle = '#d7c49b';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.strokeStyle = '#4b3928';
	ctx.lineWidth = 16;
	ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);
	ctx.fillStyle = '#172033';
	ctx.font = 'bold 32px system-ui';
	ctx.fillText('FORMAS DE LA ESCENA', 40, 58);
	const shapes = [
		{ x: 105, color: '#ff6b6b', label: 'Cubo' },
		{ x: 235, color: '#ffc857', label: 'Cono' },
		{ x: 365, color: '#4ecdc4', label: 'Esfera' },
		{ x: 495, color: '#7c83fd', label: 'Toroide' },
	];
	for (const [index, shape] of shapes.entries()) {
		ctx.fillStyle = shape.color;
		if (index === 0) ctx.fillRect(shape.x, 145, 72, 72);
		else if (index === 1) { ctx.beginPath(); ctx.moveTo(shape.x + 36, 138); ctx.lineTo(shape.x + 76, 217); ctx.lineTo(shape.x - 4, 217); ctx.closePath(); ctx.fill(); }
		else if (index === 2) { ctx.beginPath(); ctx.arc(shape.x + 36, 181, 40, 0, Math.PI * 2); ctx.fill(); }
		else { ctx.lineWidth = 18; ctx.beginPath(); ctx.arc(shape.x + 36, 181, 31, 0, Math.PI * 2); ctx.strokeStyle = shape.color; ctx.stroke(); }
		ctx.fillStyle = '#172033'; ctx.font = '20px system-ui'; ctx.fillText(shape.label, shape.x - 1, 260);
	}
	ctx.fillStyle = '#526079';
	ctx.font = '22px system-ui';
	ctx.fillText('Arrastra las figuras y explora la cuadricula', 40, 350);
	ctx.fillText('W A S D para desplazarte', 40, 390);
	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, toneMapped: false });
	const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.79), material);
	panel.name = 'VR scene map';
	panel.visible = false;
	panel.renderOrder = 10;
	scene.add(panel);
	return panel;
}

const mapPanel = createMapPanel();
let controllerLabels = null;
let labelsInitPromise = null;
function initControllerLabels() {
	const rightController = controllers.right;
	if (!rightController || labelsInitPromise) return;
	controllerLabels = new XRControllerLabelHelper({
		handController: rightController,
		labels: { 'a-button': 'Mapa', 'b-button': 'Guias' },
	});
	labelsInitPromise = controllerLabels.init().catch((error) => {
		console.warn('No se pudieron cargar las etiquetas del control VR:', error);
		labelsInitPromise = null;
	});
}
controllers.addEventListener(CMEventTypes.ON_RIGHT_CONTROLLER_CONNECTED, initControllerLabels);
renderer.xr.addEventListener('sessionstart', initControllerLabels);

function showMapInFrontOfViewer() {
	const xrCamera = renderer.xr.getCamera(camera);
	xrCamera.updateMatrixWorld(true);
	const viewerPosition = new THREE.Vector3();
	const viewerDirection = new THREE.Vector3();
	xrCamera.getWorldPosition(viewerPosition);
	xrCamera.getWorldDirection(viewerDirection);
	mapPanel.position.copy(viewerPosition).addScaledVector(viewerDirection, 1.25);
	mapPanel.position.y -= 0.08;
	mapPanel.lookAt(viewerPosition);
	mapPanel.visible = true;
}

let guidesVisible = true;
const chasmJumpDirection = new THREE.Vector3();
controllers.addEventListener(CMEventTypes.ON_BUTTON_DOWN, (event) => {
	if (event.handedness === 'left' && event.button === 'ButtonX' && prisoner.userData.jumpAcrossChasm) {
		renderer.xr.getCamera(camera).getWorldDirection(chasmJumpDirection);
		prisoner.userData.jumpAcrossChasm(chasmJumpDirection.setY(0));
		return;
	}
	if (event.handedness !== 'right') return;
	if (event.button === 'ButtonA') {
		if (mapPanel.visible) mapPanel.visible = false;
		else showMapInFrontOfViewer();
	} else if (event.button === 'ButtonB') {
		guidesVisible = !guidesVisible;
		grid.visible = guidesVisible;
		axes.visible = guidesVisible;
	}
});

const xrButton = new XRSessionModeButton(renderer, {
	mode: 'immersive-vr',
	label: 'VR disponible',
	activeLabel: 'Quitter la VR',
	unsupportedLabel: 'VR non disponible',
	optionalFeatures: ['local-floor', 'bounded-floor'],
});
buttonContainer.appendChild(xrButton.button);

let introRendered = false;
let previousTime = performance.now();
const gameOverControls = createGameOverControls(prisoner);
let elapsedTime = 0;
let previousLevel = 1;
let victoryCameraAge=-1;
const victoryCameraFrom=new THREE.Vector3(),victoryTargetFrom=new THREE.Vector3();

function resize() {
	introRendered = false;
	const { clientWidth, clientHeight } = container;
	camera.aspect = clientWidth / clientHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(clientWidth, clientHeight, false);
}

function animate() {
 if (museum.active || prisoner.userData.dead || prisoner.userData.gameOver) dungeonMusic.stop();
	const currentTime = performance.now();
	const deltaTime = Math.min((currentTime - previousTime) / 1000, 0.1);
	previousTime = currentTime;
	if (dungeonIntro?.open && !renderer.xr.isPresenting) {
		if (!introRendered) { renderer.render(scene, camera); introRendered = true; }
		return;
	}
	introRendered = false;
	updateResolution(currentTime);
	elapsedTime += deltaTime;
	if (!renderer.xr.isPresenting && !firstPerson.active) orbitControls.update();
	controllers.update(elapsedTime, deltaTime);
	locomotion.update(deltaTime);
	prisoner.userData.updateWakeSequence?.(deltaTime, camera.position);
	prisonerKeyboard.update(deltaTime);
	if (!museum.active) slabSpell.update(deltaTime);
	museum.update(deltaTime);

	if(museum.level!==previousLevel){
		previousLevel=museum.level;
		if(previousLevel===4)document.querySelector('#first-person-hint').textContent='Arrastra para mirar · WASD para caminar · Espacio para saltar · Clic para lanzar un rayo';
		if(previousLevel===4&&!renderer.xr.isPresenting&&!firstPerson.active){camera.far=280;camera.updateProjectionMatrix();camera.position.set(6.6,7.8,21);orbitControls.target.set(0,1,5.6);orbitControls.update();}
	}
	if(prisoner.userData.victoryCelebrating&&!renderer.xr.isPresenting&&!firstPerson.active){
		if(victoryCameraAge<0){victoryCameraAge=0;victoryCameraFrom.copy(camera.position);victoryTargetFrom.copy(orbitControls.target);}
		if(victoryCameraAge<2.5){victoryCameraAge=Math.min(2.5,victoryCameraAge+deltaTime);const t=THREE.MathUtils.smoothstep(victoryCameraAge,0,2.5);camera.position.lerpVectors(victoryCameraFrom,new THREE.Vector3(0,10,10),t);orbitControls.target.lerpVectors(victoryTargetFrom,new THREE.Vector3(0,2,-14.5),t);orbitControls.update();}
	}
	prisoner.userData.updateAppearance?.(deltaTime);
	// Read the hand only after this frame's skeleton and encounter poses are applied.
	slabSpell.updateRays();
	updateHiddenKey(deltaTime);
	firstPerson.update();
	gameOverControls.update(deltaTime);
	renderer.render(scene, camera);
	slabSpell.finishRayFrame?.();
}

window.addEventListener('resize', resize);
resize();
renderer.setAnimationLoop(animate);
