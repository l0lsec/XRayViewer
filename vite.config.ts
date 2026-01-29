import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'DICOM X-Ray Viewer',
        short_name: 'XRayViewer',
        description: 'Local-first, privacy-focused DICOM X-ray viewer',
        theme_color: '#1a1a2e',
        background_color: '#0f0f1a',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  optimizeDeps: {
    exclude: [
      '@cornerstonejs/dicom-image-loader'
    ],
    esbuildOptions: {
      target: 'esnext'
    }
  },
  build: {
    target: 'esnext'
  },
  worker: {
    format: 'es'
  },
  // Handle Cornerstone WASM codec ESM exports  
  resolve: {
    alias: {
      // Use .mjs versions that have proper ESM exports
      '@cornerstonejs/codec-libjpeg-turbo-8bit/decodewasmjs': '@cornerstonejs/codec-libjpeg-turbo-8bit/dist/libjpegturbowasm_decode.mjs',
      '@cornerstonejs/codec-charls/decodewasmjs': '@cornerstonejs/codec-charls/dist/charlswasm_decode.mjs',
      '@cornerstonejs/codec-openjpeg/decodewasmjs': '@cornerstonejs/codec-openjpeg/dist/openjpegwasm_decode.mjs',
      '@cornerstonejs/codec-openjph/wasmjs': '@cornerstonejs/codec-openjph/dist/openjphjs.mjs',
    }
  }
})
