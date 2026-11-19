import * as THREE from 'three';
import { createPrisonerMovement } from './prisoner-movement.js';

const WALK_START = 10.7;
const ease = (time, start, end) => THREE.MathUtils.smoothstep(time, start, end);

export function installPrisonerSleep(person) {
  const standingY = person.position.y;
  person.userData.standingY = standingY;
  person.userData.sleeping = true;
  person.position.set(8.2, .58, -9.2);
  // Face into the room (+Z), with the back toward the rear wall (-Z).
  person.quaternion.setFromEuler(new THREE.Euler(0, 0, Math.PI / 2, 'YXZ'));
  let elapsed = 0, startPosition, startRotation, walking, riseYaw = null;
  const seated = new THREE.Vector3(7.1, -1.15, -8.8);
  const upright = new THREE.Quaternion();
  const destination = new THREE.Vector3(-1.5, standingY, -1);
  person.userData.wakeUp = () => {
    if (!person.userData.sleeping) return;
    person.userData.sleeping = false;
    person.userData.wakingUp = true;
    startPosition = person.position.clone();
    startRotation = person.quaternion.clone();
  };
  window.addEventListener('dungeon-introduction-complete', person.userData.wakeUp, { once: true });
  person.userData.updateWakeSequence = (dt, cameraPosition) => {
    if (!person.userData.wakingUp) return;
    elapsed += dt;
    person.userData.wakeTime = elapsed;
    if (elapsed < 2) {
      const t = THREE.MathUtils.smoothstep(elapsed, 0, 2);
      person.position.lerpVectors(startPosition, seated, t);
      person.quaternion.slerpQuaternions(startRotation, upright, t);
    } else if (elapsed < 5) {
      person.position.copy(seated); person.quaternion.copy(upright);
    } else if (elapsed < 6.2) {
      if (riseYaw === null) riseYaw = cameraPosition ? Math.atan2(cameraPosition.x - seated.x, cameraPosition.z - seated.z) : 0;
      person.position.copy(seated);
      person.rotation.set(0, riseYaw * ease(elapsed, 5, 6.2), 0);
    } else if (elapsed < WALK_START) {
      // Lean over the supporting hand, gather the feet, then push through
      // the legs. The hips travel forward before the torso straightens.
      const gather = ease(elapsed, 6.2, 7.5);
      const push = ease(elapsed, 7.5, 9.9);
      const settle = ease(elapsed, 9.9, WALK_START);
      person.position.copy(seated);
      person.position.y = seated.y + .17 * gather + 1.0 * push;
      const forwardShift = .38 * gather + .14 * push;
      person.position.x += Math.sin(riseYaw ?? 0) * forwardShift;
      person.position.z += Math.cos(riseYaw ?? 0) * forwardShift;
      person.rotation.set(.27 * gather * (1 - settle), riseYaw ?? 0, -.07 * gather * (1 - push), 'YXZ');
    } else {
      if (!walking) { person.position.y = standingY; person.rotation.set(0, riseYaw ?? 0, 0); walking = createPrisonerMovement(person); }
      person.userData.introWalking = true;
      const direction = destination.clone().sub(person.position).setY(0);
      const distance = direction.length();
      walking.update(Math.min(dt, distance / 2.8), direction, true);
      if (distance < .06) {
        person.position.copy(destination);
        walking.update(0, new THREE.Vector3());
        person.userData.walkingIntensity = 0;
        if (cameraPosition) {
          person.rotation.set(0, Math.atan2(cameraPosition.x - person.position.x, cameraPosition.z - person.position.z), 0);
        }
        person.userData.wakingUp = person.userData.introWalking = false;
      }
    }
  };
}

