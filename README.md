# Plantilla de aplicaciones 3D y realidad virtual

Este proyecto ofrece dos puntos de partida que comparten una escena sencilla. La opción 3D funciona en una computadora con mouse y teclado. La opción VR agrega WebXR, controladores y locomoción mediante la biblioteca XR Components.

## Inicio rápido

Necesitás Node.js en una versión LTS compatible con Vite.

```powershell
.\install_dependencies.bat
.\run_dev_server.bat
```

Para escribir menos y evitar errores, ingresá las primeras letras del nombre de un archivo `.bat` y presioná `Tab` para que la terminal lo complete. Por ejemplo, escribí `.\ins`, presioná `Tab` y luego `Enter`.

Abrí `http://localhost:10001` en el navegador. Las órdenes `npm install` y `npm run dev` siguen disponibles como alternativa.

Para detener el servidor, volvé a la terminal y presioná `Ctrl + C`.

## Páginas disponibles

- `index.html`: portada que permite elegir una de las dos plantillas.
- `3d.html`: aplicación Three.js para computadora.
- `vr.html`: aplicación Three.js y WebXR para casco o emulador.

## Archivos que conviene modificar

- `src/main-3d.js`: cámara, renderizador y ciclo de animación de la aplicación 3D.
- `src/main-vr.js`: configuración WebXR, controladores, botón VR y locomoción.
- `src/scene-content.js`: suelo, grilla, ejes, luces y objetos compartidos por las dos escenas.
- `src/styles.css`: apariencia de la portada y de los controles HTML.

La carpeta `src/vendor` contiene bundles ya preparados. En general, no es necesario editar esos archivos:

- `threexrtoolkit.js`: componentes para controles, interacción, locomoción y menús en experiencias WebXR.
- `threexrtoolkit-API.md`: documentación oficial de las clases, opciones y métodos públicos de XR Components.
- `dynamicMenu.js` y sus módulos complementarios: menú configurable que puede mostrarse en HTML y también integrarse en VR.
- `dynamicMenu-readme.md` y `dynamicMenu-API.md`: documentación de Dynamic Menu.

## Cómo funciona el proyecto 3D

`src/main-3d.js` crea la escena, la cámara, el renderizador y los controles orbitales. Luego llama a `addSceneContent`, definida en `src/scene-content.js`, para agregar los elementos visibles. Modificar ese archivo compartido permite cambiar las dos plantillas al mismo tiempo.

## Cómo funciona el proyecto VR

`src/main-vr.js` habilita WebXR en el renderizador y usa tres clases de XR Components:

- `ControllersManager` crea y actualiza los controladores de las manos.
- `XRSessionModeButton` agrega el botón **Entrar en VR** y gestiona la sesión inmersiva.
- `XRTeleportMoveControl` permite teleportación, movimiento continuo con joystick y giro por saltos. La geometría del suelo se registra como superficie caminable.

La página VR también conserva los controles orbitales mientras se mira desde una pantalla común.

### Probar WebXR en la computadora

La escena se puede abrir con `.\run_dev_server.bat` y recorrer con mouse. Para simular un casco y sus controles se puede usar la extensión **Immersive Web Emulator** de Meta en un navegador basado en Chromium.

### Probar en un casco conectado a la misma red

```powershell
.\run_vr_server.bat
```

Este comando expone el servidor en la red local y activa HTTPS, requisito de WebXR cuando no se usa `localhost`. Es posible que Windows solicite permiso de firewall y que el navegador advierta sobre el certificado de desarrollo. Usá únicamente este certificado dentro de una red de confianza.

También podés ejecutar `npm run dev:vr` como alternativa.

## Usar una inteligencia artificial para modificar la plantilla

Abrí la carpeta completa en Visual Studio Code para que el asistente pueda comprender la relación entre los archivos. Como primer mensaje, describí el resultado que querés obtener, las restricciones y cómo se debe verificar. Por ejemplo:

> Quiero transformar la plantilla 3D en un simulador del sistema solar. Conservá la cámara orbital y la página de inicio. Trabajá sobre `src/main-3d.js` y `src/scene-content.js`. Antes de terminar, ejecutá la compilación e indicame cómo comprobar el resultado en el navegador.

Después revisá los cambios y pedí ajustes pequeños y concretos. Para señalar un archivo específico podés abrirlo antes de escribir o agregarlo al contexto con `@` desde el chat del asistente, si la herramienta utilizada admite esa función.

## Comandos

- `npm run dev`: servidor local en HTTP para el trabajo 3D y la emulación en la misma computadora.
- `npm run dev:network`: servidor HTTP visible en la red local; no habilita sesiones WebXR inmersivas en otro dispositivo.
- `npm run dev:vr`: servidor HTTPS visible en la red local para probar con un casco.
- `npm run build`: comprueba el proyecto y genera la versión de distribución en `dist`.
- `npm run preview`: muestra localmente la versión generada.

## Recomendaciones para estudiantes

- Guardá una copia de la plantilla original antes de comenzar.
- Modificá pocas cosas por vez y comprobá el resultado en el navegador.
- No edites los bundles de `src/vendor` salvo que conozcas su código fuente.
- Si algo deja de funcionar, copiá el error completo de la terminal o de la consola del navegador y compartilo con el asistente de IA.
