# Nimbus — Production-Readiness Review (v1.6.0)

_Snapshot audit, 2026-07-10. **Status: pending** — recommendations below are not yet
implemented; revisit and work the P0/P1 items when picking this up. Tracked in
[`TRACKER.md`](TRACKER.md)._

## Verdict

- **Personal / portfolio PWA:** ship-ready. Clean provider-abstraction architecture, real
  caching, offline PWA, thoughtful UX, no glaring security holes. Deployable publicly as-is.
- **Commercial product at scale:** ~85%. A few hardening gaps to close first (error boundary,
  rate limiting on self-host, hermetic tests, error tracking). None are architectural — all additive.
- **Overall: A− / strong senior-level project.**

## Strengths

- **Anti-corruption adapter layer** — every vendor normalizes to one neutral schema; Express
  routes and Netlify functions share the same `server/adapters/` registry (no duplicated fetch
  logic). The standout decision.
- **Secrets correct** — API keys resolve server-side only; `meta` stores the env-var *name*, not
  the value; provider input validated against the registry.
- **XSS-safe** — no `dangerouslySetInnerHTML`; vendor strings render as text.
- **Performance-aware** — initial JS ~87 KB gzip, CSS ~10 KB gzip; `html2canvas` (202 KB) is
  lazy-loaded only on share. 15-min TTL cache + stale-while-revalidate.
- **PWA done properly**, and a real docs KB + backend tests + `.fallowrc` exist.

## Gaps, by priority

| Pri | Issue | Why it matters | Fix |
|---|---|---|---|
| **P0** | No React error boundary | One render error → full white screen | Top-level `<ErrorBoundary>` in `App.jsx` with fallback + reload |
| **P1** | No rate limiting on Express `/api/weather` | Self-host can be hammered → burns WeatherAPI quota | `express-rate-limit` (Netlify serverless is less exposed) |
| **P1** | Tests hit live external APIs | Non-hermetic → flaky/slow CI, fails on provider outage | Mocked adapter unit tests; keep live tests as an opt-in suite |
| **P1** | No request timeout / retry on provider fetches | A hung upstream can hang the request | Confirm/`AbortController` timeout in `_shared/http.js` + one retry w/ backoff |
| **P2** | No error tracking / structured logging | Prod issues invisible (only a startup log) | Sentry (client + functions) or structured logs |
| **P2** | `App.css` is ~4,500 lines, one file | Hard to navigate/maintain | Split by section or adopt CSS modules incrementally |
| **P2** | `App.jsx` ~785 lines holds all state | Testability + cognitive load | Extract a `useWeather()` hook / context |
| **P2** | Touch pin/remove not screen-reader-reachable | Inline controls `display:none` on coarse pointers; long-press is the only path | Add an accessible affordance (e.g. a visible `⋯` on the active pill) |
| **P2** | Overlays don't trap focus | Keyboard users can tab behind open sheets | Add a focus trap to the overlay pattern |

## Smaller notes

- **SSRF-safe** — user input only becomes a query param to fixed provider hosts, `encodeURIComponent`'d.
- **`AirQuality.jsx` may be dead** (tile + `AQIDetail` supersede it) — confirm via fallow and remove.
- **Netlify is the real prod target**; the Express server is dev/self-host, so most P1 server items
  scope to the self-host path.
- **Accessibility above average** (aria-labels, reduced-motion, contrast fix) but not complete
  (focus trap, touch SR).

## Recommended order

1. Error boundary (P0 — biggest resilience win).
2. Rate-limit + fetch timeout (P1).
3. Mocked adapter unit tests for hermetic CI (P1).
4. P2 polish (Sentry, CSS/JS structure, a11y) as time allows.
