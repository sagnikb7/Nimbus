# Nimbus Tracker

_The single source of truth for **status + backlog + done**. Read this first._
_Knowledge (why / how / specs) lives in the other [`docs/`](README.md) files — this file links
to them rather than restating. Prioritized by free-tier feasibility (see
[`weatherapi.md`](weatherapi.md)) and effort-to-impact._

_Last updated: 2026-07-10._

## 🔭 Now / in flight

_Nothing in flight._

**Recommended next:** **Phase 2** of the weather-data backlog (batched P0 UI by component), or
the deferred dynamic-weather polish (parallax depth, temperature tint, unified transition
choreography). See below.

---

## ⏭️ Up next (backlog)

### 🔌 Provider system
- [x] **Provider selector UI** — shipped 2026-07-01 (Settings → Data provider; background-refreshes all cities on switch, migrating location keys across providers).
- [ ] **Cache-by-provider** — location identity (`name|region|country`) differs per provider; switch-time key migration handles it, but a cold load can briefly serve the prior provider's cached values. Optional: namespace the cache key by provider.

### 🎨 Dynamic weather — atmosphere system
Full spec + decisions: [`dynamic-weather.md`](dynamic-weather.md). CSS-only ceiling.
**Particle + structural revamp shipped 2026-07-10** (see done log). The "living sky" backdrop was
built then reverted — background is now a single fixed corner glow. Remaining = optional polish.

**Structural correctness** — ✅ shipped 2026-07-10
- [x] Night becomes a modifier, not a mood (`data-mood` weather + `data-period` day/night)
- [x] Standalone purple "night" mood retired
- [x] Intensity tiers (`light/moderate/heavy` from code + `precip_mm`) scale particle density/speed
- [x] Wind-driven particle lean (`--wind-tilt` from `current.wind.degree` + speed)
- [x] Streak-shaped, wind-leaning precipitation (rain/storm); decorative orbs + fog **cut**
- [x] Decouple `--accent` (decorative) from `--ui-accent` (controls, contrast-guarded on glass)

**Not pursued** (background kept intentionally minimal)
- [ ] ~~Continuous time-of-day sky gradient~~ — built then reverted (dark mode must stay dark-dark)
- [ ] Parallax depth layers, perf-safe ambient motion, temperature tint · not planned

### 🌦 Weather-data features
All free-tier. "Phase 2" = the P0 items below, batched **by component** so each file is
touched once: HourlyForecast (rain bars + cloud fill), Forecast (chips + tomorrow drill-down),
WeatherDetails (dewpoint + pressure trend).

**P0 — data already fetched, UI missing (no new API calls)**
- [x] Hourly rain-probability bars — shipped 2026-07-10 as part of the `HourlyForecast` trend-graph redesign (`hour[].chance_of_rain` added to the neutral schema + both adapters; Open-Meteo query gained `precipitation_probability`)
- [ ] Hourly cloud-cover fill behind tiles (needs `hour[].cloud_cover` added to the neutral schema) · S
- [x] Max-wind chip on daily `Forecast` rows — shipped 2026-07-01 (rows now show chance-of-rain + max-wind, the two metrics both providers supply; total-snow/UV chips dropped for cross-provider consistency)
- [ ] Tomorrow drill-down overlay from a `Forecast` row (`daily[1].hour[]`) · M
- [x] Dewpoint pill in `WeatherDetails` (+ "Muggy/Comfortable/Dry") — shipped 2026-07-10 (`current.dewpoint {c,f}` added to schema + both adapters; comfort tile via `utils/comfortUtils.getDewComfort`)
- [ ] Pressure-trend arrow on the Pressure pill · S
- [ ] Moon-phase + illumination card (sibling of `SunriseSunset`) · M
- [ ] Visibility detail card (drill-down from Visibility pill; needs hourly visibility added to the neutral schema) · M

