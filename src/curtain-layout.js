import * as THREE from 'three';

export function positionCurtainActors(actors) {
 const widths=actors.map(actor=>new THREE.Box3().setFromObject(actor).getSize(new THREE.Vector3()).x);
 const split=Math.ceil(actors.length/2),spacing=.4,centerGap=3.6;
 // Leave the prisoner's silhouette clear, with the cast on either side.
 const leftWidth=widths.slice(0,split).reduce((sum,width)=>sum+width,0)+spacing*Math.max(0,split-1);
 let cursor=-centerGap/2-leftWidth;
 actors.forEach((actor,index)=>{
  if(index===split)cursor=centerGap/2;
  actor.position.x=cursor+widths[index]/2;
  cursor+=widths[index]+spacing;
 });
}
