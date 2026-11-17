export function enableFullscreen() {
	const button=document.querySelector('#fullscreen-toggle');
	const status=document.querySelector('#fullscreen-status');
	if(!button)return;
	if(!document.fullscreenEnabled||!document.documentElement.requestFullscreen){button.disabled=true;button.textContent='Pantalla completa no disponible';return;}
	function sync(){
		const active=!!document.fullscreenElement;
		button.textContent=active?'Salir de pantalla completa':'Pantalla completa';
		button.setAttribute('aria-pressed',String(active));
		window.dispatchEvent(new Event('resize'));
	}
	button.addEventListener('click',async()=>{
		status.textContent='';button.disabled=true;
		try{
			if(document.fullscreenElement)await document.exitFullscreen();
			else await document.documentElement.requestFullscreen();
		}catch{status.textContent='No se pudo activar la pantalla completa.';}
		finally{button.disabled=false;sync();}
	});
	document.addEventListener('fullscreenchange',sync);
	sync();
}
