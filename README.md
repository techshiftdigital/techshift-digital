# TechShift Digital v5.0.6 — video thumbnail hotfix

This is a focused overlay for the working v5.0.5 repository.

## Change size

Only **two production files** are replaced:

1. `scripts/apply-site-fixes.mjs`
2. `public/assets/original-videos.js`

One independent verifier and deployment notes are added. The package does not replace video data, calculator code, navigation files, CSS for the working v5.0.5 fixes, or page content.

## Corrections

- Emits plain canonical video URLs: `https://www.youtube.com/watch?v=VIDEO_ID`.
- Emits plain canonical thumbnail URLs: `https://i.ytimg.com/vi/VIDEO_ID/hqdefault.jpg`.
- Removes malformed embedded-link/backtick URL output.
- Repairs the thumbnail error fallback with the alternate `img.youtube.com` host.
- Reasserts canonical title, thumbnail and Watch-link destinations at runtime.
- Removes text nodes and metadata attributes whose complete value is `undefined` or `null` inside original video cards.
- Uses cache version `20261112.2` for the two video assets only; the v5.0.5 result-layout and hero asset versions remain `20261112.1`.
- Regenerates all nine localized video listing pages from the original categorized data.

## Preserved invariants

- 166 original videos: 94 AI and 72 Excel.
- Clickable thumbnail, title and Watch on YouTube link for every card.
- English, Spanish and Brazilian Portuguese listings.
- Existing video search and category filters.
- v5.0.5 calculator result-layout, language-selector alignment and clickable tool-title work.

## Deploy

See `UPLOAD-TO-GITHUB.md`.
