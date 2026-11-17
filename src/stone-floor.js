import * as THREE from 'three';
const bounds=new THREE.Box3();

// Use the rotated stone's actual underside, rather than a nominal radius.
export function stoneFloorHeight(mesh){
 mesh.updateWorldMatrix(true,true);bounds.setFromObject(mesh);
 return .025+mesh.position.y-bounds.min.y;
}
