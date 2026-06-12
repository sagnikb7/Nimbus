# Data Providers Reference

What our two data sources give us, verified against pricing + docs (June 2026).
Backlog items reference this file instead of restating capabilities.

## Weather — WeatherAPI.com (free tier, ~1M calls/month)

One call powers the whole app:

```
GET https://api.weatherapi.com/v1/forecast.json?key=…&q=…&days=3&aqi=yes&alerts=yes
→ current + hourly + 3-day forecast + astro + AQI + government alerts
```

Server-side only (key hidden): `server/routes/weather.js` and its Netlify mirror
`netlify/functions/weather.js` — **keep both in sync.** The `q` param accepts a city
name *or* `lat,lng` (used by geolocation + autocomplete selection).

### Free-tier capabilities

| Capability | Free | Notes |
|---|---|---|
| `current.json` (Realtime) | ✅ | All tiers |
| `forecast.json` | ✅ **3 days max** | 7-day needs Starter ($7/mo); 14-day needs Pro+ |
| `forecast.json` + `alerts=yes` | ✅ | Government warnings — same call, no extra cost (in use) |
| `forecast.json` + `aqi=yes` | ✅ | In use |
| `history.json` | ✅ **past 1 day only** | Enables "vs yesterday" |
| `marine.json` | ✅ **1 day, no tides** | Coastal/sailing |
| `astronomy.json` / `timezone.json` | ✅ | Redundant — already in `forecast.json` |
| `search.json` | ✅ | Superseded by Open-Meteo for autocomplete |
| `future.json` (14–300 days) | ❌ | Paid only |
| `pollen` / `solar` / `et0` | ❌ | Starter+ / Business+ |
| `sports.json` / `ip.json` | ❌ | Paid |

**Translation:** nearly every backlog item is free. Only 7+ day forecast, pollen, and
solar require a paid bump.

### Fetched but not (fully) rendered

`forecast.json` already returns fields we under-use — most P0 tracker items are pure UI
over data we already pay for: `dewpoint_c/f`, `cloud` %, hourly `vis_km`,
`windchill/heatindex`, `snow_cm`, `moon_phase`, `moon_illumination`, `is_moon_up`,
`maxwind_kph`, `totalsnow_cm`, `daily_chance_of_rain/snow`.

## Geocoding — Open-Meteo (keyless, CORS-open, CC-BY 4.0)

City autocomplete calls Open-Meteo **directly from the browser** (no proxy):

```
https://geocoding-api.open-meteo.com/v1/search?name=…&count=5&language=en&format=json
```

GeoNames-backed — far richer disambiguation than WeatherAPI's `search.json` ("Gopalpur"
returns 5 distinct cities). Returns `admin1`–`admin4`, `population`, `timezone`.
Normalized at the fetch boundary (`latitude/longitude/admin1` → `lat/lon/region`) so the
rest of the app stays provider-agnostic. See `client/components/SearchBar.jsx`.

- **Limits:** 600/min · 5k/hour · 10k/day · 300k/month. Debounce (300 ms) + in-memory
  `Map` cache make quota a non-issue.
- **Attribution:** CC-BY 4.0 — credited in the search-dropdown footer. ✅

## Weather icons — Meteocons (`@bybas/weather-icons`, MIT)

**These are the _animated_ Meteocons, not static.** Each SVG in `public/wx/` (31 files)
carries native **SMIL** animation (`<animate>` / `<animateTransform>`) — e.g. `clear-day.svg`
rotates the sun 360° over 45s, `rain.svg` has 6 animated drops, `thunderstorms-*` flash.

- **Source / how to add one:**
  `https://cdn.jsdelivr.net/npm/@bybas/weather-icons@2.0.0/production/fill/all/{name}.svg`
  (note: `gh/basmilius/…` and `production/fill/svg/` paths 404 — use `@bybas` +
  `production/fill/all/`). Download into `public/wx/` and map the code in `utils/weatherIcon.js`.
- **Mapping:** `getWeatherIcon(code, is_day)` → `/wx/{name}.svg` (all 60 WeatherAPI codes
  covered; `SUN_ICONS` for the sunrise/sunset/moon glyphs). `utils/weatherIcon.js`.
- **Rendered as `<img src=…>`** in `CurrentWeather` / `Forecast` / `HourlyForecast`. This
  matters: **SMIL animations DO play through `<img>`** (CSS/JS-driven SVG animation would
  not — SMIL does), so the icons animate live in the app with zero JS.
- **`ShareCard` exception:** uses the WeatherAPI **raster PNG**, because html2canvas can't
  reliably rasterize gradient/animated SVGs into the share image.
