import * as THREE from 'three';

export function createParchment() {
	const canvas = document.createElement('canvas');
	canvas.width = 1024;
	canvas.height = 512;
	const context = canvas.getContext('2d');
	const paper = context.createLinearGradient(0, 0, 0, canvas.height);
	paper.addColorStop(0, '#e9d19a');
	paper.addColorStop(0.5, '#f5e4b8');
	paper.addColorStop(1, '#d2b477');
	context.fillStyle = paper;
	context.fillRect(0, 0, canvas.width, canvas.height);
	for (let i = 0; i < 900; i++) {
		context.fillStyle = `rgba(92, 59, 28, ${Math.random() * 0.08})`;
		context.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2 + Math.random() * 8, 1 + Math.random() * 3);
	}
	context.strokeStyle = '#805b32';
	context.lineWidth = 12;
	context.strokeRect(22, 22, canvas.width - 44, canvas.height - 44);
	context.fillStyle = '#392718';
	context.textAlign = 'center';
	context.textBaseline = 'middle';
	context.font = 'bold 54px Georgia, serif';
	context.fillText('Tocando la antorcha siniestra', 512, 210);
	context.fillText('del fondo podrás seguir tu camino.', 512, 300);

	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	const scroll = new THREE.Group();
	const sheet = new THREE.Mesh(
		new THREE.PlaneGeometry(2.4, 1.3),
		new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9, side: THREE.DoubleSide }),
	);
	sheet.position.y = 0.95;
	scroll.add(sheet);
	scroll.userData.parchment = true;
	return scroll;
}
