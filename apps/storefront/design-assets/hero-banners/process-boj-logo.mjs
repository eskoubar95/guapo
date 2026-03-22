#!/usr/bin/env node
/**
 * Sort baggrund → transparent, trim, gem som boj-logo.png til brug i bannere.
 * Kræver: ./_boj-import/boj-logo-raw.png
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const RAW = path.join(__dirname, '_boj-import', 'boj-logo-raw.png');
const OUT = path.join(__dirname, 'boj-logo.png');

/** Pixel anses som baggrund hvis næsten sort (studio-sort felt) */
function knockOutBlackToAlpha(inputBuffer, channels, width, height) {
  const out = Buffer.alloc(width * height * 4);
  const stride = channels;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * stride;
      const o = (y * width + x) * 4;
      const r = inputBuffer[i];
      const g = inputBuffer[i + 1];
      const b = inputBuffer[i + 2];
      const a = channels === 4 ? inputBuffer[i + 3] : 255;
      const sum = r + g + b;
      if (sum < 72 && r < 50 && g < 50 && b < 50) {
        out[o] = 0;
        out[o + 1] = 0;
        out[o + 2] = 0;
        out[o + 3] = 0;
      } else {
        out[o] = r;
        out[o + 1] = g;
        out[o + 2] = b;
        out[o + 3] = a;
      }
    }
  }
  return out;
}

async function main() {
  if (!fs.existsSync(RAW)) {
    console.error('Mangler', RAW);
    process.exit(1);
  }

  const base = sharp(RAW).ensureAlpha();
  const { data, info } = await base.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  const rgba = knockOutBlackToAlpha(data, channels, width, height);

  await sharp(rgba, {
    raw: { width, height, channels: 4 },
  })
    .trim({ threshold: 5 })
    .resize({
      width: 520,
      height: 120,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .png({ compressionLevel: 9 })
    .toFile(OUT);

  const meta = await sharp(OUT).metadata();
  console.log(`Wrote ${OUT} (${meta.width}×${meta.height})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
