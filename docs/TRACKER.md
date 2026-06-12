# Nimbus Tracker

_The single source of truth for **status + backlog + done**. Read this first._
_Knowledge (why / how / specs) lives in the other [`docs/`](README.md) files — this file links
to them rather than restating. Prioritized by free-tier feasibility (see
[`weatherapi.md`](weatherapi.md)) and effort-to-impact._

_Last updated: 2026-06-13._

## 🔭 Now / in flight

_Nothing in flight._

**Recommended next:** Dynamic-weather **M1** (structural fixes — highest leverage) or
**Phase 2** of the weather-data backlog (batched P0 UI by component). See below.

---

## ⏭️ Up next (backlog)

### 🎨 Dynamic weather — atmosphere system
Full spec + decisions: [`dynamic-weather.md`](dynamic-weather.md). CSS-only ceiling.

**M1 — structural correctness** (low risk, do first)
- [ ] Night becomes a modifier, not a mood (`data-mood` weather + `data-period` day/night)
- [ ] Night-variant palettes per weather mood (retire the standalone purple "night")
- [ ] Intensity tiers (`light/moderate/heavy` from code + `precip_mm`) scale particle density/speed
- [ ] Wind-driven particle angle + speed (`--wind-angle` from `wind_degree`)
- [ ] Choreographed city-change transitions (cross-fade particles, unify timings)
- [ ] Decouple `--mood-accent` (decorative) from `--ui-accent` (controls, WCAG-AA on glass)

**M2 — push CSS to its ceiling** (the "wow"; reassess after M1)
- [ ] Streak-shaped precipitation (amend [`particles.md`](particles.md) hard rules)
- [ ] Parallax depth layers (2–3)
- [ ] Restore perf-safe ambient motion (transform-only)
- [ ] Temperature tint (warm↔cool from `temp_c`)
- [ ] Continuous time-of-day sky gradient (solar position)

### 🌦 Weather-data features
All free-tier. "Phase 2" = the P0 items below, batched **by component** so each file is
touched once: HourlyForecast (rain bars + cloud fill), Forecast (chips + tomorrow drill-down),
WeatherDetails (dewpoint + pressure trend).

**P0 — data already fetched, UI missing (no new API calls)**
- [ ] Hourly rain-probability bars under each `HourlyForecast` tile (`chance_of_rain`) · S
- [ ] Hourly cloud-cover fill behind tiles (`hour[].cloud`) · S
- [ ] Max-wind + total-snow chips on daily `Forecast` rows (`maxwind_kph`, `totalsnow_cm`) · S
- [ ] Tomorrow drill-down overlay from a `Forecast` row (`forecastday[1].hour[]`) · M
- [ ] Dewpoint pill in `WeatherDetails` (+ "Muggy/Comfortable/Dry") · S
- [ ] Pressure-trend arrow on the Pressure pill · S
- [ ] Moon-phase + illumination card (sibling of `SunriseSunset`) · M
- [ ] Visibility detail card (drill-down from Visibility pill, `hour[].vis_km`) · M

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

- **Netlify functions are hand-mirrored** from Express routes — edit `server/routes/weather.js`
  **and** `netlify/functions/weather.js` together.
- **No test runner / linter** — verify via build + the visual recipe in [`dev-workflow.md`](dev-workflow.md).
- `weatherAlias` localStorage map grows with unique search strings (tiny; pruned only on key
  removal). Negligible.