// Aim the articulated limbs in the figure's own coordinates, independent of
// the side on which it is lying. The normal rig mapping restores them on wake.
export function createSleepingPose(person, bones) {
  const origin = new THREE.Vector3(), current = new THREE.Vector3();
  const target = new THREE.Vector3(), rotation = new THREE.Quaternion();
  const parentRotation = new THREE.Quaternion();
  let floorHeight = null;
  const vertex = new THREE.Vector3();
  function aim(name, childName, point) {
    const bone = bones.get(name), child = bones.get(childName);
    if (!bone || !child) return;
    bone.getWorldPosition(origin);
    child.getWorldPosition(current).sub(origin).normalize();
    target.copy(point); person.localToWorld(target); target.sub(origin).normalize();
    rotation.setFromUnitVectors(current, target).multiply(bone.getWorldQuaternion(new THREE.Quaternion()));
    bone.quaternion.copy(bone.parent.getWorldQuaternion(parentRotation).invert().multiply(rotation));
    bone.updateWorldMatrix(false, true);
  }
  function solveLimb(a, b, c, targetWorld, poleLocal) {
    const upper = bones.get(a), lower = bones.get(b), end = bones.get(c);
    if (!upper || !lower || !end) return;
    const hip = upper.getWorldPosition(new THREE.Vector3());
    const knee = lower.getWorldPosition(new THREE.Vector3());
    const foot = end.getWorldPosition(new THREE.Vector3());
    const lengthA = hip.distanceTo(knee), lengthB = knee.distanceTo(foot);
    const axis = targetWorld.clone().sub(hip);
    const distance = THREE.MathUtils.clamp(axis.length(), Math.abs(lengthA - lengthB) + .001, lengthA + lengthB - .001);
    axis.normalize();
    const pole = poleLocal.clone().transformDirection(person.matrixWorld);
    pole.addScaledVector(axis, -pole.dot(axis)).normalize();
    const along = (lengthA * lengthA - lengthB * lengthB + distance * distance) / (2 * distance);
    const bend = hip.clone().addScaledVector(axis, along).addScaledVector(pole, Math.sqrt(Math.max(0, lengthA * lengthA - along * along)));
    aim(a, b, person.worldToLocal(bend));
    aim(b, c, person.worldToLocal(hip.clone().addScaledVector(axis, distance)));
  }
  let plantedFeet;
  function keepAboveFloor() {
    const model = person.userData.medievalWarriorModel;
    if (!model) return;
    person.updateWorldMatrix(true, true);
    let bottom = Infinity;
    model.traverse(mesh => {
      if (!mesh.isMesh || !mesh.geometry.attributes.position) return;
      mesh.skeleton?.update();
      const indices = mesh.geometry.index;
      const count = indices?.count ?? mesh.geometry.attributes.position.count;
      for (let i = 0; i < count; i++) {
        mesh.getVertexPosition(indices ? indices.getX(i) : i, vertex);
        vertex.applyMatrix4(mesh.matrixWorld);
        bottom = Math.min(bottom, vertex.y);
      }
    });
    if (bottom < .015) {
      person.position.y += .015 - bottom;
      person.updateWorldMatrix(true, true);
    }
  }
  return dt => {
    if (person.userData.wakingUp) {
      const elapsed = person.userData.wakeTime ?? 0;
      if (elapsed >= WALK_START) return;
      // Hold the seated pose while rotating; then reuse the rise timeline.
      const time = elapsed < 5 ? elapsed : Math.max(5, elapsed - 1.2);
      const seatedAmount = 1 - ease(time, 6.3, 8.7);
      const stretch = Math.sin(Math.PI * THREE.MathUtils.clamp((time - 2) / 3, 0, 1));
      const mouth = person.getObjectByName('screaming-mouth');
      if (mouth) mouth.visible = stretch > .3;
      if (elapsed >= 6.2 && !plantedFeet) {
        plantedFeet = [-1, 1].map(sign => {
          const point = person.localToWorld(new THREE.Vector3(sign * .14, 0, .35));
          point.y = .14;
          return point;
        });
      }
      for (const [side, thigh, shin, foot, arm, elbow, hand, sign] of [
        ['R',61,60,59,50,49,48,-1], ['L',57,56,55,27,26,25,1],
      ]) {
        if (plantedFeet) {
          const index = sign < 0 ? 0 : 1;
          const foot = plantedFeet[index].clone();
          // Bring the rear foot under the hips slightly later than the front.
          const shift = new THREE.Vector3(0, 0, (sign < 0 ? .24 : -.12) * (1 - ease(time, 5.2, 6.4))).applyAxisAngle(new THREE.Vector3(0, 1, 0), person.rotation.y);
          foot.add(shift);
          solveLimb(`thigh${side}_${thigh}`, `shin${side}_${shin}`, `foot${side}_${foot}`, foot, new THREE.Vector3(0, 0, 1));
        } else if (seatedAmount > .001) {
          aim(`thigh${side}_${thigh}`, `shin${side}_${shin}`, new THREE.Vector3(sign * .13, .78, .5 * seatedAmount));
          aim(`shin${side}_${shin}`, `foot${side}_${foot}`, new THREE.Vector3(sign * .13, .1 + .52 * seatedAmount, .75 * seatedAmount));
        }
        aim(`upper_arm${side}_${arm}`, `forearm${side}_${elbow}`, new THREE.Vector3(sign * (.3 + stretch * .12), 1.13 + stretch * .7, .15));
        aim(`forearm${side}_${elbow}`, `hand${side}_${hand}`, new THREE.Vector3(sign * .25, 1.02 + stretch * 1.04, .2));
        if (plantedFeet && time < 8.7) {
          const release = ease(time, sign < 0 ? 6 : 7, 8.7);
          const support = sign < 0
            ? plantedFeet[0].clone().add(new THREE.Vector3(-.37, 0, -.48).applyAxisAngle(new THREE.Vector3(0, 1, 0), person.rotation.y)).setY(.13)
            : plantedFeet[1].clone().add(new THREE.Vector3(0, .85, -.12));
          const rest = person.localToWorld(new THREE.Vector3(sign * .27, 1.02, .2));
          support.lerp(rest, release);
          solveLimb(`upper_arm${side}_${arm}`, `forearm${side}_${elbow}`, `hand${side}_${hand}`, support, new THREE.Vector3(sign, 0, -.5));
        }
      }
      keepAboveFloor();
      return;
    }
    person.position.y = floorHeight ?? .58;
    for (const [side, thigh, shin, foot, arm, elbow, hand, sign] of [
      ['R', 61, 60, 59, 50, 49, 48, -1],
      ['L', 57, 56, 55, 27, 26, 25, 1],
    ]) {
      // Local -X points toward the floor: the upper leg follows the lower
      // leg's diagonal, slightly offset so both silhouettes remain visible.
      const upper = sign > 0;
      aim(`thigh${side}_${thigh}`, `shin${side}_${shin}`,
        new THREE.Vector3(upper ? .015 : -.13, upper ? .83 : .79, upper ? .46 : .42));
      aim(`shin${side}_${shin}`, `foot${side}_${foot}`,
        new THREE.Vector3(upper ? -.025 : -.16, upper ? .4 : .36, upper ? .21 : .17));
      aim(`upper_arm${side}_${arm}`, `forearm${side}_${elbow}`, new THREE.Vector3(sign * .2, 1.18, .31));
      aim(`forearm${side}_${elbow}`, `hand${side}_${hand}`, new THREE.Vector3(sign * .08, 1.52, .2));
    }
    if (floorHeight === null && person.userData.medievalWarriorModel) {
      person.updateWorldMatrix(true, true);
      const heights = [];
      person.userData.medievalWarriorModel.traverse(mesh => {
        if (!mesh.isMesh || !mesh.geometry.attributes.position) return;
        // CPU skinning must use this frame's bent skeleton, not the previous
        // standing pose retained in the renderer's bone matrices.
        mesh.skeleton?.update();
        const indices = mesh.geometry.index;
        const count = indices?.count ?? mesh.geometry.attributes.position.count;
        for (let i = 0; i < count; i += 3) {
          mesh.getVertexPosition(indices ? indices.getX(i) : i, vertex);
          vertex.applyMatrix4(mesh.matrixWorld);
          heights.push(vertex.y);
        }
      });
      heights.sort((a, b) => a - b);
      // Let a small area of the side rest into the uneven stone surface;
      // a single low finger or clothing vertex must not suspend the body.
      const contact = heights[Math.floor(heights.length * .025)];
      if (!Number.isFinite(contact)) return;
      floorHeight = person.position.y + .005 - contact;
      person.position.y = floorHeight;
      person.updateWorldMatrix(true, true);
    }
  };
}
