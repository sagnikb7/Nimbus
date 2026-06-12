# Dev Workflow

How to run Nimbus and verify changes. (Task tracking lives in [`TRACKER.md`](TRACKER.md).)

## Run

```bash
pnpm dev          # client :5173 (proxies /api → Express :3033) + server together
pnpm dev:client   # Vite only
pnpm dev:server   # Express only (nodemon)
pnpm build        # production build → dist/
pnpm start        # serve dist/ from Express on one port
```

Package manager is **pnpm** (not npm). No test runner or linter is configured —
verification is **build + manual/visual**.

If ports are stuck: `lsof -ti:3033,5173 | xargs kill -9`.

## Verify visually (Playwright screenshot recipe)

Playwright core is available via the npx cache. Resolve its path once:
`find ~/.npm/_npx -path "*playwright-core*" -name index.js`. Then (CJS default import):

```js
import pkg from '<that path>'; const { chromium } = pkg;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 520, height: 820 }, deviceScaleFactor: 2 });
await p.goto('http://localhost:5173/');
await p.locator('.search-bar input').fill('Ballygunge');
await p.waitForSelector('.search-suggestion');
await p.locator('.search-suggestion').first().click();   // closes the dropdown
await p.waitForSelector('.current-temp');
await p.waitForTimeout(1800);
await p.locator('.current-weather').screenshot({ path: '/tmp/hero.png' });
await b.close();
```

Then Read the PNG. Toggle `.theme-toggle` for light/dark. For night-mode UI, search a
city currently in night (different timezone).

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
