import { translate } from './language.js';
export function enableFullscreen() {
	const button=document.querySelector('#fullscreen-toggle');
	const status=document.querySelector('#fullscreen-status');
	if(!button)return;
	function label(text){button.setAttribute('aria-label',text);button.title=text;}
	if(!document.fullscreenEnabled||!document.documentElement.requestFullscreen){button.disabled=true;label(translate('Plein écran non disponible', 'Pantalla completa no disponible'));return;}
	function sync(){
		const active=!!document.fullscreenElement;
		label(active?translate('Quitter le plein écran', 'Salir de pantalla completa'):translate('Plein écran', 'Pantalla completa'));
		button.setAttribute('aria-pressed',String(active));
		window.dispatchEvent(new Event('resize'));
	}
	button.addEventListener('click',async()=>{
		status.textContent='';button.disabled=true;
		try{
			if(document.fullscreenElement)await document.exitFullscreen();
			else await document.documentElement.requestFullscreen();
		}catch{status.textContent=translate('Impossible d’activer le plein écran.', 'No se pudo activar la pantalla completa.');}
		finally{button.disabled=false;sync();}
	});
	document.addEventListener('fullscreenchange',sync);
	sync();
}
