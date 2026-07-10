# Decision Log

ADR-lite. Newest first. Each entry: **Context → Decision → Rationale → Status**.
Keep entries short; link to code/`CLAUDE.md` for detail.

---

## 2026-07-10 — v1.6.0 UI/UX: dark-dark background, accent-fill contrast token, touch dock

- **Context:** A run of UX passes on top of the multi-vendor + detail-page work. Three calls were
  non-obvious enough to record so they aren't re-litigated.
- **Decision:**
  1. **Background stays dark-dark.** The mood/solar-driven "living sky" backdrop was built, then
     **reverted** to a single fixed **corner accent glow** over a solid `--bg` (`--backdrop-glow`,
     both themes). Weather expressiveness lives in the **particle layer** + accent tokens, not the
     backdrop. (See [`dynamic-weather.md`](dynamic-weather.md).)
  2. **Accent-fill contrast token `--on-accent`.** Filled `--ui-accent` controls must use
     `color: var(--on-accent)` (near-black in dark theme, white in light) — never hardcoded
     `#fff`. Light-theme control *fills* are darkened (teal/amber/blue) so white text passes
     WCAG-AA. White-on-bright-accent was a real contrast failure.
  3. **Touch dock = long-press action sheet.** On coarse pointers the inline pin/✕ are hidden;
     press-and-hold a dock pill opens a bottom sheet (Pin/Remove) with a persistent ✕ + one-time
     hint. Swipe was rejected (conflicts with the dock's horizontal scroll).
  - Also: single-line header (wordmark dropped → search fills the line), empty state became the
    brand/onboarding moment (raster app icon + wordmark + chips), hero card elevated with a
    mood-accent gradient rim, detail heroes de-duplicated ("At a Glance" is the single narrative),
    and active list/scale rows use a **background tint, never an accent left-stripe**.
- **Rationale:** The user consistently wanted restraint (proper dark mode, no colored washes) and
  legibility; a paired `--on-accent` token is the systemic fix for contrast; long-press is the
  best-practice touch pattern for a horizontal dock.
- **Status:** ✅ Done (v1.6.0) — verified via Playwright screenshots. See `CLAUDE.md` +
  [`TRACKER.md`](TRACKER.md) done log.

## 2026-07-10 — PWA: dev SW on, Settings-only install UI, richer manifest

- **Context:** The address-bar install icon never appeared. Root cause: `vite-plugin-pwa`
  disables the service worker in dev, so `localhost` failed the "registered SW" install
  criterion; the manifest was also minimal (no maskable icon, shortcuts, or screenshots) and
  there was no in-app install/update affordance.
- **Decision:** Turn the SW on in dev (`devOptions.enabled: true`). Complete the manifest
  (`id`, `lang`, `dir`, `categories`, `display_override`, a **padded maskable** icon, app
  **shortcuts** `?action=locate|search`, and **screenshots** narrow+wide). Add `usePWA`
  (captures `beforeinstallprompt`) and drive install **only from Settings → Install** — no
  header button, no auto-banner. Show SW update/offline state via `useRegisterSW`
  (`virtual:pwa-register/react`, needs `workbox-window`). Ship `public/_headers` for
  SW/manifest `no-cache` + MIME + immutable `/assets`. **No `share_target`.**
- **Rationale:** `devOptions` is the actual fix for the missing icon and lets us verify
  installability locally. Settings-only keeps the header uncluttered and trusts the browser's
  native install icon for discovery (user preference). A maskable icon prevents mask clipping;
  screenshots upgrade Chrome's install dialog. Skipping `share_target` avoids inbound-routing
  complexity Nimbus doesn't need (it's a share *source*).
- **Status:** ✅ Done — see [`pwa.md`](pwa.md) and `CLAUDE.md` → PWA.

## 2026-07-01 — Provider selection moved client-side + per-provider capability descriptors

- **Context:** The provider was fixed server-side (`WEATHER_PROVIDER` env) with a single generic
  `WEATHER_API_KEY`. We want the client to swap providers at runtime (future selector) and each
  provider to declare its own requirements so the app/tests can tell which are usable.
