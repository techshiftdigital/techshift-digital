# TechShift Digital V4: Executive Redesign

A complete replacement build based on the prior V3 requirements and retrieved conversation. The old V3 ZIP was not available locally for a file-by-file audit. Back up your existing repository and content before replacing anything. This package has not been pushed or deployed.

## Included
19 public content pages plus custom 404, six browser tools, three original practical guides, three new generated editorial images in optimized WebP, responsive navigation, accessibility basics, local content editor, build-time HTML listings, metadata, canonical URLs, social cards, sitemap, robots, security headers and legacy redirects.

## Deploy
Upload the contents of this package to your repository root. Preserve the supplied folders. Cloudflare Workers build command: npm run build. Deploy command: npx wrangler deploy. The supplied wrangler.jsonc serves dist/. For Cloudflare Pages use npm run build and output directory dist. Check the preview before production. Cloudflare configuration is included, but actual deployment has not been tested against your account.

## Preview
The dist/ folder is already built. From the package root, run python -m http.server 8000 --directory dist and open http://localhost:8000. Root-relative URLs mean double-clicking public/index.html is not a reliable preview.

## Publish Excel resources and videos
1. Open creator/index.html locally in a browser.
2. Import the current repository data/content.json before editing on a new device.
3. Add/edit entries. Excel resources have title, description, category, free/paid status, hosted download/purchase URL and optional preview image. Videos have title, description, category and an individual YouTube URL.
4. Download content.json. Replace data/content.json in GitHub and commit.
5. The configured build renders the entries into crawlable public HTML.

The editor does not upload workbooks, process payments or publish directly. Host your workbook first; paid resources link to your external store. Browser drafts are a convenience, not a backup. creator/ is outside the public deployment directory and is not a secure online CMS. Do not store credentials here.

## Content integrity
Your YouTube channel and supplied Facebook profile are preserved. Individual video URLs, workbook files, paid product URLs and the exact Upwork service URL were not recoverable from the available history. None have been invented. The resource/video listings start empty with honest guidance and working tool/channel links. Add real entries before promoting the libraries. Older content JSON may require schema migration; do not overwrite your old data without a backup.

## SEO and launch
Unique titles/descriptions/canonicals, one H1 per page, crawlable links, sitemap regenerated on build, indexable public pages, descriptive image alt text and site/page JSON-LD. No fake reviews, client logos or metrics. No keyword stuffing or guaranteed ranking claims. Add your domain to Search Console and submit the sitemap after launch. Check live URLs, HTTPS, mobile layout and actual Core Web Vitals. No live Lighthouse score is claimed.

## Privacy and terms
Browser tools do not transmit inputs. Hosting may process technical request information. External thumbnails/images create requests to their hosts. No analytics, ads or contact-form backend is included. Review the supplied policy text for your actual business and hosting setup before launch. It is not a jurisdiction-specific legal policy. Update it before adding tracking, forms, payments or ads.

## Visual credits
Three original editorial images generated with Microsoft Copilot for this redesign. No people, fabricated testimonials or implied enterprise customers.
