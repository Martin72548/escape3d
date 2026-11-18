import * as THREE from 'three';
import { publicAssetBase } from './public-asset-base.js';

export function addMedievalVault(parent, stoneMaterial) {
  const root = new THREE.Group(); root.name = 'Voute gothique medievale a croisees d ogives'; parent.add(root);
  const spring = 5.85, rise = 4.75, halfWidth = 10;
  const height = x => spring + rise * Math.sqrt(Math.max(0, 196 - (Math.abs(x) + 4) ** 2)) / Math.sqrt(180);
  const stone = stoneMaterial.clone();
  for (const key of ['map', 'bumpMap', 'roughnessMap']) {
    stone[key] = stoneMaterial[key].clone(); stone[key].repeat.set(7, 9); stone[key].needsUpdate = true;
  }
  stone.color.set(0xd2c6a9); stone.bumpScale = .07; stone.side = THREE.DoubleSide;
  const positions = [], uvs = [], indices = [], nx = 96, nz = 64;
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    const x = -halfWidth + i / nx * 20, z = -10 + j / nz * 20;
    positions.push(x, height(x), z); uvs.push(i / nx, j / nz);
    if (i < nx && j < nz) {
      const a = j * (nx + 1) + i, b = a + nx + 1;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geometry.setIndex(indices); geometry.computeVertexNormals();
  const shell = new THREE.Mesh(geometry, stone); shell.receiveShadow = true; root.add(shell);
  const ribStone = stoneMaterial.clone(); ribStone.color.set(0xc6b99a); ribStone.bumpScale = .025;
  const darkStone = ribStone.clone(); darkStone.color.set(0x8d8066);
  function rib(points, radius = .12, material = ribStone) {
    const curve = new THREE.CatmullRomCurve3(points);
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 100, radius, 10, false), material);
    mesh.castShadow = mesh.receiveShadow = true; root.add(mesh); return mesh;
  }
  function arch(z) {
    const points = Array.from({ length: 65 }, (_, i) => { const x = -9.96 + i / 64 * 19.92; return new THREE.Vector3(x, height(x) - .09, z); });
    rib(points, .16);
    for (const side of [-1, 1]) rib(points.map(p => p.clone().add(new THREE.Vector3(0, -.09, side * .16))), .055);
    // Individual stone joints in each transverse arch.
    const curve = new THREE.CatmullRomCurve3(points);
    for (let i = 1; i < 32; i++) {
      const point = curve.getPointAt(i / 32), tangent = curve.getTangentAt(i / 32);
      const joint = new THREE.Mesh(new THREE.TorusGeometry(.165, .009, 5, 12), darkStone);
      joint.position.copy(point); joint.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent); root.add(joint);
    }
  }
  for (const z of [-10, -5, 0, 5, 10]) arch(z);
  for (let bay = 0; bay < 4; bay++) {
    const start = -10 + bay * 5, center = start + 2.5;
    for (const side of [-1, 1]) {
      const points = Array.from({ length: 65 }, (_, i) => {
        const t = i / 64, x = side * (-9.96 + t * 19.92);
        return new THREE.Vector3(x, height(x) - .12, start + t * 5);
      });
      rib(points, .11);
    }
    const boss = new THREE.Group(); boss.position.set(0, height(0) - .23, center); root.add(boss);
    const metal = new THREE.MeshStandardMaterial({color:0x8e6335,metalness:.48,roughness:.62});
    const carved = new THREE.Mesh(new THREE.SphereGeometry(.23, 16, 12), ribStone); carved.scale.y = .55; boss.add(carved);
    for(let petal=0;petal<8;petal++) {
      const a=petal*Math.PI/4,leaf=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),metal);
      leaf.position.set(Math.sin(a)*.19,-.08,Math.cos(a)*.19);leaf.scale.set(.065,.035,.14);leaf.rotation.y=a;boss.add(leaf);
    }
  }
  rib([new THREE.Vector3(0,height(0)-.08,-10),new THREE.Vector3(0,height(0)-.08,10)],.075);
  // Close the gables above the existing six-metre walls.
  for(const z of [-10,10]) {
    const p=[],idx=[];
    for(let i=0;i<=96;i++){const x=-10+i/96*20;p.push(x,5.8,z,x,height(x),z);if(i<96){const a=i*2;idx.push(a,a+1,a+2,a+2,a+1,a+3);}}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();
    const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:0x938873,roughness:1,side:THREE.DoubleSide}));m.receiveShadow=true;root.add(m);
    if(z===-10){
      const uv=[];
      for(let i=0;i<=96;i++){
        const x=-10+i/96*20;
        uv.push(i/96,0,i/96,(height(x)-5.8)/(height(0)-5.8));
      }
      const frescoGeometry=g.clone();
      frescoGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
      const frescoMaterial=new THREE.MeshStandardMaterial({color:0xd6c7ac,roughness:1,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
      const fresco=new THREE.Mesh(frescoGeometry,frescoMaterial);
      fresco.name='Fresque sacree medievale au-dessus des phrases';fresco.position.z=.025;fresco.receiveShadow=true;root.add(fresco);
      new THREE.TextureLoader().load(`${publicAssetBase}textures/medieval-sacred-fresco.png`,texture=>{
        texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
        frescoMaterial.map=texture;frescoMaterial.color.set(0xffffff);frescoMaterial.needsUpdate=true;
      },undefined,error=>console.warn('Fresque medievale indisponible :',error));
    }
  }
  return root;
}
