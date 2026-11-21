import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function addHarpyRaptorBody(bird) {
  const skin = new THREE.MeshStandardMaterial({ color: 0xa97558, roughness: .84, vertexColors: true });
  const scales = new THREE.MeshStandardMaterial({ color: 0x605345, roughness: .92 });
  const ridges = new THREE.MeshStandardMaterial({ color: 0x8d7a63, roughness: .9 });
  const keratin = new THREE.MeshStandardMaterial({ color: 0xb6a58a, roughness: .48 });
  const mottling = (x, y, z) => .93 + .033 * Math.sin(x * 83 + y * 54) + .027 * Math.sin(z * 168 - y * 71);
  function addMesh(parent, geometry, material) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function skinMesh(parent, geometry) {
    const position = geometry.attributes.position;
    const colors = [];
    for (let i = 0; i < position.count; i++) {
      const tone = mottling(position.getX(i), position.getY(i), position.getZ(i));
      colors.push(tone, tone * .97, tone * .94);
    }
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return addMesh(parent, geometry, skin);
  }
  // Each ring defines chest, waist and hip volume around the same vertical axis.
  const profile = new THREE.CatmullRomCurve3([
    [.03, -.78, .035], [.35, -.68, .25], [.46, -.46, .28], [.35, -.18, .23],
    [.29, .05, .22], [.34, .32, .25], [.46, .65, .29], [.50, .86, .25],
    [.37, 1.01, .19], [.18, 1.08, .165], [.16, 1.28, .16], [.035, 1.33, .035],
  ].map(([width, y, depth]) => new THREE.Vector3(width, y, depth)));
  const positions = [], indices = [], rows = 76, columns = 64;
  for (let row = 0; row <= rows; row++) {
    const { x: width, y, z: depth } = profile.getPoint(row / rows);
    for (let col = 0; col < columns; col++) {
      const angle = 2 * Math.PI * col / columns;
      const front = Math.max(0, Math.cos(angle));
      const ribs = .029 * Math.exp(-((y - .32) ** 2) / .095) * Math.sin(angle * 2) ** 2 * front;
      positions.push(Math.sin(angle) * width, y, .11 + Math.cos(angle) * depth + ribs);
      if (row < rows) {
        const a = row * columns + col, b = row * columns + (col + 1) % columns;
        indices.push(a, b, a + columns, b, b + columns, a + columns);
      }
    }
  }
  const torso = new THREE.BufferGeometry();
  torso.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  torso.setIndex(indices);
  torso.computeVertexNormals();
  skinMesh(bird, torso);

  function tube(points, radius, taper = 0) {
    const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
    const steps = 16, sides = 8;
    const geometry = new THREE.TubeGeometry(curve, steps, radius, sides, false);
    if (taper) {
      const position = geometry.attributes.position;
      const point = new THREE.Vector3();
      for (let row = 0; row <= steps; row++) {
        const center = curve.getPointAt(row / steps);
        for (let side = 0; side <= sides; side++) {
          const i = row * (sides + 1) + side;
          point.fromBufferAttribute(position, i).lerp(center, row / steps * taper);
          position.setXYZ(i, point.x, point.y, point.z);
        }
      }
      geometry.computeVertexNormals();
    }
    return geometry;
  }

  const legs = [];
  for (const direction of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(direction * .29, -.48, .13);
    bird.add(leg);
    legs.push(leg);
    const thigh = skinMesh(leg, new THREE.SphereGeometry(1, 32, 24).scale(.235, .42, .26));
    thigh.position.set(direction * .07, -.28, .115);
    thigh.rotation.x = -.39;
    addMesh(leg, tube([[.05 * direction, -.46, .26], [.085 * direction, -.71, .03],
      [.095 * direction, -1.06, -.135], [.10 * direction, -1.47, -.045]], .10, .38), scales);
    const plates = [];
    for (let i = 0; i < 14; i++) {
      const t = i / 13;
      plates.push(new THREE.SphereGeometry(1, 10, 5).scale(.082 - .023 * t, .022, .022)
        .translate(direction * (.072 + t * .028), -.61 - t * .83, .35 - .43 * Math.sin(t * 1.94)));
    }
    for (const toe of [-1, 0, 1, 2]) {
      const rear = toe === 2;
      const x = direction * .10 + (rear ? -.065 * direction : toe * .16);
      const z = rear ? -.31 : .32 - Math.abs(toe) * .07;
      addMesh(leg, tube([[direction * .10, -1.45, -.05], [x * .75, -1.54, z * .50], [x, -1.55, z]], .049, .44), scales);
      addMesh(leg, tube([[x, -1.545, z], [x, -1.52, z + (rear ? -.065 : .09)],
        [x, -1.59, z + (rear ? -.115 : .14)]], .034, .98), keratin);
    }
    addMesh(leg, mergeGeometries(plates), ridges);
    plates.forEach(plate => plate.dispose());
  }
  return legs;
}
