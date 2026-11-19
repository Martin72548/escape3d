import * as THREE from 'three';
import { createRecordedDoorCreak } from './recorded-door-creak.js';
import { createPrisonerMovement } from './prisoner-movement.js';
import { createRealisticTorch } from './realistic-torch.js';

export function createDungeonExit(scene, stoneMaterial, floorMaterial, prisoner, enterNextRoom, awardRibbonPoint, showRibbonMessage, showThrowHint) {
 const iron=new THREE.MeshStandardMaterial({color:0x292a28,metalness:.7,roughness:.65});
 const wood=new THREE.MeshStandardMaterial({color:0x49301d,roughness:.95});
 const hinge=new THREE.Group();hinge.name='Puerta del calabozo';hinge.position.set(-1.15,0,-9.88);scene.add(hinge);
 const door=new THREE.Mesh(new THREE.BoxGeometry(2.3,3.5,.16),wood);door.position.set(1.15,1.75,0);door.castShadow=true;hinge.add(door);
 for(const y of [.65,1.75,2.85]){const strap=new THREE.Mesh(new THREE.BoxGeometry(2.25,.14,.08),iron);strap.position.set(1.15,y,.13);hinge.add(strap);}
 const handle=new THREE.Mesh(new THREE.TorusGeometry(.12,.025,8,24),iron);handle.position.set(2,1.6,.15);hinge.add(handle);
 const corridor=new THREE.Group();corridor.name='Pasillo iluminado';scene.add(corridor);
 const entrance=new THREE.Group();scene.add(entrance);
 function block(w,h,d,x,y,z,material=stoneMaterial,parent=corridor){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.receiveShadow=true;mesh.castShadow=true;parent.add(mesh);return mesh;}
 const junctionZ=-13;
 const runLength=66;
 const gateZ=junctionZ-runLength;
 const nearEdge=gateZ-4;
 const farEdge=nearEdge-8;
 const chapelZ=farEdge-4;
 const endZ=gateZ-1;
 const length=junctionZ-endZ;
 const centerZ=(junctionZ+endZ)/2;
 const ceilingHeight=6;
 const wallCenter=1.6;
 const wallThickness=.24;
 const innerWall=wallCenter-wallThickness/2;
 // Leave room for the running stride and raised arms, regardless of heading.
 const bodyClearance=1.03;
 const lateralLimit=innerWall-bodyClearance;
 block(3.2,.12,length,0,-.06,centerZ,floorMaterial);
 block(wallThickness,ceilingHeight,length,wallCenter,ceilingHeight/2,centerZ);
 // The inner wall starts at the corner of the short entrance, clear of the approach.
 block(wallThickness,ceilingHeight,length-innerWall,-wallCenter,ceilingHeight/2,centerZ-innerWall/2);
 block(3.44,.18,length,0,ceilingHeight,centerZ);
 // Stone jambs frame the opening without blocking the view down the passage.
 block(.16,3.65,.36,-1.23,1.825,-9.88,stoneMaterial,entrance);
 block(.16,3.65,.36,1.23,1.825,-9.88,stoneMaterial,entrance);
 block(2.62,.18,.36,0,3.62,-9.88,stoneMaterial,entrance);
 block(3.2,.12,4.6,0,-.06,-12.3,floorMaterial,entrance);
 block(3.44,.18,4.6,0,ceilingHeight,-12.3,stoneMaterial,entrance);
 block(wallThickness,ceilingHeight,4.6,wallCenter,ceilingHeight/2,-12.3,stoneMaterial,entrance);
 const insideCornerZ=junctionZ+innerWall;
 const entranceWallLength=-10-insideCornerZ;
 block(wallThickness,ceilingHeight,entranceWallLength,-wallCenter,ceilingHeight/2,(insideCornerZ-10)/2,stoneMaterial,entrance);
 block(1.72,ceilingHeight,wallThickness,.86,ceilingHeight/2,-14.6,stoneMaterial,entrance);
 const gate=new THREE.Group();gate.name='Grille du couloir';gate.position.z=gateZ;corridor.add(gate);
 for(let i=-5;i<=5;i++) gate.attach(block(.075,3.65,.075,i*.25,1.825,gateZ,iron));
 for(const y of [.35,1.65,3.3]) gate.attach(block(2.65,.09,.11,0,y,gateZ,iron));
 for(const x of [-1.39,1.39]) block(.18,3.9,.38,x,1.95,gateZ);
 block(3.1,ceilingHeight-3.65,.44,0,(ceilingHeight+3.65)/2,gateZ+.32);
 const lever=new THREE.Group();lever.name='Manivelle de la grille';lever.position.set(1.25,1.65,gateZ+1.05);corridor.add(lever);
 block(.18,.55,.36,1.39,lever.position.y,lever.position.z,iron);
 lever.attach(block(.08,.46,.08,1.25,lever.position.y+.18,lever.position.z,iron));
 lever.attach(block(.27,.10,.10,1.14,lever.position.y+.40,lever.position.z,wood));
 const vaultHeight=8.5;
 const vaultEnd=chapelZ-1.8;
 const vaultLength=endZ-vaultEnd;
 const vaultCenter=(endZ+vaultEnd)/2;
 const pitCenter=(nearEdge+farEdge)/2;
 const pitDepth=24;
 block(5.6,.22,endZ-nearEdge,0,-.11,(endZ+nearEdge)/2,floorMaterial);
 block(5.6,.22,farEdge-vaultEnd,0,-.11,(farEdge+vaultEnd)/2,floorMaterial);
 for(const x of [-2.92,2.92]){
  block(.24,vaultHeight,vaultLength,x,vaultHeight/2,vaultCenter);
  block(.24,pitDepth,nearEdge-farEdge,x,-pitDepth/2,pitCenter);
 }
 for(const z of [nearEdge+.12,farEdge-.12])block(5.6,pitDepth,.24,0,-pitDepth/2,z);
 block(5.6,.3,nearEdge-farEdge,0,-pitDepth,pitCenter,new THREE.MeshStandardMaterial({color:0x090a0c}));
 block(6.08,.25,vaultLength,0,vaultHeight,vaultCenter);
 block(6.08,vaultHeight,.25,0,vaultHeight/2,vaultEnd);
 for(const x of [-2.2,2.2])block(1.6,vaultHeight,.24,x,vaultHeight/2,endZ);
 block(3,vaultHeight-ceilingHeight,.24,0,(vaultHeight+ceilingHeight)/2,endZ);

 const hook=new THREE.Group();
 hook.name='Crochet scellé dans la voûte';hook.position.set(0,vaultHeight-.25,pitCenter);corridor.add(hook);
 hook.attach(block(1.1,.48,.9,0,vaultHeight-.17,pitCenter));
 hook.attach(block(.62,.12,.48,0,vaultHeight-.44,pitCenter,iron));
 for(const x of [-.23,.23])for(const z of [-.16,.16]){
  const bolt=new THREE.Mesh(new THREE.CylinderGeometry(.047,.047,.09,6),iron);
  bolt.position.set(x,-.29,z);hook.add(bolt);
 }
 const hookShape=new THREE.CatmullRomCurve3([
  new THREE.Vector3(0,.05,0),new THREE.Vector3(0,-.48,0),
  new THREE.Vector3(0,-.84,.15),new THREE.Vector3(0,-.8,.43),new THREE.Vector3(0,-.53,.5),
 ]);
 const metalHook=new THREE.Mesh(new THREE.TubeGeometry(hookShape,28,.065,10,false),iron);
 metalHook.castShadow=true;hook.add(metalHook);

 const chapelHinge=new THREE.Group();chapelHinge.name='Porte de la chapelle du Saut Périlleux';
 chapelHinge.position.set(-1.15,0,chapelZ);corridor.add(chapelHinge);
 const doorShape=new THREE.Shape();
 doorShape.moveTo(0,0);doorShape.lineTo(2.3,0);doorShape.lineTo(2.3,2.65);
 doorShape.absarc(1.15,2.65,1.15,0,Math.PI,false);doorShape.lineTo(0,0);
 const chapelDoor=new THREE.Mesh(new THREE.ExtrudeGeometry(doorShape,{depth:.16,bevelEnabled:false}),wood);
 chapelDoor.castShadow=true;chapelHinge.add(chapelDoor);
 const chapelWall=new THREE.Shape();
 chapelWall.moveTo(-2.8,0);chapelWall.lineTo(-2.8,vaultHeight);chapelWall.lineTo(2.8,vaultHeight);chapelWall.lineTo(2.8,0);
 chapelWall.lineTo(1.16,0);chapelWall.lineTo(1.16,2.65);
 chapelWall.absarc(0,2.65,1.16,0,Math.PI,false);chapelWall.lineTo(-1.16,0);chapelWall.closePath();
 const facade=new THREE.Mesh(new THREE.ExtrudeGeometry(chapelWall,{depth:.28,bevelEnabled:false}),stoneMaterial);
 facade.position.z=chapelZ-.19;facade.castShadow=facade.receiveShadow=true;corridor.add(facade);
 for(const y of [.75,1.65,2.55])chapelHinge.attach(block(2.25,.11,.09,0,y,chapelZ+.19,iron));
 for(const x of [-1.34,1.34])block(.36,2.7,.65,x,1.35,chapelZ);
 for(let i=0;i<9;i++){
  const angle=(i+.5)*Math.PI/9;
  const stone=block(.39,.39,.65,1.33*Math.cos(angle),2.65+1.33*Math.sin(angle),chapelZ);
  stone.rotation.z=angle;
 }
 const vaultTorches=[[-2.6,nearEdge+1.1],[2.6,farEdge-1.2],[-2.6,chapelZ+.4]].map(([x,z])=>
  createRealisticTorch(corridor,{position:[x,4,z],rotationY:-Math.sign(x)*Math.PI/2,intensity:72,seed:-z})
 );
 const vaultLight=new THREE.PointLight(0xffcf9a,34,13,2);vaultLight.position.set(0,6.3,pitCenter);corridor.add(vaultLight);
 const pitLight=new THREE.PointLight(0x6e85a0,40,13,2);pitLight.position.set(0,-3,pitCenter);corridor.add(pitLight);
 corridor.add(new THREE.HemisphereLight(0xffbf78,0x302619,.35));
 // Rotate the long passage about its entrance to form the left turn.
 corridor.rotation.y=Math.PI/2;
 corridor.position.set(-junctionZ,0,junctionZ);
 const ribbons=[];
 const ribbonLength=.72;
 const ribbonGeometry=new THREE.PlaneGeometry(.19,ribbonLength,4,16);
 const vertices=ribbonGeometry.attributes.position;
 for(let i=0;i<vertices.count;i++){
  const t=.5-vertices.getY(i)/ribbonLength;
  const x=vertices.getX(i);
  vertices.setXYZ(i,x*(.7+.3*t)+.035*Math.sin(t*5)*t,-t*ribbonLength+.06*t**12*(1-Math.abs(x)/.095),.055*Math.sin(t*8+x*12)*t);
 }
 ribbonGeometry.computeVertexNormals();
 const ribbonMaterial=new THREE.MeshStandardMaterial({color:0xc21328,emissive:0x5f0611,emissiveIntensity:.35,roughness:.83,side:THREE.DoubleSide});
 for(let distance=0;distance<runLength;distance+=6){
  const side=distance%12===0?1:-1;
  const torch=createRealisticTorch(corridor,{position:[side*1.28,4.7,junctionZ-distance],rotationY:-side*Math.PI/2,intensity:45,seed:distance+1});
  const ribbon=new THREE.Mesh(ribbonGeometry,ribbonMaterial);
  ribbon.name='Ruban rouge';
  ribbon.position.set(0,-.6,.07);
  ribbon.rotation.y=side*Math.PI/2;
  torch.root.add(ribbon);
  const tip=ribbon.localToWorld(new THREE.Vector3(0,-ribbonLength,0));
  ribbons.push({torch,ribbon,tip});
 }
 const gateX=gateZ-junctionZ;
 const nearX=nearEdge-junctionZ+.65;
 const chapelX=chapelZ-junctionZ;
 const pivot=hook.localToWorld(new THREE.Vector3(0,-.8,.17));
 const standingY=prisoner.userData.standingY??.02;
 const gripHeight=3.45;
 const swingAngle=Math.atan2(nearX-pivot.x,pivot.y-standingY-gripHeight);
 const swingRadius=Math.hypot(nearX-pivot.x,pivot.y-standingY-gripHeight);
 const rope=new THREE.Group();
 rope.name='Corde de traversée';
 rope.visible=false;corridor.add(rope);
 const heldRibbon=new THREE.Group();
 heldRibbon.name='Ruban rouge serré dans la main droite';
 heldRibbon.visible=false;corridor.add(heldRibbon);
 const knot=new THREE.Mesh(new THREE.SphereGeometry(.082,10,8),ribbonMaterial);
 knot.scale.set(1,.7,.8);heldRibbon.add(knot);
 for(const side of [-1,1]){
  const tail=new THREE.Mesh(ribbonGeometry,ribbonMaterial);
  tail.scale.set(.7,.55,.7);tail.rotation.z=side*.32;tail.position.x=side*.034;heldRibbon.add(tail);
 }
 const ropeMaterial=new THREE.MeshStandardMaterial({color:0x9b352b,roughness:.91});
 const ropeGeometry=new THREE.CylinderGeometry(.045,.045,1,8);
 const ropeSegments=Array.from({length:14},()=>{
  const segment=new THREE.Mesh(ropeGeometry,ropeMaterial);rope.add(segment);return segment;
 });
 const coil=new THREE.Group();coil.name='Corde tressée tenue en main';coil.visible=false;corridor.add(coil);
 for(let i=0;i<4;i++){
  const loop=new THREE.Mesh(new THREE.TorusGeometry(.29,.042,6,32),ropeMaterial);
  loop.position.set(.045*i,-.27,.015*i);loop.rotation.y=1.1+i*.09;loop.scale.y=1.25;coil.add(loop);
 }
 const gold=new THREE.Group();gold.visible=false;corridor.add(gold);
 const glow=new THREE.PointLight(0xffc441,0,4,2);gold.add(glow);
 const sparkMaterial=new THREE.MeshBasicMaterial({color:0xffde75,toneMapped:false});
 const sparkGeometry=new THREE.SphereGeometry(.031,6,4);
 const sparks=Array.from({length:18},()=>{const spark=new THREE.Mesh(sparkGeometry,sparkMaterial);gold.add(spark);return spark;});
 const braidStrips=Array.from({length:10},()=>{const strip=new THREE.Mesh(ribbonGeometry,ribbonMaterial);gold.add(strip);return strip;});
 const ropeAnchor=corridor.worldToLocal(pivot.clone());
 const grip=new THREE.Vector3(), otherHand=new THREE.Vector3(), ropeTip=new THREE.Vector3();
 const start=new THREE.Vector3(), end=new THREE.Vector3(), ropeDirection=new THREE.Vector3(), up=new THREE.Vector3(0,1,0);
 const creak=createRecordedDoorCreak({volume:1.4}),openingAngle=Math.PI*.56;
 const movement=createPrisonerMovement(prisoner,{scripted:true});
 const arm=prisoner.getObjectByName('casting-arm');
 const leftArm=prisoner.getObjectByName('left-arm');
 const wrist=prisoner.getObjectByName('casting-wrist');
 const leftWrist=prisoner.getObjectByName('left-wrist');
 const elbow=prisoner.getObjectByName('casting-elbow');
 const leftElbow=prisoner.getObjectByName('left-elbow');
 const elbowRest=elbow.quaternion.clone(),leftElbowRest=leftElbow.quaternion.clone();
 const rightRest=arm.quaternion.clone(),leftRest=leftArm.quaternion.clone();
 const direction=new THREE.Vector3();
 let opened=false,age=0,stage='approach',leverAge=0,jumpTime=null,vaultAge=0;
 let gateOpened=false,edgeCheckArmed=true;
 let throwAttempts=0;
 const jumpDuration=.76;
 function jump(){if(stage==='run'&&jumpTime===null)jumpTime=0;}
 function giveCorridorControl(){
  const state=prisoner.userData;
  state.inExitCorridor=true;
  state.jumpInExitCorridor=jump;
  state.constrainMovement=(x,z)=>({
   x:THREE.MathUtils.clamp(x,gateOpened?nearX:gateX+1.55,lateralLimit),
   z:THREE.MathUtils.clamp(z,junctionZ-lateralLimit,junctionZ+lateralLimit),
   y:standingY,
  });
  stage='run';
 }
 function checkRibbons(){
  const state=prisoner.userData;
  const hasEnoughRibbons=ribbons.filter(({ribbon})=>!ribbon.visible).length>=10;
  showRibbonMessage(hasEnoughRibbons);
  if(hasEnoughRibbons){
   state.inExitCorridor=false;
   state.runningToGate=false;
   delete state.jumpInExitCorridor;
   prisoner.rotation.y=-Math.PI/2;
   stage='braid';
  }else{
   edgeCheckArmed=false;
   giveCorridorControl();
  }
 }
 function poseHands(rightPitch,leftPitch,closer,bend){
  arm.quaternion.copy(rightRest);arm.rotateX(rightPitch);arm.rotateZ(closer);
  leftArm.quaternion.copy(leftRest);leftArm.rotateX(leftPitch);leftArm.rotateZ(-closer);
  elbow.quaternion.copy(elbowRest);elbow.rotateX(bend);
  leftElbow.quaternion.copy(leftElbowRest);leftElbow.rotateX(bend);
  wrist.getWorldPosition(grip);corridor.worldToLocal(grip);
  leftWrist.getWorldPosition(otherHand);corridor.worldToLocal(otherHand);
 }
 function drawRope(slack){
  start.copy(grip);
  ropeSegments.forEach((segment,index)=>{
   const t=(index+1)/ropeSegments.length;
   end.copy(grip).lerp(ropeTip,t);
   end.y+=slack*Math.sin(Math.PI*t);
   ropeDirection.copy(end).sub(start);
   segment.position.copy(start).lerp(end,.5);
   segment.scale.y=ropeDirection.length()+.025;
   segment.quaternion.setFromUnitVectors(up,ropeDirection.normalize());
   start.copy(end);
  });
  rope.visible=true;
 }
 function updateGrip(){
  heldRibbon.visible=stage==='takeoff'||stage==='swing';
  if(!heldRibbon.visible)return;
  const palm=prisoner.getObjectByName('spell-origin');
  if(palm)palm.getWorldPosition(grip);
  else wrist.localToWorld(grip.set(0,-.055,0));
  corridor.worldToLocal(grip);
  heldRibbon.position.copy(grip);
  heldRibbon.rotation.y=Math.sin(vaultAge*6)*.25;
  ropeTip.copy(ropeAnchor);
  drawRope(0);
 }
 function throwRope(){
  if(stage!=='holdRope')return;
  throwAttempts++;
  vaultAge=0;
  stage='throwRope';
 }
 function open(){if(opened)return;opened=true;creak.play();}
 function moveTo(x,z,dt,speed){
  direction.set(x-prisoner.position.x,0,z-prisoner.position.z);
  const distance=direction.length();
  movement.update(Math.min(dt,distance/speed),direction,true,speed);
  return distance<=speed*dt;
 }
 function update(dt){
  age+=dt;
  for(const {torch,ribbon,tip} of ribbons){
   if(Math.abs(prisoner.position.x-tip.x)>18)continue;
   torch.update(dt);
   ribbon.rotation.x=.09*Math.sin(age*3+tip.x);
   ribbon.rotation.z=.13*Math.sin(age*4+tip.x);
  }
  if(prisoner.position.x<gateX+18)for(const torch of vaultTorches)torch.update(dt);
  if(!opened||stage==='complete')return;
  hinge.rotation.y=Math.max(-openingAngle,hinge.rotation.y-dt*openingAngle/creak.duration);
  const state=prisoner.userData;
  if(state.dead||state.gameOver||state.sleeping||state.wakingUp||state.fallen||state.waistGrabOwner||state.firstSpellTrance||state.broomStriking||state.batDucking||state.snakeHopping||state.scorpionHopping)return;
  if(!state.crossingDungeonExit){
   if(hinge.rotation.y>-openingAngle)return;
   state.crossingDungeonExit=true;
  }
  if(stage==='approach'){
   if(moveTo(0,-8.5,dt,2.8))stage='doorway';
  }else if(stage==='doorway'){
   if(moveTo(0,junctionZ,dt,2.8)){
    movement.update(1,direction.set(0,0,0));
    state.walkingIntensity=0;
    giveCorridorControl();
   }
  }else if(stage==='run'){
   if(jumpTime!==null){
    jumpTime=Math.min(jumpTime+dt,jumpDuration);
    const t=jumpTime/jumpDuration;
    const lift=4*1.05*t*(1-t);
    prisoner.position.y=(state.standingY??.02)+lift;
    const reach=Math.sin(Math.PI*t);
    arm.rotateX(-2.5*reach);
    leftArm.rotateX(-2.5*reach);
    for(const {ribbon,tip} of ribbons){
     if(ribbon.visible&&lift>.3&&prisoner.position.y+2.95>=tip.y&&Math.hypot(prisoner.position.x-tip.x,prisoner.position.z-tip.z)<.9){
      ribbon.visible=false;
      awardRibbonPoint();
     }
    }
    if(t===1)jumpTime=null;
   }
   if(gateOpened){
    state.viewingExitVault=prisoner.position.x<gateX-2.4;
    if(prisoner.position.x>gateX+.5)edgeCheckArmed=true;
    if(jumpTime===null&&edgeCheckArmed&&prisoner.position.x<=nearX+.01){
     state.inExitCorridor=false;
     state.runningToGate=false;
     delete state.jumpInExitCorridor;
     stage='through';
    }
   }else if(jumpTime===null&&prisoner.position.x<=gateX+1.56){
    state.inExitCorridor=false;
    delete state.jumpInExitCorridor;
    state.runningToGate=false;
    stage='approachLever';
   }
  }else if(stage==='approachLever'){
   if(moveTo(gateX+1.55,junctionZ-.53,dt,2.8)){
    prisoner.rotation.y=-Math.PI/2;
    stage='lever';
   }
  }else if(stage==='lever'){
   leverAge+=dt;
   movement.update(dt,direction.set(0,0,0));
   const reach=THREE.MathUtils.smoothstep(leverAge,0,.45);
   const pull=THREE.MathUtils.smoothstep(leverAge,.45,1.05);
   const release=THREE.MathUtils.smoothstep(leverAge,1.05,1.5);
   arm.rotateX((-1.35+.85*pull)*reach*(1-release));
   arm.rotateZ(-.55*reach*(1-release));
   lever.rotation.x=1.7*pull;
   gate.position.y=3.75*THREE.MathUtils.smoothstep(leverAge,.75,2.3);
   if(leverAge>=2.3){gateOpened=true;stage='through';}
  }else if(stage==='through'){
   if(moveTo(nearX,junctionZ,dt,2.8)){
    state.viewingExitVault=true;
    checkRibbons();
   }
  }else if(stage==='braid'){
   movement.update(dt,direction.set(0,0,0));
   vaultAge+=dt;
   const forming=THREE.MathUtils.smoothstep(vaultAge,.25,1.4);
   const weaving=forming*(1-THREE.MathUtils.smoothstep(vaultAge,3.8,4.7));
   const roll=Math.sin(vaultAge*11)*.24*weaving;
   poseHands(-1.0*forming+roll,-1.0*forming-roll,.36*forming,-.64*forming);
   gold.position.copy(grip).lerp(otherHand,.5);
   gold.visible=weaving>.02;glow.intensity=20*weaving;
   sparks.forEach((spark,index)=>{
    const angle=vaultAge*6+index*Math.PI*2/sparks.length;
    const radius=.19+.09*Math.sin(vaultAge*3+index);
    spark.position.set(Math.cos(angle)*radius,Math.sin(angle)*radius,.12*Math.sin(2*angle));
    spark.scale.setScalar(weaving*(.7+.3*Math.sin(angle*3)));
   });
   braidStrips.forEach((strip,index)=>{
    const t=THREE.MathUtils.smoothstep(vaultAge,1.1+index*.09,3.1+index*.09);
    const angle=vaultAge*(3+2*t)+index*Math.PI*2/braidStrips.length;
    const radius=.25*(1-t);
    strip.position.set(Math.cos(angle)*radius,.12*Math.sin(angle),Math.sin(angle)*radius);
    strip.rotation.set(angle*.3,angle,.65*Math.cos(angle));
    strip.scale.setScalar(.46*forming*(1-t));
   });
   coil.position.copy(grip);
   const braided=THREE.MathUtils.smoothstep(vaultAge,1.25,4.1);
   coil.visible=braided>.01;coil.scale.setScalar(braided);
   if(vaultAge>=5){
    gold.visible=false;
    state.useExitRope=throwRope;
    stage='holdRope';
    showThrowHint();
   }
  }else if(stage==='holdRope'){
   poseHands(-.95,-.45,.16,-.5);
   coil.position.copy(grip);
  }else if(stage==='throwRope'){
   vaultAge+=dt;
   const outbound=THREE.MathUtils.smoothstep(vaultAge,.08,.66);
   const returning=throwAttempts<3?THREE.MathUtils.smoothstep(vaultAge,.66,1.4):0;
   const progress=outbound*(1-returning);
   const release=THREE.MathUtils.smoothstep(vaultAge,0,.25)*(1-returning);
   poseHands(-.95-1.63*release,-.45-.42*release,.16*(1-release),-.5*(1-release));
   ropeTip.copy(ropeAnchor);
   if(throwAttempts===1)ropeTip.x+=.9;
   if(throwAttempts===2)ropeTip.y-=1.25;
   ropeTip.lerpVectors(grip,ropeTip,progress);
   coil.visible=progress<.08;
   coil.position.copy(grip);
   drawRope(-.45*Math.sin(Math.PI*progress));
   if(throwAttempts<3&&vaultAge>=1.4){
    rope.visible=false;coil.visible=true;stage='holdRope';
   }else if(throwAttempts===3&&vaultAge>=.66){
    delete state.useExitRope;
    vaultAge=0;stage='takeoff';
   }
  }else if(stage==='takeoff'){
   vaultAge+=dt;
   prisoner.position.y=standingY+1.12*THREE.MathUtils.smoothstep(vaultAge,0,.32);
   poseHands(-2.58,-2.45,.12,-.12);
   if(vaultAge>=.32){vaultAge=0;stage='swing';}
  }else if(stage==='swing'){
   vaultAge=Math.min(vaultAge+dt,2.2);
   const angle=THREE.MathUtils.lerp(swingAngle,-swingAngle,THREE.MathUtils.smoothstep(vaultAge,0,2.2));
   prisoner.position.set(pivot.x+swingRadius*Math.sin(angle),pivot.y-swingRadius*Math.cos(angle)-gripHeight,junctionZ);
   prisoner.position.y+=1.12*THREE.MathUtils.smoothstep(Math.abs(prisoner.position.x-pivot.x),2.4,3.8);
   prisoner.rotation.y=-Math.PI/2;
   poseHands(-2.58,-2.45,.12,-.12);
   if(vaultAge>=2.2){rope.visible=false;coil.visible=true;coil.position.copy(grip);vaultAge=0;stage='openChapel';}
  }else if(stage==='openChapel'){
   movement.update(dt,direction.set(0,0,0));
   vaultAge+=dt;
   prisoner.position.y=standingY+1.12*(1-THREE.MathUtils.smoothstep(vaultAge,0,.32));
   poseHands(-.95,-.45,.16,-.5);coil.position.copy(grip);
   chapelHinge.rotation.y=1.45*THREE.MathUtils.smoothstep(vaultAge,0,1.25);
   if(vaultAge>=1.25)stage='enterChapel';
  }else if(stage==='enterChapel'){
   const arrived=moveTo(chapelX-1.35,junctionZ,dt,2.8);
   poseHands(-.95,-.45,.16,-.5);coil.position.copy(grip);
   if(!arrived)return;
   stage='complete';
   state.crossingDungeonExit=false;
   delete state.viewingExitVault;
   delete state.constrainMovement;
   movement.update(1,direction.set(0,0,0));
   state.walkingIntensity=0;
   enterNextRoom();
  }
 }
 return {open,update,updateGrip,unlockAudio:creak.unlock};
}
