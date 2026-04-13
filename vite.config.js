import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // SW updates silently in background — no reload prompt needed
      registerType: 'autoUpdate',

      // Static assets to precache that aren't caught by globPatterns
      includeAssets: ['favicon.svg', 'apple-touch-icon-180x180.png'],

      // Web App Manifest — controls install appearance and behavior
      manifest: {
        name: 'Nimbus Weather',
        short_name: 'Nimbus',
        description: 'Beautiful weather forecasts with a native feel',
        theme_color: '#667eea',       // Status bar color (matches --accent)
        background_color: '#0f0f1a',  // Splash screen bg (matches dark theme body)
        display: 'standalone',        // No browser chrome — full native feel
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            // Maskable: OS can apply its own shape mask (circle, squircle, etc.)
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },

      // Workbox service worker configuration
      workbox: {
        // Precache all built assets (app shell)
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],

        // Runtime caching for external resources and API calls
        runtimeCaching: [
          // Google Fonts stylesheets — rarely change, cache aggressively
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Google Fonts files (woff2) — immutable, cache aggressively
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // WeatherAPI condition icons — static images, cache for a month
          {
            urlPattern: /^https:\/\/cdn\.weatherapi\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'weather-icons-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Weather API responses — prefer fresh data, fall back to cache offline
          {
            urlPattern: /\/api\/weather\?.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'weather-api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 15, // 15 min
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3033',
    },
  },
});
