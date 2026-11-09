# TechShift Digital - Phases 1, 2 and 3 deployment update

This package is a consolidated update for the existing GitHub/Cloudflare project. It keeps the site's 50-tool scope and does not include or replace the 165-video metadata, GitHub workflow, Cloudflare configuration, `build.mjs`, `package.json`, `wrangler.jsonc`, or the existing base stylesheet.

## What the package changes

- Replaces `public/tools/index.html` with a searchable, category-filterable directory containing 50 cards.
- Replaces each of the 50 `public/tools/<slug>/index.html` pages with an expanded page that keeps the calculator first and adds tool-specific guidance, formulas where relevant, examples, Excel instructions where relevant, mistakes, limitations, FAQs, related tools and video placeholders.
- Adds four shared assets:
  - `public/assets/tool-calculators.js`
  - `public/assets/tools-directory.js`
  - `public/assets/related-videos.js`
  - `public/assets/tools-enhancements.css`
- Uses the existing `data/videos-ai.json` and `data/videos-excel.json` files at runtime. No video record is duplicated or changed.

## Before deployment

1. Download a backup of the current GitHub repository or create a backup branch.
2. Confirm the deployed branch is `main` (or use the branch currently connected to Cloudflare).
3. Confirm this existing QR library is still present:

   `public/assets/vendor/qr-bundle.js`

4. Do not delete existing AI/Excel video pages or JSON metadata.

## GitHub upload steps

1. Extract this ZIP locally.
2. Copy the package's `public/` folder into the repository root and allow files with matching paths to be replaced.
3. Confirm the four new shared assets are under `public/assets/`.
4. Confirm `public/tools/index.html` was replaced.
5. Confirm all 50 tool folders under `public/tools/` contain the new `index.html`.
6. Do **not** replace these existing files:

   - `build.mjs`
   - `package.json`
   - `wrangler.jsonc`
   - `public/assets/style.css`
   - `data/content.json`
   - `data/videos-ai.json`
   - `data/videos-excel.json`

7. Review the changed-file list. The intended website update is 55 files: 51 HTML files and 4 shared assets.
8. Commit with this message:

   `Improve 50 tools with content, SEO, search and related links`

9. Push/commit to the branch connected to Cloudflare.

## Cloudflare verification

1. Open Cloudflare -> Workers & Pages -> `techshift-digital` -> Deployments.
2. Confirm the latest commit builds successfully.
3. Confirm production traffic points to the new deployment.
4. Open `/tools/` and test search plus at least two category filters.
5. Open representative pages:
   - `/tools/percentage-change/`
   - `/tools/cagr-calculator/`
   - `/tools/json-formatter-validator/`
   - `/tools/working-days/`
   - `/tools/qr-code-generator/`
6. Verify calculators, Reset buttons, related-tool links and responsive layout.
7. On a tool with a closely matched tutorial, verify the related-video title and YouTube action open the same destination.
8. Confirm the existing AI and Excel directories still show 93 and 72 listings respectively (165 total).
9. Confirm `sitemap.xml` includes the Tools directory and 50 canonical tool URLs.

## Search Console after deployment

- Inspect `/tools/` and 3-5 representative tool URLs.
- Submit the existing sitemap if Search Console no longer shows it as successful.
- Do not request all 50 URLs individually; allow the sitemap and internal links to drive discovery.
- Monitor indexing, impressions, click-through rate and Core Web Vitals before making further structural changes.

## Rollback

If any production issue appears, use Cloudflare's previous successful deployment or revert the GitHub commit. Because infrastructure and video metadata are unchanged, rollback is limited to the files in this package.
