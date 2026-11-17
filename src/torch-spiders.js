import * as THREE from 'three';

export function createTorchSpiders(scene, buildSpider) {
  const spiders = [];
  let template;
  let cooldown = 0;

  function spawn() {
    if (cooldown > 0) return;
    cooldown = 0.8;
    if (!template) {
      template = new THREE.Group();
      buildSpider(template);
    }
    for (let i = 0; i < 24; i++) {
      if (spiders.length >= 24) scene.remove(spiders.shift().group);
      const group = template.clone();
      group.scale.setScalar(0.55 + Math.random() * 0.25);
      group.position.set(Math.random() * 11.6 - 5.8, 6 + Math.random() * 3, Math.random() * 14 - 9);
      const legs = [];
      group.traverse(part => {
        if (part.userData.spiderLeg || part.userData.spiderPalp) legs.push(part);
      });
      spiders.push({ group, legs, fallSpeed: 0, heading: Math.random() * Math.PI * 2,
        speed: 4 + Math.random() * 3, turnIn: Math.random(), phase: Math.random() * Math.PI * 2 });
      scene.add(group);
    }
  }

  function update(dt, time, active) {
    cooldown = Math.max(0, cooldown - dt);
    if (!active) return;
    for (const spider of spiders) {
      const { group } = spider;
      if (group.position.y > 0.02) {
        spider.fallSpeed += 18 * dt;
        group.position.y = Math.max(0.02, group.position.y - spider.fallSpeed * dt);
      } else {
        spider.turnIn -= dt;
        if (spider.turnIn <= 0) {
          spider.heading += (Math.random() - 0.5) * Math.PI * 1.5;
          spider.turnIn = 0.25 + Math.random() * 0.8;
        }
        group.position.x += Math.sin(spider.heading) * spider.speed * dt;
        group.position.z += Math.cos(spider.heading) * spider.speed * dt;
        if (Math.abs(group.position.x) > 6.1) spider.heading = -spider.heading;
        if (group.position.z < -9.2 || group.position.z > 5.2) spider.heading = Math.PI - spider.heading;
        group.position.x = THREE.MathUtils.clamp(group.position.x, -6.1, 6.1);
        group.position.z = THREE.MathUtils.clamp(group.position.z, -9.2, 5.2);
      }
      group.rotation.y = spider.heading;
      for (const leg of spider.legs) {
        const stride = Math.sin(time * 0.035 + leg.userData.phase + spider.phase);
        if (leg.userData.spiderLeg) leg.rotation.y = stride * 0.55;
        else leg.rotation.x = stride * 0.2;
      }
    }
  }

  function hitTest(raycaster) {
    return raycaster.intersectObjects(spiders.map(spider => spider.group), true)[0];
  }

  function removeHit(object) {
    const index = spiders.findIndex(spider => {
      for (let part = object; part; part = part.parent) {
        if (part === spider.group) return true;
      }
      return false;
    });
    if (index < 0) return false;
    scene.remove(spiders[index].group);
    spiders.splice(index, 1);
    return true;
  }

  function reset() {
    for (const spider of spiders) scene.remove(spider.group);
    spiders.length = 0;
    cooldown = 0;
  }

  return { spawn, update, reset, hitTest, removeHit };
}
