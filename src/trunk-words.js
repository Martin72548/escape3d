import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { publicAssetBase } from './public-asset-base.js';

export async function addTrunkWords(parent, barkMaterial) {
  const font = await new FontLoader().loadAsync(`${publicAssetBase}fonts/helvetiker_bold.typeface.json`);
  const words = ['dragon', 'courageux', 'grande', 'château', 'dame'];
  const group = new THREE.Group(); group.name = 'Mots en trois dimensions sur le tronc'; parent.add(group);
  const bark = barkMaterial ?? new THREE.MeshStandardMaterial({color:0x60422a,roughness:1});
  const size=128,pixels=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const dx=(x-size/2)/(size/2),dy=(y-size/2)/(size/2),r=Math.hypot(dx,dy);
    const ring=Math.sin(r*110+Math.sin(Math.atan2(dy,dx)*5)*.55),grain=Math.sin(x*2.7+y*4.3)*5;
    const value=153+ring*20+grain;pixels.set([value+30,value,value*.64,255],(y*size+x)*4);
  }
  const cutMap=new THREE.DataTexture(pixels,size,size);cutMap.colorSpace=THREE.SRGBColorSpace;cutMap.needsUpdate=true;
  const cutWood=new THREE.MeshStandardMaterial({map:cutMap,roughness:.92});
  const branchLengths=[.9,1.65,1.2,2.1,1.4];
  const front = new THREE.MeshStandardMaterial({color:0xe9c471,metalness:.35,roughness:.46});
  const edges = new THREE.MeshStandardMaterial({color:0x79562b,metalness:.25,roughness:.68});
  const options = {font,size:.27,depth:.09,curveSegments:8,bevelEnabled:true,bevelThickness:.008,bevelSize:.006,bevelSegments:2};
  words.forEach((word,index) => {
    // The bundled font lacks â; add its circumflex as a separate solid glyph.
    const geometry = new TextGeometry(word.replace('â','a'), options);
    geometry.computeBoundingBox();
    const bounds=geometry.boundingBox, width=bounds.max.x-bounds.min.x;
    const object=new THREE.Group();object.name=`Mot 3D : ${word}`;object.userData.word=word;object.userData.spellTarget='trunk-word';
    const text=new THREE.Mesh(geometry,[front,edges]);object.add(text);
    if(word.includes('â')){
      const prefix=new TextGeometry('ch',options);prefix.computeBoundingBox();
      const a=new TextGeometry('a',options);a.computeBoundingBox();
      const x=prefix.boundingBox.max.x+.035+(a.boundingBox.max.x-a.boundingBox.min.x)/2;
      const shape=new THREE.Shape();shape.moveTo(-.065,0);shape.lineTo(0,.055);shape.lineTo(.065,0);shape.lineTo(.045,-.017);shape.lineTo(0,.02);shape.lineTo(-.045,-.017);shape.closePath();
      const accent=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.09,bevelEnabled:true,bevelSize:.003,bevelThickness:.003,bevelSegments:1}),[front,edges]);
      accent.position.set(x,bounds.max.y+.045,0);object.add(accent);prefix.dispose();a.dispose();
    }
    text.position.x=-(bounds.min.x+bounds.max.x)/2;text.position.y=-bounds.min.y;
    for(const part of object.children)if(part!==text){part.position.x+=text.position.x;part.position.y+=text.position.y;}
    object.scale.setScalar(Math.min(1,1.7/width));
    const side=index%2===0?-1:1,z=9-index*4.5;
    const start=new THREE.Vector3(side*.72,-.3,z);
    const end=new THREE.Vector3(side*(.72+branchLengths[index]),.12+index%3*.12,z-.2);
    const direction=end.clone().sub(start),length=direction.length();
    const branchGeometry=new THREE.CylinderGeometry(.15,.28,length,20,10,true);
    const p=branchGeometry.attributes.position;
    for(let i=0;i<p.count;i++){
      const angle=Math.atan2(p.getZ(i),p.getX(i)),ridge=1+Math.sin(angle*11+p.getY(i)*3)*.04;
      p.setX(i,p.getX(i)*ridge);p.setZ(i,p.getZ(i)*ridge);
    }
    branchGeometry.computeVertexNormals();
    const branch=new THREE.Mesh(branchGeometry,bark);branch.name=`Branche coupee : ${word}`;
    branch.position.copy(start).add(end).multiplyScalar(.5);
    branch.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize());
    branch.castShadow=branch.receiveShadow=true;group.add(branch);
    const cut=new THREE.Mesh(new THREE.CircleGeometry(.151,32),cutWood);
    cut.name=`Bois coupe au bout : ${word}`;cut.position.copy(end).addScaledVector(direction.clone().normalize(),.003);
    cut.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),direction.clone().normalize());cut.receiveShadow=true;group.add(cut);
    object.position.copy(end).add(new THREE.Vector3(0,.18,.03));
    object.rotation.y=(index%2===0?1:-1)*.12;
    object.traverse(part=>{if(part.isMesh){part.castShadow=part.receiveShadow=true;}});
    group.add(object);
  });
  return group;
}
