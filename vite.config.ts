import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerSW: false,
      manifest: false,
      // Samples are runtime-cached on first sound instead, so an install that
      // never plays a chord costs nothing.
      injectManifest: { globIgnores: ['**/audio/**'] },
    }),
  ],
  resolve: {
    alias: {
      src: path.resolve(__dirname, 'src'),
    },
  },
})
