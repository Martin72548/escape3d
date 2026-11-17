import * as THREE from 'three';
import { createSepulchralVoice } from './sepulchral-voice.js';
import { statueExplosionSound } from './statue-explosion-sound.js';

export function createEffigyEncounter(scene, tomb, prisoner) {
  const effigy = tomb.userData.effigy;
  const scream = createSepulchralVoice();
  const parts = {arm:[],leg:[],head:[]}, debris=[];
  const chunkGeometry = new THREE.DodecahedronGeometry(1,0);
  const rest = [], eyes=[];
  const corpseMeshes=[];
  let voiceStarted=false;
  let requested=false, ready=false, age=0, hits=0, model, spine, head;
  const garment=tomb.userData.effigyGarment;
  const garmentPivot=new THREE.Group();garmentPivot.position.y=.78;effigy.add(garmentPivot);
  effigy.updateWorldMatrix(true,true);garmentPivot.attach(garment);
  tomb.userData.appearanceReady.then(loaded=>{
    if(!loaded)return;
    model=loaded;
    model.traverse(bone=>{if(bone.isBone)rest.push({bone,q:bone.quaternion.clone(),p:bone.position.clone(),s:bone.scale.clone()});});
    spine=model.getObjectByName('spine_01');head=model.getObjectByName('head');
    const meshes=[];model.traverse(mesh=>{if(mesh.isSkinnedMesh)meshes.push(mesh);});
    function prepareCorpse(mesh, source=mesh.userData.livingMaterials){
      const materials=(Array.isArray(source)?source:[source]).filter(Boolean).map(material=>{
        const skin=material.clone();
        if(/skin/i.test(skin.name)){skin.color.set(0x899482);skin.roughness=.87;skin.normalScale?.set(1.15,1.15);}
        else if(/eye|iris/i.test(skin.name)){skin.color.set(0x20190e);skin.roughness=.35;}
        else if(/teeth/i.test(skin.name)){skin.color.set(0x9e936b);skin.roughness=.8;}
        else {skin.color.multiplyScalar(.55);skin.roughness=.9;}
        if(skin.map)skin.map.anisotropy=8;
        return skin;
      });
      if(materials.length)corpseMeshes.push({mesh,material:Array.isArray(source)?materials:materials[0]});
    }
    function region(mesh,id){
      const indices=mesh.geometry.attributes.skinIndex,weights=mesh.geometry.attributes.skinWeight;
      if(!indices||!weights)return 'body';
      let slot=0;for(let i=1;i<4;i++)if(weights.getComponent(id,i)>weights.getComponent(id,slot))slot=i;
      let bone=mesh.skeleton.bones[indices.getComponent(id,slot)];
      while(bone?.isBone){
        if(bone.name==='upperarm_l')return 'arm';
        if(bone.name==='thigh_r')return 'leg';
        if(bone.name==='head'||bone.name==='neck_01')return 'head';
        bone=bone.parent;
      }
      return 'body';
    }
    for(const mesh of meshes){
      const geometry=mesh.userData.fullBodyGeometry??mesh.geometry, index=geometry.index;
      // Geometry and material resources stay outside serialised Object3D
      // userData when cloning the detachable portions.
      delete mesh.userData.fullBodyGeometry;
      const buckets={body:[],arm:[],leg:[],head:[]};
      for(let i=0;i<(index?.count??geometry.attributes.position.count);i+=3){
        const ids=[0,1,2].map(k=>index?index.getX(i+k):i+k);
        const regions=ids.map(id=>region(mesh,id));
        const label=regions.find(r=>regions.filter(v=>v===r).length>=2)??regions[0];
        buckets[label].push(...ids);
      }
      for(const name of ['arm','leg','head']){
        const piece=mesh.clone();piece.geometry=geometry.clone();piece.geometry.setIndex(buckets[name]);
        piece.name=`Gisant ${name}`;piece.frustumCulled=false;mesh.parent.add(piece);parts[name].push(piece);
        prepareCorpse(piece,mesh.userData.livingMaterials);
      }
      mesh.geometry=geometry.clone();mesh.geometry.setIndex(buckets.body);
      prepareCorpse(mesh);
    }
    if(head)for(const side of [-1,1]){
      const eye=new THREE.Mesh(new THREE.SphereGeometry(.015,12,10),new THREE.MeshStandardMaterial({color:0xff1800,emissive:0xff0800,emissiveIntensity:5}));
      effigy.add(eye);eye.position.set(side*.038,1.59,.092);effigy.updateWorldMatrix(true,true);head.attach(eye);
      const light=new THREE.PointLight(0xff1700,0,.8);eye.add(light);eye.visible=false;eyes.push({eye,light});
    }
    ready=true;
  });
  function trigger(){if(!requested&&hits<3&&!prisoner.userData.dead){requested=true;age=0;}}
  function shatter(name){
    scene.updateMatrixWorld(true);
    for(const piece of parts[name]){
      if(!piece.visible)continue;
      piece.skeleton?.update();
      const index=piece.geometry.index;
      for(let i=0;i<Math.min(36,index?.count??0);i++){
        const vertexId=index.getX(Math.floor(i*(index.count-1)/Math.min(36,index.count)));
        const point=piece.getVertexPosition(vertexId,new THREE.Vector3()).applyMatrix4(piece.matrixWorld);
        const shard=new THREE.Mesh(chunkGeometry,tomb.userData.stoneMaterial);shard.position.copy(point);shard.scale.setScalar(.025+Math.random()*.065);shard.castShadow=true;scene.add(shard);
        debris.push({mesh:shard,v:new THREE.Vector3((Math.random()-.5)*4,2+Math.random()*3,(Math.random()-.5)*4),age:0});
      }
      piece.visible=false;
    }
    if(name==='head')eyes.forEach(({eye})=>eye.visible=false);
    statueExplosionSound.play();scream.play();
  }
  function hit(){
    if(!ready||hits>=3||prisoner.userData.dead||prisoner.userData.georgeCaptured)return false;
    hits++;
    shatter(['arm','leg','head'][hits-1]);
    return true;
  }
  function aim(bone,target){
    const child=bone?.children.find(o=>o.isBone);if(!child)return;
    const start=bone.getWorldPosition(new THREE.Vector3());
    const direction=child.getWorldPosition(new THREE.Vector3()).sub(start).normalize();
    const q=new THREE.Quaternion().setFromUnitVectors(direction,target.clone().sub(start).normalize()).multiply(bone.getWorldQuaternion(new THREE.Quaternion()));
    bone.quaternion.copy(bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(q));bone.updateWorldMatrix(false,true);
  }
  function bendAnatomically(bone,angle,axis){
    if(!bone)return;
    const worldRotation=bone.getWorldQuaternion(new THREE.Quaternion());
    worldRotation.premultiply(new THREE.Quaternion().setFromAxisAngle(axis,angle));
    bone.quaternion.copy(bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(worldRotation));
    bone.updateWorldMatrix(false,true);
  }
  function update(dt){
    for(let i=debris.length-1;i>=0;i--){const p=debris[i];p.age+=dt;p.v.y-=9.8*dt;p.mesh.position.addScaledVector(p.v,dt);p.mesh.rotation.x+=dt*5;p.mesh.rotation.z+=dt*3;if(p.mesh.position.y<.06){p.mesh.position.y=.06;p.v.set(0,0,0);}if(p.age>6){p.mesh.removeFromParent();debris.splice(i,1);}}
    if(!requested||!ready||hits>=3||prisoner.userData.dead){if(hits>=3||prisoner.userData.dead)scream.stop();return;}
    if(!voiceStarted){voiceStarted=true;scream.play();}
    age+=dt;
    const transformation=THREE.MathUtils.smoothstep(age,.2,2.8);
    for(const {mesh,material}of corpseMeshes){
      mesh.material=material;
      if(mesh.morphTargetInfluences)for(const [name,value]of [['age_old',.9],['weight_min',.85],['muscle_min',.65],['face_cheekbones_incr',.7],['face_eye_size_decr',.4],['face_mouth_width_incr',.4]]){
        const index=mesh.morphTargetDictionary?.[name];if(index!==undefined)mesh.morphTargetInfluences[index]=value*transformation;
      }
    }
    const sit=THREE.MathUtils.clamp(THREE.MathUtils.smoothstep(age,.5,4.8)+Math.sin(age*21)*.012*Math.sin(Math.min(age/4.8,1)*Math.PI),0,1);
    // Preserve every cervical link's position and length. All movement below
    // is rotation about anatomical joints, never translation of the head.
    rest.forEach(({bone,q,p,s})=>{bone.quaternion.copy(q);bone.position.copy(p);bone.scale.copy(s);});
    model.updateWorldMatrix(true,true);
    const lateralAxis=new THREE.Vector3(1,0,0).transformDirection(effigy.matrixWorld);
    // Rotate at the hips rather than folding the abdomen into the chest.
    // Counter-rotate both thighs so the legs remain on the lid while the
    // pelvis and complete torso rise together as one continuous skeleton.
    const hipAngle=sit*Math.PI/2;
    bendAnatomically(model.getObjectByName('pelvis'),hipAngle,lateralAxis);
    for(const side of ['l','r'])bendAnatomically(model.getObjectByName('thigh_'+side),-hipAngle,lateralAxis);
    garment.visible=false;
    const neck=model.getObjectByName('neck_01');
    // A small backward counter-rotation keeps the chin clear of the chest.
    // The rig's local bone axes differ from the figure's anatomical axes.
    const neckExtension=-.045*Math.sin(sit*Math.PI);
    bendAnatomically(neck,neckExtension,lateralAxis);
    bendAnatomically(head,-neckExtension,lateralAxis);
    const reach=THREE.MathUtils.smoothstep(age,2.2,6);
    for(const [suffix,side]of [['l',1],['r',-1]]){
      const upper=model.getObjectByName('upperarm_'+suffix),lower=model.getObjectByName('lowerarm_'+suffix);
      if(!upper||!lower)continue;
      const shoulder=upper.getWorldPosition(new THREE.Vector3());
      const direction=prisoner.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0,2,0)).sub(shoulder).normalize();
      const outward=new THREE.Vector3(side,0,0).transformDirection(effigy.matrixWorld);
      const goal=shoulder.clone().addScaledVector(direction,.55).addScaledVector(outward,.32);
      goal.y+=Math.sin(age*7+side)*.01*reach;
      const current=lower.getWorldPosition(new THREE.Vector3());aim(upper,current.lerp(goal,reach));
      const handGoal=shoulder.clone().addScaledVector(direction,1.1).addScaledVector(outward,.23);
      const hand=model.getObjectByName('hand_'+suffix);
      if(hand)aim(lower,hand.getWorldPosition(new THREE.Vector3()).lerp(handGoal,reach));
      const wrist=model.getObjectByName('hand_'+suffix);if(wrist){wrist.rotateX(.48*reach);wrist.rotateZ(side*.16*reach);}
    }
    eyes.forEach(({eye,light})=>{eye.visible=hits<3;light.intensity=(2+Math.sin(age*19)*.4)*sit;});
  }
  return {trigger,hit,update,unlockAudio:scream.unlock,get hits(){return hits;}};
}
