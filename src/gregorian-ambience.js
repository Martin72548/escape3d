import { publicAssetBase } from './public-asset-base.js';
﻿// Ave Maria, Schola Gregoriana (Oltarzew), CC BY-SA 3.0. See audio/SOURCES.md.
export function createGregorianAmbience(){
 let player=null,wanted=false;
 const source=`${publicAssetBase}audio/gregorian-male-ave-maria.ogg`;
 function unlock(){
  if(!player){player=new Audio(source);player.preload='auto';player.loop=true;player.volume=1;player.addEventListener('error',()=>console.error('No se pudo cargar el audio:',source,player.error));}
  if(player.readyState===0)player.load();
 }
 async function start(){
  if(wanted)return;wanted=true;unlock();
  try{await player.play();}
  catch(error){wanted=false;console.error('No se pudo iniciar el canto gregoriano:',error);}
 }
 function stop(){
  wanted=false;if(!player)return;
  player.pause();player.currentTime=0;
 }
 return {start,stop,unlock,get playing(){return !!player&&!player.paused;}};
}
