# Weather provider adapters

`GET /api/weather?city=&provider=` is fulfilled by the adapter the **client**
requests via `?provider=` (default `open-meteo`). Every adapter exports
`fetchWeather(city, ctx)` + a `meta` descriptor and returns the **neutral schema**
below, so the entire frontend is provider-agnostic.

- `city` — a city name **or** `"lat,lon"` (used by geolocation + autocomplete).
- `ctx` — `{ apiKey }` (only key-requiring providers use it; resolved server-side).

Registry: `server/adapters/index.js`. Shared helpers: `_shared/` (`http.getJson`,
`convert.*`). Both the Express route (`server/routes/weather.js`) and the Netlify
function (`netlify/functions/weather.js`) `require()` this same registry — no build
step, no duplicated vendor logic.

## Provider descriptor + capabilities

Each adapter also exports `meta` — a self-describing descriptor:

```jsonc
{ "id": "open-meteo", "label": "Open-Meteo", "keyRequired": false, "keyEnvVar": null,
  "forecastDays": 7, "supportsAlerts": false, "supportsAirQuality": true }
{ "id": "weatherapi", "label": "WeatherAPI.com", "keyRequired": true,
  "keyEnvVar": "WEATHERAPI_KEY", "keyEnvVarFallback": "WEATHER_API_KEY",
  "forecastDays": 3, "supportsAlerts": true, "supportsAirQuality": true }
```

The descriptor stores the **env-var name**, never the key value. The registry derives
everything from it:

- `DEFAULT_PROVIDER` — `open-meteo` (keyless → always usable).
- `resolveKey(id)` — reads `process.env[keyEnvVar]` (or the legacy fallback) at runtime.
- `isAvailable(id)` — `!keyRequired || !!resolveKey(id)`.
- `listProviders()` — `[{ id, label, keyRequired, available, forecastDays }]`; **no keys / env-var
  names** — this is what `GET /api/providers` returns for the client's (future) provider selector.

**Forecast length is provider-driven.** Each adapter sets its own day count (`meta.forecastDays`;
Open-Meteo 7, WeatherAPI 3 = free-tier cap) and the neutral `daily[]` simply has that length — the
UI renders whatever it's given (`Forecast.jsx` header is `${daily.length}-Day Forecast`). Per-day
fields that a provider can't supply should be `null`/omitted so the UI can show them only when present
(this is how future provider-specific extras — e.g. per-day UV/AQI — get added, field by field).

The route validates `?provider` against the registry (unknown → 400; key-required but
unconfigured → 400) — provider is client input and is never trusted blindly.

Add a provider by dropping an adapter that exports `fetchWeather` + `meta` and registering
it in `index.js`. If it needs a key, add `keyEnvVar`; availability, the capability list, and
the client selector all pick it up automatically.

## Neutral schema

```jsonc
{
  "location": { "name","region","country","lat","lon",
                "localtime":"YYYY-MM-DD HH:MM", "timezone":"IANA" },
  "current": {
    "temp":       { "c":0, "f":0 },
    "feels_like": { "c":0, "f":0 },
    "condition":  { "id":1000, "text":"Clear", "icon_url":"" }, // icon_url: ShareCard only
    "is_day": 1,
    "wind": { "speed_kph":0, "dir":"NW", "degree":0, "gust_kph":0 },
    "humidity":0, "uv":0, "precip_mm":0, "visibility_km":0, "pressure_mb":0,
    "dewpoint": { "c":0, "f":0 },             // or null; comfort ("muggy") metric
    "cloud_cover":0,                          // % (both providers)
    "moon_phase": null, "moon_illumination": null,  // WeatherAPI only; null = omit in UI
    "air_quality": { "pm2_5":0,"pm10":0,"o3":0,"no2":0,"so2":0,"co":0, "epa_index":1 } // or null
  },
  "daily": [ {
    "date":"YYYY-MM-DD",
    "high": {"c":0,"f":0}, "low": {"c":0,"f":0},
    "condition": {"id":1000,"text":"Clear","icon_url":""},
    "chance_of_rain":0, "chance_of_snow":0, "max_wind_kph":0, "uv":0, "total_snow_cm":0,
    "astro": { "sunrise":"6:30 AM", "sunset":"6:00 PM" },
    "hour": [ {
      "time":"YYYY-MM-DD HH:MM", "time_epoch":0, "temp":{"c":0,"f":0},
      "condition":{"id":1000,"text":"Clear"}, "is_day":1, "chance_of_rain":0,
      "precip_mm":0, "snow_cm":0,
      "wind":{"speed_kph":0,"dir":"NW","degree":0,"gust_kph":0}
    } ]
  } ],
  "alerts": [ { "event","headline","severity","areas","effective","expires","description","instruction" } ]
}
```

### Notes / provider gaps
- **`condition.id`** is a neutral code seeded from WeatherAPI's numbering so the
  Meteocons icon table (`weatherIcon.js`) and mood table (`weatherMood.js`) work
  unchanged. Non-WeatherAPI vendors translate their codes to it (`convert.wmoToConditionId`).
- **Open-Meteo** has no alerts → `alerts: []`; no vendor icons → `icon_url: ""`
  (ShareCard falls back to the bundled Meteocon); no reverse geocoding → names for
  `"lat,lon"` come from BigDataCloud (keyless).
