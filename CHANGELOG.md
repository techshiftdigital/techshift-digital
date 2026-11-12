# v5.0.6 focused hotfix

## Modified

- `scripts/apply-site-fixes.mjs`
  - canonical plain YouTube and thumbnail URL generation
  - safe handling of missing/`undefined` metadata
  - unchanged 94 AI + 72 Excel source-count guards
  - video-only cache bump to `20261112.2`

- `public/assets/original-videos.js`
  - valid thumbnail fallback assignment
  - canonical runtime links and image sources
  - targeted removal of exact `undefined`/`null` card metadata
  - unchanged search, filtering and visible-count behavior

## Added

- `qa/verify-video-thumbnail-fix.mjs`
- `README.md`
- `UPLOAD-TO-GITHUB.md`

## Not changed

- Original video JSON source files
- Calculator implementation or calculator CSS
- Header/navigation implementation
- Language selector behavior
- Tool-title linking implementation
- `original-videos.css`
