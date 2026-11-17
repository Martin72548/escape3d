import * as THREE from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';

export function addOvalMirror(scene) {
 const root = new THREE.Group();
 root.name = 'Espejo oval en la pared izquierda mirando la puerta';
 root.position.set(-9.65, 2.3, -8);
 root.rotation.y = Math.PI / 2;
 scene.add(root);

 const backing = new THREE.Mesh(
  new THREE.CylinderGeometry(1, 1, .09, 80),
  new THREE.MeshStandardMaterial({ color: 0x302820, roughness: .8 })
 );
 backing.rotation.x = Math.PI / 2;
 backing.scale.set(.86, 1, 1.31);
 backing.position.z = -.06;
 backing.castShadow = true;
 root.add(backing);

 const glass = new Reflector(new THREE.CircleGeometry(1, 96).scale(.77, 1.22, 1), {
  color: 0xc7cccf,
  textureWidth: 768,
  textureHeight: 1024,
  clipBias: .003,
  multisample: 0,
 });
 glass.name = 'Superficie oval con reflejo de la escena';
 glass.userData.spellTarget = 'oval-mirror';
 root.add(glass);

 const bronze = new THREE.MeshStandardMaterial({ color: 0x796044, metalness: .72, roughness: .38 });
 const rim = new THREE.Mesh(new THREE.TorusGeometry(1, .065, 12, 96), bronze);
 rim.scale.set(.82, 1.27, 1);
 rim.position.z = .012;
 rim.castShadow = true;
 root.add(rim);
 return root;
}
