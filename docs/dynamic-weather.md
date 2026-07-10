# Dynamic Weather System — Design Spec

_Audit + vision + decisions for the accent/particle/atmosphere system. The **checklist and
status** for this work live in [`TRACKER.md`](TRACKER.md) under "Dynamic weather"; this file
is the durable **why and what**._

The goal: evolve Nimbus from **6 discrete moods** into a **continuous, data-driven
atmosphere** — award-winning-feeling, **CSS-only** (no canvas/WebGL), within the perf budget
the [perf pass](DECISIONS.md) established.

## ✅ Shipped (2026-07-10), then simplified — what actually landed

The **particle + structural** half of the revamp landed and stuck. The "living sky" backdrop
was built, disliked in review ("dark mode should feel proper dark-dark, not colored"), and
**reverted** in favor of a deliberately plain background.

What's live:
- **Background = one subtle corner glow.** Solid `--bg` + a single fixed-violet `--backdrop-glow`
  radial bleeding from the top-left (`body::before`). Not mood/time driven, no animation. Dark
  theme reads dark-dark; light theme stays clean. (The time-of-day sky, `--sky-*`,
  `getSkyGradient`, and the `body::after` weather layer were all removed. The per-mood
  `--ambient-*` tokens are now unused legacy.)
- **Night is a lighting modifier, not a mood** — `getWeatherMood(code)` returns weather only
  (`clear|cloudy|rainy|snowy|stormy`); day/night is `data-period` from `is_day`. The old
  `if(!isDay) return 'night'` bug and the standalone `night` mood palette are gone.
- **Precipitation is real** — `data-intensity` (`light|moderate|heavy` from `precip_mm` /
  `chance_of_rain`, storms ≥ moderate) scales particle count/speed/opacity; **wind lean** via
  `--wind-tilt` (wind direction + speed → screen tilt). Rain/storm are **elongated streaks**;
  snow stays round with a gentler lean. Lightning is a soft **top sky-glow**, not a full-screen
  strobe.
- **Decorative particles cut** — clear-day "orbs" and cloudy "fog-circles" removed. Only
  precipitation + **clear-night stars** remain.
- **`--ui-accent` decoupled** from decorative `--accent` — controls/focus/spinners/affordances
  use `--ui-accent` (pale moods override it to a legible tone); decorative color stays `--accent`.

**Not pursued:** the continuous time-of-day sky, parallax depth, temperature tint, unified
transition choreography. The background is intentionally minimal now. The sections below are the
original audit, kept for the *why* — note the "atmosphere engine / living sky" vision there was
**not** adopted.

## Decisions (finalized 2026-06-13)

1. **Rendering ceiling — push CSS to its ceiling.** No canvas/WebGL. We may break "circles
   only" for precipitation (elongated streaks), add 2–3 parallax depth layers, drive particle
   angle from wind, and restore *transform-only* motion. This **supersedes** parts of
   [`particles.md`](particles.md) (already pre-amended there).
2. **First milestone = structural fixes** (correctness), not the full reframe. Ship M1, reassess.
3. **Decouple accent now** — `--mood-accent` (decorative) vs `--ui-accent` (controls, WCAG-AA
   on glass). Pale moods must not produce illegible buttons/focus rings.

## Current state (what we're fixing)

`getWeatherMood(code, isDay)` → one of `clear · night · cloudy · rainy · snowy · stormy`.
That one string drives `--accent`, `--ambient-1/2/3`, `--temp-gradient`, and the particle
layer. Everything else we fetch (`precip_mm`, `chance_of_rain`, `wind_kph`, `wind_degree`,
`cloud`, `temp_c`, time-of-day) is **unused** for visuals.

### Findings (prioritized)

- 🔴 **Night erases weather.** `if (!isDay) return 'night'` — a clear night and a night
  thunderstorm render pixel-identical (verified by screenshot). ~Half of every day has zero
  weather differentiation.
- 🔴 **No intensity.** Light drizzle and a downpour are the same drops at the same speed.
- 🔴 **Discrete, not continuous.** Can't represent "golden-hour, breezy, light rain."
- 🟠 **Background is frozen** within a city (perf pass killed the animation); dynamism only
  shows when switching cities, which users rarely do.
