# Validation report

## Completed checks

- 50 unique tool slugs present.
- 100 detailed localized records present (50 Spanish + 50 Brazilian Portuguese).
- 400 localized FAQs present.
- Every localized record contains a title, SEO description, introduction, usage steps, method/formula, example, limitations and related tools.
- JavaScript syntax checks passed for the post-build script, browser runtime and QA verifier.
- A 50-tool fixture build completed successfully.
- The fixture produced 100 localized tool routes plus localized homepage and Tools directory routes.
- All 100 localized fixture tool pages preserved the same base stylesheet, image source, calculator-form markup and tool-script reference as the English source.
- All 100 localized tool routes passed static QA for selector assets, localized title, canonical/hreflang injection and detailed content payload.
- Multilingual sitemap generation passed.
- Rebuild logic removes stale generated language folders before regeneration.

## Browser-rendering limitation

An automated browser screenshot check was attempted, but the available Playwright browser binary was missing and the environment blocked downloading it. Static interface parity, route serving and responsive CSS were verified; final rendered review should be performed after running the package against the real repository, because the real English header and page classes were not attached to this request.

## Required repository validation

After installation, run:

```bash
npm run build
python3 qa/verify-content.py
node qa/verify-multilingual.mjs dist
```

Then manually inspect the representative desktop and mobile pages listed in `README.md`.
