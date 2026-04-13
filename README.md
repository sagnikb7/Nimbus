# Nimbus

A modern weather app with real-time forecasts, air quality, animated backgrounds, and a glassmorphism UI. Built with React 19 and Express.

---

## Features

- **Real-time weather** -- current temperature, feels-like, humidity, wind, UV, pressure, visibility, and precipitation
- **3-day forecast** -- daily highs and lows with condition icons
- **Hourly forecast** -- scrollable hour-by-hour breakdown with "now" highlight
- **Air quality** -- EPA index badge (Good through Hazardous) with PM2.5, PM10, O3, NO2, CO, SO2 pollutant pills
- **Temperature units** -- toggle between Celsius and Fahrenheit, persisted across sessions
- **Geolocation** -- one-tap GPS button to get weather for your current location
- **Saved locations** -- bookmark up to 5 cities in a bottom dock bar, persisted in localStorage
- **Share weather** -- generate a styled weather card image and share via Web Share API or download as PNG
- **Animated backgrounds** -- CSS particle system per weather mood (floating orbs, twinkling stars, drifting clouds, rain, snow, lightning). Respects `prefers-reduced-motion`.
- **Sunrise / sunset** -- animated timeline with progress dot and glow
- **Dark / Light mode** -- respects system preference, toggleable, remembers your choice
- **Chromatic moods** -- the entire color palette shifts based on weather conditions (amber for clear, indigo for night, violet for storms, etc.)
- **Installable PWA** -- install to home screen on mobile or desktop for a full-screen native experience with offline support
- **Responsive** -- single-column layout with bottom dock, optimized for mobile and desktop
- **Glassmorphism UI** -- frosted glass cards, 3-layer ambient gradient background, fluid typography

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 6 |
| Backend | Express 4, Node.js |
| Weather data | [WeatherAPI](https://www.weatherapi.com/) |
| PWA | vite-plugin-pwa, Workbox |
| Styling | CSS custom properties, glassmorphism, CSS particle animations |
| Typography | Space Grotesk + Inter (Google Fonts) |
| Share | html2canvas, Web Share API |
| Package manager | pnpm |
| Dev tools | Concurrently, Nodemon |

## Getting Started

### Prerequisites

- **Node.js** 18+
- **pnpm** -- install via `npm install -g pnpm`
- A free **WeatherAPI** key -- sign up at [weatherapi.com](https://www.weatherapi.com/)

### Installation

```bash
git clone <repo-url>
cd node-weather
pnpm install
```

### Configure

Copy the example env file and add your API key:

```bash
cp .env.example .env
```

```env
WEATHER_API_KEY=your_api_key_here
PORT=3000
```

### Run

**Development** (hot-reload on both client and server):

```bash
pnpm dev
```

This starts the Vite dev server on `:5173` (with API proxy to `:3000`) and the Express API on `:3000` concurrently.

**Production**:

```bash
pnpm build
pnpm start
```

Builds the React app to `dist/`, then Express serves it on `http://localhost:3000`.

## Project Structure

```
nimbus/
├── client/                         React frontend
│   ├── main.jsx                    Entry point
│   ├── App.jsx                     Shell, state, all feature wiring
│   ├── App.css                     Radiant design system + all styles
│   ├── components/
│   │   ├── SearchBar.jsx           Search input + GPS location button
│   │   ├── CurrentWeather.jsx      Hero temp, condition, save, share
│   │   ├── WeatherDetails.jsx      Scrollable stat pills
│   │   ├── AirQuality.jsx          EPA badge + pollutant pills
│   │   ├── HourlyForecast.jsx      Hour-by-hour scroll
│   │   ├── Forecast.jsx            3-day forecast rows
│   │   ├── SunriseSunset.jsx       Sunrise/sunset timeline
│   │   ├── Sidebar.jsx             Bottom dock bar (saved cities)
│   │   ├── WeatherParticles.jsx    CSS particle animations per mood
│   │   └── ShareCard.jsx           Off-screen card for image capture
│   ├── hooks/
│   │   └── useAnimatedNumber.js    rAF-based number transitions
│   └── utils/
│       ├── weatherMood.js          Condition code → mood mapping
│       ├── aqiUtils.js             EPA index → level/color mapping
│       └── shareUtils.js           html2canvas capture + Web Share
├── server/                         Express backend
│   ├── index.js                    Server entry, static + API
│   ├── config.js                   Env var loader
│   └── routes/
│       └── weather.js              GET /api/weather?city=
├── public/                         Static assets
│   ├── favicon.svg                 SVG favicon (minimal cloud)
│   ├── pwa-192x192.png             PWA icon 192px
│   ├── pwa-512x512.png             PWA icon 512px
│   └── apple-touch-icon-180x180.png  iOS home screen icon
├── scripts/
│   └── generate-icons.js           PNG icon generator (no deps)
├── index.html                      Vite HTML entry + PWA meta tags
├── vite.config.js                  Vite + React + PWA plugin config
├── .env.example                    Environment template
└── package.json
```

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start Vite + Express concurrently |
| `pnpm dev:client` | Vite dev server only (`:5173`) |
| `pnpm dev:server` | Express with nodemon only (`:3000`) |
| `pnpm build` | Build React app to `dist/` |
| `pnpm start` | Production server |
| `node scripts/generate-icons.js` | Regenerate PWA icon PNGs from source |

## API

### `GET /api/weather?city=<name>`

Returns current weather + 3-day forecast + air quality from WeatherAPI.

**Query params:**

| Param | Required | Description |
|---|---|---|
| `city` | Yes | City name, zip code, or `lat,lng` coordinates |

**Success (200):**

```json
{
  "location": { "name": "Kolkata", "region": "West Bengal", "country": "India", ... },
  "current": { "temp_c": 33, "temp_f": 91, "humidity": 65, "air_quality": { "pm2_5": 12.3, ... }, "condition": { "text": "Partly Cloudy", ... }, ... },
  "forecast": { "forecastday": [ ... ] }
}
```

**Error (400/500):**

```json
{ "error": "City query parameter is required" }
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `WEATHER_API_KEY` | Yes | -- | Your WeatherAPI key |
| `PORT` | No | `3000` | Server port |

## License

ISC
