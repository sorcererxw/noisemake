// @ts-check
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'server',

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        noisemake: fileURLToPath(new URL('../src/index.ts', import.meta.url))
      }
    },
    ssr: {
      noExternal: ['react', 'react-dom', 'react/jsx-runtime']
    }
  },

  integrations: [react()],
  adapter: cloudflare()
});
