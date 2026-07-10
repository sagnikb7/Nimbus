# Weather Particles Guide

> ⚠️ **Shipped 2026-07-10 — "Living Sky" revamp.** The particle system was cut down and
> reworked. Current truth:
> - **Only two particle families remain:** precipitation (`raindrop`, `storm-drop`, `snowflake`)
>   and **clear-night stars**. The decorative **clear "orbs" and cloudy "fog-circles" were
>   removed** — clear days and cloudy skies show no particles (just the plain background).
> - **Rain & storm are elongated streaks** (height ≫ width, gradient fill) that **lean with wind**
>   via `--wind-tilt`; snow stays a round flake with a gentler lean.
> - **Intensity** (`data-intensity` light/moderate/heavy) scales precip count/speed/opacity.
> - **Lightning** is a soft top-anchored **sky glow**, not a full-screen white strobe.
> - Still firm: **no `<canvas>`, no WebGL, no `<svg>` particles** — everything is styled `<div>`s.
> - The background (a single `--backdrop-glow` corner glow on `body::before`) is **not** a
>   particle (see [`dynamic-weather.md`](dynamic-weather.md)). Component: `WeatherParticles.jsx`.
>
> The per-mood sections further down describe the pre-revamp all-circles implementation and are
> **historical** where they mention orbs/fog or circular rain — trust this banner + the tables
> immediately below for current behavior.

Reference this file before making ANY edits to `client/components/WeatherParticles.jsx` or particle-related CSS in `client/App.css`.

## Architecture

`WeatherParticles.jsx` is a pure CSS particle system. No canvas, no JS animation loops. Each particle is a `<div>` with a CSS class and randomized inline styles. Particles are generated once per mood via `useMemo` and stay stable across re-renders.

### Data flow

```
mood (string) → generateParticles(mood) → array of { type, key, style }
                                            ↓
                                    rendered as <div class="particle {type}" style={...} />
```

### Render path

ALL particle types render through a single path:
```jsx
<div className={`particle ${p.type}`} style={p.style} />
```
No SVGs. No special branches. Every particle is a styled `<div>`.

## Design Philosophy

**Original (still true for ambient particles):** orbs, stars, clouds, and snow use the same
visual language — **soft radial-gradient circles** — achieving variety through motion, speed,
count, and color rather than shape. This keeps the ambient layer cohesive.

**Amended (per [`dynamic-weather.md`](dynamic-weather.md)):** precipitation that should *read as precipitation*
(rain, storm drops) may break from circles into **elongated streaks** and may **lean with the
wind**. Variety now comes from shape *and* motion where it improves legibility of the actual
weather. Intensity (drizzle → downpour) scales count/speed/opacity. The "no canvas / no SVG"
boundary is unchanged.

### Consistent properties across all moods

| Property | Value |
|----------|-------|
| Shape | Circle for ambient particles (`border-radius: 50%`, `width === height`); elongated streak allowed for rain/storm (M2) |
| Color technique | `radial-gradient(circle, rgba(R, G, B, 0.6) 0%, transparent 70%)` |
| Element type | `<div>` — no SVGs, no canvas |
| Animation timing | `linear infinite` |
| `will-change` | `transform` (motion particles) or `opacity` (stationary particles) |
| Border-radius | Set in CSS, never inline |
| Size | Set inline as equal `width` + `height` |
| Positioning | `position: absolute` with inline offsets |

## Mood Color Palette

Each mood's particle color uses the mood accent at 0.6 alpha in a radial gradient:

| Mood | Accent hex | Gradient RGBA | CSS class |
|------|-----------|---------------|-----------|
| clear | `#f59e0b` | `rgba(255, 200, 60, 0.6)` | `.particle.orb` |
| night | `#a78bfa` | `rgba(167, 139, 250, 0.6)` | `.particle.star` |
| cloudy | `#94a3b8` | `rgba(148, 163, 184, 0.6)` | `.particle.cloud-circle` |
| rainy | `#38bdf8` | `rgba(56, 189, 248, 0.6)` | `.particle.raindrop` |
| snowy | `#bae6fd` | `rgba(186, 230, 253, 0.6)` | `.particle.snowflake` |
| stormy | `#c084fc` | `rgba(192, 132, 252, 0.6)` | `.particle.storm-drop` |

