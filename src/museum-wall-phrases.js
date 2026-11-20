import * as THREE from 'three';
import { translate } from './language.js';

export function addMuseumWallPhrases(parent) {
  const phrases = translate([
    "L'herboriste du monastère, à l'heure des vêpres, va apporter du romarin et un thé citronné à l’abbé malade dans sa cellule.",
    'Pendant le banquet, le très noble seigneur de Noirmoutier, d’un air solennel, prodigue des bienfaits à ses nobles barons assis autour de lui.',
    'Près de l’arcade principale, une vieille mendiante supplie le prince héritier de lui donner quelques deniers pour pouvoir manger.',
    'À l’ombre des remparts de l’ancienne forteresse, le vieux conseiller du roi, malgré les protestations véhémentes des courtisans réunis dans la grande salle, remet discrètement un parchemin scellé au jeune messager chargé de prévenir les habitants du village avant la tombée de la nuit.',
  ], [
    'El herbolario del monasterio llevará romero y té de limón al abad enfermo a la hora de vísperas en su celda.',
    'Durante el banquete, el noble señor de Noirmoutier, con aire solemne, ofrece favores a los barones sentados a su alrededor.',
    'Cerca del arco principal, una anciana mendiga suplica al príncipe heredero que le dé unas monedas para comer.',
    'A la sombra de las murallas, el viejo consejero del rey entrega discretamente un pergamino sellado al joven mensajero, que debe avisar a los aldeanos antes del anochecer.',
  ]);

  const inscriptions = new THREE.Group();
  inscriptions.name = 'Phrases inscrites chacune dans un bloc';
  inscriptions.userData.phrases = phrases;
  const slots = [[0,1],[1,1],[2,1],[2,0]];
  phrases.forEach((phrase, index) => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048; canvas.height = 900;
    const ctx = canvas.getContext('2d');
    const margin = 115, available = canvas.width - margin * 2;
    let size = 100, lines, lineHeight;
    do {
      ctx.font = '600 ' + size + 'px Georgia, serif';
      lines = []; let line = '';
      for (const word of phrase.split(' ')) {
        const next = line ? line + ' ' + word : word;
        if (line && ctx.measureText(next).width > available) { lines.push(line); line = word; }
        else line = next;
      }
      lines.push(line); lineHeight = size * 1.32;
      if (lines.length * lineHeight <= canvas.height - 150) break;
      size -= 2;
    } while (size > 30);
    ctx.fillStyle = '#080705'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    const top = (canvas.height - lines.length * lineHeight) / 2;
    lines.forEach((line, row) => ctx.fillText(line, margin, top + row * lineHeight));
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8;
    const material = new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
    const inscription = new THREE.Mesh(new THREE.PlaneGeometry(5.95, 2.48), material);
    const [col,row] = slots[index];
    inscription.position.set(-20/3 + col*20/3, 1.5 + row*3, -9.46);
    inscription.name = 'Phrase sur bloc ' + (index + 1);
    inscription.userData.museumExitPhrase = index === 0;
    inscription.userData.museumHorsePhrase = index === 1;
    inscription.userData.museumBatPhrase = index === 2;
    inscriptions.add(inscription);
  });
  parent.add(inscriptions);
  return inscriptions;
}
