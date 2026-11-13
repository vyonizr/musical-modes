import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectRegister: false,
      manifest: false,
      // vite-plugin-pwa's injectManifest defaults globPatterns to
      // **/*.{js,wasm,css,html} and would otherwise never precache the piano
      // samples — this explicitly adds mp3 to that same default set.
      injectManifest: { globPatterns: ['**/*.{js,wasm,css,html,mp3}'] },
    }),
  ],
  resolve: {
    alias: {
      src: fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
