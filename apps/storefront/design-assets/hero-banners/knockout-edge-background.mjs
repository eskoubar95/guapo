#!/usr/bin/env node
/**
 * Fjerner sammenhængende mørk baggrund fra kanterne (typisk sort felt i kvadratiske packshots).
 * Bruges når PNG har opaque sort i stedet for alpha.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Sum RGB under dette = betragtes som “baggrund” til flood-fill fra kant */
const DARK_SUM_MAX = 95;

function knockoutFromEdges(rgba, w, h) {
  const out = Buffer.from(rgba);
  const seen = new Uint8Array(w * h);
  const q = [];

  const darkAt = (px) => {
    const i = px * 4;
    return out[i] + out[i + 1] + out[i + 2] < DARK_SUM_MAX;
  };

  const push = (x, y) => {
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    const p = y * w + x;
    if (seen[p]) return;
    if (!darkAt(p)) return;
    seen[p] = 1;
    q.push(p);
  };

  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }

  for (let qi = 0; qi < q.length; qi++) {
    const p = q[qi];
    const x = p % w;
    const y = (p / w) | 0;
    const i = p * 4;
    out[i + 3] = 0;
    if (x + 1 < w) push(x + 1, y);
    if (x > 0) push(x - 1, y);
    if (y + 1 < h) push(x, y + 1);
    if (y > 0) push(x, y - 1);
  }

  return out;
}

async function main() {
  const input = path.join(__dirname, 'boj-dynasty-cream.png');
  const tmp = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data, info } = tmp;
  const { width, height } = info;

  const fixed = knockoutFromEdges(data, width, height);

  await sharp(fixed, {
    raw: { width, height, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .toFile(input);

  const meta = await sharp(input).metadata();
  console.log(`Updated ${input} → ${meta.width}×${meta.height}, hasAlpha: ${meta.hasAlpha}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
