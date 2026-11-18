import * as THREE from 'three';

export function createKomodoSkin() {
  const size = 512, cells = 32, cell = size / cells;
  const color = new Uint8Array(size * size * 4), relief = new Uint8Array(color.length);
  let seed = 98231;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const centers = Array.from({ length: cells * cells }, () => ({ x: .2 + random() * .6, y: .2 + random() * .6, shade: random() }));
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const gx = Math.floor(x / cell), gy = Math.floor(y / cell);
    let first = Infinity, second = Infinity, selected;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const center = centers[((gy + dy + cells) % cells) * cells + (gx + dx + cells) % cells];
      const distance = Math.hypot(x / cell - gx - dx - center.x, y / cell - gy - dy - center.y);
      if (distance < first) { second = first; first = distance; selected = center; }
      else second = Math.min(second, distance);
    }
    const edge = THREE.MathUtils.smoothstep(second - first, .015, .15);
    const grain = (random() - .5) * 13;
    const mottling = Math.sin(x * .037 + Math.sin(y * .021) * 2) * Math.cos(y * .043) * 17;
    const value = 64 + selected.shade * 39 + mottling + grain;
    const i = (y * size + x) * 4;
    color.set([value * .98 * (.5 + .5 * edge), value * (.5 + .5 * edge), value * .77 * (.5 + .5 * edge), 255], i);
    const height = 62 + edge * (112 + 38 * (1 - Math.min(first, 1))) + grain;
    relief.set([height, height, height, 255], i);
  }
  function texture(data) {
    const map = new THREE.DataTexture(data, size, size);
    map.wrapS = map.wrapT = THREE.RepeatWrapping; map.repeat.set(2, 1);
    map.magFilter = THREE.LinearFilter; map.minFilter = THREE.LinearMipmapLinearFilter;
    map.generateMipmaps = true; map.anisotropy = 4; map.needsUpdate = true; return map;
  }
  const map = texture(color); map.colorSpace = THREE.SRGBColorSpace;
  const bump = texture(relief);
  const skin = new THREE.MeshPhysicalMaterial({ map, bumpMap: bump, bumpScale: .009, roughness: .78, metalness: 0, clearcoat: .07, clearcoatRoughness: .65 });
  const belly = skin.clone(); belly.color.set(0xc8bb8a); belly.bumpScale = .004; belly.roughness = .87;
  return { skin, belly };
}
