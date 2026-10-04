import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import vinext from 'vinext';
import { nitro } from 'nitro/vite';

export default defineConfig({
  resolve: {
    alias: [
      { find: /^tailwindcss$/, replacement: fileURLToPath(new URL('./node_modules/tailwindcss/index.css', import.meta.url)) },
      { find: /^tw-animate-css$/, replacement: fileURLToPath(new URL('./node_modules/tw-animate-css/dist/tw-animate.css', import.meta.url)) },
      { find: /^tslib$/, replacement: fileURLToPath(new URL('./node_modules/tslib/tslib.es6.mjs', import.meta.url)) },
    ],
  },
  plugins: [vinext(), nitro()],
});
