/**
 * Generates PWA icon PNGs from scratch using raw PNG encoding.
 * Renders the Nimbus minimal cloud logo on a gradient background.
 * No external dependencies required.
 *
 * The cloud shape matches the SVG path used in App.jsx and favicon.svg:
 *   M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z
 * which is composed of two circles + a flat bottom:
 *   - Large circle (left):  center (9, 12), radius 7
 *   - Small circle (right): center (17.5, 14.5), radius 4.5
 *   - Flat base connecting them at y=19
 *
 * Usage: node scripts/generate-icons.js
 */

const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function createPNG(width, height, pixels) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function makeChunk(type, data) {
    const buf = Buffer.alloc(4 + type.length + data.length + 4);
    buf.writeUInt32BE(data.length, 0);
    buf.write(type, 4);
    data.copy(buf, 4 + type.length);
    const crc = crc32(Buffer.concat([Buffer.from(type), data]));
    buf.writeInt32BE(crc, buf.length - 4);
    return buf;
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type: RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const rawData = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 3)] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3;
      const outIdx = y * (1 + width * 3) + 1 + x * 3;
      rawData[outIdx] = pixels[idx];
      rawData[outIdx + 1] = pixels[idx + 1];
      rawData[outIdx + 2] = pixels[idx + 2];
    }
  }
  const compressed = zlib.deflateSync(rawData);

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

// CRC32
const crcTable = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) | 0;
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

/**
 * Tests if a point is inside the cloud silhouette.
 * The cloud is defined in a 24x24 coordinate space and consists of:
 *   - A large circle: center (9, 12), radius 7
 *   - A small circle: center (17.5, 14.5), radius 4.5
 *   - A flat bottom rect connecting them at y = 12..19, x = 9..17.5
 * Returns a 0-1 alpha with soft antialiased edges.
 */
function cloudAlpha(px, py, scale, offsetX, offsetY) {
  // Transform pixel coords to the 24x24 cloud space
  const cx = (px - offsetX) / scale;
  const cy = (py - offsetY) / scale;

  // Large circle (left bump)
  const d1 = Math.hypot(cx - 9, cy - 12) - 7;
  // Small circle (right bump)
  const d2 = Math.hypot(cx - 17.5, cy - 14.5) - 4.5;
  // Bottom rectangle connecting both circles
  const inRect = cx >= 9 && cx <= 17.5 && cy >= 12 && cy <= 19;
  const d3 = inRect ? -1 : Infinity;

  // Signed distance: negative = inside
  const dist = Math.min(d1, d2, d3);

  // Anti-alias: smooth edge over ~0.6 units
  if (dist < -0.6) return 1;
  if (dist > 0.6) return 0;
  return 1 - (dist + 0.6) / 1.2;
}

function generateIcon(size) {
  const pixels = Buffer.alloc(size * size * 3);

  // Brand gradient colors
  const skyTL = [102, 126, 234]; // #667eea (top-left)
  const skyBR = [118, 75, 162];  // #764ba2 (bottom-right)
  const cloudColor = [245, 247, 255]; // near-white

  // Scale the 24x24 cloud to fit the icon with padding
  // Cloud bounding box in 24-space: roughly x 2..22, y 5..19 → 20 wide, 14 tall
  const cloudWidth = 20;
  const targetWidth = size * 0.58;
  const scale = targetWidth / cloudWidth;
  // Center the cloud (offset so the bounding box center maps to icon center)
  const offsetX = (size - cloudWidth * scale) / 2 - 2 * scale;
  const offsetY = (size - 14 * scale) / 2 - 5 * scale + size * 0.04;

  // Rounded rect corner radius
  const radius = size * 0.21;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 3;
      const t = (x / size + y / size) / 2;

      // Rounded rect mask
      let inside = true;
      if (x < radius && y < radius) {
        inside = Math.hypot(x - radius, y - radius) <= radius;
      } else if (x >= size - radius && y < radius) {
        inside = Math.hypot(x - (size - radius), y - radius) <= radius;
      } else if (x < radius && y >= size - radius) {
        inside = Math.hypot(x - radius, y - (size - radius)) <= radius;
      } else if (x >= size - radius && y >= size - radius) {
        inside = Math.hypot(x - (size - radius), y - (size - radius)) <= radius;
      }

      if (!inside) {
        pixels[idx] = 0;
        pixels[idx + 1] = 0;
        pixels[idx + 2] = 0;
        continue;
      }

      // Background gradient
      let r = lerp(skyTL[0], skyBR[0], t);
      let g = lerp(skyTL[1], skyBR[1], t);
      let b = lerp(skyTL[2], skyBR[2], t);

      // Cloud overlay
      const alpha = cloudAlpha(x, y, scale, offsetX, offsetY);
      if (alpha > 0) {
        const a = alpha * 0.95;
        r = lerp(r, cloudColor[0], a);
        g = lerp(g, cloudColor[1], a);
        b = lerp(b, cloudColor[2], a);
      }

      pixels[idx] = r;
      pixels[idx + 1] = g;
      pixels[idx + 2] = b;
    }
  }

  return createPNG(size, size, pixels);
}

const publicDir = path.join(__dirname, '..', 'public');

for (const size of [192, 512]) {
  const png = generateIcon(size);
  const filePath = path.join(publicDir, `pwa-${size}x${size}.png`);
  fs.writeFileSync(filePath, png);
  console.log(`Created ${filePath} (${png.length} bytes)`);
}

const applePng = generateIcon(180);
const applePath = path.join(publicDir, 'apple-touch-icon-180x180.png');
fs.writeFileSync(applePath, applePng);
console.log(`Created ${applePath} (${applePng.length} bytes)`);

console.log('Done!');
