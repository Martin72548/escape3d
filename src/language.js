const key = 'escape3d-language';
let savedLanguage;
try { savedLanguage = globalThis.localStorage?.getItem(key); } catch {}
const requestedLanguage = globalThis.location
	? new URLSearchParams(globalThis.location.search).get('lang')
	: null;
export const language = ['fr', 'es'].includes(requestedLanguage) ? requestedLanguage : savedLanguage === 'es' ? 'es' : 'fr';
export const translate = (french, spanish) => language === 'es' ? spanish : french;

export function bindLanguagePicker(document) {
	document.documentElement.lang = language;
	document.title = translate('Le magicien', 'El mago');
	const picker = document.getElementById('language-picker');
	picker.value = language;
	picker.setAttribute('aria-label', translate('Langue du jeu', 'Idioma del juego'));
	picker.title = translate('Changer de langue redémarre la partie', 'Cambiar de idioma reinicia la partida');
	picker.addEventListener('change', () => {
		if (picker.value === language) return;
		try { globalThis.localStorage?.setItem(key, picker.value); } catch {}
		const url = new URL(globalThis.location.href);
		url.searchParams.set('lang', picker.value);
		globalThis.location.assign(url);
	});
	document.querySelector('#scoreboard span').textContent = translate('Points', 'Puntos');
	document.querySelector('#scene-container').setAttribute('aria-label', translate('Scène de jeu en trois dimensions', 'Escena tridimensional del juego'));
	document.querySelector('#first-person-hint').textContent = movementHint();
	if (language === 'fr') {
		document.querySelector('#dungeon-intro-title').textContent = 'Tu es prisonnier dans un sombre cachot dont tu dois t’échapper.';
		const paragraphs = document.querySelectorAll('.dungeon-intro-content p');
		paragraphs[0].textContent = 'La clé est cachée sous une dalle. Cherche-la ou gagne 15 points en éliminant les monstres et les insectes pour éclairer la bonne dalle. Soulève-la, récupère la clé et passe au niveau suivant.';
		paragraphs[1].textContent = 'Utilise les touches W, A, S et D pour te déplacer.';
		paragraphs[2].textContent = 'Des créatures rôdent dans les ombres. Reste sur tes gardes !';
		paragraphs[3].textContent = 'Bonne chance !';
		const directions = ['avancer', 'reculer', 'aller à gauche', 'aller à droite'];
		document.querySelectorAll('.dungeon-intro-content li').forEach((item, index) => {
			item.lastChild.textContent = ' ' + directions[index] + '.';
		});
		document.querySelector('#dungeon-intro-close').textContent = 'Fermer';
	}
}

export function movementHint(jump = false) {
	return translate(
		`Glisser pour regarder · WASD pour marcher${jump ? ' · Espace pour sauter' : ''} · Clic pour lancer un rayon`,
		`Arrastra para mirar · WASD para caminar${jump ? ' · Espacio para saltar' : ''} · Clic para lanzar un rayo`,
	);
}