- **Decision:** Each adapter exports a `meta` descriptor (`{id,label,keyRequired,keyEnvVar,...}`) that
  stores the key's **env-var name, never the value**. The registry derives `DEFAULT_PROVIDER`
  (`open-meteo`), `resolveKey`, `isAvailable`, and `listProviders` from it. Provider is now **client
  input**: stored in `localStorage` (default open-meteo), sent as `?provider=`, validated server-side
  (unknown → 400; key-required-but-unconfigured → 400). `GET /api/providers` exposes the capability
  list (`{id,label,keyRequired,available}` — no keys) for the future selector; the client self-heals a
  stale/unavailable choice against it. WeatherAPI key renamed `WEATHER_API_KEY` → `WEATHERAPI_KEY`
  (legacy read as fallback). `WEATHER_PROVIDER` env removed; `server/config.js` now only exports `port`.
- **Rationale:** Self-describing providers make the selector, the "which providers work here" startup
  log, and the test matrix fall out for free. Keeping keys as env-var *names* (resolved at runtime)
  keeps secrets out of any serialized/logged structure and out of the client payload. Treating the
  query param as untrusted input is basic hardening.
- **Update (same day):** the settings selector UI shipped — `SettingsPanel` → Data provider; switching
  background-refreshes every saved city and migrates cross-provider location keys.
- **Deferred:** cache-keying by provider — `getCached`/`partitionCities` now treat a different-provider
  entry as a miss (so stale cross-provider data is never shown) and switch-time migration re-keys, but a
  cold load can still briefly serve the prior provider's values before the refresh lands. Namespacing the
  cache key by provider would close that gap.
- **Status:** ✅ Done (backend + client plumbing + selector UI + tests).

## 2026-07-01 — Multi-vendor weather via a server-side adapter + neutral schema

- **Context:** The app was hardwired to WeatherAPI.com — the route returned its raw JSON and the
  entire frontend (~15 files) read that vendor's shape directly. We wanted to swap providers
  (starting with keyless Open-Meteo) and add more later (AccuWeather, etc.) without rewriting the
  UI each time.
- **Decision:** Add `WEATHER_PROVIDER` (`server/config.js`, `.env.example`) selecting a
  server-side **adapter** (`server/adapters/{weatherapi,open-meteo}.js`, registry `index.js`,
  helpers `_shared/`). Every adapter returns one **fresh vendor-neutral schema** (contract in
  `adapters/README.md`) — renamed keys (`current_weather`-style: `temp.{c,f}`, `feels_like`,
  `wind.{speed_kph,dir,degree,gust_kph}`, `daily[]`, `alerts[]`, `condition.id`, `epa_index`).
  The frontend was rewritten to consume the neutral keys. Chose a **fresh** schema over
  "reuse WeatherAPI's shape" deliberately (user call) — more frontend churn now, but no vendor's
  naming leaks into the UI. `condition.id` is seeded from WeatherAPI's code numbers so the
  Meteocons icon/mood tables (`weatherIcon.js`/`weatherMood.js`) work unchanged; other vendors
  translate into it. Both Express and Netlify import the **same** CommonJS registry (Node global
  `fetch`, no build step), retiring the hand-mirror rule.
- **Rationale:** An anti-corruption layer keeps the UI provider-agnostic; adding a vendor =
  one new adapter file. Open-Meteo gaps are absorbed in its adapter (WMO→id, deg→compass,
  ISO→"h:mm AM", us_aqi→EPA 1–6, `alerts:[]`, BigDataCloud reverse-geocoding for `lat,lon`
  names, `icon_url:""` → ShareCard falls back to bundled Meteocons). Geocoding autocomplete
  stays client-direct Open-Meteo (unchanged).
- **Status:** ✅ Done. Verified both providers through the live Express route (name + `lat,lon`
  queries) and a production build.

## 2026-06-13 — Knowledge base reorg: one tracker, many knowledge files

- **Context:** Tracking was spread across three files (`ROADMAP.md` backlog, `docs/STATUS.md`
  status/done, `docs/DYNAMIC_WEATHER_PLAN.md` checklists). Status drifted between them and
  links were inconsistent.
- **Decision:** Split **tracking** (one file) from **knowledge** (many). All status/backlog/
  done/checkboxes live in **`docs/TRACKER.md`** only. Knowledge base = `DECISIONS.md` (why),
  `dynamic-weather.md` (design spec), `particles.md` (moved from root
  `WEATHER_PARTICLES_GUIDE.md`), `weatherapi.md` (provider reference), `dev-workflow.md` (run +
  verify), `README.md` (map + protocol). Deleted `ROADMAP.md`, `docs/STATUS.md`,
  `docs/DYNAMIC_WEATHER_PLAN.md` (content migrated). Updated all cross-links + `CLAUDE.md`.
