import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig(({ mode }) => {
	const isVrMode = mode === 'vr';

	return {
		plugins: isVrMode ? [basicSsl({ name: 'Plantilla WebXR local' })] : [],
		server: {
			host: isVrMode ? '0.0.0.0' : '127.0.0.1',
			port: 10001,
			strictPort: true,
			// En Vite 8 `https` debe ser un objeto. El plugin completa este
			// objeto con el certificado autofirmado cuando se usa el modo VR.
			https: isVrMode ? {} : undefined,
			// Los manuales de vendor no forman parte de la aplicación y pueden
			// quedar abiertos en otro programa mientras Vite está ejecutándose.
			watch: { ignored: ['**/src/vendor/*.md'] },
		},
		preview: {
			host: '127.0.0.1',
			port: 10001,
			strictPort: true,
		},
		build: {
			outDir: 'dist',
			rollupOptions: {
				input: {
					inicio: resolve(import.meta.dirname, 'index.html'),
					proyecto3d: resolve(import.meta.dirname, '3d.html'),
					proyectoVr: resolve(import.meta.dirname, 'vr.html'),
				},
			},
		},
		base: './',
	};
});
