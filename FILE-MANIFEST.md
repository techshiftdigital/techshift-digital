# File manifest

## Production files

| Path | Purpose |
|---|---|
| `multilingual-build.mjs` | Post-build generator for English integration, Spanish/Portuguese routes, SEO tags and sitemap. |
| `translations/tool-content.json` | Detailed Spanish and Brazilian Portuguese content for all 50 tools. |
| `translations/tool-inventory.json` | Canonical 50-tool slug, category and localized-title inventory. |
| `public/assets/multilingual-site.js` | Shared language dropdown, common interface localization, route switching and localized detail rendering. |
| `public/assets/multilingual-site.css` | Scoped responsive styles for the dropdown and localized information blocks. |

## Validation and documentation

| Path | Purpose |
|---|---|
| `qa/verify-content.py` | Validates counts, completeness, uniqueness, SEO lengths, FAQs and related links. |
| `qa/verify-multilingual.mjs` | Validates generated routes, titles, assets, `hreflang` and sitemap. |
| `README.md` | Installation, build, deployment, post-deployment checks and rollback. |
| `DEPLOYMENT-CHECKLIST.md` | Concise operator checklist. |
| `VALIDATION-REPORT.md` | Completed validation and explicit environment limitation. |
| `docs/IMPLEMENTATION-NOTES.md` | Architecture and design-parity notes. |
| `CHANGELOG.md` | Consolidated update summary. |
| `package.json` | Optional local check commands; no dependencies. |
| `CHECKSUMS.sha256` | SHA-256 checksums for all package files except itself. |