**P1 — free, smart logic or one extra call**
- [ ] Natural-language daily summary ("Warm morning, rain after 2 PM…") — highest delight · M
- [ ] "What should I wear?" / activity hint (feels-like + wind + precip) · S
- [ ] Golden/blue-hour overlay on the sun timeline · S
- [ ] "Compared to yesterday" badge — one new call, `history.json`, cached per-day · M
- [x] Precipitation timeline ("rain expected within the hour") — shipped 2026-07-10 as the `PrecipDetail` page (hourly probability curve + amount bars, next-precip lead, multi-day outlook)
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

**2026-07-10 — v1.6.0 (UI/UX polish batch)**
- **Version bump → 1.6.0.**
- **Single-line header** — dropped the brand wordmark; the search pill now fills the line with
  the controls grouped right.
- **Empty-state redesign** — brand landing/onboarding: raster app icon + indigo→violet **Nimbus**
  wordmark + tagline + value prop + primary "Use my location" CTA (with "Locating…" state) + a
  hint + three educational feature chips. Removed the old `CloudMark` SVG (component deleted).
- **Hero card elevated** — the current-weather card gets a subtle mood-accent **gradient rim** +
  soft halo (fill stays dark) to distinguish it from the plain glass cards.
- **Accent-fill contrast fix** — filled `--ui-accent` controls now use `--on-accent` (near-black
  in dark theme, white in light) instead of hardcoded white; light-theme control fills darkened
  (teal/amber/blue) so all accent×theme combos pass WCAG-AA. Rule documented in `CLAUDE.md`.
- **Dock touch model** — long-press action sheet (Pin/Remove) with Feather icons, an elevated
  drawer surface, a persistent ✕, and a one-time hint; inline pin/✕ hidden on touch.
- **Detail-page polish** — hero double-summary removed (At a Glance is the single narrative);
  wind hero compacted (compass dropped, wind-chill "feels like" line added); AQI/Wind ladders +
  precip ladder use background-tint active state (no accent left-stripe — new design-system rule).
- **Dew Point comfort tile** — `current.dewpoint {c,f}` added to schema + both adapters; tile
  shows value + comfort word (`getDewComfort`).
- **Precipitation detail page** — new `PrecipDetail` overlay (tap the now-interactive Precip
  tile), meteorologist-grade + novice-friendly: hero (current mm/h + type + intensity, or a Dry
  state) → At a Glance → **hourly precip graph** (`PrecipHourlyGraph` — probability curve +
  amount bars, snow-aware) → Today's Summary → multi-day outlook → Rain Intensity ladder →
  educational. Added `hour[].precip_mm` + `snow_cm` to the neutral schema + both adapters (+ README
  + live-test assertions) to power the amount bars. New `utils/precipUtils.js`.
- **AQI + Wind detail hierarchy** — reordered both overlays so obvious/actionable info leads:
  AQI = hero → At a Glance → Outdoor Activity → Primary pollutant → Breakdown → Scale → Learn;
  Wind = hero → At a Glance → Hourly graph → Gusts → Today's Summary → Beaufort → Learn.
  Reference/education pushed to the bottom.
- **Hourly wind graph** — `WindDetail`'s hourly section is now a `WindHourlyGraph` (speed
  area-curve + dashed gust line + baseline direction arrows + Now marker + night bands), modeled
  on `HourlyForecast`. No backend — reads existing `hour[].wind`. Replaced the old scrolling
  arrow-list.
- **Overlay width consistency** — `SettingsPanel`/`WindDetail`/`AQIDetail` now center their
  content in the same 780px column as the main shell (`padding-inline: max(1.5rem, calc((100% -
  780px)/2))`) instead of sprawling full-width on desktop. Backdrops stay full-bleed.