- 🟠 **Uncoordinated transitions** — body bg `0.6s`, ambient `2.5s`, particles hard-cut `0s`.
- 🟠 **Particles read as abstract dots**, not weather (no streaks, depth, or wind angle).
- 🟠 **No temperature in color** — hot and cold clear days are both amber.
- 🟡 **Accent overloaded** — mood color == UI control color; pale moods → low contrast.
- 🟡 **Day/night is 1 bit** — no dawn / golden hour / dusk / deep-night.

## Vision — from "6 moods" to an atmosphere engine

Decouple into **composable layers driven by real data**, each continuous:

- **Sky / time layer** — gradient from solar position (dawn → day → golden hour → dusk →
  night), not a boolean.
- **Condition layer** — precip *type* + *intensity* scaled by `precip_mm`/`chance_of_rain`;
  cloud density from `cloud %`; fog/haze.
- **Wind** — a global vector that sets particle **angle + speed** (snow shouldn't fall
  straight in a gale).
- **Temperature** — a warm↔cool tint applied *independently* of condition.
- **Lighting (day/night)** — a *modifier multiplied over* the real weather, never a
  replacement for it.
- **Choreography** — one coordinated timeline on city change; one signature centerpiece.

## Milestone specs

The checkboxes for these are in [`TRACKER.md`](TRACKER.md). Detail here.

### M1 — Structural correctness (CSS/JS only, low risk)

- **Night as a modifier, not a mood.** Refactor so `getWeatherMood` (or a new `getAtmosphere`)
  returns the **weather** mood from `code` *regardless of day/night*, plus a separate
  **lighting** value. Set `data-mood` = weather + `data-period` = day/night on `<html>`.
  *Files: `utils/weatherMood.js`, `App.jsx`.*
- **Night-variant palettes.** Per weather mood, define a darkened/desaturated
  `[data-period="night"]` variant of `--ambient-*`, `--mood-accent`, `--temp-gradient`; give
  particles a night treatment. Retire the standalone purple "night" palette. *Files: `App.css`.*
- **Intensity tiers.** Derive `light | moderate | heavy` from code + `precip_mm` /
  `chance_of_rain`, exposed as `data-intensity` (or a numeric CSS var). Scale particle count,
  speed, and opacity. *Files: mood util, `WeatherParticles.jsx`, `App.css`.*
- **Wind-driven particle angle + speed.** Map `wind_degree` → `--wind-angle`, `wind_kph` → a
  speed multiplier; precip falls at an angle and faster in wind. *Files: `App.jsx`,
  `WeatherParticles.jsx`/`App.css`.*
- **Choreographed transitions.** Unify timing so accent, ambient, and particles transition
  together on city change; cross-fade particles instead of hard-cutting. *Files: `App.css`,
  `WeatherParticles.jsx`.*
- **Decouple accent.** `--ui-accent` (controls/focus, contrast-guarded) separate from
  `--mood-accent` (decorative). Repoint interactive elements; verify WCAG-AA on glass for
  every mood × theme. *Files: `App.css` + components using `var(--accent)` for controls.*

**Exit check:** night storm ≠ night clear; drizzle ≠ downpour; particles lean with wind; city
switches feel choreographed; controls legible in all 6 moods × 2 themes (use the forced-mood
recipe in [`dev-workflow.md`](dev-workflow.md)).

### M2 — Push CSS to its ceiling (the "wow", still no canvas)

Requires **amending [`particles.md`](particles.md)** further (the hard rules are already
pre-amended to allow this). Reassess scope after M1.

- **Streak-shaped precipitation** — elongated, motion-blurred rain/storm; snow stays round.
- **Parallax depth** — 2–3 particle layers at different speeds/sizes/opacities.
- **Restored ambient motion (perf-safe)** — transform-only, GPU-promoted, no
  `backdrop-filter` re-rasterization (the original sin the perf pass fixed).
- **Temperature tint** — warm↔cool overlay driven by `temp_c`, independent of condition.
- **Continuous time-of-day sky** — gradient from solar position using sunrise/sunset data.

## Out of scope

Canvas / WebGL rendering · 3D / map-based hero visuals.
