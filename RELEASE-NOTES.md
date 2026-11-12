# TechShift Digital v5.0.4 combined deployment

## Included fixes

- Restores 166 authoritative channel videos: 94 AI and 72 Excel.
- Generates canonical YouTube watch URLs and `i.ytimg.com` thumbnails from the validated 11-character video ID.
- Adds the authoritative `source` field to every generated compatibility record.
- Makes each video thumbnail, title, and localized Watch link clickable.
- Rebuilds all nine video listing pages across English, Spanish, and Brazilian Portuguese.
- Keeps result boxes in normal layout flow on all 150 localized tool pages.
- Applies the responsive 430–560 px desktop/tablet hero height to all three homepages while preserving automatic mobile height.
- Reconciles the focused verifier and full verifier instead of disabling either one.
- Uses marker-based, repeatable injection so the build does not duplicate styles, scripts, or generated content.

## Validation completed

- Node syntax checks passed for every JavaScript and MJS file.
- JSON parsing and source counts passed: 94 AI + 72 Excel = 166 unique videos.
- A complete 187-page integration fixture built successfully.
- Verified 50 tool pages in each of three languages.
- Verified nine video pages, canonical URLs/thumbnails, and clickable title/thumbnail/watch links.
- Verified three localized homepages include the hero-height correction.
- Two consecutive clean builds produced the same SHA-256 tree hash:
  `26218c795391d718409e5b2c84f14632f2aed0626522bbbba534e8944643ad78`.

This ZIP is an overlay for the existing repository. It intentionally does not contain unrelated website pages.
