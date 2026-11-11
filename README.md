# TechShift Digital — complete replacement repository

A zero-dependency, multilingual static website for **techshiftdigital.com**. The same dark visual system, supplied hero image, page structure and compact top-navigation language dropdown are used in English, Spanish and Brazilian Portuguese.

## Included

- 50 functioning browser tools in each language (150 detailed tool pages).
- Formula, worked example, Excel guidance, four FAQs, related links and SEO on every tool page.
- Shared `public/data/tools.json` metadata.
- Shared `public/data/videos.json` with 165 AI and Excel learning records.
- English, Spanish and Brazilian Portuguese home, tools, resources, AI, insights, video, about, contact, privacy and terms routes.
- Canonical URLs, hreflang, Open Graph, JSON-LD, robots.txt and multilingual sitemap.
- GitHub validation workflow and Cloudflare Pages configuration.
- No package dependencies and no installer or manual script step.

## Important video-data note

The prior private repository and its historical video JSON were not supplied with this request. To avoid fabricating YouTube video IDs, records whose exact public watch URL was recoverable use that watch URL; the remaining learning records use a functional YouTube topic-search URL. The structure is deliberately centralized in `public/data/videos.json`, so a recovered historical list can be substituted without changing any page template.

## Cloudflare Pages settings

- Build command: `npm run build`
- Build output directory: `dist`
- Node.js: 20 or newer

See `UPLOAD-TO-GITHUB.md` for click-by-click instructions.
