# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Required references

- **Before editing `client/components/WeatherParticles.jsx` or particle CSS in `client/App.css`**: Read `WEATHER_PARTICLES_GUIDE.md` first. It contains hard rules (circles only, no ellipses, no SVGs, etc.) and the current debug/production state.

## Commands

| Task | Command |
|---|---|
| Dev (client + server) | `pnpm dev` |
| Dev client only | `pnpm dev:client` |
| Dev server only | `pnpm dev:server` |
| Production build | `pnpm build` |
| Production start | `pnpm start` |
| Regenerate PWA icons | `node scripts/generate-icons.js` |

Package manager is **pnpm** (not npm). No test runner or linter is configured.

## Architecture

**Nimbus** is a weather app with a React 19 + Vite 6 frontend and an Express 4 backend, both in one repo.

### Client-Server Split

- **Client** (`client/`) — React SPA using ESM. Vite entry point is `index.html` → `client/main.jsx`. During dev, Vite runs on `:5173` and proxies `/api` requests to Express on `:3033` (configured in `vite.config.js`).
- **Server** (`server/`) — Express app using CommonJS (`require`/`module.exports`). Serves the built `dist/` folder as static files with a catch-all fallback to `index.html` for client-side routing. Single API route at `GET /api/weather?city=`.
- **Production**: `pnpm build` outputs to `dist/`, then `pnpm start` serves everything from Express on one port.

### Design System — "Radiant"

Single-column layout (max-width 780px, centered) with no sidebar. Saved cities appear in a fixed bottom dock bar.

- **Glassmorphism**: All cards use `backdrop-filter: blur(40px)` with semi-transparent RGBA fills (`--glass`, `--glass-strong`). Borders are `--glass-border`.
- **Chromatic moods**: Each weather mood (clear, night, cloudy, rainy, snowy, stormy) overrides `--accent`, `--ambient-*`, and `--temp-gradient` with a unique color palette. Sunny is amber/coral, night is indigo/purple, stormy is electric violet, etc.
- **3-layer ambient background**: `body::before` uses three radial gradients with `--ambient-1/2/3`, animated on a 45-second cycle.
- **Border radius**: 20px for cards, 100px (`--radius-pill`) for pills and buttons.
- **Temperature**: `clamp(8rem, 28vw, 14rem)`, weight 200, gradient text fill.
- **Dock**: Fixed bottom bar with pill-shaped city items, glass background with heavy blur.

### Server

- `server/config.js` — loads `.env` via dotenv, exports `port` and `weatherApiKey`
- `server/routes/weather.js` — proxies requests to WeatherAPI's `forecast.json` endpoint (3-day forecast + AQI). The API key never reaches the client.

### Client State & Data Flow

All state lives in `App.jsx` — no external state library. Key state: `savedCities` (persisted to localStorage, max 5), `savedWeather` (cached API responses), `activeWeather` (currently displayed city), `theme` (dark/light), `tempUnit` ('c'|'f', persisted to localStorage), `aqiDetailOpen` (AQI detail overlay).

**Caching**: `utils/weatherCache.js` provides localStorage-backed caching with a 15-minute TTL. On mount, `partitionCities()` splits saved cities into fresh (served from cache) and stale/missing (fetched from API). `handleSearch` uses three paths: fresh cache hit (no API call), stale SWR (show cached + background refresh), and miss (loading spinner + fetch). `handleRefresh` always bypasses cache. A `FreshnessLabel` component (defined in `App.jsx`) shows "Updated X mins ago" using the cache timestamp.

The `city` query param accepts both city names and `lat,lng` coordinates (used by geolocation).

### Theming

Dual-layer theming via CSS custom properties on `<html>`:
- `data-theme="dark|light"` — base color tokens (set by user toggle, defaults to system preference)
- `data-mood="clear|night|cloudy|rainy|snowy|stormy"` — weather-reactive chromatic palette (overrides `--accent`, `--ambient-*`, `--temp-gradient` per mood, set automatically via `utils/weatherMood.js`)

Three ambient gradients (`--ambient-1/2/3`) drive the animated radial gradient on `body::before`.

### Components

Twelve components in `client/components/`, all using default exports with PascalCase naming:
- `SearchBar` — glass pill search input with loading spinner and GPS location button
- `CurrentWeather` — hero section with massive temperature display (uses `useAnimatedNumber`), condition, bookmark toggle, share button. Accepts `tempUnit` for C/F switching.
- `WeatherDetails` — horizontal scrollable pill carousel ordered by importance: AQI, Wind, Humidity, UV, Precip, Visibility, Pressure. AQI and Wind pills are interactive (accent border + chevron indicator) and open detail overlays.
- `AQIDetail` — full-screen detail overlay: animated hero AQI number, primary pollutant card, pollutant breakdown grid, AQI scale ladder, outdoor guidance, educational accordion. Uses `calculateAQI()` for numeric US AQI (0–500) with `getAQILevelFromEpa` fallback. Locks body scroll, closes on Escape/overlay click.
- `AirQuality` — compact AQI card using EPA index from API; shows pollutant breakdown grid (PM2.5, PM10, O₃, NO₂, CO, SO₂).
- `WindDetail` — full-screen detail overlay (same pattern as `AQIDetail`): animated hero wind speed, compass arrow SVG, Beaufort scale category, hourly wind chart, gust assessment, prevailing direction, peak hour. Uses `windUtils.js` helpers.
- `Forecast` — stacked full-width rows in a glass card. Accepts `tempUnit`.
- `HourlyForecast` — horizontal scroll in a glass card, filters hours based on localtime offset. Accepts `tempUnit`.
- `SunriseSunset` — sunrise/sunset timeline with animated glow dot; parses 12-hour time strings from API
- `Sidebar` — fixed bottom dock bar with pill-shaped city items and glow on active. Accepts `tempUnit`.
- `WeatherParticles` — pure CSS particle system per weather mood (orbs, stars, clouds, rain, snow, lightning). Respects `prefers-reduced-motion`. Uses `useMemo` for stable random generation.
- `ShareCard` — off-screen 600x400 card (forwardRef) captured by html2canvas for sharing. Uses inline styles + mood-specific gradients.