## Mood → Particle Mapping

Counts below reflect the **current code** (`WeatherParticles.jsx` is the source of truth — it
was reduced ~40% in the perf pass). Earlier revisions of this guide listed pre-perf-pass
counts (14/30/22/35/25/45); those are wrong.

**Current (post-revamp) mapping** — the source of truth is `WeatherParticles.jsx`. Counts are
the **moderate**-intensity base; `data-intensity` scales count ×0.55 / ×1.0 / ×1.6 and speed
(duration ×1.3 / ×1.0 / ×0.72) for light / moderate / heavy. Rain/storm lean by `--wind-tilt`.

| State | Type | Base count | Shape/size | Speed (base) | Animation |
|------|------|-----------|-----------|-------|-----------|
| clear + **day** | — | 0 | (no particles) | — | — |
| clear + **night** | `star` | 18 | circle 2-5px | 3-6s | `twinkle` |
| cloudy | — | 0 | (no particles) | — | — |
| rainy | `raindrop` | 20 | streak 2×22px | 0.9-1.7s | `precipFall` (+ `--wind-tilt`) |
| snowy | `snowflake` | 16 | circle 3-8px | 7-14s | `snowDrift` (gentle lean) |
| stormy | `storm-drop` + `lightning` | 26 + 1 | streak 2×30px | 0.5-1.1s | `precipFall` + top-glow `lightning` |

---

## Clear — Floating Orbs

Warm amber circles rising like thermals / heat shimmer.

### Particle generation (WeatherParticles.jsx)

10 orbs, each with randomized inline styles:
- `left`: random 5-95% (spread across full width)
- `width` / `height`: random 4-10px (equal — perfect circles)
- `animationDuration`: random 16-26s
- `animationDelay`: random 0-16s (staggered entry)
- `opacity`: random 0.10-0.30

### CSS (App.css)

```css
.particle.orb {
  position: absolute;
  bottom: -10px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 200, 60, 0.6) 0%, transparent 70%);
  animation: floatOrb linear infinite;
}
```

### Animation — `floatOrb`

```css
@keyframes floatOrb {
  0%   { transform: translateY(0) translateX(0); }
  25%  { transform: translateY(-25vh) translateX(10px); }
  50%  { transform: translateY(-50vh) translateX(-8px); }
  75%  { transform: translateY(-75vh) translateX(12px); }
  100% { transform: translateY(-110vh) translateX(0); }
}
```

Orbs float upward with gentle horizontal sway (S-curve). Overshoots to -110vh to exit before looping.

---

## Night — Twinkling Stars

Small purple dots pulsing in place like stars.

### Particle generation (WeatherParticles.jsx)

18 stars, each with randomized inline styles:
- `left`: random 2-98% (spread across full width)
- `top`: random 2-70% (scattered across upper portion)
- `width` / `height`: random 2-5px (equal — perfect circles)
- `animationDuration`: random 3-6s
- `animationDelay`: random 0-5s
- `opacity`: random 0.10-0.30

### CSS (App.css)

```css
.particle.star {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(167, 139, 250, 0.6) 0%, transparent 70%);
  animation: twinkle ease-in-out infinite;
}
```

### Animation — `twinkle`

```css
@keyframes twinkle {
  0%, 100% { opacity: 0.1; }
  50%      { opacity: 0.8; }
}
```

Stars pulse between 0.1 and 0.8 opacity. Uses `ease-in-out` (not `linear`) for natural breathing. Positioned via inline `left` + `top` — stationary, no transform animation.

---

## Cloudy — Ambient Wandering Fog

Slate circles scattered across the screen, gently wandering in organic loops with subtle scale breathing. Creates an atmospheric haze that feels native to glassmorphism — like fog drifting through frosted glass.

### Particle generation (WeatherParticles.jsx)

