/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { cp } from 'node:fs/promises'
import { createReadStream, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, normalize, resolve, sep } from 'node:path'

// Deployed at https://<owner>.github.io/JapaneseLearningApp/ — base must match
// the repo name or every asset URL and the service-worker scope break on Pages.
const BASE = '/JapaneseLearningApp/'
const ROOT = fileURLToPath(new URL('.', import.meta.url))

/**
 * Serve the content packs as static JSON: a dev middleware (so `fetch` works in `vite dev`)
 * plus a build copy of content/packs → dist/packs (so L2–L5 are reachable on Pages). L1
 * stays bundled via dynamic import (precached, offline day-one); higher levels are fetched
 * and runtime-cached. content/packs remains the single source of truth — no duplication.
 */
function contentPacks(): Plugin {
  const packsDir = resolve(ROOT, 'content/packs')
  const urlPrefix = `${BASE}packs/`
  return {
    name: 'hikkoshi-content-packs',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const raw = req.url
        if (!raw) return next()
        let path: string
        try {
          path = decodeURIComponent(raw.split('?')[0])
        } catch {
          return next() // malformed percent-encoding
        }
        if (!path.startsWith(urlPrefix)) return next()
        const file = normalize(join(packsDir, path.slice(urlPrefix.length)))
        // Contain to packsDir (trailing separator so a sibling like packs-secret can't escape).
        if ((file !== packsDir && !file.startsWith(packsDir + sep)) || !existsSync(file)) return next()
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        createReadStream(file).pipe(res)
      })
    },
    async closeBundle() {
      await cp(packsDir, resolve(ROOT, 'dist/packs'), { recursive: true })
    },
  }
}

export default defineConfig({
  base: BASE,
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0'),
  },
  plugins: [
    react(),
    contentPacks(),
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
        // precache kept in sync with build). L1 packs are bundled JS chunks caught by the
        // glob; L2–L5 JSON and the D-019 webfonts are runtime-cached below (lazy, so first
        // load stays light) — woff2 is deliberately absent from this glob: see below.
        // webp: the D-026 photo layer (four licensed, compressed stills ≈ 0.5 MB total) is part
        // of the core visual identity, so it precaches like the app shell rather than arriving
        // late over the network. Fonts stay runtime-cached (D-019) — their long tail is unlike
        // this small fixed set.
        globPatterns: ['**/*.{js,css,html,svg,png,webp,webmanifest}'],
        navigateFallback: `${BASE}index.html`,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Fetched higher-level packs: serve from cache, refresh in the background —
            // available offline after the first online visit to that level.
            urlPattern: new RegExp(`${BASE}packs/.*\\.json$`),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'hikkoshi-packs',
              expiration: { maxEntries: 40 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Zen Old Mincho / Klee One (D-019): unicode-range-chunked into many small files
            // so a browser only ever fetches the ranges a page actually renders, but their
            // full combined coverage is real weight — cache-first (fonts don't change) rather
            // than forced into the day-one precache, matching the same "offline after first
            // online visit" trade-off already accepted for content packs above.
            urlPattern: /\.woff2$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'hikkoshi-fonts',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  test: {
    // Two projects: the React app runs under jsdom; the framework-agnostic
    // schemas package and the Node build pipeline run under the node environment.
    projects: [
      {
        extends: true,
        test: {
          name: 'app',
          environment: 'jsdom',
          include: ['src/**/*.test.{ts,tsx}'],
          setupFiles: ['src/test/setup.ts'],
        },
      },
      {
        test: {
          name: 'node',
          environment: 'node',
          include: ['packages/**/*.test.ts', 'pipeline/**/*.test.ts'],
        },
      },
    ],
  },
})