- **Rationale:** A single tracker can't drift against itself; knowledge files stay focused and
  linkable. `CLAUDE.md` now points sessions at `TRACKER.md` first.
- **Status:** ✅ Done.

## 2026-06-13 — Number animation: animate on change, not count-from-zero

- **Context:** The hero temperature (and feels/AQI/wind) rolled up `0 → value` on every city
  load — `useAnimatedNumber` initialized at 0 and the hero remounts per city (`key={activeCity}`).
  A focal number counting from a value it never had read as a gimmick.
- **Decision:** Initialize the hook **from the target** so first mount shows the real value
  instantly (the CSS `tempReveal` carries the entrance); animate **only when the value changes
  while mounted** (°C↔°F toggle, refresh delta). Also `800→550 ms` and ease-in-out-quartic →
  **ease-out cubic** (reads immediately, settles softly).
- **Rationale:** Keeps the *meaningful* motion (unit/refresh deltas), drops the gimmicky
  count-from-0. Verified: instant on load; `25→…→77` on toggle.
- **Status:** ✅ Done. (`hooks/useAnimatedNumber.js`.)

## 2026-06-13 — Dynamic weather direction: night-as-modifier, accent split, CSS ceiling

- **Context:** PM audit of the accent + particle systems found the "dynamic" weather is naive:
  night collapses all weather to one purple "night" mood (clear night == storm night,
  verified by screenshot), intensity is ignored (drizzle == downpour), the background is frozen,
  and the accent doubles as both mood color and UI control color. Full audit in
  [`dynamic-weather.md`](dynamic-weather.md).
- **Decision (3 forks, with the user):** (1) **CSS-only ceiling** — no canvas/WebGL; push CSS
  (precip streaks, parallax, wind angle, transform-only motion) instead. (2) **Structural
  fixes first (M1)** before the full reframe. (3) **Decouple `--mood-accent` (decorative) from
  `--ui-accent` (controls, WCAG-AA on glass)** now.
- **Rationale:** Highest correctness-per-effort, respects the perf pass, fixes a real a11y
  risk (pale moods → illegible controls). M1 is all CSS/JS, low risk.
- **Status:** ⏳ Planned — tasks in [`TRACKER.md`](TRACKER.md); spec in `dynamic-weather.md`.

## 2026-06-13 — Performance pass: kill ambient animation, halve backdrop blur, cap particles, drop entry-blur

- **Symptom:** Visible shimmer near the hero and behind it. Audit traced it to a perpetually-animated 3-layer radial gradient (`body::before`, 45s scale+translate cycle) underneath universal `backdrop-filter: blur(40px)` glass cards. Each frame the browser had to re-rasterize the blurred backdrop, landing at slightly different subpixel positions → shimmer.
- **Decision (Plan B + remove ambient + cap particles):**
  1. **Removed the `@keyframes ambient` animation entirely.** The 3-layer gradient stays static (mood color changes still happen via `--ambient-*` swaps). Single biggest GPU win.
  2. **`--blur: 40px → 24px`** on cards; dock from 48px → 28px. Still reads as glass at a fraction of the GPU cost per frame.
  3. **Removed `filter: blur(N)` from entry keyframes** (`blurIn`, `revealUp`, `tempReveal`). Replaced with pure transform + opacity. Visually indistinguishable to humans; cheap for the compositor.
  4. **Removed `filter: drop-shadow(...)` from three icon selectors** (`.current-condition img`, `.hourly-icon`, `.forecast-icon`). Meteocons have built-in soft edges; the shadows were barely visible against the glass.
  5. **Capped WeatherParticles counts by ~40%**: clear 14→10, night 30→18, cloudy 22→14, rainy 35→20, snowy 25→16, stormy 45→26. Visual density on-screen is essentially identical; GPU work roughly halved.
  6. **Added `will-change: transform` to base `.particle`** so the compositor promotes them to GPU layers — particles passing behind glass no longer force backdrop-blur recomputation.
