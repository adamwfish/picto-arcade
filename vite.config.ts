import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Minimal declaration so we can read an env flag without depending on all of
// @types/node just for the config file.
declare const process: { env: Record<string, string | undefined> };

// Set SINGLEFILE=1 to inline everything (JS + CSS) into one self-contained
// dist/index.html that runs by double-clicking the file — no server needed.
// `npm run build:single` does this; plain `npm run build` keeps split chunks
// for normal static hosting.
const singleFile = process.env.SINGLEFILE === '1';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), ...(singleFile ? [viteSingleFile()] : [])],
  base: './',
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1200,
    ...(singleFile
      ? {}
      : {
          rollupOptions: {
            output: {
              manualChunks: {
                three: ['three'],
                react: ['react', 'react-dom'],
              },
            },
          },
        }),
  },
});
