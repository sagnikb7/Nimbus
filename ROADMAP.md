# Nimbus Roadmap

Prioritized by **WeatherAPI free-tier feasibility** + effort-to-impact. Verified against the
[pricing page](https://www.weatherapi.com/pricing.aspx) and
[API docs](https://www.weatherapi.com/docs/) (June 2026).

## What the free tier actually gives us

| Capability | Free | Notes |
|---|---|---|
| `current.json` (Realtime) | ✅ | All tiers |
| `forecast.json` | ✅ **3 days max** | 7-day needs Starter ($7/mo); 14-day needs Pro+ |
| `forecast.json` w/ `alerts=yes` | ✅ Limited | Government weather warnings — same call, no extra cost |
| `forecast.json` w/ `aqi=yes` | ✅ Limited | Already used |
| `history.json` | ✅ **Past 1 day only** | Enables "vs yesterday" comparisons |
| `marine.json` | ✅ **1 day, no tides** | Coastal/sailing data |
| `astronomy.json` | ✅ | Standalone moon/sun (redundant — already in `forecast.json`) |
| `timezone.json` | ✅ | Standalone (redundant — already in `forecast.json`) |
| `search.json` | ✅ | Already used |
| `alerts.json` (standalone) | ✅ Limited | Or use `alerts=yes` on forecast |
| `future.json` (14-300 days ahead) | ❌ | Paid only |
| `pollen` param | ❌ | Starter+ |
| `solar` / irradiance / `et0` | ❌ | Starter+ / Business+ |
| `sports.json` | ❌ Limited | Paid for full data |
| `ip.json` | ❌ | Paid |

**Translation:** every "Quick win" and most "Differentiator" items below are achievable on the
free 100k-calls/month plan. Only the 7+ day forecast and pollen require a paid bump.

---

## P0 — Data already fetched, UI missing (no new API calls)

These are the highest leverage: zero added cost, immediate user value.

- [x] **Severe weather alerts banner** — `alerts=yes` added to `forecast.json`; dismissible banner above the hero renders when `alerts.alert[]` is non-empty. Most-severe-first, expandable rows (event/areas/severity pill/window/desc/instruction), mood-independent severe/moderate/advisory tones. *Done — see `AlertsBanner.jsx`.*
- [ ] **Hourly rain probability** — render `chance_of_rain` (already in `hour[]`) as a thin bar under each `HourlyForecast` tile. Color the bar with `--accent` when ≥40%. *Effort: S · Endpoint: existing*
- [ ] **Moon phase + illumination card** — `forecast.forecastday[0].astro` already returns `moon_phase`, `moon_illumination`, `moonrise`, `moonset`. Add a `MoonPhase` glass card (sibling of `SunriseSunset`) with an illuminated circle SVG, phase name, and rise/set times. *Effort: M · Endpoint: existing*
- [ ] **Dewpoint pill in WeatherDetails** — `current.dewpoint_c/f` already returned. Add to the carousel with a one-line plain-English interpretation ("Muggy" / "Comfortable" / "Dry") based on °C thresholds (>20=muggy, 12-20=comfortable, <12=dry). *Effort: S · Endpoint: existing*
- [ ] **Hourly cloud cover row** — `hour[].cloud` (0-100%). Could appear as a faint background fill behind each HourlyForecast tile (more cloud → more opacity). Subtle but informative. *Effort: S · Endpoint: existing*
- [ ] **Tomorrow drill-down** — clicking a day in `Forecast` opens a detail overlay using `forecastday[1].hour[]` (24 hourly readings — already fetched). Same pattern as `WindDetail`/`AQIDetail`. *Effort: M · Endpoint: existing*
- [ ] **Max wind + total snow on daily forecast rows** — `day.maxwind_kph` and `day.totalsnow_cm` already in response. Show as small chips on each Forecast row when meaningful (wind ≥40 kph, snow >0). *Effort: S · Endpoint: existing*
- [ ] **Visibility detail card** — drill-down from the existing Visibility pill using `hour[].vis_km`. Useful for driving/aviation. *Effort: M · Endpoint: existing*

## P1 — Free, one extra API call

Each adds one endpoint to the data flow. All within free quota.

- [ ] **"Compared to yesterday" badge** — call `history.json?q=...&dt={yesterday}` once per active city per day. Show "↑ 4° warmer than yesterday" near the hero. Cache the value in localStorage with the date key (one call/day/city). *Effort: M · New endpoint: history.json*
- [ ] **Precipitation timeline ("rain starts in 23 min")** — Dark Sky-style. Use the next 1-2 hours of `hour[].precip_mm` + `chance_of_rain` (already fetched) to compute a minute-bucketed bar. *Caveat:* free tier is hourly granularity, so this is "rain expected this hour" not minute-accurate. Frame the UI accordingly ("Rain expected within the next hour"). *Effort: M · Endpoint: existing*
- [ ] **Marine mode (coastal cities)** — detect when location is near coast (lat/lon distance to a coastline file, OR just a manual toggle in the dock), call `marine.json` for 1-day swell/wave-height data. Render as a new `MarineCard`. *Effort: L · New endpoint: marine.json*

## P1 — Differentiators (use existing free data smartly)

These wrap existing fields in user-friendly logic. No new endpoints needed.

- [ ] **Natural language daily summary** — derive one sentence from `forecastday[0].hour[]`: *"Warm morning, rain likely after 2 PM, clearing by evening."* Pure JS over already-fetched data. The single highest-delight item. *Effort: M · Endpoint: existing*
- [ ] **"What should I wear?" / activity hint** — rule-based: feels-like + wind + precip → outfit suggestion ("Light jacket"), umbrella indicator, "good for a run" badge. Could live as a small card below the hero. *Effort: S · Endpoint: existing*
- [ ] **Golden hour + blue hour overlay** — Compute from sunrise/sunset (±30 min). Add tinted bands to the existing sun timeline. Photographer-friendly. *Effort: S · Endpoint: existing*
- [ ] **Pressure trend arrow** — `current.pressure_mb` vs the first hour of forecast (or yesterday's last hour via history). Show ↑/↓ trend on the existing Pressure pill. *Effort: S · Endpoint: existing*

## P2 — Engineering hygiene

- [x] **Condition code coverage** — `utils/weatherIcon.js` now maps **all 60** WeatherAPI codes (verified against [conditions.json](https://www.weatherapi.com/docs/weather_conditions.json)). The previously-unmapped 12 (`1012, 1015, 1018, 1021, 1024, 1027, 1033, 1036, 1039, 1042, 1045, 1048`) were the haze/dust/smoke/smog family — now mapped to bundled `haze`, `dust`, `dust-wind`, and `smoke` Meteocons instead of falling through to `cloudy`. _(The old "48 of 62 — missing fog/blizzard variants" note was inaccurate; the gaps were atmospheric-obscuration codes.)_
- [ ] **Auto-detect location on first visit** — prompt `navigator.geolocation` on empty state instead of requiring a manual search. Friction killer.
- [x] **Server-side `alerts=yes` flag** — added to both `server/routes/weather.js` and `netlify/functions/weather.js` (mirrors in sync). *Done.*

## P2 — Polish & power-user

- [ ] **Weather comparison view** — side-by-side hero for any two saved cities. Power-user, lower frequency. *Effort: L*
- [ ] **Daily PWA notification** — morning briefing push. Requires Notification permission UX and a server-side scheduler (or registered service worker periodic sync). *Effort: L*
- [ ] **Animated precipitation radar** — embed [RainViewer](https://www.rainviewer.com/api.html) free tiles. WeatherAPI map tiles exist too but are static. Visually impressive. *Effort: L · External API*

## Requires paid upgrade (flag, don't build on free)

- ❌ **7-10 day forecast** — needs Starter tier ($7/mo, 7 days) or Pro+ ($25/mo, 14 days). Listed in the old roadmap but not free-tier feasible.
- ❌ **Pollen forecast** — needs Starter+. Could pair with AQI as "air health" hub later.
- ❌ **Solar irradiance / UV solar panels mode** — needs Starter+.
- ❌ **Sports events at city** — needs Starter+.

---

## Suggested build order (next 3-6 sprints)

Effort-to-impact ratio, free-tier-only:

1. **Severe weather alerts banner** — P0, S, safety win
2. **Hourly rain probability bars** — P0, S, universally useful
3. **Natural language daily summary** — P1, M, biggest delight win
4. **Moon phase card** — P0, M, free data on the table
5. **"What should I wear?" hint** — P1, S, differentiator
6. **Compared to yesterday badge** — P1, M, one new endpoint
7. **Tomorrow drill-down** — P0, M, depth without more API calls
8. **Dewpoint pill** — P0, S, small but premium
9. **Precipitation timeline** — P1, M, the Dark Sky echo
10. **Condition code coverage fix** — P2, S, engineering hygiene
11. **Golden hour overlay** — P1, S, photographer love
12. **Marine mode** — P1, L, conditional on coastal users
