# Nimbus Tracker

_The single source of truth for **status + backlog + done**. Read this first._
_Knowledge (why / how / specs) lives in the other [`docs/`](README.md) files — this file links
to them rather than restating. Prioritized by free-tier feasibility (see
[`weatherapi.md`](weatherapi.md)) and effort-to-impact._

_Last updated: 2026-07-01._

## 🔭 Now / in flight

_Nothing in flight._

**Recommended next:** Dynamic-weather **M1** (structural fixes — highest leverage) or
**Phase 2** of the weather-data backlog (batched P0 UI by component). See below.

---

## ⏭️ Up next (backlog)

### 🔌 Provider system
- [x] **Provider selector UI** — shipped 2026-07-01 (Settings → Data provider; background-refreshes all cities on switch, migrating location keys across providers).
- [ ] **Cache-by-provider** — location identity (`name|region|country`) differs per provider; switch-time key migration handles it, but a cold load can briefly serve the prior provider's cached values. Optional: namespace the cache key by provider.

### 🎨 Dynamic weather — atmosphere system
Full spec + decisions: [`dynamic-weather.md`](dynamic-weather.md). CSS-only ceiling.

**M1 — structural correctness** (low risk, do first)
- [ ] Night becomes a modifier, not a mood (`data-mood` weather + `data-period` day/night)
- [ ] Night-variant palettes per weather mood (retire the standalone purple "night")
- [ ] Intensity tiers (`light/moderate/heavy` from code + `precip_mm`) scale particle density/speed
- [ ] Wind-driven particle angle + speed (`--wind-angle` from `current.wind.degree`)
- [ ] Choreographed city-change transitions (cross-fade particles, unify timings)
- [ ] Decouple `--mood-accent` (decorative) from `--ui-accent` (controls, WCAG-AA on glass)

**M2 — push CSS to its ceiling** (the "wow"; reassess after M1)
- [ ] Streak-shaped precipitation (amend [`particles.md`](particles.md) hard rules)
- [ ] Parallax depth layers (2–3)
- [ ] Restore perf-safe ambient motion (transform-only)
- [ ] Temperature tint (warm↔cool from `current.temp.c`)
- [ ] Continuous time-of-day sky gradient (solar position)

### 🌦 Weather-data features
All free-tier. "Phase 2" = the P0 items below, batched **by component** so each file is
touched once: HourlyForecast (rain bars + cloud fill), Forecast (chips + tomorrow drill-down),
WeatherDetails (dewpoint + pressure trend).

**P0 — data already fetched, UI missing (no new API calls)**
- [ ] Hourly rain-probability bars under each `HourlyForecast` tile (`chance_of_rain`) · S
- [ ] Hourly cloud-cover fill behind tiles (needs `hour[].cloud_cover` added to the neutral schema) · S
- [x] Max-wind chip on daily `Forecast` rows — shipped 2026-07-01 (rows now show chance-of-rain + max-wind, the two metrics both providers supply; total-snow/UV chips dropped for cross-provider consistency)
- [ ] Tomorrow drill-down overlay from a `Forecast` row (`daily[1].hour[]`) · M
- [ ] Dewpoint pill in `WeatherDetails` (+ "Muggy/Comfortable/Dry") · S
- [ ] Pressure-trend arrow on the Pressure pill · S
- [ ] Moon-phase + illumination card (sibling of `SunriseSunset`) · M
- [ ] Visibility detail card (drill-down from Visibility pill; needs hourly visibility added to the neutral schema) · M

**P1 — free, smart logic or one extra call**
- [ ] Natural-language daily summary ("Warm morning, rain after 2 PM…") — highest delight · M
- [ ] "What should I wear?" / activity hint (feels-like + wind + precip) · S
- [ ] Golden/blue-hour overlay on the sun timeline · S
- [ ] "Compared to yesterday" badge — one new call, `history.json`, cached per-day · M
- [ ] Precipitation timeline ("rain expected within the hour") · M
- [ ] Marine mode for coastal cities — `marine.json` · L

### 🛠 Engineering & polish
- [ ] Auto-detect location on first visit (`navigator.geolocation` on empty state)
- [ ] Weather comparison view (side-by-side two saved cities) · L
- [ ] Daily PWA notification (morning briefing) · L
- [ ] Animated precipitation radar (RainViewer free tiles) · L

### 💳 Paid-only (parked — don't build on free)
7–10 day forecast (Starter $7/mo) · pollen (Starter+) · solar irradiance (Starter+) ·
sports events (Starter+). See [`weatherapi.md`](weatherapi.md).

---

## ✅ Done log (newest first)

The *why* for notable items is in [`DECISIONS.md`](DECISIONS.md); full history is in git.

**2026-07-01**
- **Detail-pill polish** — AQI tile now *is* the air-quality alert (level-colored border + subtle tint
  when harmful; removed the separate `.aqi-alert` bar); moon pill made a 2-liner; tiles reordered into
  priority groups; radius 100px→20px (card-consistent, per design system); alerts banner collapsed by
  default; capability list surfaces Cloud cover / Moon phase.
- **Provider switching (Settings) + capability display** — pick any available provider; app
  background-refreshes every saved city with the new source (migrates cross-provider location keys so
  the forecast length etc. actually updates). Settings lists the selected provider's features
  (`${forecastDays}-day forecast`, alerts, AQI, keyless) from new `meta` flags
  (`supportsAlerts`/`supportsAirQuality`) surfaced in `/api/providers`. Freshness label now shows the
  provider name.
