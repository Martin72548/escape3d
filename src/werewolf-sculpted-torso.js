import * as THREE from 'three';

export function createSculptedWerewolfTorso(materials){
 const profile=new THREE.SplineCurve([[.22,.86],[.35,1.12],[.38,1.42],[.47,1.78],[.65,2.16],[.8,2.43],[.66,2.62],[.3,2.8]].map(p=>new THREE.Vector2(...p)));
 const geometry=new THREE.LatheGeometry(profile.getPoints(64),72),p=geometry.attributes.position;
 const bump=(value,center,width)=>Math.exp(-(((value-center)/width)**2));
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),front=Math.max(0,z/.8);
  const chest=bump(Math.abs(x),.3,.22)*bump(y,2.19,.24)*.22;
  const abs=bump(Math.abs(x),.16,.12)*([1.44,1.66,1.87].reduce((sum,h)=>sum+bump(y,h,.085),0))*.09;
  const sternum=bump(x,0,.035)*bump(y,2.02,.35)*.035;
  const ribs=Math.sin(y*34+Math.abs(x)*4)*bump(Math.abs(x),.43,.13)*bump(y,1.95,.24)*.017;
  p.setXYZ(i,x,y,z*.64+front*(chest+abs-sternum+ribs));
 }
 geometry.computeVertexNormals();const mesh=new THREE.Mesh(geometry,materials.flesh);mesh.name='Torso continuo de cintura estrecha y musculatura esculpida';mesh.castShadow=mesh.receiveShadow=true;return mesh;
}
