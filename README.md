# TechShift Digital — Focused Multilingual UI Update

This update fixes the multilingual interface without replacing the existing site generator, translations, tools, videos, SEO data, GitHub workflow, Wrangler configuration, or Cloudflare settings.

## What it changes

- Removes the oversized globe and detached/full-width language bar.
- Removes duplicate standalone language links.
- Adds one compact native language dropdown inside the existing top navigation.
- Uses the same control on English, Spanish, and Brazilian Portuguese pages.
- Reuses the English header, dark theme, shared styles, and homepage hero media for localized pages.
- Retains localized page content, metadata, canonical links, `hreflang`, calculator markup, and scripts.
- Preserves query strings and URL fragments when switching languages.
- Falls back to a language homepage only when an equivalent localized route does not exist.

## Files added

```text
scripts/apply-focused-multilingual-ui-fix.mjs
scripts/unify-multilingual-ui.mjs
public/assets/multilingual-unified.css
public/assets/multilingual-unified.js
qa/verify-focused-multilingual-ui.mjs
```

The installer makes one guarded change to `package.json`: it appends the UI normalizer to the existing build command and adds a verification script. It backs up `package.json` first.

## Deploy

From the repository root:

```bash
node scripts/apply-focused-multilingual-ui-fix.mjs
npm run build
npm run verify:multilingual-ui
```

Then inspect the representative routes listed in `DEPLOYMENT-CHECKLIST.md`, commit, and push to the Cloudflare-connected branch.

Suggested commit message:

```text
Unify multilingual theme and compact language menu
```
