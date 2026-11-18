import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { translate } from './language.js';
import { publicAssetBase } from './public-asset-base.js';

export async function addTrunkWords(parent, posts, groundY) {
  const font = await new FontLoader().loadAsync(`${publicAssetBase}fonts/helvetiker_bold.typeface.json`);
  const words = translate(['dragon', 'courageux', 'grande', 'château', 'dame'],
    ['dragón', 'valiente', 'grande', 'castillo', 'dama']);
  const group = new THREE.Group(); group.name = 'Mots en trois dimensions sur les pilotis'; parent.add(group);
  const front = new THREE.MeshStandardMaterial({color:0xe9c471,metalness:.35,roughness:.46});
  const edges = new THREE.MeshStandardMaterial({color:0x79562b,metalness:.25,roughness:.68});
  const options = {font,size:.27,depth:.09,curveSegments:8,bevelEnabled:true,bevelThickness:.008,bevelSize:.006,bevelSegments:2};
  words.forEach((word,index) => {
    // The bundled font lacks â; add its circumflex as a separate solid glyph.
    const accentIndex = word.search(/[âó]/);
    const plain = word.replace('â','a').replace('ó','o');
    const geometry = new TextGeometry(plain, options);
    geometry.computeBoundingBox();
    const bounds=geometry.boundingBox, width=bounds.max.x-bounds.min.x;
    const object=new THREE.Group();object.name=`Mot 3D : ${word}`;object.userData.word=word;object.userData.spellTarget='trunk-word';
    object.userData.collectibleNoun = index === 0 || index >= 3;
    const text=new THREE.Mesh(geometry,[front,edges]);object.add(text);
    if(accentIndex !== -1){
      const prefix=new TextGeometry(plain.slice(0,accentIndex),options);prefix.computeBoundingBox();
      const a=new TextGeometry(plain[accentIndex],options);a.computeBoundingBox();
      const x=prefix.boundingBox.max.x+.035+(a.boundingBox.max.x-a.boundingBox.min.x)/2;
      const shape = new THREE.Shape();
      if (word[accentIndex] === 'ó') {
        shape.moveTo(-.032,0);shape.lineTo(.018,.055);shape.lineTo(.046,.055);shape.lineTo(-.004,0);
      } else {
        shape.moveTo(-.065,0);shape.lineTo(0,.055);shape.lineTo(.065,0);
        shape.lineTo(.045,-.017);shape.lineTo(0,.02);shape.lineTo(-.045,-.017);
      }
      shape.closePath();
      const accent = new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.09,bevelEnabled:true,bevelThickness:.003,bevelSize:.003,bevelSegments:1}),[front,edges]);
      accent.position.set(x,bounds.max.y+.045,0);object.add(accent);prefix.dispose();a.dispose();
    }
    text.position.x=-(bounds.min.x+bounds.max.x)/2;text.position.y=-bounds.min.y;
    for(const part of object.children)if(part!==text){part.position.x+=text.position.x;part.position.y+=text.position.y;}
    object.scale.setScalar(Math.min(1,1.7/width));
    const {x,z}=posts[index];
    object.position.set(x+Math.sign(x)*.42,groundY+.18,z-.28);
    object.traverse(part=>{if(part.isMesh){part.castShadow=part.receiveShadow=true;}});
    group.add(object);
  });
  return group;
}
