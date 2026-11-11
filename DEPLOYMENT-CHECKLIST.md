# Deployment checklist

- [ ] Back up or tag the current working repository.
- [ ] Copy the package files using the exact paths in `README.md`.
- [ ] Remove the earlier `language-selector-build.mjs` import if present.
- [ ] Add `await import('./multilingual-build.mjs');` as the last line of `build.mjs`.
- [ ] Run `npm run build`.
- [ ] Confirm the report says 100 detailed tool translations are available.
- [ ] Run both QA commands from `README.md`.
- [ ] Check English pages remain unchanged apart from the dropdown.
- [ ] Check Spanish and Portuguese pages use the same header, images and cards as English.
- [ ] Check the dropdown appears in all three languages; no “All languages” text link remains visible.
- [ ] Test representative calculators and QR generation.
- [ ] Test desktop and mobile layouts.
- [ ] Deploy to the Cloudflare-connected branch.
- [ ] Confirm `sitemap-multilingual.xml` is publicly reachable.
- [ ] Monitor Cloudflare build logs and browser console for errors.