- **Dynamic weather revamp (particles + structure; background kept simple)** — **Night is now a
  lighting modifier** (`data-period`), not a mood: `getWeatherMood` returns weather only, so a
  night storm ≠ a night clear (the old `if(!isDay) return 'night'` bug is gone). Precipitation
  gained **intensity tiers** (`data-intensity` light/moderate/heavy scaling count/speed/opacity)
  and **wind lean** (`--wind-tilt` from wind dir+speed); rain/storm became **elongated streaks**,
  lightning a soft **top sky-glow**. Decorative clear-"orbs" + cloudy-"fog" particles were **cut**
  (only precipitation + clear-night stars remain). `--ui-accent` decoupled from decorative
  `--accent` so pale moods keep legible controls/focus. A "living sky" time-of-day backdrop was
  built then **reverted** — the background is deliberately a **single fixed corner accent glow**
  (`--backdrop-glow`) so dark mode stays dark-dark. Full detail: [`dynamic-weather.md`](dynamic-weather.md).
- **Share card → ad poster** — `ShareCard` rebuilt as a promo card: dark mood-tinted "aurora"
  backdrop, big weather moment (place · temp · condition), Nimbus wordmark, and a "Try Nimbus →"
  CTA + URL. Dropped the forecast/detail grid (it's an ad, not a dashboard).
- **Brand/logo refresh** — header is now a **typographic** `Nimbus` wordmark with a fixed
  indigo→violet gradient (`--brand-wordmark`, mood-independent; reused via `.brand-word` in
  Settings→About so they match). Empty state = a flat `CloudMark` with a slow pulsating bounce
  (`emptyCloudPulse`, reduced-motion static) + a "Use my location" CTA. Settings→About mark now
  uses the **raster app icon** (`/pwa-192x192.png`), not the cloud SVG. (An earlier same-day
  attempt at a live animated-Meteocon header glyph + rain "diorama" was reverted per feedback.)
- **Light-theme weather-icon contrast** — pale Meteocon clouds were vanishing on the near-white
  cards; added a per-theme `--wx-icon-filter` (soft cool drop-shadow + slight brightness/
  saturate) on the icon `<img>`s. Dark theme unchanged. Also: dock pill remove-✕ made
  mobile-safe (no hidden tap target; reveals on hover+active) and search-suggestion hover lost
  its accent left-border for consistency.
- **Hourly Forecast redesign — temperature trend graph** — replaced the flat `time·icon·temp`
  card list with an SVG temp curve (values ride the line), precipitation bars
  (`hour[].chance_of_rain`, new to the neutral schema + both adapters; Open-Meteo added
  `precipitation_probability`), a "Now" marker, night bands, and a right-aligned micro-summary
  ("↑ Warming · Rain by 5 AM"). Goal: understand the next hours in <1s via position, not
  reading each cell. Curve is top-biased + damped so near-flat days still look intentional.
  a11y: per-column `aria-label`s, decorative SVG, reduced-motion-gated draw-in. Verified across
  light/dark/rain via Playwright.
- **Dock + detail-tile polish** — (1) dock pill remove-✕ no longer a hidden tap target
  (`pointer-events:none` when hidden) so mobile taps can't accidentally delete; it now reveals
  on hover *and* on the active pill (deliberate tap-to-open → remove), with a centered SVG glyph.
  (2) detail tiles dropped the heavy standalone-card shadow (which overlapped into a muddy band)
  for a tight contained one — chips read as distinct.
- **PWA hardening — installable everywhere + modern bells** — root cause of the missing
  install icon fixed (`devOptions.enabled` turns the SW on in dev; it was off, so
  `localhost` failed the "registered SW" criterion). Manifest completed: `id`, `lang`,
  `dir`, `categories`, `display_override`, **maskable icon** (padded safe-zone variant via
  `generate-icons.js`), **app shortcuts** (`?action=locate|search`, handled on mount), and
  **screenshots** (narrow+wide) for the rich install dialog. **Settings-only install UI**
  (`usePWA` hook → Settings → Install: native prompt / installed ✓ / iOS A2HS steps; no
  header button by decision, no `share_target`). **Update/offline toast** via
  `useRegisterSW` (added `workbox-window` dep). `public/_headers` for SW/manifest
  no-cache + MIME + immutable assets; light/dark `theme-color`. Verified: prod build SW
  `activated`, manifest `application/manifest+json`, backend tests green. Reference:
  [`pwa.md`](pwa.md).

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
