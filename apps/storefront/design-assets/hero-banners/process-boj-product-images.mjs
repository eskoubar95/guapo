#!/usr/bin/env node
/**
 * Beskærer overskydende hvid baggrund (Sharp trim) og gemmer web-venlige PNG’er.
 * Råfiler: ./_boj-import/*-raw.png  →  ./boj-*.png
 *
 * Kør: pnpm --filter @guapo/storefront exec node design-assets/hero-banners/process-boj-product-images.mjs
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const JOBS = [
  {
    raw: 'dynasty-raw.png',
    out: 'boj-dynasty-cream.png',
    maxHeight: 2200,
  },
  {
    raw: 'ginseng-raw.png',
    out: 'boj-ginseng-essence-water.png',
    maxHeight: 2400,
  },
  {
    raw: 'relief-sun-raw.png',
    out: 'boj-relief-sun.png',
    maxHeight: 2200,
  },
];

async function main() {
  const importDir = path.join(__dirname, '_boj-import');

  for (const job of JOBS) {
    const input = path.join(importDir, job.raw);
    const output = path.join(__dirname, job.out);

    let pipeline = sharp(input).rotate(); // respektér EXIF

    /* Lav threshold — ellers “spiser” trim lyse områder på emballage mod hvid baggrund */
    pipeline = pipeline.trim({
      threshold: 10,
    });

    pipeline = pipeline.resize({
      height: job.maxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    });

    await pipeline.png({ compressionLevel: 9, effort: 9 }).toFile(output);

    const meta = await sharp(output).metadata();
    console.log(`${job.out}  ${meta.width}×${meta.height}px`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
