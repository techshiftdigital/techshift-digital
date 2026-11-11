# Deployment checklist

## Before deployment

- [ ] Back up or create a Git branch.
- [ ] Extract this package at the repository root.
- [ ] Confirm `package.json`, `build.mjs`, and the `public/` folder are in the same repository root.

## Install and verify

```bash
node scripts/apply-focused-multilingual-ui-fix.mjs
npm run build
npm run verify:multilingual-ui
```

The installer preserves the existing build command and appends:

```text
node scripts/unify-multilingual-ui.mjs dist
```

If the Cloudflare output directory is not `dist`, replace `dist` in the appended command and in `verify:multilingual-ui` with the configured output directory.

## Visual review

Desktop:

- [ ] `/`
- [ ] `/es/`
- [ ] `/pt-br/`
- [ ] `/tools/`
- [ ] `/es/tools/`
- [ ] `/pt-br/tools/`
- [ ] One calculator in each language
- [ ] One resource/video page in each language

Mobile (approximately 390 × 844):

- [ ] Dropdown remains inside the header.
- [ ] No horizontal overflow.
- [ ] Menu and dropdown do not overlap.
- [ ] No globe or detached white language bar appears.

Functional/SEO:

- [ ] Each language change stays on an equivalent page when available.
- [ ] Calculator inputs and results still work.
- [ ] Videos and external YouTube links still work.
- [ ] Canonical and `hreflang` elements remain present.
- [ ] `robots.txt` and sitemap output are unchanged.
- [ ] Cloudflare build output remains `dist` (or the repository’s existing configured directory).

## Rollback

1. Restore the backed-up `package.json` from `.techshift-backups/`.
2. Remove the five files listed in `README.md`.
3. Rebuild and redeploy.
