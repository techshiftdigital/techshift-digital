# TechShift Digital v5.0.4 — combined deployment overlay

This single overlay combines the original-video restoration, canonical YouTube links and thumbnails, clickable titles/thumbnails/watch links, calculator result-box layout correction, and three-language homepage hero-height correction.

## Upload (no terminal required)

1. Extract this ZIP.
2. Open the `techshift-digital` repository on GitHub and select `main`.
3. Choose **Add file → Upload files**.
4. Drag **everything inside** the extracted folder onto the upload page. Upload the contents, not the outer folder or ZIP.
5. Allow GitHub to replace matching files. Do **not** delete the rest of the repository.
6. Commit directly to `main` with: `Deploy combined TechShift Digital v5.0.4 fixes`.
7. Wait for Cloudflare to run `npm run build` and deploy `dist`.

Expected build messages:

- `Restored 166 original videos (94 AI, 72 Excel) on 9 localized listing pages.`
- `Applied result layout fix to 150 tool pages (50 EN, 50 ES, 50 pt-BR).`
- `Applied responsive hero-height fix to 3 localized homepages.`
- `Focused site-fix verification passed...`
- `TechShift Digital build complete: dist/`

## Files intentionally replaced or added

- `build.mjs`
- `package.json`
- `scripts/apply-site-fixes.mjs`
- `qa/verify-site-fixes.mjs`
- `qa/verify.mjs`
- `public/assets/original-videos.js`
- `public/assets/original-videos.css`
- `public/assets/result-layout-fix.css`
- `public/assets/homepage-hero-height-fix.css`
- `public/data/videos-ai.json`
- `public/data/videos-excel.json`
- `public/data/videos.json`
- `public/data/videos-manifest.json`

The build is repeatable and does not remove or rewrite unrelated source pages.
