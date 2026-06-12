# Project Status

_Last updated: 2026-06-13_

The handoff doc. Read this first. Move items between sections as work progresses.

## Snapshot

Nimbus is a React 19 + Vite + Express weather app (WeatherAPI.com), deployed on Netlify.
Recent work has focused on a search/autocomplete feature, a correctness refactor of how
cities are keyed, and a design pass on the current-weather hero.

## ✅ Done (recent)

- **Phase 1 — severe weather alerts** — `&alerts=yes` added to both `server/routes/weather.js` and `netlify/functions/weather.js` (mirrors in sync; response now carries an `alerts` object). New `AlertsBanner.jsx` renders above the hero when `alerts.alert[]` is non-empty: most-severe-first, expandable rows (event, areas, severity pill, effective→expires window, desc, instruction), dismissible, with mood-independent severe/moderate/advisory tones. Verified in dark + light via injected-alert screenshots (globally calm right now, so `alert[]` is empty on live data).
- **Phase 0 quick wins** — (1) **Open-Meteo CC-BY 4.0 attribution** added as a non-interactive footer row in the search dropdown (links Open-Meteo + the license); clears the long-standing TODO. (2) **Condition-code coverage completed** — `weatherIcon.js` now maps all 60 WeatherAPI codes; the 12 unmapped haze/dust/smoke/smog codes get 6 new bundled Meteocons (`haze-day/night`, `dust-day/night`, `dust-wind`, `smoke`) instead of the `cloudy` fallback. Verified via build + dropdown screenshot.

