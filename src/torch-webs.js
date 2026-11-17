import * as THREE from 'three';

// Wall-facing silk fans leave the flame and its interactive support exposed.
export function addTorchWebs(scene, x, z) {
  const group = new THREE.Group();
  group.name = 'torch-cobwebs';
  group.position.set(x, 2.82, z);
  if (Math.abs(x) > 6) group.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;

  const vertices = [];
  const segment = (a, b) => vertices.push(...a, ...b);
  for (const side of [-1, 1]) {
    const origin = [side * 0.12, -0.04, -0.08];
    const tips = [
      [side * 0.94, -0.46, -0.43],
      [side * 1.04, -0.04, -0.43],
      [side * 0.96, 0.42, -0.43],
      [side * 0.68, 0.79, -0.43],
      [side * 0.36, 0.94, -0.43],
    ];
    const point = (tip, t) => origin.map((v, axis) => v + (tip[axis] - v) * t);
    for (const tip of tips) segment(origin, tip);
    for (let ring = 1; ring <= 7; ring++) {
      const t = ring / 7;
      for (let spoke = 0; spoke < tips.length - 1; spoke++) {
        const a = point(tips[spoke], t);
        const b = point(tips[spoke + 1], t);
        // Slightly sagging strands give the old webs a softer silhouette.
        const middle = a.map((v, axis) => (v + b[axis]) / 2);
        middle[1] -= 0.025 * t;
        segment(a, middle);
        segment(middle, b);
      }
    }
    segment(tips[0], [side * 0.18, -0.68, -0.43]);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  const silk = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({
    color: 0xe4ded0, transparent: true, opacity: 0.58, depthWrite: false,
  }));
  group.add(silk);
  scene.add(group);
  return group;
}
