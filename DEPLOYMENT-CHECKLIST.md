# Deployment checklist

## Before commit

- [ ] Package extracted at the GitHub repository root.
- [ ] Existing `package.json`, `build.mjs` and `multilingual-build.mjs` retained.
- [ ] `node scripts/apply-language-selector-header-fix.mjs` completed successfully.
- [ ] `npm run build` completed successfully.
- [ ] `node qa/verify-language-selector-header-fix.mjs dist` passed.
- [ ] Git diff contains no tool content, video JSON, image, translation or Cloudflare configuration changes.

## Desktop review

Review at 1440 px or wider:

- [ ] `/`
- [ ] `/tools/`
- [ ] One English tool page
- [ ] `/es/`
- [ ] `/es/tools/`
- [ ] One Spanish tool page
- [ ] `/pt-br/`
- [ ] `/pt-br/tools/`
- [ ] One Brazilian Portuguese tool page
- [ ] `/videos/excel/` and one localized equivalent
- [ ] `/videos/ai/` and one localized equivalent

For each page, confirm:

- [ ] No full-width language bar appears below the header.
- [ ] The selector is compact and inside the dark header at the top-right.
- [ ] The existing logo, menus and YouTube control remain aligned and clickable.
- [ ] English, Español and Português (Brasil) remain selectable.
- [ ] Switching language keeps the equivalent page and preserves the current route behavior.

## Mobile review

Review at 390 × 844 and 360 × 800:

- [ ] Selector remains inside the header and does not create horizontal scrolling.
- [ ] Logo remains visible.
- [ ] Menu toggle remains visible and clickable.
- [ ] Selector and menu toggle do not overlap.
- [ ] Dropdown options fit within the viewport.
- [ ] Keyboard focus is visible.

## Cloudflare

- [ ] Commit to the Cloudflare-connected branch.
- [ ] Cloudflare runs `npm run build` successfully.
- [ ] Deployment status is Ready.
- [ ] Repeat the homepage, tools page and one localized tool smoke test on the production URL.
