# TechShift Digital — Compact Language Selector Header Fix

This is a focused post-build update for the existing English, Spanish and Brazilian Portuguese website. It moves the current language selector out of the full-width white row and into the right side of the existing dark navigation header, then applies compact desktop and mobile styling.

## Scope

This update changes only selector placement and presentation. It does **not** replace or regenerate:

- the English, Spanish or Brazilian Portuguese page content;
- the 50 tools or their localized detail pages;
- calculator forms or calculation logic;
- images, menus or navigation links;
- Excel/AI video listings or JSON data;
- SEO metadata or multilingual route mapping;
- `build.mjs`, `multilingual-build.mjs`, Cloudflare or Wrangler configuration.

The existing selector element and its current language-switching event handlers are preserved. At runtime, it is moved into the header without cloning it.

## Files in this update

```text
language-selector-header-fix.mjs
public/assets/language-selector-header-fix.css
public/assets/language-selector-header-fix.js
scripts/apply-language-selector-header-fix.mjs
qa/verify-language-selector-header-fix.mjs
README.md
DEPLOYMENT-CHECKLIST.md
CHANGELOG.md
VALIDATION.md
```

## Deploy to the GitHub repository

1. Back up or create a branch from the current Cloudflare deployment branch.
2. Extract this package at the repository root, preserving the paths above.
3. From the repository root, run:

   ```bash
   node scripts/apply-language-selector-header-fix.mjs
   ```

   The installer preserves the existing `package.json` and appends the fix to its current build command. For the build command discussed in the deployment history, the result is:

   ```json
   "build": "node build.mjs && node multilingual-build.mjs && node language-selector-header-fix.mjs"
   ```

   If `build.mjs` already runs the multilingual integration internally, the installer still appends this fix only once and does not change that integration.

4. Build and verify:

   ```bash
   npm run build
   node qa/verify-language-selector-header-fix.mjs dist
   ```

5. Review the pages in `DEPLOYMENT-CHECKLIST.md` at desktop and mobile widths.
6. Commit the focused change to the Cloudflare-connected branch.

Suggested commit message:

```text
Fix multilingual selector placement in site header
```

## How it works

`language-selector-header-fix.mjs` runs after the existing multilingual build. It:

1. copies the two small selector-fix assets to `dist/assets/`;
2. adds one stylesheet and one deferred script reference to every generated HTML page;
3. is idempotent, so repeated builds do not duplicate either reference.

In the browser, the deferred script finds the existing selector, keeps the same DOM element and listeners, and moves it into the best matching header/navigation container. The CSS neutralizes the full-width white-bar styling and limits the control to a compact dark-header dropdown.

## Responsive behavior

- Desktop control width: at most 144 px (the dropdown itself is approximately 126 px).
- Mobile dropdown width: approximately 108 px; 98 px on very narrow screens.
- The selector remains visible in the header when the primary navigation collapses.
- A mobile menu toggle remains usable; when it is a direct header child, the selector is inserted before it.
- Keyboard focus remains visible.
- The dropdown list is constrained to the viewport.
- Reduced-motion preferences are respected.

## Rollback

1. Remove `&& node language-selector-header-fix.mjs` from `scripts.build` in `package.json`.
2. Delete the five production/update files:

   ```text
   language-selector-header-fix.mjs
   public/assets/language-selector-header-fix.css
   public/assets/language-selector-header-fix.js
   scripts/apply-language-selector-header-fix.mjs
   qa/verify-language-selector-header-fix.mjs
   ```

3. Run `npm run build` and redeploy.

The rollback does not touch multilingual content or existing selector logic.
