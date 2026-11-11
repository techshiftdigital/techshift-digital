# TechShift Digital result-box fix v5.0.1

This is a focused overlay for the current TechShift Digital v5 repository. It fixes the calculated-result area overlapping the action buttons or the following Formula section on tool pages.

## Files in this update

- `build.mjs` — replaces the current build file. It keeps the existing `public` → `dist` build and existing verification, injects the result-layout stylesheet into every tool detail page, and runs one additional layout check.
- `public/assets/result-layout-fix.css` — new stylesheet containing layout-only rules. It does not change colours, typography, calculations, text, routes, language selection or videos.
- `qa/verify-result-layout-fix.mjs` — new build-time check confirming every English, Spanish and Brazilian Portuguese tool page receives exactly one fix stylesheet and that route counts remain aligned.

## Deploy

1. Extract this ZIP.
2. At the root of the existing `techshift-digital` repository, replace `build.mjs` with the supplied file.
3. Add `public/assets/result-layout-fix.css` at that exact path.
4. Add `qa/verify-result-layout-fix.mjs` at that exact path.
5. Commit the three files to `main`.
6. Let the existing Cloudflare deployment run unchanged (`npm run build`, output directory `dist`).

Do not delete or replace the existing `public`, `qa`, data, video or language folders. This package is an overlay, not a replacement website.

## Expected build output

The build should report the number of patched tool pages, run the existing site verification, then print a successful result-layout verification. With the current 50-tool, three-language site, the expected patch count is 150 tool pages (50 per language).

## Rollback

Restore the previous `build.mjs`, then remove:

- `public/assets/result-layout-fix.css`
- `qa/verify-result-layout-fix.mjs`

No content or calculation files are changed by this update.
