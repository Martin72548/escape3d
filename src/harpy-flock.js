import { createHarpyFlight } from './harpy-flight.js';

export function createHarpyFlock(parent) {
 const flights=[
  createHarpyFlight(parent,{limit:21,centerZ:-.8,laneVariation:.8}),
  createHarpyFlight(parent,{limit:21,centerZ:.8,laneVariation:.8,initialDirection:-1}),
 ];
 let selected=flights[0];
 function flightFor(mesh){return flights.find(flight=>flight.target(mesh))??null;}
 return {
  flights,flightFor,
  select(flight){if(flights.includes(flight))selected=flight;},
  target(mesh){const flight=flightFor(mesh);return flight?.target(mesh)??null;},
  hit(mesh){return flightFor(mesh)?.hit(mesh)??false;},
  unlockAudio(){flights.forEach(flight=>flight.unlockAudio());},
  update(dt){flights.forEach(flight=>flight.update(dt));},
  capture(){flights.forEach(flight=>{if(flight===selected)flight.capture();else flight.stop();});},
  carryAt(position,yaw){selected.carryAt(position,yaw);},
  stop(){flights.forEach(flight=>flight.stop());},
  get bird(){return selected.bird;},get direction(){return selected.direction;},
  get pass(){return selected.pass;},get active(){return flights.some(flight=>flight.active);},
 };
}
