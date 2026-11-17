import * as THREE from 'three';

export function addMuseumWallPhrases(parent) {
  const phrases = [
    "L'herboriste du monastère, à l'heure des vêpres, va apporter du romarin et un thé citronné ...",
    'Pendant le banquet, le très noble seigneur de Noirmoutier, d’un air solennel, prodigue des bienfaits à ses nobles barons assis autour de lui.',
    'Près de l’arcade principale, une vieille mendiante supplie le prince héritier de lui donner quelques deniers pour pouvoir manger.',
    'À l’ombre des remparts de l’ancienne forteresse, le vieux conseiller du roi, malgré les protestations véhémentes des courtisans réunis dans la grande salle, remet discrètement un parchemin scellé au jeune messager chargé de prévenir les habitants du village avant la tombée de la nuit.',
  ];
  const canvas = document.createElement('canvas');
  canvas.width = 4096;
  canvas.height = 1280;
  const ctx = canvas.getContext('2d');
  ctx.font = '600 64px Georgia, serif';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#000000';
  const marginX = 230, marginY = 55, lineHeight = 78;
  const blockHeight = (canvas.height - marginY * 2) / phrases.length;
  const textBlocks = [];
  phrases.forEach((phrase, index) => {
    const lines = [];
    let line = '';
    for (const word of phrase.split(' ')) {
      const next = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(next).width > canvas.width - marginX * 2) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    lines.push(line);
    const top = marginY + index * blockHeight + (blockHeight - lines.length * lineHeight) / 2;
    textBlocks.push({ top, height: lines.length * lineHeight });
    lines.forEach((text, row) => ctx.fillText(text, marginX, top + row * lineHeight));
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const material = new THREE.MeshBasicMaterial({
    map: texture, transparent: true, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
  });
  const inscription = new THREE.Mesh(new THREE.PlaneGeometry(18, 5.2), material);
  inscription.name = 'Phrases sur le mur du fond';
  inscription.userData.phrases = phrases;
  // Place the text just in front of the niche's smooth recessed backing.
  inscription.position.set(0, 3.05, -10.59);
  inscription.raycast = () => {};
  // Match the first paragraph's wrapped lines with a dedicated spell target.
  textBlocks.slice(0, 3).forEach((first, index) => {
  const target = new THREE.Mesh(
    new THREE.PlaneGeometry(18 * (canvas.width - marginX * 2) / canvas.width, 5.2 * first.height / canvas.height),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  );
  target.name = `Phrase cible : ${phrases[index]}`;
  target.userData.museumExitPhrase = index === 0;
  target.userData.museumHorsePhrase = index === 1;
  target.userData.museumBatPhrase = index === 2;
  target.position.set(0, 2.6 - 5.2 * (first.top + first.height / 2) / canvas.height, .01);
  inscription.add(target);
  });
  parent.add(inscription);
  return inscription;
}
