#!/usr/bin/env node
/**
 * Rasteriserer hero-banner HTML til PNG via Playwright (Chromium).
 * Kører en minimal lokal HTTP-server (samme mappe), så Google Fonts loader korrekt.
 *
 * Fra repo-root: pnpm --filter @guapo/storefront hero-banner:export
 * Fra apps/storefront: pnpm hero-banner:export
 *
 * Første gang: pnpm exec playwright install chromium
 */

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

/** @type {{ id: string, desktop: { file: string }, mobile: { file: string } }[]} */
const BANNER_SETS = [
  {
    id: 'Anua',
    desktop: { file: 'guapo-banner-desktop.html' },
    mobile: { file: 'guapo-banner-mobil.html' },
  },
  {
    id: 'Beauty of Joseon',
    desktop: { file: 'guapo-banner-boj-desktop.html' },
    mobile: { file: 'guapo-banner-boj-mobil.html' },
  },
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function safeFilePath(root, urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0] || '/');
  const rel = path.normalize(decoded.replace(/^\/+/, ''));
  if (rel.includes('..')) {
    return null;
  }
  const full = path.resolve(root, rel);
  const relToRoot = path.relative(root, full);
  if (relToRoot.startsWith('..') || path.isAbsolute(relToRoot)) {
    return null;
  }
  return full;
}

function startServer() {
  const server = http.createServer(async (req, res) => {
    try {
      const pathname = new URL(req.url || '/', 'http://127.0.0.1').pathname;
      const full = safeFilePath(ROOT, pathname);
      if (!full) {
        res.writeHead(403);
        res.end();
        return;
      }
      const stat = await fs.stat(full).catch(() => null);
      if (!stat?.isFile()) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const ext = path.extname(full);
      const buf = await fs.readFile(full);
      res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
      res.writeHead(200);
      res.end(buf);
    } catch (e) {
      res.writeHead(500);
      res.end(String(e));
    }
  });

  return new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      resolve({ server, port });
    });
    server.on('error', reject);
  });
}

function outName(htmlName) {
  return htmlName.replace(/\.html$/i, '.png');
}

async function main() {
  const outDir = path.join(ROOT, 'exports');
  await fs.mkdir(outDir, { recursive: true });

  const { server, port } = await startServer();
  const base = `http://127.0.0.1:${port}`;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ deviceScaleFactor: 1 });
  const page = await context.newPage();

  const gotoOpts = {
    waitUntil: 'networkidle',
    timeout: 60_000,
  };

  // 2560px-bannere + body padding — undgå forkerte element-screenshots
  const desktopVp = { width: 2800, height: 1100 };
  // Mobil-banner .banner-mobile er 800×800 — viewport skal rumme body-padding + banner
  const mobileVp = { width: 1100, height: 1100 };

  const written = [];

  try {
    for (const set of BANNER_SETS) {
      await page.setViewportSize(desktopVp);
      await page.goto(`${base}/${set.desktop.file}`, gotoOpts);
      await page.evaluate(() => document.fonts.ready);
      const desktopPath = path.join(outDir, outName(set.desktop.file));
      await page.locator('.banner').screenshot({
        path: desktopPath,
        type: 'png',
      });
      written.push(desktopPath);

      await page.setViewportSize(mobileVp);
      await page.goto(`${base}/${set.mobile.file}`, gotoOpts);
      await page.evaluate(() => document.fonts.ready);
      const mobilePath = path.join(outDir, outName(set.mobile.file));
      await page.locator('.banner-mobile').screenshot({
        path: mobilePath,
        type: 'png',
      });
      written.push(mobilePath);
    }

    console.log('Hero banner PNGs exported:\n');
    for (const p of written) {
      console.log(`  ${p}`);
    }
    console.log('');
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
