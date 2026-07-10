# PWA Reference

How Nimbus is installable and offline-capable, and how to verify/regenerate it.
Architecture lives in [`../CLAUDE.md`](../CLAUDE.md) → **PWA**; this file is the
operational reference.

## Why the install button appears (installability criteria)

Chromium shows the address-bar **install** icon only when ALL hold:
1. Served over **HTTPS** or `localhost`.
2. A **web app manifest** with `name`/`short_name`, `start_url`, `display`
   (`standalone`|`fullscreen`|`minimal-ui`), and icons incl. **192** and **512**.
3. A **registered service worker** with a fetch handler, **activated**.
4. Not already installed.

The historical gap here: `vite-plugin-pwa` disables the SW in dev, so `pnpm dev`
failed #3 and the icon never showed while developing. `devOptions.enabled: true`
fixes that. Screenshots + maskable icon aren't required for the icon, but the
maskable icon avoids clipping and `screenshots` upgrade the install *dialog*.

## Files

| Concern | Where |
|---|---|
| Manifest, SW, runtime caching, devOptions | `vite.config.js` |
| Install state (beforeinstallprompt, standalone, iOS) | `client/hooks/usePWA.js` |
| Install control (button / installed / iOS steps) | `client/components/SettingsPanel.jsx` → Install |
| Update / offline toast | `UpdateToast` in `client/App.jsx` (`.pwa-toast` CSS) |
| Shortcut `?action=…` handling | mount effect in `client/App.jsx` |
| Icon + maskable generation | `scripts/generate-icons.js` |
| Screenshots | `public/screenshots/{mobile,wide}.png` |
| Netlify caching/MIME headers | `public/_headers` |

Registration goes through `virtual:pwa-register/react` (`useRegisterSW`), which
requires **`workbox-window`** (a devDependency).

## Install affordance (Settings-only)

By decision there is **no header install button and no banner** — discovery relies
on the browser's native address-bar icon. The only in-app control is
**Settings → Install**, which shows one of: an **Install** button (fires the native
prompt via `promptInstall()`), an **installed ✓** state, or iOS **Add to Home
Screen** steps (iOS Safari never fires `beforeinstallprompt`).

## Regenerating assets

- **Icons + maskable**: replace `public/pwa-512x512.png` (512×512 master), then
  `node scripts/generate-icons.js`. Produces the 192/180 downscales and
  `maskable-512x512.png` (master scaled to the safe zone, padded with `#0f0f1a`).
- **Screenshots**: run the app (`pnpm dev`) and capture with the Playwright recipe
  in [`dev-workflow.md`](dev-workflow.md) at `540×960 @2x` (→1080×1920, narrow) and
  `960×540 @2x` (→1920×1080, wide), saved to `public/screenshots/`. Regenerate
  after notable UI changes so the install dialog stays current.

## Verify

1. `pnpm dev` → Chrome DevTools → **Application → Manifest**: no errors; icons,
   maskable, screenshots, shortcuts all listed. **Service Workers**: activated.
   Address-bar install icon present; Settings → Install → **Install** fires the
   native prompt.
2. `pnpm build && pnpm start` → repeat against the production bundle; manifest is
   served as `application/manifest+json`, SW `activated`, no console errors.
3. Bump `package.json` version, rebuild → the **update toast** appears; Reload
   activates the new SW.
4. Lighthouse PWA/Installable audit passes.
