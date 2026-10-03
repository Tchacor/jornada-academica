import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build` → dist/ normal; `npm run build:single` → um único index.html autocontido
const single = process.env.SINGLE === '1';

export default defineConfig({
  base: './',
  plugins: single ? [viteSingleFile()] : [],
  build: { chunkSizeWarningLimit: 4000, outDir: single ? 'dist-single' : 'dist' },
});
