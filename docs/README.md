# Nimbus Knowledge Base

A lightweight "second brain" for the project. Goal: **low context drift, easy handoffs** —
anyone (human or AI session) reads these few files and understands *where we are*, *why
things are the way they are*, and *what's next*.

**The split:** one file **tracks** (status + todo + done); the rest are durable **knowledge**
it links to. Tracking lives in exactly one place so it never drifts across files.

## The files

| File | Role | Update when… |
|---|---|---|
| 📍 [`TRACKER.md`](TRACKER.md) | **The tracker** — status, backlog, done log, watch-outs. The only place with checkboxes. | Anything is planned, started, or shipped. **Read first.** |
| [`DECISIONS.md`](DECISIONS.md) | **Why** — decision log (ADR-lite) with rationale + trade-offs. | You make a non-obvious choice you'd otherwise re-explain later. |
| [`dynamic-weather.md`](dynamic-weather.md) | **Design spec** — accent/particle/atmosphere audit, vision, milestone detail. | The weather-visual direction changes. |
| [`particles.md`](particles.md) | **Reference** — particle-system spec & hard rules. | Before editing `WeatherParticles.jsx` or particle CSS. |
| [`weatherapi.md`](weatherapi.md) | **Reference** — WeatherAPI + Open-Meteo capabilities, fields, limits. | Provider capabilities or usage change. |
| [`dev-workflow.md`](dev-workflow.md) | **Reference** — run commands + visual-verify (Playwright) recipe. | The run/verify workflow changes. |
| [`pwa.md`](pwa.md) | **Reference** — installability criteria, install UI, asset regen, verify steps. | PWA config, install UI, or icons/screenshots change. |
| [`../CLAUDE.md`](../CLAUDE.md) | **Architecture** — components, state, caching, theming, PWA. | The architecture or a documented pattern changes. |

## Maintenance protocol

1. **Start of session** → read [`TRACKER.md`](TRACKER.md), then any knowledge file for the
   area you'll touch.
2. **Making a notable choice** → add a dated entry to [`DECISIONS.md`](DECISIONS.md)
   (Context / Decision / Rationale / Status). Keep it short.
3. **Planned / started / shipped** → update [`TRACKER.md`](TRACKER.md) only. Move finished
   items to the Done log; record the next step precisely enough to resume cold.
4. **Don't duplicate** → architecture in `CLAUDE.md`, capabilities in `weatherapi.md`, specs
   in their own files. Link, don't copy. Status goes in the tracker, nowhere else.
5. **Keep it scannable** → tables and bullets over prose; prune stale content.

> The matching AI-session memory lives in `.claude/projects/.../memory/` (auto-loaded each
> session) and points back here. This repo KB is the source of truth; memory is the index.
