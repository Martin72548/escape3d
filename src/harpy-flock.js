import { createHarpyFlight } from './harpy-flight.js';
import { refineHarpyFace } from './harpy-realistic-face.js';
import { refineHarpyPlumage } from './harpy-final-wings.js';
import { createHarpyWingAudio, unlockHarpyWingAudio } from './harpy-wing-audio.js';

export function createHarpyFlock(parent) {
 const flights=[
  createHarpyFlight(parent,{limit:21,centerZ:0,laneVariation:.8,speed:7,upright:true}),
 ];
 let selected=flights[0];
 const wrists=refineHarpyPlumage(selected,{upright:true});
 refineHarpyFace(selected,{windSwept:true,skinTint:0xc29171}).catch(error=>console.warn('Visage de la harpie indisponible',error));
 let wingTime=0;
 const wingAudio=createHarpyWingAudio();
 function updateWingAudio(){
  const {bird}=selected;
  wingAudio.update(bird.position.x,bird.visible&&Math.abs(bird.position.x)<=17.5);
 }
 function flightFor(mesh){return flights.find(flight=>flight.target(mesh))??null;}
 return {
  flights,flightFor,
  select(flight){if(flights.includes(flight))selected=flight;},
  target(mesh){const flight=flightFor(mesh);return flight?.target(mesh)??null;},
  hit(mesh){
   const hit=flightFor(mesh)?.hit(mesh)??false;
   if(hit)updateWingAudio();
   return hit;
  },
  unlockAudio(){unlockHarpyWingAudio();flights.forEach(flight=>flight.unlockAudio());},
  update(dt){
   flights.forEach(flight=>flight.update(dt));
   wingTime+=dt;
   wrists.forEach(wrist=>{
    wrist.rotation.z=.13*Math.sin(wingTime*5.4-.8);
    wrist.rotation.y=.08*Math.cos(wingTime*5.4);
   });
   updateWingAudio();
  },
  capture(){flights.forEach(flight=>{if(flight===selected)flight.capture();else flight.stop();});},
  carryAt(position,yaw){selected.carryAt(position,yaw);},
  stop(){flights.forEach(flight=>flight.stop());wingAudio.stop();},
  get bird(){return selected.bird;},get direction(){return selected.direction;},
  get pass(){return selected.pass;},get active(){return flights.some(flight=>flight.active);},
 };
}
