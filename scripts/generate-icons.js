/**
 * Regenerates the smaller PWA icons from the master artwork.
 *
 * The app icon is now a designed raster: `public/pwa-512x512.png` is the master
 * (indigo→violet rounded tile with a fluffy cumulus cloud). This script simply
 * downscales it to the 192px PWA icon and the 180px apple-touch icon so all
 * sizes stay pixel-consistent.
 *
 * To change the icon: replace `public/pwa-512x512.png` with the new 512×512
 * artwork, then run `node scripts/generate-icons.js`. Keep the header/favicon
 * cloud (`public/favicon.svg` + the SVG in `client/App.jsx`) visually in sync.
 *
 * Uses macOS `sips` (built in) — no npm dependencies. The vector favicon.svg is
 * authored by hand and not touched here.
 *
 * Usage: node scripts/generate-icons.js
 */

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const publicDir = path.join(__dirname, '..', 'public');
const master = path.join(publicDir, 'pwa-512x512.png');

if (!fs.existsSync(master)) {
  console.error(`Master icon not found: ${master}`);
  console.error('Add a 512×512 pwa-512x512.png first, then re-run.');
  process.exit(1);
}

const targets = [
  { size: 192, file: 'pwa-192x192.png' },
  { size: 180, file: 'apple-touch-icon-180x180.png' },
];

for (const { size, file } of targets) {
  const out = path.join(publicDir, file);
  execFileSync('sips', ['-s', 'format', 'png', '-z', String(size), String(size), master, '--out', out], {
    stdio: 'ignore',
  });
  console.log(`Created ${out} (${size}×${size})`);
}

console.log('Done!');
