import * as THREE from 'three';

export function createWerewolfLimb(side,leg,material){
 const points=leg?[[0,0,0],[side*.035,-.28,.08],[0,-.57,.04],[0,-.78,-.12],[0,-1.04,.05]]:[[side*.1,.02,0],[side*.14,-.29,.02],[side*.19,-.61,.035],[side*.2,-.96,.1],[side*.2,-1.35,.14]];
 const radii=leg?[.2,.24,.14,.115,.15]:[.22,.24,.155,.19,.19];
 const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
 const geometry=new THREE.TubeGeometry(path,40,1,20,false),p=geometry.attributes.position;
 for(let ring=0;ring<=40;ring++){
  const t=ring/40,center=path.getPointAt(t),segment=Math.min(3,Math.floor(t*4)),blend=THREE.MathUtils.smoothstep(t*4-segment,0,1),radius=THREE.MathUtils.lerp(radii[segment],radii[segment+1],blend);
  for(let j=0;j<=20;j++){
   const id=ring*21+j,v=new THREE.Vector3().fromBufferAttribute(p,id).sub(center),angle=j/20*Math.PI*2;
   v.multiplyScalar(radius*(1+Math.cos(angle*3+t*5)*.035));v.z*=leg?1.05:.9;v.add(center);p.setXYZ(id,v.x,v.y,v.z);
  }
 }
 geometry.computeVertexNormals();const mesh=new THREE.Mesh(geometry,material);mesh.name=leg?'Pierna digitigrada continua':'Brazo largo de musculatura continua';mesh.castShadow=mesh.receiveShadow=true;return mesh;
}
