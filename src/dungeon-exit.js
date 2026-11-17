import * as THREE from 'three';
import { createRecordedDoorCreak } from './recorded-door-creak.js';

export function createDungeonExit(scene, stoneMaterial) {
 const iron=new THREE.MeshStandardMaterial({color:0x292a28,metalness:.7,roughness:.65});
 const wood=new THREE.MeshStandardMaterial({color:0x49301d,roughness:.95});
 const hinge=new THREE.Group();hinge.name='Puerta del calabozo';hinge.position.set(-1.15,0,-9.88);scene.add(hinge);
 const door=new THREE.Mesh(new THREE.BoxGeometry(2.3,3.5,.16),wood);door.position.set(1.15,1.75,0);door.castShadow=true;hinge.add(door);
 for(const y of [.65,1.75,2.85]){const strap=new THREE.Mesh(new THREE.BoxGeometry(2.25,.14,.08),iron);strap.position.set(1.15,y,.13);hinge.add(strap);}
 const handle=new THREE.Mesh(new THREE.TorusGeometry(.12,.025,8,24),iron);handle.position.set(2,1.6,.15);hinge.add(handle);
 const corridor=new THREE.Group();corridor.name='Pasillo iluminado';corridor.userData.spellTarget='exit-passage';scene.add(corridor);
 function block(w,h,d,x,y,z,material=stoneMaterial){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.receiveShadow=true;mesh.castShadow=true;corridor.add(mesh);return mesh;}
 block(2.4,.12,9,0,-.07,-14.5);block(.22,3.8,9,-1.31,1.9,-14.5);block(.22,3.8,9,1.31,1.9,-14.5);block(2.8,.18,9,0,3.7,-14.5);block(2.8,3.8,.2,0,1.9,-19);
 // Stone jambs frame the opening without blocking the view down the passage.
 block(.16,3.65,.36,-1.23,1.825,-9.88);block(.16,3.65,.36,1.23,1.825,-9.88);block(2.62,.18,.36,0,3.62,-9.88);
 const torch=new THREE.Group();torch.name='Antorcha del pasillo';torch.position.set(.98,2,-13);torch.rotation.z=.2;corridor.add(torch);
 const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.055,.07,.65,10),wood);torch.add(shaft);
 const flame=new THREE.Mesh(new THREE.ConeGeometry(.14,.45,10),new THREE.MeshBasicMaterial({color:0xffb139}));flame.position.y=.52;torch.add(flame);
 const core=new THREE.Mesh(new THREE.ConeGeometry(.075,.28,10),new THREE.MeshBasicMaterial({color:0xffec9a}));core.position.set(0,.46,.02);torch.add(core);
 const glow=new THREE.PointLight(0xffb34f,45,15,2);glow.position.set(.65,2.6,-13);corridor.add(glow);
 corridor.add(new THREE.HemisphereLight(0xffbf78,0x302619,.35));
 const creak=createRecordedDoorCreak({volume:1.4}),openingAngle=Math.PI*.56;
 let opened=false,age=0;
 function open(){if(opened)return;opened=true;creak.play();}
 function update(dt){age+=dt;if(opened)hinge.rotation.y=Math.max(-openingAngle,hinge.rotation.y-dt*openingAngle/creak.duration);flame.scale.set(1+.07*Math.sin(age*13),1+.12*Math.sin(age*17),1);glow.intensity=45+3*Math.sin(age*15)+2*Math.sin(age*23);}
 return {open,update,unlockAudio:creak.unlock,hinge,corridor,get opened(){return opened;}};
}
