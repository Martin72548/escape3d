import * as THREE from 'three';

const width = 2.3;
const radius = width / 2;
const springHeight = 2.65;
const height = springHeight + radius;
const boardCount = 7;
const thickness = .16;

function createOakTexture() {
 const canvas = document.createElement('canvas');
 const boardPixels = 96;
 canvas.width = boardCount * boardPixels;
 canvas.height = 1024;
 const context = canvas.getContext('2d');
 let seed = 173;
 const random = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
 };

 for (let board = 0; board < boardCount; board++) {
  const left = board * boardPixels;
  const tone = [0, 13, -6, 8, -3, 16, 4][board];
  const grain = context.createLinearGradient(left, 0, left + boardPixels, 0);
  for (const [stop, shade] of [[0, -26], [.1, 4], [.42, 13], [.72, 1], [.94, 7], [1, -24]]) {
   grain.addColorStop(stop, `rgb(${111 + tone + shade},${73 + tone + shade},${43 + tone + shade})`);
  }
  context.save();
  context.beginPath();
  context.rect(left, 0, boardPixels, canvas.height);
  context.clip();
  context.fillStyle = grain;
  context.fillRect(left, 0, boardPixels, canvas.height);

  const knotX = left + 25 + random() * 46;
  const knotY = 250 + random() * 550;
  for (let i = 0; i < 150; i++) {
   const x = left + random() * boardPixels;
   const phase = random() * Math.PI * 2;
   const separation = x - knotX;
   const bend = Math.sign(separation) * 13 * Math.exp(-Math.abs(separation) / 14);
   context.strokeStyle = i % 4 ? 'rgba(43,23,12,.19)' : 'rgba(222,167,105,.27)';
   context.lineWidth = .35 + random() * 1.3;
   context.beginPath();
   for (let y = 0; y <= canvas.height; y += 8) {
    const offset = Math.sin(y * .013 + phase) * 2
     + bend * Math.exp(-((y - knotY) ** 2) / 2300);
    if (y === 0) context.moveTo(x + offset, y);
    else context.lineTo(x + offset, y);
   }
   context.stroke();
  }
  const knot = context.createRadialGradient(0, 0, 0, 0, 0, 9);
  knot.addColorStop(0, 'rgba(44,23,11,.86)');
  knot.addColorStop(.52, 'rgba(53,26,12,.49)');
  knot.addColorStop(.72, 'rgba(170,113,62,.36)');
  knot.addColorStop(1, 'rgba(79,46,23,0)');
  context.translate(knotX, knotY);
  context.scale(.7, 2.5);
  context.fillStyle = knot;
  context.fillRect(-9, -9, 18, 18);
  context.restore();
 }

 const texture = new THREE.CanvasTexture(canvas);
 texture.colorSpace = THREE.SRGBColorSpace;
 texture.anisotropy = 8;
 return texture;
}

export function addChapelDoor(hinge, iron) {
 const oak = createOakTexture();
 const wood = new THREE.MeshStandardMaterial({
  map: oak, bumpMap: oak, bumpScale: .024, roughness: .91,
 });
 const endGrain = new THREE.MeshStandardMaterial({ color: 0x51341f, roughness: .95 });
 function addMesh(geometry, material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = mesh.receiveShadow = true;
  hinge.add(mesh);
  return mesh;
 }

 const boardWidth = width / boardCount;
 for (let board = 0; board < boardCount; board++) {
  const left = board * boardWidth + .006;
  const right = (board + 1) * boardWidth - .006;
  const shape = new THREE.Shape();
  shape.moveTo(left, .012);
  shape.lineTo(right, .012);
  // Sample the same semicircle as the stone opening across each board.
  const archRadius = radius - .009;
  const rightAngle = Math.acos((right - radius) / radius);
  const leftAngle = Math.acos((left - radius) / radius);
  for (let step = 0; step <= 12; step++) {
   const angle = THREE.MathUtils.lerp(rightAngle, leftAngle, step / 12);
   const x = radius + radius * Math.cos(angle);
   shape.lineTo(x, springHeight + archRadius * Math.sin(angle));
  }
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
   depth: thickness, bevelThickness: .005, bevelSize: .004, bevelSegments: 1,
  });
  const positions = geometry.attributes.position;
  const uvs = geometry.attributes.uv;
  for (let i = 0; i < positions.count; i++) {
   uvs.setXY(i, positions.getX(i) / width, positions.getY(i) / height);
  }
  addMesh(geometry, [wood, endGrain]);
 }

 const strap = new THREE.Shape();
 strap.moveTo(.025, -.063);
 strap.lineTo(1.52, -.041);
 strap.quadraticCurveTo(1.73, -.039, 1.82, 0);
 strap.quadraticCurveTo(1.73, .039, 1.52, .041);
 strap.lineTo(.025, .063);
 strap.closePath();
 const strapGeometry = new THREE.ExtrudeGeometry(strap, {
  depth: .034, bevelThickness: .005, bevelSize: .005, bevelSegments: 1,
 });
 const rivetGeometry = new THREE.SphereGeometry(.027, 8, 6);
 const barrelGeometry = new THREE.CylinderGeometry(.049, .049, .21, 12);
 for (const y of [.65, 1.8, 2.56]) {
  addMesh(strapGeometry, iron, 0, y, thickness);
  addMesh(barrelGeometry, iron, .061, y, thickness + .041);
  for (const x of [.17, .48, .82, 1.16, 1.49, 1.7]) {
   addMesh(rivetGeometry, iron, x, y, thickness + .035).scale.z = .55;
  }
 }

 const plate = new THREE.Shape();
 plate.moveTo(0, .175);
 plate.quadraticCurveTo(.11, .12, .11, .06);
 plate.lineTo(.11, -.06);
 plate.quadraticCurveTo(.10, -.135, 0, -.175);
 plate.quadraticCurveTo(-.10, -.135, -.11, -.06);
 plate.lineTo(-.11, .06);
 plate.quadraticCurveTo(-.11, .12, 0, .175);
 const handleX = 2.03;
 const handleY = 1.42;
 addMesh(new THREE.ExtrudeGeometry(plate, { depth: .025, bevelEnabled: false }),
  iron, handleX, handleY, thickness);
 for (const y of [handleY - .125, handleY + .125]) {
  addMesh(rivetGeometry, iron, handleX, y, thickness + .025).scale.z = .55;
 }
 addMesh(new THREE.TorusGeometry(.039, .017, 8, 16), iron,
  handleX, handleY + .065, thickness + .05).rotation.y = Math.PI / 2;
 addMesh(new THREE.TorusGeometry(.105, .021, 8, 24), iron,
  handleX, handleY - .035, thickness + .078).rotation.x = .17;
}