- **Performance pass (shimmer fix)** — killed the perpetually-animated ambient bg gradient (root cause of the shimmer behind glass cards), halved backdrop blur (40→24 cards, 48→28 dock), dropped `filter: blur` from entry animations, removed `drop-shadow` from icons, capped particle counts by ~40%, GPU-promoted particles via `will-change`. Visual fidelity preserved across all breakpoints. See DECISIONS.md.
- **Search dropdown fixed (legibility)** — was a glass surface that bled the hero text through it; now a solid menu (`#14141c` dark / `#fff` light) with proper elevation shadow and an accent-tinted active row with a 3px left bar. Mood-aware via `color-mix`.
- **admin2 in search dropdown** — Open-Meteo's `admin2` (district) now shows when present and distinct from `admin1`, disambiguating same-name+same-state matches (e.g. three "Medinipur, Odisha" now read as "Kendujhar, Odisha" / "Deogarh, Odisha" / etc.).
- **City autocomplete swapped to Open-Meteo geocoding** — keyless, CORS-open, GeoNames-backed. Far richer dataset (Gopalpur returns 5 distinct cities; Tokyo also matches Papua New Guinea / Nepal / etc.). `/api/search` proxy deleted entirely — Express route, Netlify function, and redirect removed. `/api/weather` proxy stays (real API key). CC-BY 4.0 attribution now shown in the search dropdown footer (done — see Phase 0 above). See DECISIONS.md.
- **Saved cities are now auto-add + pinnable** — search auto-enters the city, FIFO-evicts the oldest unpinned at cap 5. Dock pills have a pin glyph (outlined → filled accent on toggle). Legacy saved entries migrated to `pinned: true`. Save button removed from hero; share moved into the header chrome next to refresh/°C/theme. See DECISIONS.md.
- **Forecast / sun polish** — Today row is a clean rounded rect with proper inter-row gaps (dropped the dangling left stripe and the border-top dividers). Sun endpoint icons removed (the SUNRISE/SUNSET text already disambiguates; the two meteocons were near-identical).
- **3-Day Forecast overhaul** — date subtitles, conditional chips (precip / max-wind / UV / snow when meaningful), temperature range bar across the 3 days, and a subtle accent treatment on the "Today" row. Surfaces `day.maxwind_kph`, `day.uv`, `day.totalsnow_cm`, `day.daily_chance_of_rain/snow` we were already fetching. See DECISIONS.md.
- **Sun-dot pulse removed** — the perpetual `sunPulse` animation on the sunrise/sunset progress dot was pure decoration; replaced by the dot's existing static glow. Calmer card.
- **H/L → arrow icons; sunrise/sunset disambiguated** — `current-stats` now uses thin up/down arrow SVGs instead of `H`/`L` text. Sun endpoints show stacked "SUNRISE 06:21 AM" labels with 22px Meteocons so the two endpoints are visually distinct. See DECISIONS.md.
- **ROADMAP.md rewritten against verified free-tier capabilities** — full audit of [WeatherAPI pricing](https://www.weatherapi.com/pricing.aspx) + [docs](https://www.weatherapi.com/docs/). Highlights: alerts are FREE via `alerts=yes` on the existing call; 1-day history is FREE (enables "vs yesterday"); `forecast.json` returns many fields we never render (dewpoint, cloud cover, hourly visibility, moon phase, max wind, total snow). Reorganized into P0 (already-fetched data) / P1 (one new call or smart logic) / P2 (engineering) and paid-only.
- **Hero resize + sun timeline split out** — hero card trimmed (smaller padding, temp clamp `6rem→10.5rem`, tighter margins); `SunriseSunset` extracted from `CurrentWeather` and now renders as its own glass card sibling. Result: WeatherDetails pills above-the-fold on iPad+ and mobile. See DECISIONS.md.
- **City autocomplete** — `/api/search` proxy (Express + Netlify fn); debounced combobox with in-memory cache, abort, keyboard nav, `Name · Region · Country` results; selects by `lat,lon`.
- **Location-identity keying** — cache + saved cities keyed by `name|region|country` (not bare name); `query→key` alias map; legacy migration. (Fixes same-name collisions.)
- **Hero revamp ("Refined Centered")** — superscript degree (solid accent, outside gradient clip — clipping bug fixed), H/FEELS/L row, glass condition chip, grid spacing.
- **Body font** → Hanken Grotesk (display stays Space Grotesk); ShareCard fonts synced.
- **Search bar moved into the header** — desktop inline, mobile wraps to its own row; dropdown z-index fixed.
- **Live local-time clock in the hero** — `useCityClock(tz_id)` in `CurrentWeather`, ticks every 30s, shown as "H:MM AM local" in the mood accent under the date. Makes the sun bar legible across timezones.
- **Weather icons → Meteocons** — 25 bundled SVGs in `public/wx/` (`@bybas/weather-icons`), mapped via `utils/weatherIcon.js` (`getWeatherIcon(code, is_day)`, `SUN_ICONS`). Swapped in `CurrentWeather`, `Forecast`, `HourlyForecast`. **`ShareCard` intentionally kept on the WeatherAPI PNG** (html2canvas + gradient SVG is unreliable). Source: `cdn.jsdelivr.net/npm/@bybas/weather-icons@2.0.0/production/fill/all/{name}.svg`.
- **Sun timeline redesign** — day/night windows, countdown headline ("Sunset/Sunrise in Xh Ym"), daylight duration, tomorrow's sunrise via `forecast.forecastday[1].astro`. Verified day (Toronto) + night (Tokyo).

## ⏳ In flight / next

_Nothing in flight._ **Phase 2 is next** (per the agreed sequencing plan): batch the P0 UI items by component so each file is touched once — HourlyForecast (rain-probability bars + cloud-cover fill), Forecast (max-wind/snow chips + tomorrow drill-down), WeatherDetails (dewpoint pill + pressure-trend arrow), plus the Moon-phase and Visibility-detail cards.

**Dynamic-weather sidequest — audit done, plan written (2026-06-13).** PM audit of the
accent + particle systems is complete; findings + milestones are in
`docs/DYNAMIC_WEATHER_PLAN.md` (linked from ROADMAP). Decisions: CSS-only ceiling (no canvas),
structural fixes first (M1), decouple `--mood-accent`/`--ui-accent` now. Not yet started.

**Also shipped this session:** number roll-up refined — it no longer counts from 0 on every
city load (init-from-target; CSS `tempReveal` carries the entrance), only animates on real
change (°C↔°F, refresh); 800→550ms, ease-out cubic. See `hooks/useAnimatedNumber.js`.

## ⚠️ Known limitations / watch-outs

- `weatherAlias` localStorage map grows with unique search strings (tiny; only pruned for removed keys). Negligible, but noted.
- Netlify functions are hand-mirrored from Express routes — **edit both** when changing an endpoint.
- No test runner / linter configured. Verification is build + manual/visual.

## How to run

```bash
pnpm dev        # client :5173 (proxies /api → Express :3033)
pnpm build      # production build to dist/
```

If ports are stuck: `lsof -ti:3033,5173 | xargs kill -9`.

## How to verify visually (Playwright screenshot recipe)

Playwright core is available via the npx cache. Resolve its path once:
`find ~/.npm/_npx -path "*playwright-core*" -name index.js`. Then (CJS default import):

```js
import pkg from '<that path>'; const { chromium } = pkg;
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:520,height:820}, deviceScaleFactor:2 });
await p.goto('http://localhost:5173/');
await p.fill('.search-bar input','Ballygunge'); await p.keyboard.press('Enter');
await p.waitForSelector('.current-temp'); await p.waitForTimeout(1800);
await p.locator('.current-weather').screenshot({ path:'/tmp/hero.png' });
await b.close();
```

Then Read the PNG. Toggle `.theme-toggle` for light/dark. For night-mode UI, search a city
currently in night (different timezone).
