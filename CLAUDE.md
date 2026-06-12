# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Required references

- **Knowledge base (`docs/`)** — read at the start of a session to avoid context drift. Start with `docs/TRACKER.md` (the single tracker: status, backlog, done log), then `docs/DECISIONS.md` (why things are the way they are) for any area you'll touch. `docs/README.md` maps the whole KB and the update protocol. **Tracking lives only in `docs/TRACKER.md`** — update it (not a roadmap/status file) when work is planned, started, or shipped.
- **Before editing `client/components/WeatherParticles.jsx` or particle CSS in `client/App.css`**: Read `docs/particles.md` first — hard rules (now amended: precipitation may be elongated streaks, but still no canvas/SVG) and the current state. The weather-visual direction is in `docs/dynamic-weather.md`.

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
- **Server** (`server/`) — Express app using CommonJS (`require`/`module.exports`). Serves the built `dist/` folder as static files with a catch-all fallback to `index.html` for client-side routing. Single API route at `GET /api/weather?city=` (the `/api/search` proxy was removed when autocomplete moved to Open-Meteo geocoding — keyless + CORS open = no proxy needed).
- **Production**: `pnpm build` outputs to `dist/`, then `pnpm start` serves everything from Express on one port.

### Deployment (Netlify)

The app is deployed to Netlify (`nimbus-weather-2026.netlify.app`). `netlify.toml` builds with `pnpm run build`, publishes `dist/`, and redirects `/api/weather` to a serverless function. `netlify/functions/weather.js` is a standalone reimplementation of the Express weather route using the built-in `fetch` (no axios) — keep it in sync with `server/routes/weather.js` (`forecast.json` with `days=3&aqi=yes`). Reads `WEATHER_API_KEY` from the environment. The Express server (`server/`) is used for local dev and any non-Netlify hosting. **City autocomplete does not go through the server at all** — the client calls Open-Meteo's geocoding API directly (keyless, CORS-open).

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
- `server/routes/weather.js` — single route: `GET /api/weather?city=` proxies WeatherAPI's `forecast.json` (3-day forecast + AQI). Keeps the API key server-side.

### Client State & Data Flow

All state lives in `App.jsx` — no external state library. Key state: `savedCities` (persisted to localStorage, max 5), `savedWeather` (cached API responses), `activeWeather` (currently displayed city), `theme` (dark/light), `tempUnit` ('c'|'f', persisted to localStorage), `aqiDetailOpen` (AQI detail overlay).

**Location identity**: cities are keyed by a stable identity (`getLocationKey(location)` → `name|region|country`, lowercased) — *not* bare city name — so two same-named cities (e.g. multiple "Gopalpur"s) never collide in the cache or saved list. `savedCities` is an array of objects `{ key, name, region, country, lat, lon, query, pinned }`; `savedWeather` and the cache are keyed by `key`. Legacy `string[]` saved-cities from older versions migrate on read to `{ key: null, name, query, pinned: true }` (and existing objects without `pinned` also coerce to pinned, since they were explicitly saved under the old bookmark model). The dock shows a region qualifier only when two saved cities share a name.

**Saved-city lifecycle (auto-add + pinnable, cap 5)**: There is no longer a save button. Every successful `handleSearch` calls `upsertCity(key, data)` which always updates `savedWeather` and, if the city is new, appends it to `savedCities` with `pinned: false`. When at cap 5, FIFO-evicts the **oldest unpinned** entry (its cache is also pruned via `removeCache`). If all 5 are pinned the new search is silently not added. Each dock pill carries a bookmark-glyph pin button (`onTogglePin` → flips `pinned`); pinned pills show the glyph accent-filled, unpinned show it outlined and faint (brighter on hover). The X remove still works for both. **Share button** lives in `.header-actions` (not in the hero anymore), styled like the other 36px circular header buttons.

**Caching**: `utils/weatherCache.js` provides localStorage-backed caching with a 15-minute TTL. On mount, `partitionCities()` splits saved cities into fresh (served from cache) and stale/missing (fetched from API). `handleSearch` uses three paths: fresh cache hit (no API call), stale SWR (show cached + background refresh), and miss (loading spinner + fetch). `handleRefresh` always bypasses cache. A `FreshnessLabel` component (defined in `App.jsx`) shows "Updated X mins ago" using the cache timestamp.