- **Provider-exclusive detail pills** — **moon phase** (WeatherAPI `astro.moon_phase`, accurate inline
  SVG glyph from illumination + waxing/waning) and **cloud cover** (common to both) added to the details
  carousel; each renders only when the field is present (the per-field-adaptivity pattern). Forecast rows
  simplified to two always-on chips — chance of rain + max wind (the metrics BOTH providers supply);
  the UV/snow/precip-threshold chips were dropped for cross-provider consistency.
- **Settings page** — new full-screen `SettingsPanel` sheet opened by a header **gear** (replaced the
  unit + theme toggles). Appearance (theme **Light/Dark/System** — new tri-state; System follows the OS
  live), Units (°C/°F), About (features, `v{__APP_VERSION__}` via Vite `define`, GitHub link, Made with ♥).
  Reusable `.segmented` control. App version bumped to **1.5.0**.
- **Forecast length is provider-driven** — adapters own `meta.forecastDays` (Open-Meteo 7, WeatherAPI
  3); neutral `daily[]` carries that length and `Forecast.jsx` header is dynamic
  (`${daily.length}-Day Forecast`). `forecastDays` added to `/api/providers`. Dock horizontal-scroll
  fix (`justify-content: safe center`) so the first saved city is reachable.
- **Provider selection → client-side + capability descriptors** — provider now chosen by the client
  (`localStorage`, default open-meteo, sent as `?provider=`), not `WEATHER_PROVIDER` env. Each adapter
  exports a `meta` descriptor; registry adds `DEFAULT_PROVIDER`/`resolveKey`/`isAvailable`/
  `listProviders`. New `GET /api/providers` capability endpoint (no keys) + Netlify function; server
  logs available providers on boot; route validates the requested provider. Key renamed
  `WEATHER_API_KEY` → `WEATHERAPI_KEY` (legacy fallback). (Selector UI shipped separately the same day;
  cache-by-provider still deferred.)
- **Backend test suite (Vitest)** — first tests in the repo. Pure units for `convert.js` +
  registry; **live** integration for both adapters and the `/api/weather` route (no mocks — real
  providers; WeatherAPI self-skips without a key). `pnpm test`.
- **App icon refreshed** — new fluffy-cloud artwork (indigo→violet); PNGs downscaled from a 512
  master via `sips`; favicon + header/empty/ShareCard marks redrawn to the same cloud. `axios`
  removed (unused).
- **Hero card compacted** — split layout: location header + big temp left, condition chip over a
  horizontal H·Feels·L row on the right, "Updated X ago" beneath. Much shorter card.
- **Multi-vendor weather adapter** — `WEATHER_PROVIDER` env var (`weatherapi` | `open-meteo`)
  selects a server-side adapter that normalizes any vendor into one **neutral schema** the whole
  frontend consumes (`server/adapters/`, contract in `adapters/README.md`). Open-Meteo adapter
  merges forecast + air-quality, translates WMO→condition id, degrees→compass, ISO→"h:mm AM",
  us_aqi→EPA index, and reverse-geocodes `lat,lon` names via BigDataCloud (no alerts). Express
  route and Netlify function now `require()` the **same** registry — the hand-mirror duplication
  is gone. Frontend rewritten to neutral keys (`temp.c/f`, `condition.id`, `wind.*`, `daily[]`,
  `alerts[]`, `epa_index`). Rationale in [`DECISIONS.md`](DECISIONS.md). Geocoding autocomplete
  unchanged (still client-direct Open-Meteo).

**2026-06-13**
- **Knowledge-base reorg** — single tracker (this file) + multi-file knowledge base; killed
  `ROADMAP.md` / `STATUS.md` / `DYNAMIC_WEATHER_PLAN.md`; moved particle guide to
  `docs/particles.md`; fixed all cross-links.
- **Dynamic-weather audit + plan** — accent/particle systems audited; spec in
  [`dynamic-weather.md`](dynamic-weather.md).
- **Number roll-up refined** — no longer counts from 0 on load (init-from-target, CSS reveal
  carries the entrance); animates only on real change (°C↔°F, refresh); 800→550 ms, ease-out
  cubic. `hooks/useAnimatedNumber.js`.
- **Phase 1 — severe-weather alerts** — `alerts=yes` on both endpoint mirrors; `AlertsBanner`
  above the hero (most-severe-first, expandable, dismissible, mood-independent tones).
- **Phase 0** — Open-Meteo CC-BY attribution in the search dropdown; all 60 WeatherAPI
  condition codes now mapped (added haze/dust/smoke Meteocons).

**Earlier (2026-06-12 → 13)**
- Performance pass (killed ambient animation, halved blur, capped particles) — [`DECISIONS.md`](DECISIONS.md)
- City autocomplete → Open-Meteo geocoding; `/api/search` proxy retired
- Auto-add + pinnable saved cities; share moved to header
- 3-day Forecast overhaul; sun timeline redesign + extracted to its own card
- Location-identity keying (anti-collision); hero "Refined Centered" revamp
- Weather icons → bundled Meteocons; search bar moved into the header; live local-time clock

---

## ⚠️ Watch-outs

- **Weather vendor logic is shared, not mirrored** — both `server/routes/weather.js` and
  `netlify/functions/weather.js` `require()` the same `server/adapters/` registry. Add/patch vendors
  there (keep the neutral schema in `adapters/README.md`); both entrypoints resolve the provider from
  `?provider=` and delegate. No more editing two copies of the fetch.
- **Backend has tests, no linter** — `pnpm test` (Vitest, `server/**/*.test.js`). Adapter/route
  tests are **live** (hit real providers); the WeatherAPI one self-skips without `WEATHERAPI_KEY`.
  Frontend still has no tests — verify via build + the visual recipe in [`dev-workflow.md`](dev-workflow.md).
- `weatherAlias` localStorage map grows with unique search strings (tiny; pruned only on key
  removal). Negligible.
