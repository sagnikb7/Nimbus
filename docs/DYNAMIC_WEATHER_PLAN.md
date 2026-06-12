# Dynamic Weather System — Plan

_Created 2026-06-13. Owner: design/eng. Source: PM audit of the accent + particle systems._

The goal: evolve Nimbus from **6 discrete moods** into a **continuous, data-driven
atmosphere** — award-winning-feeling, but built **CSS-only** (no canvas/WebGL) and
within the perf budget the perf-pass established.

## Decisions (finalized 2026-06-13)

1. **Rendering ceiling — push CSS to its ceiling.** No canvas/WebGL. We may break the
   "circles only" rule for precipitation (elongated streaks), add 2–3 parallax depth
   layers, drive particle angle from wind, and restore *transform-only* motion. This
   **supersedes** parts of `WEATHER_PARTICLES_GUIDE.md` — that guide must be amended in M2.
2. **First milestone = structural fixes** (correctness), not the full reframe. Ship M1,
   then reassess.
3. **Decouple accent now** — `--mood-accent` (decorative) vs `--ui-accent` (controls,
   WCAG-AA on glass). Pale moods must not produce illegible buttons/focus rings.

## Current state (what we're fixing)

`getWeatherMood(code, isDay)` → one of `clear · night · cloudy · rainy · snowy · stormy`.
That one string drives `--accent`, `--ambient-1/2/3`, `--temp-gradient`, and the particle
layer. Everything else we fetch (`precip_mm`, `chance_of_rain`, `wind_kph`, `wind_degree`,
`cloud`, `temp_c`, time-of-day) is **unused** for visuals.

### Findings (prioritized)

- 🔴 **Night erases weather.** `if (!isDay) return 'night'` — a clear night and a night
  thunderstorm render pixel-identical (verified by screenshot). ~Half of every day has
  zero weather differentiation.
- 🔴 **No intensity.** Light drizzle and a downpour are the same 20 dots at the same speed.
- 🔴 **Discrete, not continuous.** Can't represent "golden-hour, breezy, light rain."
- 🟠 **Background is frozen** within a city (perf pass killed the animation); dynamism only
  shows when switching cities, which users rarely do.
- 🟠 **Uncoordinated transitions** — body bg `0.6s`, ambient `2.5s`, particles hard-cut `0s`.
- 🟠 **Particles read as abstract dots**, not weather (no streaks, depth, or wind angle).
- 🟠 **No temperature in color** — hot and cold clear days are both amber.
- 🟡 **Accent overloaded** — mood color == UI control color; pale moods → low contrast.
- 🟡 **Day/night is 1 bit** — no dawn / golden hour / dusk / deep-night.
- 🟡 **Guide is stale** — documents counts `14/30/22/35/25/45`; code runs `10/18/14/20/16/26`.

---

## Milestone 1 — Structural correctness (CSS/JS only, low risk)

Decouple the model so weather, intensity, wind, and lighting are independent inputs.

- [ ] **M1.1 — Night becomes a modifier, not a mood.** Refactor `getWeatherMood` (or add
  `getAtmosphere`) to return the **weather** mood from `code` *regardless of day/night*,
  plus a separate **lighting** value. Set `data-mood` = weather + `data-period` = day/night
  on `<html>`. *Files: `utils/weatherMood.js`, `App.jsx`.*
- [ ] **M1.2 — Night-variant palettes.** For each weather mood, define a darkened/desaturated
  `[data-period="night"]` variant of `--ambient-*`, `--mood-accent`, `--temp-gradient`, and
  give particles a night treatment. Retire the standalone purple "night" palette. *Files: `App.css`.*
- [ ] **M1.3 — Intensity tiers.** Derive `light | moderate | heavy` from condition code +
  `precip_mm` / `chance_of_rain`, exposed as `data-intensity` (or a numeric CSS var). Scale
  particle **count, speed, and opacity** off it (drizzle ≠ downpour). *Files: `weatherMood.js`/new util, `WeatherParticles.jsx`, `App.css`.*
- [ ] **M1.4 — Wind-driven particle angle + speed.** Map `wind_degree` → a `--wind-angle` CSS
  var and `wind_kph` → a speed multiplier; precipitation falls at an angle and faster in wind.
  *Files: `App.jsx` (set vars), `WeatherParticles.jsx`/`App.css` (consume).*
- [ ] **M1.5 — Choreographed transitions.** Unify the timing system so accent, ambient, and
  particles transition together on city change; cross-fade particles instead of hard-cutting
  (e.g. fade the `.weather-particles` layer on mood change). *Files: `App.css`, `WeatherParticles.jsx`.*
- [ ] **M1.6 — Decouple accent.** Introduce `--ui-accent` (controls/focus, contrast-guarded)
  separate from `--mood-accent` (decorative). Repoint buttons, focus rings, links, and
  interactive borders to `--ui-accent`. Verify WCAG-AA on glass for every mood, both themes.
  *Files: `App.css` + every component using `var(--accent)` for an interactive element.*

**M1 exit check:** night storm ≠ night clear; drizzle ≠ downpour; particles lean with wind;
city switches feel choreographed; controls legible in all 6 moods × 2 themes (verify via the
forced-mood screenshot recipe in `STATUS.md`).

## Milestone 2 — Push CSS to its ceiling (the "wow", still no canvas)

Requires **amending `WEATHER_PARTICLES_GUIDE.md`** (lift "circles only" for precip; keep
"no canvas/SVG"). Reassess scope after M1.

- [ ] **M2.1 — Streak-shaped precipitation.** Allow elongated rain/storm elements (thin,
  motion-blurred), keeping snow round. Update the guide's hard rules accordingly.
- [ ] **M2.2 — Parallax depth.** 2–3 particle layers at different speeds/sizes/opacities for
  a sense of depth (foreground fast/large, background slow/faint).
- [ ] **M2.3 — Restored ambient motion (perf-safe).** Bring subtle life back to the
  background using **transform-only**, GPU-promoted motion that does *not* force
  `backdrop-filter` re-rasterization (the original sin the perf pass fixed).
- [ ] **M2.4 — Temperature tint.** A warm↔cool overlay driven by `temp_c`, applied
  independently of condition (hot clear ≠ cold clear).
- [ ] **M2.5 — Continuous time-of-day sky.** Replace the day/night boolean with a gradient
  driven by solar position (dawn → day → golden hour → dusk → night), using the
  sunrise/sunset data we already have.

## Hygiene (do alongside)

- [x] **H.1 — Update `WEATHER_PARTICLES_GUIDE.md`** — done (2026-06-13): stale counts corrected
  (now match code), supersession banner added, and the "circles only" / "no rotation" hard rules
  pre-amended to allow precip streaks + wind-angle rotation (no-canvas/SVG boundary kept). Code
  stays all-circles until M2 implements the streaks.
- [ ] **H.2 — Log a `DECISIONS.md` entry** for the night-as-modifier model and the
  `--mood-accent` / `--ui-accent` split.

## Explicitly out of scope

- Canvas / WebGL rendering (decided against — CSS ceiling only).
- 3D / map-based hero visuals.
