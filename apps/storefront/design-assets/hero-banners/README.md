# Hero banner sources (HTML/CSS)

Static, self-contained HTML used to **design** marketing hero art, then export as **images** for Payload (background on the storefront hero block).

| File | Canvas |
|------|--------|
| `guapo-banner-desktop.html` | 2560×875 px (Anua) |
| `guapo-banner-mobil.html` | 800×800 px |
| `guapo-banner-boj-desktop.html` | 2560×875 px (Beauty of Joseon) |
| `guapo-banner-boj-mobil.html` | 800×800 px |

## Bundled assets (same folder)

| File | Use |
|------|-----|
| `anua-niacinamide-serum.png` | Anua product cutout (replace with higher-res if export looks soft at 2560-wide) |
| `DBA2025-Badge.svg` | Danish Beauty Award badge (vector, scales cleanly) |
| `boj-logo.png` | Officielt wordmark (genereres fra `_boj-import/boj-logo-raw.png` via `hero-banner:process-boj-logo`) |
| `boj-relief-sun.png` | Relief Sun — transparent packshot |
| `boj-ginseng-essence-water.png` | Ginseng Essence Water — transparent |
| `boj-dynasty-cream.png` | Dynasty Cream — transparent (leveret med sort felt: kør `pnpm hero-banner:knockout-dynasty-bg` én gang) |

**Opdatering af produkt-PNG’er:** læg de færdige filer direkte her med navnene ovenfor (ingen trim nødvendig ved ægte alpha).

**Ældre workflow (foto med hvid kant):** råfiler i `_boj-import/` + `pnpm hero-banner:process-boj-images` (Sharp trim). Juster `threshold` i `process-boj-product-images.mjs` ved behov.

## How to use

### Export til PNG (Playwright — anbefalet)

Fra **repo-root**:

```bash
pnpm --filter @guapo/storefront exec playwright install chromium   # kun første gang / efter opgradering
pnpm hero-banner:export
```

Fra **`apps/storefront`** kan du i stedet bruge `pnpm exec playwright install chromium` og `pnpm hero-banner:export`.

Det skriver **præcise** raster af banner-boksene (samme som i browseren) til:

| Output | Størrelse (ca.) |
|--------|------------------|
| `exports/guapo-banner-desktop.png` | 2560×875 |
| `exports/guapo-banner-mobil.png` | 800×800 |
| `exports/guapo-banner-boj-desktop.png` | 2560×875 |
| `exports/guapo-banner-boj-mobil.png` | 800×800 |

Scriptet starter en lokal HTTP-server i denne mappe, så **Google Fonts** loader som i produktion. `exports/` er gitignoreret for PNG’er — kopiér til Payload / CMS efter behov.

### Manuel preview

1. Serve mappen over HTTP (fx `npx serve -l 4321`) og åbn `http://127.0.0.1:4321/guapo-banner-desktop.html`. Vent til fonts er loadet.
2. Alternativt: screenshot i browser / devtools til samme pixelstørrelser som tabellen ovenfor.

### Efter export

Komprimer (WebP/JPEG) og upload til Payload; brug som hero-baggrund på forsiden.

These files are **not** part of the Next.js app bundle.

**Resolution:** Desktop uses the PNG at **~800px CSS height**. You do not need AI-generated upscales—if the final raster export is blurry, swap `anua-niacinamide-serum.png` for a larger export from photo / remove.bg (e.g. 1600–2400px tall source).