### Key Patterns

- Weather condition codes (from WeatherAPI) are mapped to mood strings in `utils/weatherMood.js` using Sets for rain/snow/storm code groups
- `hooks/useAnimatedNumber.js` — requestAnimationFrame-based animated number transitions with ease-in-out quartic easing, used for temperature displays and AQI hero number. Initializes from 0 so temperatures count up on city load/switch (component remounts via `key={activeCity}`). C/F toggle animates from old → new value.
- `utils/aqiUtils.js` — full EPA AQI breakpoint calculation: converts WeatherAPI μg/m³ values to EPA-native units (ppm/ppb), applies linear interpolation per pollutant, returns max sub-index as the overall AQI. Also exports `AQI_LEVELS`, `POLLUTANT_INFO`, and helpers (`getPrimaryPollutant`, `getSortedPollutants`, `getAQISummary`).
- `utils/weatherCache.js` — localStorage cache keyed by city name, 15-min TTL. Exports `getCached`, `setCache`, `removeCache`, `partitionCities`. Handles quota exceeded by pruning stale entries.
- `utils/windUtils.js` — Beaufort-scale wind categories (kph thresholds) and helpers: `getWindCategory`, `getHourlyWind`, `getPrevailingDirection`, `getGustAssessment`, `getPeakWindHour`, `getWindSummary`. Used by `WindDetail` component.
- Interactive detail pills (Wind, AQI) use accent-colored border and a `::after` chevron pseudo-element as visual affordance for the drill-down.
- Staggered entry animations via inline `animationDelay` styles (60ms in WeatherDetails, 80ms in Forecast)
- Entry animations use blur-to-clear reveals (`blurIn`, `revealUp`, `tempReveal` keyframes). `tempReveal` adds blur + scale + fade on `.current-temp` on mount.
- Weather icons from the API use protocol-relative URLs (`//cdn.weatherapi.com/...`) — components prefix with `https:`
- All cards use heavy glassmorphism: `backdrop-filter: blur(40px)` with `var(--glass)` fills and `var(--glass-border)` borders
- Interactive elements glow on hover via `box-shadow` with `var(--accent-glow)`
- Fonts: Space Grotesk (`--font-display`) for headings/temperatures, Inter (`--font`) for body text (Google Fonts, loaded in `index.html`)
- Temperature unit toggle: `tempUnit` state ('c'|'f') is prop-drilled to all temp-displaying components. Each reads the appropriate API field dynamically (e.g., `temp_c`/`temp_f`).
- Geolocation: `navigator.geolocation.getCurrentPosition` passes `lat,lng` to `handleSearch()` — no backend changes needed since WeatherAPI accepts coordinates as the city param.
- Share: html2canvas (dynamically imported) captures the off-screen `ShareCard`, then Web Share API is tried first with PNG file fallback to download.
- Weather particles: CSS-only animations generated once per mood via `useMemo` with randomized positions/durations. Hidden when `prefers-reduced-motion: reduce`.

### PWA

Configured via `vite-plugin-pwa` in `vite.config.js`:
- **Service worker** (`registerType: 'autoUpdate'`) — generated by Workbox, auto-updates silently.
- **Manifest** — `display: standalone`, portrait orientation, Nimbus cloud icons (192, 512, apple-touch-icon-180).
- **Precaching** — all built assets (JS/CSS/HTML/SVG/PNG/woff2) are precached at install.
- **Runtime caching strategies:**
  - Google Fonts → `CacheFirst` (1 year)
  - WeatherAPI CDN icons → `CacheFirst` (30 days)
  - `/api/weather` responses → `NetworkFirst` (15 min cache, serves stale when offline)
- **Icons** — source SVG is `public/favicon.svg` (minimal cloud path). PNGs are generated by `scripts/generate-icons.js` (raw PNG encoder, no dependencies). Both use the same cloud silhouette: `M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z`.
- **HTML meta tags** — `theme-color`, `apple-mobile-web-app-capable`, `viewport-fit=cover` in `index.html`.

### Environment

Requires a `WEATHER_API_KEY` from [weatherapi.com](https://www.weatherapi.com/) in `.env` (see `.env.example`). `PORT` defaults to 3033.