14 circles, each with randomized inline styles:
- `left`: random 0-100% (spread across full width)
- `top`: random 0-100% (spread across full height)
- `width` / `height`: random 15-70px (equal — perfect circles, widest range of all moods)
- `animationDuration`: random 20-40s (slowest mood — lazy, ambient)
- `animationDelay`: random 0-20s (staggered entry)
- `opacity`: random 0.06-0.20 (subtlest of all moods)

### CSS (App.css)

```css
.particle.cloud-circle {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(148, 163, 184, 0.6) 0%, transparent 70%);
  animation: cloudFloat ease-in-out infinite;
}
```

No `left` or `top` offset in CSS — both axes come from inline styles. Uses `ease-in-out` (not `linear`) for organic, breathing motion.

### Animation — `cloudFloat`

```css
@keyframes cloudFloat {
  0%   { transform: translate(0, 0) scale(1); }
  20%  { transform: translate(35px, -20px) scale(1.04); }
  40%  { transform: translate(-10px, -45px) scale(0.97); }
  60%  { transform: translate(-30px, 15px) scale(1.06); }
  80%  { transform: translate(20px, 25px) scale(0.98); }
  100% { transform: translate(0, 0) scale(1); }
}
```

5 waypoints creating an asymmetric wandering loop (pentagon-like path). Circles gently orbit their origin point — no edge-to-edge traversal. Subtle `scale` breathing (0.97-1.06) makes the radial gradient softly pulse in and out, creating a living, atmospheric feel. The path never repeats a direction consecutively, so the motion looks organic rather than mechanical.

### Design rationale

Unlike other moods that move particles in a clear direction (up, down, across), cloudy is **ambient** — it fills the screen with a drifting haze. This approach works better with glassmorphism because the scattered, gently-pulsing circles layer over the frosted glass cards like atmospheric depth. The slow speed (20-40s) and low opacity (0.06-0.20) keep it from competing with content.

---

## Rainy — Falling Drops

Blue circles falling steadily like rain catching light.

### Particle generation (WeatherParticles.jsx)

20 drops, each with randomized inline styles:
- `left`: random 0-100% (spread across full width)
- `width` / `height`: random 3-7px (equal — perfect circles)
- `animationDuration`: random 1.0-2.0s (fast)
- `animationDelay`: random 0-3s
- `opacity`: random 0.12-0.35

### CSS (App.css)

```css
.particle.raindrop {
  position: absolute;
  top: -10px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.6) 0%, transparent 70%);
  animation: rainFall linear infinite;
}
```

### Animation — `rainFall`

```css
@keyframes rainFall {
  0%   { transform: translateY(0) translateX(0); }
  25%  { transform: translateY(25vh) translateX(-4px); }
  50%  { transform: translateY(50vh) translateX(3px); }
  75%  { transform: translateY(75vh) translateX(-2px); }
  100% { transform: translateY(110vh) translateX(0); }
}
```

Drops fall top → bottom with very subtle horizontal sway (±4px). Much faster than other moods (1-2s vs 16-26s). Sway is minimal to keep the rain feeling vertical and driven.

---

## Snowy — Drifting Snowflakes

Ice-blue circles falling slowly with gentle sway.

### Particle generation (WeatherParticles.jsx)

16 flakes, each with randomized inline styles:
- `left`: random 0-100% (spread across full width)
- `width` / `height`: random 3-8px (equal — perfect circles)
- `animationDuration`: random 6-14s (slow, leisurely)
- `animationDelay`: random 0-8s
- `opacity`: random 0.15-0.40 (slightly more visible than other moods)

### CSS (App.css)

```css
.particle.snowflake {
  position: absolute;
  top: -10px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(186, 230, 253, 0.6) 0%, transparent 70%);
  animation: snowDrift linear infinite;
}
```

### Animation — `snowDrift`

```css
@keyframes snowDrift {
  0%   { transform: translateY(0) translateX(0); }
  25%  { transform: translateY(25vh) translateX(15px); }
  50%  { transform: translateY(50vh) translateX(-10px); }
  75%  { transform: translateY(75vh) translateX(20px); }
  100% { transform: translateY(110vh) translateX(5px); }
}
```