The `city` query param accepts both city names and `lat,lng` coordinates (used by geolocation).

### Theming

Dual-layer theming via CSS custom properties on `<html>`:
- `data-theme="dark|light"` — base color tokens (set by user toggle, defaults to system preference)
- `data-mood="clear|night|cloudy|rainy|snowy|stormy"` — weather-reactive chromatic palette (overrides `--accent`, `--ambient-*`, `--temp-gradient` per mood, set automatically via `utils/weatherMood.js`)

Three ambient gradients (`--ambient-1/2/3`) drive the animated radial gradient on `body::before`.

### Components

Twelve components in `client/components/`, all using default exports with PascalCase naming:
- `SearchBar` — glass pill search input with loading spinner and GPS location button. Live **autocomplete combobox**: debounced (300ms, min 2 chars) calls **directly** to Open-Meteo's geocoding API (`https://geocoding-api.open-meteo.com/v1/search`) — keyless, CORS-open, GeoNames-backed (rich same-name disambiguation: "Gopalpur" returns 5+ distinct cities). In-memory `Map` cache keyed by lowercased query (re-typing never re-hits the API), `AbortController` cancels stale requests. Open-Meteo's response fields (`latitude/longitude/admin1`) are normalized at the fetch boundary to `lat/lon/region` so downstream code (App.jsx + cache) is API-agnostic. Dropdown shows up to 5 matches as `Name` + `Region · Country` with ↑/↓/Enter/Esc keyboard nav. Selecting calls `onSelectPlace(place)` → `handleSearch("lat,lon")` for precise WeatherAPI resolution; Enter with no highlight falls back to raw-text `onSearch`. **Attribution:** Open-Meteo geocoding is CC-BY 4.0 — credited in the search-dropdown footer (`.search-attribution`).
- `CurrentWeather` — hero section ("Refined Centered"): massive gradient temperature with a **superscript degree** (the `°` is a solid-accent span kept OUT of the gradient `background-clip:text` so it never clips), condition glass chip (Meteocons icon), an **H / FEELS / L** metadata row (H/L from `forecast.forecastday[0].day`), and a **live local-time clock** (`useCityClock(tz_id)`, ticks every 30s) so the sun bar is legible across timezones. Bookmark + share buttons. Accepts `tempUnit`.
- `WeatherDetails` — horizontal scrollable pill carousel ordered by importance: AQI, Wind, Humidity, UV, Precip, Visibility, Pressure. AQI and Wind pills are interactive (accent border + chevron indicator) and open detail overlays.
- `AQIDetail` — full-screen detail overlay: animated hero AQI number, primary pollutant card, pollutant breakdown grid, AQI scale ladder, outdoor guidance, educational accordion. Uses `calculateAQI()` for numeric US AQI (0–500) with `getAQILevelFromEpa` fallback. Locks body scroll, closes on Escape/overlay click.
- `AirQuality` — compact AQI card using EPA index from API; shows pollutant breakdown grid (PM2.5, PM10, O₃, NO₂, CO, SO₂).
- `WindDetail` — full-screen detail overlay (same pattern as `AQIDetail`): animated hero wind speed, compass arrow SVG, Beaufort scale category, hourly wind chart, gust assessment, prevailing direction, peak hour. Uses `windUtils.js` helpers.
- `Forecast` — 3-day stacked rows in a glass card. Each row: weekday + date subtitle, Meteocon, condition text, **conditional chips** (precip% ≥30, max wind kph ≥25, UV ≥6, snow cm >0 — render only when threshold met), and a **temperature range bar** scaled to the global 3-day min/max (Apple Weather pattern). The Today row gets a soft `--accent-soft` background + 3px accent left stripe. Accepts `tempUnit`.
- `HourlyForecast` — horizontal scroll in a glass card, filters hours based on localtime offset. Accepts `tempUnit`.
- `SunriseSunset` — day/night-aware timeline rendered as its **own standalone glass card** in `App.jsx` (sibling of `CurrentWeather`, not nested inside the hero). Three windows (pre-dawn / daytime / evening) computed from sunrise/sunset; evening uses tomorrow's `forecast.forecastday[1].astro` for the next sunrise. Shows a **countdown headline** ("Sunset in 3h 12m" / "Sunrise in 5h 56m") with a Meteocons icon, a progress arc + glow dot, sunrise/sunset endpoint labels, and (daytime) daylight duration. Props: `astro`, `nextAstro`, `localtime`, `isDay`.
- `Sidebar` — fixed bottom dock bar with pill-shaped city items and glow on active. Accepts `tempUnit`.
- `WeatherParticles` — pure CSS particle system per weather mood (orbs, stars, clouds, rain, snow, lightning). Respects `prefers-reduced-motion`. Uses `useMemo` for stable random generation.
- `ShareCard` — off-screen 600x400 card (forwardRef) captured by html2canvas for sharing. Uses inline styles + mood-specific gradients.

