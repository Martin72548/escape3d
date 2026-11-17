// Vite exposes public/ at BASE_URL; static servers expose the folder itself.
const staticPublicDirectory = '../public/';
export const publicAssetBase = import.meta.env?.BASE_URL ?? new URL(staticPublicDirectory, import.meta.url).href;
