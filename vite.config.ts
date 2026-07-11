/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Deployed at https://<owner>.github.io/JapaneseLearningApp/ — base must match
// the repo name or every asset URL and the service-worker scope break on Pages.
const BASE = '/JapaneseLearningApp/'

export default defineConfig({
  base: BASE,
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0'),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Hikkoshi — Japanese Learning Game',
        short_name: 'Hikkoshi',
        description:
          'A life in Japan, one day at a time: JLPT N5–N1 plus real-world survival Japanese, offline-capable.',
        lang: 'en',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        background_color: '#17141f',
        theme_color: '#17141f',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Versioned precache generated from actual build output (brief requirement:
        // precache kept in sync with build). Packs will join this list in a later session.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
        navigateFallback: `${BASE}index.html`,
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }),
  ],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
