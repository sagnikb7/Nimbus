# Weather Particles Guide

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

Every mood uses the same visual language: **soft radial-gradient circles**. The system achieves variety through motion direction, speed, count, and color — not through shape changes. This keeps particles feeling like a cohesive ambient layer rather than a weather simulation.

### Consistent properties across all moods

| Property | Value |
|----------|-------|
| Shape | Perfect circle (`border-radius: 50%`, `width === height`) |
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

| Mood | Type | Count | Size | Speed | Opacity | Direction | Animation |
|------|------|-------|------|-------|---------|-----------|-----------|
| clear | `orb` | 14 | 4-10px | 16-26s | 0.10-0.30 | bottom → top | `floatOrb` |
| night | `star` | 30 | 2-5px | 3-6s | 0.10-0.30 | stationary | `twinkle` |
| cloudy | `cloud-circle` | 22 | 15-70px | 20-40s | 0.06-0.20 | ambient wander | `cloudFloat` |
| rainy | `raindrop` | 35 | 3-7px | 1.0-2.0s | 0.12-0.35 | top → bottom | `rainFall` |
| snowy | `snowflake` | 25 | 3-8px | 6-14s | 0.15-0.40 | top → bottom | `snowDrift` |
| stormy | `storm-drop` + `lightning` | 45 + 1 | 3-6px | 0.6-1.4s | 0.12-0.30 | top → bottom + flash | `stormFall` + `lightning` |

---

## Clear — Floating Orbs

Warm amber circles rising like thermals / heat shimmer.

### Particle generation (WeatherParticles.jsx)

14 orbs, each with randomized inline styles:
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

30 stars, each with randomized inline styles:
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

22 circles, each with randomized inline styles:
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

35 drops, each with randomized inline styles:
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

25 flakes, each with randomized inline styles:
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

45 storm drops + 1 lightning overlay:

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

1. **Circles only** — `width` must always equal `height`. Never use different values.
2. **No SVGs** — render as `<div>` elements, not `<svg>`, `<ellipse>`, or `<circle>`.
3. **`border-radius: 50%`** lives in CSS, not inline styles.
4. **Color via radial-gradient** — hardcoded mood RGB at 0.6 alpha, fading to transparent at 70%. Never use `var(--accent)`.
5. **Consistent gradient formula** — `radial-gradient(circle, rgba(R, G, B, 0.6) 0%, transparent 70%)` for every mood.
6. **Respect `prefers-reduced-motion`** — the parent `.weather-particles` is hidden entirely when reduced motion is preferred.
7. **`useMemo` on mood** — particles regenerate only when mood changes, never on re-render.
8. **No rotation** — circles are rotationally symmetric; `rotate()` in keyframes is unnecessary.
9. **`will-change`** — use `transform` for motion particles, `opacity` for stationary particles (stars).
10. **Stormy uses `storm-drop`, not `raindrop`** — stormy has its own CSS class, color (violet), and animation (`stormFall`).

## File Locations

- Component: `client/components/WeatherParticles.jsx`
- Styles: `client/App.css` — search for "Weather Particles" section
- Mood mapping: `client/utils/weatherMood.js` (condition codes → mood strings)
