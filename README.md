# TechShift Digital — Consolidated Multilingual Update

This is the **single deployment package** for the Spanish and Brazilian Portuguese improvements. It replaces the earlier separate multilingual-page and language-selector updates.

## What this package fixes

1. **Detailed localized tools:** all 50 tools have Spanish and Brazilian Portuguese content (100 localized tool experiences), including an introduction, usage steps, method/formula, practical example, limitations, four FAQs and related tools.
2. **Same interface in every language:** the normal English build is the visual master. Localized pages are cloned from the current English output, preserving the same HTML structure, CSS classes, images, calculator form and tool scripts.
3. **One language dropdown everywhere:** English, Español and Português (Brasil) use the same accessible dropdown on desktop and mobile. Old “All languages” links/selectors are hidden to prevent two competing controls.
4. **SEO support:** localized titles and descriptions for all 50 tools, canonical links, `hreflang` for all three variants and a multilingual sitemap.

## Important safety model

- English pages and URLs remain the master version.
- Existing calculator logic, video JSON, images, base stylesheet, GitHub workflow and Cloudflare configuration are not replaced.
- The multilingual step runs **after** the existing build.
- Existing generated `/es/` and `/pt-br/` output is cleared and regenerated from the current English build on every run; stale localized files cannot survive.
- No paid translation service, external database or new runtime dependency is used.

## Install

1. Back up the current repository or note the last working commit.
2. Extract this package.
3. Copy these paths to the repository root, preserving their paths:

```text
multilingual-build.mjs
translations/tool-content.json
translations/tool-inventory.json
public/assets/multilingual-site.css
public/assets/multilingual-site.js
qa/verify-content.py
qa/verify-multilingual.mjs
```

4. Remove the earlier selector hook if it is present:

```js
await import('./language-selector-build.mjs');
```

5. Add this as the **last line** of the existing root `build.mjs`:

```js
await import('./multilingual-build.mjs');
```

6. Run the normal build:

```bash
npm run build
```

The default output folder is `dist`. If the existing build uses another output folder:

```bash
TSD_BUILD_DIR=your-output-folder npm run build
```

7. Validate:

```bash
python3 qa/verify-content.py
node qa/verify-multilingual.mjs dist
```

8. Commit to the branch connected to Cloudflare.

Suggested commit message:

```text
Unify multilingual design, dropdown and detailed tool content
```

## Post-deployment checks

Test all three language variants for:

- Homepage and top navigation.
- `/tools/`, `/es/tools/`, `/pt-br/tools/`.
- Percentage Change, CAGR, JSON Formatter, Working Days, QR Code and BMI tools.
- Calculator input, Calculate and Reset actions.
- Desktop and mobile language dropdown.
- Same hero/logo/tool images in all languages.
- Correct equivalent-page switching among languages.
- `https://techshiftdigital.com/sitemap-multilingual.xml`.

## Files not to replace

Do not replace the existing:

```text
build.mjs                 (add only the one-line import)
package.json
wrangler.jsonc
data/videos-ai.json
data/videos-excel.json
public/assets/style.css
public/assets/vendor/qr-bundle.js
```

## Rollback

1. Remove the final `await import('./multilingual-build.mjs');` line from `build.mjs`.
2. Remove the files copied from this package.
3. Rebuild and redeploy the last known-good commit.

See `docs/IMPLEMENTATION-NOTES.md` and `VALIDATION-REPORT.md` for details.