- **What's intentionally preserved:** glassmorphism aesthetic, all six weather mood palettes, WeatherParticles per mood, staggered card-entry animations, hero gradient temp, dock blur (just reduced).
- **What didn't make the cut (and why):** disabling particles on mobile (decided against — they're a brand differentiator and the cap already addresses the cost), `contain: paint` on cards (Plan C; not needed once ambient is static + particles are GPU-layered).
- **Status:** ✅ Done.

## 2026-06-13 — City autocomplete moved to Open-Meteo geocoding (browser-direct, proxy killed)

- **Context:** WeatherAPI's `search.json` returned a narrow set of matches and missed many real places (e.g. searching "Gopalpur" returned 1–2 entries; "Tokyo" returned only the obvious Japanese one). The user surfaced [Open-Meteo's geocoding API](https://geocoding-api.open-meteo.com/v1/search) as a much richer alternative (GeoNames-backed).
- **Verification:** Live test of `Gopalpur` returned 5 distinct cities across India (Odisha + West Bengal), Pakistan (×2), and Bangladesh. `Tokyo` returned matches in Japan, Papua New Guinea, Nepal, South Korea (fuzzy), and Niigata. Far better disambiguation. Response includes `admin1`–`admin4`, `population`, `timezone`, `country_code` — way more than WeatherAPI exposed.
- **Decision:**
  1. **Swap autocomplete to Open-Meteo.** `client/components/SearchBar.jsx` now calls `https://geocoding-api.open-meteo.com/v1/search?name=…&count=5&language=en&format=json` directly. Results normalized at the fetch boundary (`latitude/longitude/admin1` → `lat/lon/region`) so App.jsx, the cache, and `handleSelectPlace` stay untouched.
  2. **Killed the search proxy entirely.** Open-Meteo is keyless and returns `access-control-allow-origin: *`, so there is no reason to proxy. Removed:
     - the `/api/search` route in `server/routes/weather.js`
     - `netlify/functions/search.js` (file deleted)
     - the `/api/search` redirect in `netlify.toml`
  3. **`/api/weather` proxy stays** — that route still hides a real API key.
- **Rationale:** Better data + simpler architecture + one less Netlify function to keep in sync = a net win. The old proxy existed only because WeatherAPI required a key; Open-Meteo doesn't.
- **Free-tier limits:** 600/min, 5,000/hour, 10,000/day, 300,000/month. Debounce (300ms) + in-memory `Map` cache in SearchBar means a power user could type for hours without crossing 100 calls. Quota is a non-issue.
- **Trade-off:** Open-Meteo non-commercial use is CC-BY 4.0 — credit is required. Resolved 2026-06-13: a `.search-attribution` footer row in the autocomplete dropdown links Open-Meteo + the CC-BY 4.0 license.
- **Status:** ✅ Done.

## 2026-06-13 — Auto-add saved cities + pinnable dock, share moves to header

- **Context:** The bookmark/save button was a friction tap ("is this worth saving?") that doubled up with the share button in the hero top-right. Plain FIFO recents would have killed the friction but broken the #1 use case for any weather app — keeping your home/work/family cities forever.
- **Decision:**
  1. **Auto-add on search.** Every successful `handleSearch` calls a new `upsertCity(key, data)` helper that ensures the city is in `savedCities`. Cache misses, SWR hits, and fresh hits all funnel through it.
  2. **FIFO eviction at cap 5, oldest-unpinned-first.** When at cap, the first non-pinned entry is evicted (cache pruned via `removeCache`). If all 5 are pinned, the new city is silently skipped — no toast for now.
  3. **Pin toggle on dock pills.** Each dock pill has a bookmark glyph (outlined = unpinned, filled accent = pinned). Click toggles `pinned: boolean` on the saved-city entry. Pin is faint by default, brightens on hover, accent when pinned.
  4. **Migration:** legacy `savedCities` entries (strings or objects without `pinned`) are coerced to `pinned: true` on read — they were explicitly saved under the old model, so they earned the pin.
  5. **Save button removed** from `CurrentWeather`. **Share button moved** to `.header-actions` (next to refresh/°C/theme) and restyled to match the 36px circular header buttons. Hero top-right is now empty.
  6. **Polish round (same day):**
     - Removed the `.forecast-row.is-today::before` accent stripe — it sat outside the rounded rect at `left: -0.5rem` and looked detached. The `--accent-soft` background alone differentiates today.
     - `.forecast-list` switched from `border-top` dividers to `gap: 0.25rem`; rows widened their radius to 14px. The rounded today rect no longer collides with sibling divider lines.
     - Removed the Meteocon `<img>` from each `.sun-label` endpoint. The two icons (`sunrise.svg`, `sunset.svg`) are nearly indistinguishable at 22px and added no info now that text labels disambiguate. Headline icon (single, no comparison) is kept.
- **Rationale:** Auto-add captures the right user intent (looking it up = caring at least a little). The pin restores explicit user control for permanent cities — closes the "Tokyo evicted my mom's Albuquerque" failure mode. Moving share into header chrome is consistent with its role (a session action, not a hero action) and frees the hero top-right entirely. The polish fixes are the kind of thing only visible once the bigger pieces land.
- **Trade-offs accepted:** If a user fills all 5 slots with pins, new searches don't enter the dock (no UI feedback). Acceptable for now — power users in that state are aware of what they're doing.
- **Status:** ✅ Done.

## 2026-06-12 — 3-Day Forecast overhaul + sun-dot pulse removed

- **Context:** The 3-day Forecast was the plainest card on the page (just `Day · icon · condition · hi lo`) and didn't make use of the rich daily aggregates `forecast.json` already returns. Separately, the `.sun-dot-glow` element on the sun timeline was a perpetually pulsating decoration that competed for attention without conveying data.
- **Decisions:**
  1. **Restructured `Forecast.jsx` rows** into a richer layout: date subtitle ("Today · JUN 12"), conditional chips (precip% when ≥30, max wind kph when ≥25, UV when ≥6, snow cm when >0), and a **temperature range bar** scaled to the global 3-day min/max — Apple Weather pattern, instant visual comparison.
  2. **Today row gets an accent treatment** — soft accent background + 3px accent left stripe with a glow. Subtle enough to not shout, distinct enough to anchor "now".
  3. **Removed `.sun-dot-glow`** and the `sunPulse` keyframes. The dot's static `box-shadow: 0 0 16px var(--accent-glow)` was already enough visual presence.
- **Rationale:** The Forecast section was wasting screen estate — three near-identical rows with minimal info, while the API returns max wind, total snow, daily precip chance, UV, etc. for free on every call. The range bar in particular adds at-a-glance comparison ("Sat will be cooler") that bare numbers don't. Removing the pulse calms a card that no longer needs to compete for attention now that it lives alone.
- **Implementation note:** Range bar is computed inside `Forecast.jsx` from `Math.min/max` across all visible days — minimum 6% width so even a single-degree day stays visible. Chips render only when their threshold is met — empty days stay clean.
- **Status:** ✅ Done.

## 2026-06-12 — H/L → arrow icons, sunrise/sunset labels disambiguated, ROADMAP grounded in free-tier reality

- **Context:** Two icon issues + a roadmap audit:
  1. The `H` / `L` text labels in `current-stats` competed with the temperature numbers and added textual noise next to the elegant "FEELS" element.
  2. The sunrise and sunset Meteocons (`/wx/sunrise.svg`, `/wx/sunset.svg`) are nearly indistinguishable at 16px — the only signal was the icon, no text label.
  3. The previous `ROADMAP.md` had items (e.g. "7-10 day forecast") that aren't actually free on WeatherAPI.com.
- **Decisions:**
  1. Swap `H` / `L` for inline thin-stroke up/down arrow SVGs (1.75 stroke, 11×11px, `currentColor` from `--text-3`). Keeps "FEELS" as text since it has no obvious icon and is the accent element.
  2. Restructure each sun endpoint to show a 22px Meteocon paired with a stacked uppercase label ("SUNSET") + time ("06:21 PM") in display font. Left endpoint is icon-then-text, right endpoint is text-then-icon (visually mirrored).
  3. Rewrite `ROADMAP.md` from scratch grounded in a verified [pricing page](https://www.weatherapi.com/pricing.aspx) + [docs](https://www.weatherapi.com/docs/) audit. Organized as: P0 (data already fetched, UI missing), P1 (one extra free call OR smart logic over existing data), P2 (engineering + power-user), and explicitly flagged paid-only items so future work doesn't quietly assume they're free.
- **Rationale:** Arrows are universally readable for hi/lo and remove visual collision with the numbers. The sunrise/sunset text label removes ambiguity that an icon alone couldn't. The roadmap rewrite prevents future scope creep into paid features.
- **Key finding from API audit:** `forecast.json` already returns 14 fields we never display (`dewpoint_c/f`, `cloud`, `vis_km` per hour, `windchill_c/f`, `heatindex_c/f` per hour, `snow_cm`, `moon_phase`, `moon_illumination`, `is_moon_up`, etc.) — most P0 items are pure UI work. Also confirmed: alerts are FREE via `alerts=yes` on the existing forecast call (no new endpoint needed), and 1-day history is FREE (enables "vs yesterday" feature).
- **Status:** ✅ Done (icons + roadmap). Implementation of roadmap items is separate.

## 2026-06-12 — Hero resize + sun timeline extracted to its own card

- **Context:** Current-weather hero was eating the entire above-the-fold across breakpoints. Temp clamp was `clamp(8rem, 28vw, 14rem)` (≈218–224px on iPad/desktop), padding was `3rem 2rem 2.5rem`, and the sun timeline lived *inside* the hero card — total card height ≈720–760px on desktop, leaving no room for `WeatherDetails` or `HourlyForecast` on first scroll on iPad/laptop.
- **Decision:**
  - Trim hero: padding → `2rem 1.75rem 1.75rem`; temp clamp → `clamp(6rem, 22vw, 10.5rem)` (~96px mobile → ~168px desktop); tighten internal margins (temp-group 2rem→1.25rem; condition 1.25rem→0.875rem; stats 1.5rem→1rem; accent-divider gap 1.5rem→0.875rem).
  - Extract `SunriseSunset` out of `CurrentWeather` — render it as its own glass card sibling in `App.jsx`. `.sun-timeline` now carries the full glass-card styling (background/blur/border/radius/padding/shadow) instead of `border-top` inside the hero.
  - Kept `.shell` max-width at 780px (no layout/two-column restructure).
- **Rationale:** Modern weather apps (Apple, Carrot, Pixel) sit around 110–160px hero temp; 218px was visually heavy and starved the rest of the screen. Splitting the sun widget is a free height win because it was already a self-contained unit with its own `border-top` divider. Verified at 390×844 / 768×1024 / 1280×800 — pills now above-the-fold on iPad+ and visible on mobile.
- **Status:** ✅ Done.

## 2026-06-12 — Weather icons → Meteocons (animated SMIL SVG)

- **Context:** Condition icons were WeatherAPI CDN raster PNGs (`//cdn.weatherapi.com/weather/64x64/...`) — soft when scaled, fixed color, stylistically clashing with the crisp inline-SVG UI icons. The single weakest visual element.
- **Decision:** Replace with **Meteocons** (Bas Milius), the **animated** fill SVGs (native SMIL — sun rotates, rain falls, bolts flash), bundled locally and mapped from WeatherAPI `code` + `is_day`. Rendered via `<img src>`, through which SMIL animation still plays (CSS/JS-driven SVG would not). Correction (2026-06-13): earlier called "static" here — they animate.
- **Rationale:** MIT-licensed, premium look, day/night variants, crisp vector, theme-independent color, removes a CDN dependency (better offline/PWA).
- **Source (verified):** `https://cdn.jsdelivr.net/npm/@bybas/weather-icons@2.0.0/production/fill/all/{name}.svg`. (Note: `gh/basmilius/...` and `production/fill/svg/` paths 404 — use `@bybas` + `production/fill/all/`.)
- **Status:** ✅ Done.

## 2026-06-12 — Sun timeline: full day/night redesign

- **Context:** `SunriseSunset` only ever showed today's sunrise→sunset and hid its dot at night, so at night it was a dead, meaningless bar. No "time until" info.
- **Decision:** Three windows (pre-dawn / daytime / after-sunset), use tomorrow's `forecast.forecastday[1].astro` for next sunrise, add a countdown headline ("Sunrise in 6h 40m") + daylight duration, moon at night.
- **Rationale:** Turns a decorative bar into a useful "what's next" widget; surfaces data we already fetch.
- **Status:** ✅ Done.

## 2026-06-12 — Search bar moved into the header

- **Context:** Search lived as the first element in `<main>`, costing a full row of vertical space above the content.
- **Decision:** Move `<SearchBar>` into `.header` between brand and actions. Desktop: `brand | search(flex:1) | actions`. Mobile (≤480px): header `flex-wrap`, search drops to a full-width second row via `order`.
- **Rationale:** More screen estate for the hero/content; search is a primary action and belongs in the chrome.
- **Gotcha:** `.header` has `backdrop-filter` (its own stacking context); added `position:relative; z-index:10` so the autocomplete dropdown overlays `.main` instead of painting behind it.
- **Status:** ✅ Done.

## 2026-06-12 — Hero "Refined Centered" revamp + body font

- **Context:** The current-weather hero was a conventional centered stack; the `°` was full-size inline; no high/low shown. Body font was Inter (generic).
- **Decision:** Keep center symmetry but elevate: **superscript degree**, an **H / FEELS / L** metadata row (H/L from `forecast.forecastday[0].day`), a refined glass condition chip, grid-aligned spacing. Swap body font to **Hanken Grotesk** (kept Space Grotesk for display).
- **Degree gotcha (fixed):** The `°` must NOT be inside the gradient `background-clip:text` element — with `line-height < 1` its rounded top falls outside the gradient paint box and clips (looked like a "c"). Fix: `.current-temp-value` carries the gradient; `.current-temp-deg` is a **solid accent** glyph outside the clip.
- **Rationale:** Adds real info density (H/L) and a premium feel without breaking coherence with the centered cards below. Hanken Grotesk reads warmer/more characterful than Inter at small sizes.
- **Status:** ✅ Done. (ShareCard inline font vars updated to match.)

## 2026-06-12 — Location identity keying (anti-collision)

- **Context:** Cache and `savedCities` were keyed by bare city **name**, so two same-named cities (e.g. multiple "Gopalpur"s, London UK vs London ON) collided/overwrote each other.
- **Decision:** Key everything by `getLocationKey(location)` = `name|region|country` (lowercased). `savedCities` is now `{ key, name, region, country, lat, lon, query }[]`; cache + `savedWeather` keyed by `key`. A separate `weatherAlias` localStorage map records `query→key` so repeat text/coord searches still hit cache (the key isn't known until the response arrives). Legacy `string[]` saved cities migrate to `{ key:null, name, query }` and resolve on first fetch (matched by object identity in the mount effect).
- **Rationale:** Correctness — distinct places must not share state. Alias map preserves the existing zero-API-call repeat-search optimization.
- **Status:** ✅ Done. See `CLAUDE.md` → "Location identity".

## 2026-06-12 — City autocomplete via WeatherAPI `search.json`

- **Context:** Search was a blind text box; same-named cities were indistinguishable.
- **Decision:** Add `/api/search` proxy (Express + Netlify fn) over WeatherAPI's free `search.json`. `SearchBar` is a debounced combobox (300ms, min 2 chars) with an in-memory `Map` cache, `AbortController` for stale requests, ↑/↓/Enter/Esc nav, and up to 5 results showing `Name · Region · Country`. Selecting resolves by `lat,lon` for precision.
- **Rationale:** Uses a free, previously-unused API capability; debounce + cache keep quota usage negligible.
- **Status:** ✅ Done.

---

## Standing decisions (pre-existing, for reference)

- **Caching:** localStorage, 15-min TTL, stale-while-revalidate, quota-aware pruning (`utils/weatherCache.js`).
- **Design system "Radiant":** dual-layer theming — `data-theme` (dark/light) × `data-mood` (6 weather moods) remap `--accent`, `--ambient-*`, `--temp-gradient`. Glassmorphism throughout. (`CLAUDE.md` → Theming.)
- **Deployment:** Netlify; `netlify/functions/{weather,providers}.js` `require()` the **same** `server/adapters/` registry as the Express routes — no hand-mirrored fetch logic (add/patch vendors in `server/adapters/` only).
- **API / providers:** multi-vendor via the adapter registry. Default is **Open-Meteo** (keyless: forecast + air-quality merged, 7-day). **WeatherAPI.com** (free tier ~1M/mo, 3-day, one `forecast.json?days=3&aqi=yes&alerts=yes` call) is optional (needs `WEATHERAPI_KEY`). Provider is a client setting sent as `?provider=`.
