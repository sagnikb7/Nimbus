import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'fs';

// Expose the package.json version to the client as a compile-time constant
// (used in Settings → About) without bundling the whole manifest.
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)));

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    VitePWA({
      // SW updates silently in background — no reload prompt needed
      registerType: 'autoUpdate',

      // Static assets to precache that aren't caught by globPatterns
      includeAssets: ['favicon.svg', 'apple-touch-icon-180x180.png'],

      // Turn the SW on in dev too, so the install criteria (registered SW +
      // manifest) are satisfied at http://localhost:5173 during `pnpm dev` —
      // without this the address-bar install icon never appears while developing.
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html',
      },

      // Web App Manifest — controls install appearance and behavior
      manifest: {
        id: '/',                      // Stable app identity (dedupes installs)
        name: 'Nimbus Weather',
        short_name: 'Nimbus',
        description: 'Beautiful weather forecasts with a native feel',
        lang: 'en',
        dir: 'ltr',
        categories: ['weather', 'utilities', 'lifestyle'],
        theme_color: '#667eea',       // Status bar color (matches --accent)
        background_color: '#0f0f1a',  // Splash screen bg (matches dark theme body)
        display: 'standalone',        // No browser chrome — full native feel
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait',
        scope: '/',
        start_url: '/?source=pwa',    // Distinguishes launches from the installed app
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            // Maskable uses a PADDED variant (safe-zone) so the OS mask
            // (circle/squircle) never clips the cloud — see generate-icons.js.
            src: 'maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        // Long-press / right-click app shortcuts (handled on mount in App.jsx).
        shortcuts: [
          {
            name: 'My Location',
            short_name: 'Location',
            description: "Get weather for where you are",
            url: '/?action=locate',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Search a city',
            short_name: 'Search',
            description: 'Search weather for any city',
            url: '/?action=search',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
        // Rich install dialog (Chrome upgrades the mini-infobar when present).
        screenshots: [
          {
            src: 'screenshots/mobile.png',
            sizes: '1080x1920',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Nimbus on mobile',
          },
          {
            src: 'screenshots/wide.png',
            sizes: '1920x1080',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Nimbus on desktop',
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