### Key Patterns

- Weather condition codes (from WeatherAPI) are mapped to mood strings in `utils/weatherMood.js` using Sets for rain/snow/storm code groups
- `hooks/useAnimatedNumber.js` — requestAnimationFrame-based animated number transitions with ease-in-out quartic easing, used for temperature displays and AQI hero number. Initializes from 0 so temperatures count up on city load/switch (component remounts via `key={activeCity}`). C/F toggle animates from old → new value.
- `utils/aqiUtils.js` — full EPA AQI breakpoint calculation: converts WeatherAPI μg/m³ values to EPA-native units (ppm/ppb), applies linear interpolation per pollutant, returns max sub-index as the overall AQI. Also exports `AQI_LEVELS`, `POLLUTANT_INFO`, and helpers (`getPrimaryPollutant`, `getSortedPollutants`, `getAQISummary`).
- `utils/weatherCache.js` — localStorage cache keyed by location identity, 15-min TTL. `getLocationKey(location)` builds the key; `setCache(data, query)` stores by the response's key and records a `query→key` alias (in a separate `weatherAlias` localStorage map) so repeat text/coord searches still hit cache without knowing the key up front; `getCachedByQuery(query)` resolves via that alias. Also exports `getCached(key)`, `removeCache(key)` (also prunes its aliases), and `partitionCities(cityObjects)`. Handles quota exceeded by pruning stale entries.
- `utils/windUtils.js` — Beaufort-scale wind categories (kph thresholds) and helpers: `getWindCategory`, `getHourlyWind`, `getPrevailingDirection`, `getGustAssessment`, `getPeakWindHour`, `getWindSummary`. Used by `WindDetail` component.
- Interactive detail pills (Wind, AQI) use accent-colored border and a `::after` chevron pseudo-element as visual affordance for the drill-down.
- Staggered entry animations via inline `animationDelay` styles (60ms in WeatherDetails, 80ms in Forecast)
- Entry animations use blur-to-clear reveals (`blurIn`, `revealUp`, `tempReveal` keyframes). `tempReveal` adds blur + scale + fade on `.current-temp` on mount.
- Weather icons are **bundled Meteocons SVGs** in `public/wx/` (from `@bybas/weather-icons`), mapped from WeatherAPI condition `code` + `is_day` via `utils/weatherIcon.js` (`getWeatherIcon(code, isDay)` → `/wx/{name}.svg`; `SUN_ICONS` for the timeline). Used by `CurrentWeather`, `Forecast`, `HourlyForecast`. **Exception:** `ShareCard` still uses the WeatherAPI raster PNG — html2canvas rasterizes gradient SVGs unreliably, and the PNG is proven in the capture path.
- All cards use heavy glassmorphism: `backdrop-filter: blur(40px)` with `var(--glass)` fills and `var(--glass-border)` borders
- Interactive elements glow on hover via `box-shadow` with `var(--accent-glow)`
- Fonts: Space Grotesk (`--font-display`) for headings/temperatures, Inter (`--font`) for body text (Google Fonts, loaded in `index.html`)
- Temperature unit toggle: `tempUnit` state ('c'|'f') is prop-drilled to all temp-displaying components. Each reads the appropriate API field dynamically (e.g., `temp_c`/`temp_f`).
- Geolocation: `navigator.geolocation.getCurrentPosition` passes `lat,lng` to `handleSearch()` — no backend changes needed since WeatherAPI accepts coordinates as the city param.
- Share: `utils/shareUtils.js` exports `captureShareCard` (dynamically imports html2canvas, renders at `scale: 2` with transparent background) and `shareOrDownload` (Web Share API with `canShare` file check first, PNG download fallback). Captures the off-screen `ShareCard`.
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
