# Dev Workflow

How to run Nimbus and verify changes. (Task tracking lives in [`TRACKER.md`](TRACKER.md).)

## Run

```bash
pnpm dev          # client :5173 (proxies /api → Express :3033) + server together
pnpm dev:client   # Vite only
pnpm dev:server   # Express only (nodemon)
pnpm build        # production build → dist/
pnpm start        # serve dist/ from Express on one port
pnpm test         # Vitest (backend only) — watch: pnpm test:watch
```

Package manager is **pnpm** (not npm). **Vitest** covers the backend
(`server/**/*.test.js`, config `vitest.config.mjs`) — unit tests for the adapter
registry/`convert.js` + **live** integration tests hitting the real providers (the
WeatherAPI test self-skips without `WEATHERAPI_KEY`). No linter; **frontend** has no
tests — verify it via **build + manual/visual**.

If ports are stuck: `lsof -ti:3033,5173 | xargs kill -9`.

## Verify visually (Playwright screenshot recipe)

**Playwright is a devDependency.** One-time browser install: `pnpm exec playwright install chromium`.
Write a CJS script and run it from the repo root so `require('playwright')` resolves
(`node script.cjs`, or `NODE_PATH="$(pwd)/node_modules" node /tmp/script.cjs` if it lives
elsewhere). Then **Read the PNG** to actually see it.

```js
const { chromium } = require('playwright');
const b = await chromium.launch();
// colorScheme drives the `system` theme → data-theme. Use 'dark' | 'light'.
const ctx = await b.newContext({ viewport: { width: 1000, height: 1400 }, colorScheme: 'dark' });
const p = await ctx.newPage();
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
// Empty state is the default (fresh context = empty localStorage).
// Load a city: raw-text Enter search avoids needing the geocoding dropdown.
await p.locator('.search-bar input').fill('London');
await p.waitForTimeout(600);
await p.locator('.search-bar input').press('Enter');
await p.waitForSelector('.current-weather', { timeout: 20000 });
await p.keyboard.press('Escape');                                  // close autocomplete
await p.locator('.current-weather').click({ position: { x: 10, y: 10 } }); // blur input
await p.waitForTimeout(1200);
await p.screenshot({ path: '/tmp/main.png', fullPage: true });
await b.close();
```

- **Theme:** set `colorScheme: 'dark' | 'light'` on the context (the app's `system` pref reads it).
- **Detail overlays:** `await p.click('.detail-pill:has-text("Precip")')` → `.precip-detail`
  (same for Wind/AQI). Settings: `.settings-btn` → `.settings-panel`.
- **Night UI:** load a city currently in night (e.g. `Tokyo` in our daytime).
- **Touch dock long-press:** new context with `{ hasTouch: true, isMobile: true }`, load a city,
  then fire a real long-press (CDP taps don't "hold"):

  ```js
  await p.evaluate(() => {
    const el = document.querySelector('.dock-item');
    const r = el.getBoundingClientRect();
    const t = new Touch({ identifier: 1, target: el, clientX: r.x + r.width/2, clientY: r.y + r.height/2 });
    el.dispatchEvent(new TouchEvent('touchstart', { touches: [t], targetTouches: [t], changedTouches: [t], bubbles: true }));
  });
  await p.waitForTimeout(700);  // exceed the 450ms long-press threshold
  await p.evaluate(() => document.querySelector('.dock-item')
    .dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [], bubbles: true })));
  // → .dock-sheet action sheet is now open
  ```

### Forcing a weather mood deterministically

To screenshot a specific mood/condition regardless of real weather, intercept the API and
override `current.condition.code` + `current.is_day` (mood is derived from those):

```js
await p.route('**/api/weather**', async (route) => {
  const resp = await route.fetch();
  const data = await resp.json();
  data.current.condition.code = 1183;   // e.g. light rain
  data.current.is_day = 1;
  await route.fulfill({ response: resp, body: JSON.stringify(data) });
});
```

The same trick injects `data.alerts.alert[]` to preview the alerts banner, since live
alert data is only present during actual severe weather.
