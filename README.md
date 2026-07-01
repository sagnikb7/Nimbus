# Nimbus

A modern weather app with real-time forecasts, air quality, animated backgrounds, and a glassmorphism UI. Built with React 19 and Express.

---

## Features

- **Real-time weather** -- current temperature, feels-like, humidity, wind, UV, pressure, visibility, precipitation, cloud cover, and (WeatherAPI) moon phase
- **Multi-day forecast** -- provider-driven length (Open-Meteo 7 days, WeatherAPI 3) with daily highs/lows, condition icons, and rain/wind chips
- **Choice of data provider** -- switch between **Open-Meteo** (keyless, default) and **WeatherAPI.com** in Settings; the app re-pulls every saved city from the new source
- **Hourly forecast** -- scrollable hour-by-hour breakdown with "now" highlight
- **Air quality** -- numeric US AQI (0–500) calculated from EPA breakpoint tables, shown as a tappable pill with a full detail drill-down (primary pollutant, pollutant breakdown grid, AQI scale ladder, outdoor guidance, educational section)
- **Smart caching** -- localStorage-backed weather cache with 15-minute TTL and stale-while-revalidate pattern to minimize API calls
- **Freshness indicator** -- "Updated X mins ago" label so you always know how current the data is
- **Settings sheet** -- theme, units, and data-provider controls behind a header gear
- **Temperature units** -- toggle between Celsius and Fahrenheit, persisted across sessions
- **Geolocation** -- one-tap GPS button to get weather for your current location
- **Saved locations** -- auto-added, pinnable cities (up to 5) in a bottom dock bar, persisted in localStorage
- **Share weather** -- generate a styled weather card image and share via Web Share API or download as PNG
- **Animated backgrounds** -- CSS particle system per weather mood (floating orbs, twinkling stars, drifting clouds, rain, snow, lightning). Respects `prefers-reduced-motion`.
- **Sunrise / sunset** -- animated timeline with progress dot and glow
- **Theme** -- Light / Dark / System (follows the OS live), chosen in Settings and remembered
- **Chromatic moods** -- the entire color palette shifts based on weather conditions (amber for clear, indigo for night, violet for storms, etc.)
- **Installable PWA** -- install to home screen on mobile or desktop for a full-screen native experience with offline support
- **Responsive** -- single-column layout with bottom dock, optimized for mobile and desktop
- **Glassmorphism UI** -- frosted glass cards, 3-layer ambient gradient background, fluid typography

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 6 |
| Backend | Express 4, Node.js |
| Weather data | [Open-Meteo](https://open-meteo.com/) (default, keyless) + [WeatherAPI](https://www.weatherapi.com/), behind a neutral-schema adapter layer |
| Geocoding | [Open-Meteo geocoding](https://open-meteo.com/en/docs/geocoding-api) (browser-direct, CC-BY 4.0) |
| PWA | vite-plugin-pwa, Workbox |
| Styling | CSS custom properties, glassmorphism, CSS particle animations |
| Typography | Space Grotesk + Inter (Google Fonts) |
| Share | html2canvas, Web Share API |
| Package manager | pnpm |
| Testing | Vitest (backend) |
| Dev tools | Concurrently, Nodemon |

## Getting Started

### Prerequisites

- **Node.js** 18+ (adapters use global `fetch`)
- **pnpm** -- install via `npm install -g pnpm`
- *(Optional)* a free **WeatherAPI** key to enable that provider -- sign up at [weatherapi.com](https://www.weatherapi.com/). The default **Open-Meteo** provider is keyless, so the app runs with no key at all.

### Installation

```bash
git clone <repo-url>
cd node-weather
pnpm install
```

### Configure

Copy the example env file. The app works with **no configuration** (Open-Meteo is keyless);
add a WeatherAPI key only if you want that provider selectable in Settings:

```bash
cp .env.example .env
```

```env
# Optional — enables the "weatherapi" provider (legacy name WEATHER_API_KEY still read)
WEATHERAPI_KEY=your_api_key_here
PORT=3033
```

### Run

**Development** (hot-reload on both client and server):

```bash
pnpm dev
```

This starts the Vite dev server on `:5173` (with API proxy to `:3033`) and the Express API on `:3033` concurrently.

**Production**:

```bash
pnpm build
pnpm start
```

Builds the React app to `dist/`, then Express serves it on `http://localhost:3033`.

## Project Structure

```
nimbus/
├── client/                         React frontend
│   ├── main.jsx                    Entry point
│   ├── App.jsx                     Shell, state, all feature wiring
│   ├── App.css                     Radiant design system + all styles
│   ├── components/
│   │   ├── SearchBar.jsx           Search input + GPS + autocomplete combobox
│   │   ├── CurrentWeather.jsx      Hero temp, condition, H/Feels/L, freshness
│   │   ├── WeatherDetails.jsx      Scrollable stat pills (AQI, Wind, Humidity, UV, Cloud, Moon, ...)
│   │   ├── AQIDetail.jsx           Full-screen AQI detail drill-down
│   │   ├── WindDetail.jsx          Full-screen wind detail drill-down
│   │   ├── AirQuality.jsx          Compact AQI card
│   │   ├── AlertsBanner.jsx        Severe-weather alerts (WeatherAPI)
│   │   ├── HourlyForecast.jsx      Hour-by-hour scroll
│   │   ├── Forecast.jsx            Provider-driven multi-day forecast rows
│   │   ├── SunriseSunset.jsx       Sunrise/sunset timeline
│   │   ├── Sidebar.jsx             Bottom dock bar (saved cities)
│   │   ├── SettingsPanel.jsx       Settings sheet (theme, units, provider, about)
│   │   ├── WeatherParticles.jsx    CSS particle animations per mood
│   │   └── ShareCard.jsx           Off-screen card for image capture
│   ├── hooks/
│   │   └── useAnimatedNumber.js    rAF-based number transitions
│   └── utils/
│       ├── weatherMood.js          Condition id → mood mapping
│       ├── weatherIcon.js          Condition id + is_day → bundled Meteocon
│       ├── aqiUtils.js             EPA AQI breakpoint calculation + pollutant helpers
│       ├── windUtils.js            Beaufort categories + wind helpers
│       ├── weatherCache.js         localStorage cache with 15-min TTL + SWR (provider-aware)
│       └── shareUtils.js           html2canvas capture + Web Share
├── server/                         Express backend
│   ├── index.js                    Server entry, static + API
│   ├── config.js                   Env loader (port only)
│   ├── adapters/                   Provider anti-corruption layer (neutral schema)
│   │   ├── index.js                Registry + capabilities (getAdapter, resolveKey, ...)
│   │   ├── open-meteo.js           Open-Meteo adapter (keyless, default)
│   │   ├── weatherapi.js           WeatherAPI.com adapter
│   │   ├── _shared/                http + convert helpers (WMO→id, deg→compass, ...)
│   │   └── README.md               Adapter contract + neutral schema
│   └── routes/
│       └── weather.js              GET /api/weather?city=&provider= + GET /api/providers
├── netlify/functions/              Serverless mirrors (share the server/adapters registry)
│   ├── weather.js                  → /api/weather
│   └── providers.js                → /api/providers
├── public/                         Static assets (favicon, PWA icons, wx/ Meteocons)
├── scripts/
│   └── generate-icons.js           PNG icon generator (no deps)
├── docs/                           Knowledge base (TRACKER, DECISIONS, references)
├── index.html                      Vite HTML entry + PWA meta tags
├── vite.config.js                  Vite + React + PWA plugin config
├── vitest.config.mjs               Backend test config
├── .env.example                    Environment template
└── package.json
```

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start Vite + Express concurrently |
| `pnpm dev:client` | Vite dev server only (`:5173`) |
| `pnpm dev:server` | Express with nodemon only (`:3033`) |
| `pnpm build` | Build React app to `dist/` |
| `pnpm start` | Production server |
| `pnpm test` | Run backend tests (Vitest); `pnpm test:watch` to watch |
| `node scripts/generate-icons.js` | Regenerate PWA icon PNGs from source |

## API

Both endpoints are served by Express (dev/self-host) and by Netlify functions (which
share the same `server/adapters/` registry). Every provider is normalized to one
**neutral schema** — see [`server/adapters/README.md`](server/adapters/README.md).

### `GET /api/weather?city=<name>&provider=<id>`

Returns current weather + forecast + air quality in the neutral schema.

**Query params:**

| Param | Required | Description |
|---|---|---|
| `city` | Yes | City name or `lat,lng` coordinates |
| `provider` | No | `open-meteo` (default) or `weatherapi`. Unknown → 400; key-required-but-unconfigured → 400 |

**Success (200):**

```json
{
  "provider": "open-meteo",
  "location": { "name": "Kolkata", "region": "West Bengal", "country": "India", "timezone": "Asia/Kolkata", ... },
  "current": { "temp": { "c": 33, "f": 91 }, "feels_like": { "c": 38, "f": 100 }, "humidity": 65, "condition": { "id": 1003, "text": "Partly cloudy" }, "wind": { "speed_kph": 12, "dir": "SW", ... }, "air_quality": { "pm2_5": 12.3, "epa_index": 2, ... }, ... },
  "daily": [ { "date": "2026-07-01", "high": { "c": 34 }, "low": { "c": 27 }, "condition": { ... }, "hour": [ ... ], ... } ],
  "alerts": []
}
```

### `GET /api/providers`

Capability list for the client selector (no secrets):

```json
[ { "id": "open-meteo", "label": "Open-Meteo", "keyRequired": false, "available": true, "forecastDays": 7, "supportsAlerts": false, "supportsAirQuality": true, ... } ]
```

**Error (400/500):**

```json
{ "error": "City query parameter is required" }
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `WEATHERAPI_KEY` | No | -- | Enables the `weatherapi` provider (legacy `WEATHER_API_KEY` still read). Open-Meteo needs no key. |
| `PORT` | No | `3033` | Server port |

## License

ISC
