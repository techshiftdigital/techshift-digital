# TechShift Digital v5.0.5 — agreed site fixes

This is a focused deployment overlay for the existing TechShift Digital repository. It does not replace site content, calculations, URLs, SEO metadata, video data, or Cloudflare/GitHub configuration.

## Included changes

1. Fixes the calculator result overlap by making `output.result` a full-width block in normal flow after the action buttons.
2. Keeps the language selector accessible while removing the visible Language/Idioma label; the compact selector is placed immediately after and vertically aligned with the YouTube button on desktop, and remains usable in the mobile navigation.
3. Makes every tool-card title open the exact same URL as that card's existing Open tool / Abrir herramienta / Abrir ferramenta link.

The build-time patch covers exactly 50 tool detail pages in each locale: English, Spanish, and Brazilian Portuguese (150 pages total). The verification gate fails rather than deploying if those counts or invariants are not satisfied.

## Deploy

1. Extract this ZIP at the root of the current repository and allow these overlay files to replace files with the same names.
2. Do not delete any existing `public/` content, video data, tool scripts, QA files, Wrangler files, or GitHub workflows.
3. Run `npm run build` (or the existing Cloudflare build command).
4. Deploy the generated `dist/` directory using the existing Cloudflare/GitHub workflow.

## Verification

The build performs these steps:

- copies the unchanged `public/` tree to `dist/`;
- applies the three agreed corrections to `dist/`;
- verifies 50 tools per locale, calculator result markup, language-menu accessibility/alignment, and tool-title/action URL equality;
- runs the existing `qa/verify.mjs` full-site check.

For a self-contained fixture test of the patcher and verifier, run:

```bash
npm run test:agreed-fixes
```

## Files in this overlay

- `build.mjs`
- `package.json`
- `public/assets/agreed-site-fixes.css`
- `scripts/apply-agreed-site-fixes.mjs`
- `qa/verify-agreed-site-fixes.mjs`
- `tests/test-agreed-site-fixes.mjs`

No video JSON, calculator JavaScript, page copy, canonical URL, structured data, or deployment configuration is overwritten by this overlay.
