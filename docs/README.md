# Nimbus Knowledge Base

A lightweight "second brain" for this project. The goal is **low context drift** and
**easy handoffs** — anyone (human or an AI session) should be able to read these few
files and understand *where we are*, *why things are the way they are*, and *what's next*.

## The files

| File | Purpose | Update when… |
|---|---|---|
| [`../CLAUDE.md`](../CLAUDE.md) | **Architecture & how-it-works** — the deep technical reference (components, state, caching, theming, PWA). | The architecture or a documented pattern changes. |
| [`DECISIONS.md`](DECISIONS.md) | **Why** we built things a certain way — a decision log (ADR-lite) with rationale and trade-offs. | You make a non-obvious choice you'd otherwise have to re-explain later. |
| [`STATUS.md`](STATUS.md) | **Where we are right now** — done / in-flight / next, plus run & verify recipes. The handoff doc. | At the end of any working session, or when work stalls mid-task. |
| [`../ROADMAP.md`](../ROADMAP.md) | **Future features** — prioritized backlog of what could be built. | A feature is planned, started, or shipped. |

## Maintenance protocol (read this)

1. **Start of a session** → read `STATUS.md` first, then `DECISIONS.md` for any area you'll touch.
2. **Making a notable choice** → add a dated entry to `DECISIONS.md` (Context / Decision / Rationale / Status). Keep it short.
3. **End of a session** → update `STATUS.md`: move finished items to "Done", update "In flight", record the next step precisely enough to resume cold.
4. **Avoid duplication** → architecture lives in `CLAUDE.md`; future features in `ROADMAP.md`. Link, don't copy.
5. **Keep it scannable** → tables and bullets over prose. If a file gets long, prune stale content.

> The matching AI-session memory lives in `.claude/projects/.../memory/` (auto-loaded each
> session) and points back here. This repo KB is the source of truth; memory is the index.
