# TechShiftDigital.com v5.0.1 — Original Video Library Update

This is a **focused overlay update** for the existing TechShiftDigital.com v5 repository. It changes only the video data/build path and deliberately leaves the current pages, dark design, hero image, localized content, 50 tools, and Cloudflare configuration in place.

## What changes

- Uses the supplied authoritative files:
  - `public/data/videos-ai.json` — 94 AI videos
  - `public/data/videos-excel.json` — 72 Excel videos
- Produces 166 unique public video records with no duplicate record IDs or YouTube IDs.
- Loads those two categorized files directly on English, Spanish, and Brazilian Portuguese video pages.
- Uses each record's original YouTube video ID for:
  - the clickable title;
  - the clickable actual YouTube thumbnail;
  - the localized “Watch on YouTube” action.
- Keeps the existing v5 card classes (`grid`, `card`, `card-body`, `tag`, `textlink`) so the current visual design remains in control.
- Generates `dist/data/videos.json` only as a compatibility file, entirely from the two authoritative categorized sources. The old placeholder records are never trusted.
- Preserves the existing `public/data/tools.json` byte-for-byte and verifies it still contains 50 tools when that file is present.

## Deploy to the existing GitHub repository

1. Back up the current repository.
2. Extract this ZIP.
3. Upload **the contents of the extracted folder** into the root of the existing `main` branch.
4. Replace files when GitHub asks. Do **not** delete the existing `public` folder or other website files; this update is designed to merge into them.
5. Commit the change. The existing GitHub/Cloudflare connection should run `npm run build` automatically.
6. In Cloudflare, keep:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Node.js: 20 or newer
   - Production branch: `main`

No separate installer or shell command is required.

## Local verification (optional)

```bash
npm run build
npm run verify:dist
```

A successful build reports 166 original videos: 94 AI and 72 Excel. It also confirms multilingual video-page injection, correct YouTube URL/thumbnail generation, unchanged HTML page count, and unchanged 50-tool data.

## Post-deployment checks

Check the video library and category pages in all three language trees:

- English: `/videos/`
- Spanish: `/es/videos/`
- Brazilian Portuguese: `/pt-br/videos/`

Confirm that:

- Excel and AI filters show the correct categorized records;
- each thumbnail is a real `i.ytimg.com` image for that video ID;
- clicking the thumbnail, title, or action opens the same original YouTube video;
- the rest of the v5 website and its 50 tools are unchanged.
