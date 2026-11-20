import * as THREE from 'three';
import { createBat } from './bat-encounter.js';
import { createBatScreechLoop } from './bat-screech-loop.js';
import { createRecordedMaleScream } from './recorded-male-scream.js';
import { createBlackSmoke } from './black-smoke.js';

export function createMuseumBatSwarm(museum, prisoner, scene = museum) {
  const bats = [], sound = createBatScreechLoop();
  const smoke = createBlackSmoke(scene);
  let defeated = false;
  const scream = createRecordedMaleScream({ fileName: 'male-short-wounded-scream.mp3', offset: 0, duration: 2.8 });
  let active = false, age = 0, nextBite = 6, turn = 0, attacker = null;
  const head = prisoner.getObjectByName('head-anchor') ?? prisoner;
  function headPoint() {
    return museum.worldToLocal(head.localToWorld(new THREE.Vector3(0, .04, .12)));
  }
  function unlockAudio() { sound.unlock(); scream.unlock(); }
  function trigger() {
    if (active || defeated || prisoner.userData.dead) return false;
    active = true; unlockAudio(); sound.start();
    for (let i = 0; i < 13; i++) {
      const bat = createBat(i, { white: i === 12, black: i !== 12 });
      bat.root.userData.museumWhiteBat = i === 12;
      bat.root.name = i === 12 ? 'Chauve-souris blanche unique' : `Chauve-souris noire ${i + 1}`;
      museum.add(bat.root); bats.push(bat);
    }
    update(0);
    return true;
  }
  function release() {
    if (!attacker) return;
    museum.attach(attacker.bat.root);
    attacker.bat.returnStart = attacker.bat.root.position.clone();
    attacker.bat.returnTime = age;
    attacker = null; prisoner.userData.batBiting = false;
  }
  function stop() { release(); sound.stop(); }
  function isWhiteTarget(object) {
    for (let part = object; part; part = part.parent) {
      if (part === bats[12]?.root) return active && !defeated;
    }
    return false;
  }
  function hitWhite() {
    if (!active || defeated || prisoner.userData.dead) return;
    stop(); defeated = true; active = false;
    bats.forEach(bat => {
      smoke.emit(bat.root);
      bat.root.visible = false;
    });
  }
  function update(dt) {
    smoke.update(dt);
    if (!active) return;
    if (prisoner.userData.dead || prisoner.userData.gameOver || prisoner.userData.levelTransition) { stop(); return; }
    age += dt;
    if (!attacker && age >= nextBite - 1) {
      const bat = bats[turn++ % bats.length];
      attacker = { bat, start: bat.root.position.clone(), attached: false };
    }
    if (attacker) {
      if (!attacker.attached) {
        const t = THREE.MathUtils.clamp(age - (nextBite - 1), 0, 1);
        attacker.bat.root.position.lerpVectors(attacker.start, headPoint(), t);
        attacker.bat.root.lookAt(head.getWorldPosition(new THREE.Vector3()));
        if (age >= nextBite) {
          head.attach(attacker.bat.root);
          attacker.bat.root.position.set(0, .04, .12);
          attacker.bat.root.rotation.set(-Math.PI / 2, 0, 0);
          attacker.attached = true; attacker.releaseAt = nextBite + 3; nextBite += 6;
          prisoner.userData.batBiting = true; scream.play();
        }
      } else if (age >= attacker.releaseAt) release();
    }
    bats.forEach((bat, i) => {
      bat.age += dt;
      if (attacker?.bat !== bat) {
        const angle = age * (.65 + i * .027) + i * Math.PI * 2 / bats.length;
        const point = new THREE.Vector3(
          Math.sin(angle) * (5.8 + Math.sin(age * .4 + i) * 1.8),
          3.1 + Math.sin(angle * 1.7 + i) * 1.5,
          Math.sin(angle * 1.43 + i * .6) * 7.5,
        );
        const old = bat.root.position.clone();
        if (bat.returnStart && age - bat.returnTime < 1) bat.root.position.lerpVectors(bat.returnStart, point, age - bat.returnTime);
        else bat.root.position.copy(point);
        const direction = bat.root.position.clone().sub(old);
        if (direction.lengthSq() > .00001) bat.root.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction.normalize());
      }
      bat.wings.forEach(({ pivot, side }) => { pivot.rotation.z = side * (.2 + Math.sin(age * 35 + i) * (attacker?.bat === bat && attacker.attached ? .24 : .8)); });
    });
  }
  return { trigger, update, stop, unlockAudio, hitWhite, isWhiteTarget, bats, get active() { return active; } };
}
