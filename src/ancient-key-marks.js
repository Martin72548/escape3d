import * as THREE from 'three';

// A single shared, weathered stencil for all seventy stones.
function keyTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.ellipse(128, 59, 30, 34, 0, 0, Math.PI * 2);
  ctx.moveTo(128, 94); ctx.lineTo(128, 220);
  ctx.moveTo(116, 111); ctx.lineTo(140, 111);
  ctx.moveTo(128, 182); ctx.lineTo(164, 182); ctx.lineTo(164, 199);
  ctx.moveTo(128, 213); ctx.lineTo(153, 213);
  ctx.stroke();
  // Small chips soften the mark into the surrounding aged stone.
  ctx.globalCompositeOperation = 'destination-out';
  let seed = 73;
  for (let i = 0; i < 650; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const x = seed / 4294967296 * 256;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const y = seed / 4294967296 * 256;
    ctx.fillRect(x, y, 1.5, 1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function addAncientKeyMarks(floorStones, wallStones) {
  const material = new THREE.MeshStandardMaterial({
    map: keyTexture(), transparent: true, depthWrite: false,
    roughness: 1, metalness: 0, polygonOffset: true,
    polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  });
  const geometry = new THREE.PlaneGeometry(1, 1);
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const rotation = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  function candidates(stonesList) {
    const result = [];
    for (const stones of stonesList) {
      for (let id = 0; id < stones.count; id++) {
        stones.getMatrixAt(id, matrix);
        matrix.decompose(position, rotation, scale);
        if (scale.x < .48 || scale.y < .35) continue;
        if (!stones.userData.draggableSlabs && Math.abs(position.y) > 2) continue;
        result.push({ stones, id });
      }
    }
    // Deterministic shuffle distributes marks across the room without duplicates.
    let seed = 943;
    for (let i = result.length - 1; i > 0; i--) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const j = seed % (i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    const selected = result.slice(0, 35);
    for (const stones of stonesList) {
      const id = stones.userData.keySlabInstance;
      if (id !== undefined && !selected.some(item => item.stones === stones && item.id === id)) {
        const required = { stones, id };
        if (selected.length === 35) selected[34] = required;
        else selected.push(required);
      }
    }
    return selected;
  }
  for (const { stones, id } of [...candidates([floorStones]), ...candidates(wallStones)]) {
    const mark = new THREE.Mesh(geometry, material);
    mark.name = 'ancient-key-mark';
    mark.userData.stoneInstance = id;
    mark.raycast = () => {};
    mark.frustumCulled = false;
    // Read the instance transform so lifting a slab also moves its painted key.
    function followStone() {
      stones.getMatrixAt(id, matrix);
      matrix.decompose(position, rotation, scale);
      const size = Math.min(scale.x * .65, scale.y * .72);
      mark.position.set(0, 0, .64).applyMatrix4(matrix);
      mark.quaternion.copy(rotation);
      mark.scale.set(size, size, 1);
      mark.visible = !stones.userData.removedSlabs?.has(id);
      mark.updateMatrixWorld(true);
    }
    stones.add(mark);
    followStone();
    mark.onBeforeRender = followStone;
  }
}
