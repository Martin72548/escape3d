import * as THREE from 'three';

export function createSlabImpacts(parent) {
  const batches = [];
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 2, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(165,165,165,.65)');
  gradient.addColorStop(.4, 'rgba(125,125,125,.4)');
  gradient.addColorStop(1, 'rgba(100,100,100,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const geometry = new THREE.DodecahedronGeometry(1, 0);
  const stone = new THREE.MeshStandardMaterial({ color: 0x827c70, roughness: 1 });
  const smokeTemplate = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, opacity: .8 });
  const burstTemplate = new THREE.SpriteMaterial({ color: 0xffd098, map: texture, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  // Adding a light at impact time changes the shader variant for the whole dungeon.
  const flash = new THREE.PointLight(0xffd9a3, 0, 3);
  parent.add(flash);

  function prepare(renderer) {
    renderer.initTexture(texture);
    const preview = new THREE.Group();
    for (const object of [new THREE.Mesh(geometry, stone), new THREE.Sprite(smokeTemplate), new THREE.Sprite(burstTemplate)]) {
      object.scale.setScalar(.000001);
      object.frustumCulled = false;
      object.raycast = () => {};
      preview.add(object);
    }
    parent.add(preview);
    return preview;
  }

  function emit(point) {
    const group = new THREE.Group();
    group.name = 'Explosion de dalle : fumee grise et eclats';
    parent.updateWorldMatrix(true, false);
    group.position.copy(parent.worldToLocal(point.clone()));
    group.position.y = Math.max(.08, point.y);
    parent.add(group);
    const smokeMaterial = smokeTemplate.clone();
    const smoke = Array.from({ length: 40 }, () => {
      const sprite = new THREE.Sprite(smokeMaterial);
      sprite.position.set((Math.random() - .5) * .35, .08 + Math.random() * .25, (Math.random() - .5) * .35);
      sprite.raycast = () => {};
      group.add(sprite);
      return { sprite, size: .65 + Math.random() * .7, velocity: new THREE.Vector3((Math.random() - .5) * 1.1, .55 + Math.random() * .7, (Math.random() - .5) * 1.1) };
    });
    const pieces = Array.from({ length: 32 }, () => {
      const mesh = new THREE.Mesh(geometry, stone);
      const size = .07 + Math.random() * .15;
      mesh.scale.set(size, size * .5, size * 1.4);
      mesh.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      mesh.raycast = () => {};
      group.add(mesh);
      const angle = Math.random() * Math.PI * 2;
      const speed = .7 + Math.random() * 2;
      return { mesh, velocity: new THREE.Vector3(Math.cos(angle) * speed, 1.8 + Math.random() * 3, Math.sin(angle) * speed), spin: Math.random() * 9 - 4.5 };
    });
    flash.position.copy(group.position);
    flash.position.y += .25;
    flash.intensity = 12;
    const burstMaterial = burstTemplate.clone();
    const burst = new THREE.Sprite(burstMaterial);
    burst.position.y = .4;
    burst.scale.setScalar(1.5);
    burst.raycast = () => {};
    group.add(burst);
    batches.push({ group, smokeMaterial, smoke, pieces, burst, burstMaterial, age: 0 });
  }
  function update(dt) {
    for (let i = batches.length - 1; i >= 0; i--) {
      const batch = batches[i];
      batch.age += dt;
      if (batch.age >= 3) {
        parent.remove(batch.group);
        batch.smokeMaterial.dispose();
        batch.burstMaterial.dispose();
        batches.splice(i, 1);
        continue;
      }
      const progress = batch.age / 3;
      batch.smokeMaterial.opacity = .8 * Math.pow(1 - progress, 1.4);
      batch.burstMaterial.opacity = Math.max(0, 1 - batch.age / .45);
      batch.burst.scale.setScalar(1.5 + Math.min(batch.age, .45) * 6);
      for (const p of batch.smoke) {
        p.sprite.position.addScaledVector(p.velocity, dt);
        p.sprite.scale.setScalar(p.size + batch.age * .65);
      }
      for (const p of batch.pieces) {
        p.velocity.y -= 9.8 * dt;
        p.mesh.position.addScaledVector(p.velocity, dt);
        p.mesh.rotation.x += p.spin * dt;
        p.mesh.rotation.z += p.spin * dt;
        if (p.mesh.position.y < .03) {
          p.mesh.position.y = .03;
          p.velocity.y = Math.abs(p.velocity.y) * .25;
          p.velocity.x *= .7;
          p.velocity.z *= .7;
        }
        p.mesh.scale.multiplyScalar(Math.max(0, 1 - Math.max(0, batch.age - 2.4) * dt * 8));
      }
    }
    const newest = batches.at(-1);
    flash.intensity = newest ? 12 * Math.max(0, 1 - newest.age / .18) : 0;
  }
  return { prepare, emit, update };
}
