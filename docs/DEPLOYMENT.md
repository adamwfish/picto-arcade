# Deployment

`ROBO PICTO SPACE RUNNER: BOSTON` builds to a **fully static** bundle in
`dist/`. Vite is configured with `base: './'`, so the output works from a
domain root *or* any sub-path (e.g. project pages) with no changes.

```bash
npm install
npm run build      # → dist/
npm run preview    # sanity-check the built bundle locally
```

Everything is generated at runtime (geometry + audio), so there are no binary
assets to upload beyond the bundle itself.

---

## GitHub Pages

Option A — manual:

```bash
npm run build
npx gh-pages -d dist          # publishes dist/ to the gh-pages branch
```

Option B — GitHub Actions (`.github/workflows/deploy.yml`):

```yaml
name: Deploy
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: "${{ steps.deployment.outputs.page_url }}" }
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Because `base` is relative, no `vite.config.ts` change is needed for a
`user.github.io/repo/` URL.

---

## Netlify

- **Build command:** `npm run build`
- **Publish directory:** `dist`

Or drag-and-drop the `dist/` folder into the Netlify dashboard.

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"
```

## Vercel

- **Framework preset:** Vite
- **Build command:** `npm run build`
- **Output directory:** `dist`

## Cloudflare Pages

- **Build command:** `npm run build`
- **Build output directory:** `dist`

## Any static host / S3 / nginx

Upload the contents of `dist/` as-is. It's plain HTML/CSS/JS — no server
runtime, no environment variables, no API keys required.

---

## Performance notes

- Targets **60 FPS** on desktop Chrome, Safari, and Edge.
- Pixel ratio is capped at 2 to avoid over-rendering on HiDPI displays.
- All materials are flat/toon and most geometry is low-poly; there are no
  large textures to download.
- If you target low-end hardware, the cheapest wins are lowering
  `MODE_CONFIG.*.comics` / `.obstacles` counts in `src/game/Game.ts` and
  disabling shadows (`renderer.shadowMap.enabled = false`).