Flakes fall top → bottom with wide horizontal sway (±20px). Much wider sway than rain to feel lazy and drifting. No rotation — circles don't need it.

---

## Stormy — Storm Drops + Lightning

Violet circles falling hard and fast, plus a full-screen lightning flash.

### Particle generation (WeatherParticles.jsx)

26 storm drops + 1 lightning overlay:

**Storm drops** — each with randomized inline styles:
- `left`: random 0-100% (spread across full width)
- `width` / `height`: random 3-6px (equal — perfect circles, tighter range than rain)
- `animationDuration`: random 0.6-1.4s (fastest of all moods)
- `animationDelay`: random 0-2s
- `opacity`: random 0.12-0.30
- `key`: prefixed with `d` (e.g. `d0`, `d1`) to avoid collision with lightning key

**Lightning** — single particle:
- `type`: `lightning`
- `key`: `'lightning'`
- `animationDuration`: random 6-10s (full cycle between flashes)
- `animationDelay`: random 2-5s (offset from page load)

### CSS — storm-drop (App.css)

```css
.particle.storm-drop {
  position: absolute;
  top: -10px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(192, 132, 252, 0.6) 0%, transparent 70%);
  animation: stormFall linear infinite;
}
```

### Animation — `stormFall`

```css
@keyframes stormFall {
  0%   { transform: translateY(0) translateX(0); }
  25%  { transform: translateY(28vh) translateX(-6px); }
  50%  { transform: translateY(55vh) translateX(5px); }
  75%  { transform: translateY(82vh) translateX(-3px); }
  100% { transform: translateY(110vh) translateX(0); }
}
```

Faster than rain and with slightly more erratic sway. The non-uniform vertical intervals (28/55/82vh) create an accelerating feel.

### CSS — lightning (App.css)

```css
.particle.lightning {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.08);
  opacity: 0;
  animation: lightning ease-in-out infinite;
}
```

### Animation — `lightning`

```css
@keyframes lightning {
  0%, 100% { opacity: 0; }
  1%       { opacity: 0.6; }
  2%       { opacity: 0; }
  3%       { opacity: 0.3; }
  4%       { opacity: 0; }
}
```

Two rapid flashes (0.6 then 0.3) in the first 4% of the cycle, then darkness for the remaining 96%. With 6-10s duration, flashes occur every ~6-10 seconds with a natural double-strike pattern.

---

## Hard Rules

1. **Circles for ambient particles** — orbs, stars, clouds, and snow keep `width === height`.
   **Precipitation (rain/storm) may be elongated streaks** (per [`dynamic-weather.md`](dynamic-weather.md) M2);
   until M2 lands the code is still all-circles.
2. **No SVGs, no canvas, no WebGL** — every particle is a styled `<div>`. This boundary is firm.
3. **`border-radius: 50%`** lives in CSS, not inline styles.
4. **Color via radial-gradient** — hardcoded mood RGB at 0.6 alpha, fading to transparent at 70%. Never use `var(--accent)`.
5. **Consistent gradient formula** — `radial-gradient(circle, rgba(R, G, B, 0.6) 0%, transparent 70%)` for every mood.
6. **Respect `prefers-reduced-motion`** — the parent `.weather-particles` is hidden entirely when reduced motion is preferred.
7. **`useMemo` on mood** — particles regenerate only when mood changes, never on re-render.
8. **Rotation** — unnecessary for circular particles (rotationally symmetric). Elongated
   precipitation streaks (M2) may rotate/skew to express **wind angle** — that is the one
   sanctioned use of `rotate()`/`skew()`.
9. **`will-change`** — use `transform` for motion particles, `opacity` for stationary particles (stars).
10. **Stormy uses `storm-drop`, not `raindrop`** — stormy has its own CSS class, color (violet), and animation (`stormFall`).

## File Locations

- Component: `client/components/WeatherParticles.jsx`
- Styles: `client/App.css` — search for "Weather Particles" section
- Mood mapping: `client/utils/weatherMood.js` (condition codes → mood strings)
