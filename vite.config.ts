/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'TaskPilot',
        short_name: 'TaskPilot',
        description: 'The AI co-pilot for your day',
        theme_color: '#0D1017',
        background_color: '#0D1017',
        display: 'standalone',
        start_url: '/app/today',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [{ name: 'Quick add', url: '/app/inbox?add=1' }],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2,avif,webp,png}'],
        // The hero video is large; let it stream from the network instead of precaching.
        globIgnores: ['**/media/*.mp4', '**/media/*.webm'],
        navigateFallback: '/index.html',
      },
    }),
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
})
