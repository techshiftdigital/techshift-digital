# Validation report

## Scope

Focused post-build normalization for English, Spanish, and Brazilian Portuguese pages.

## Automated checks completed

- JavaScript syntax checks for installer, post-build processor, runtime controller, and verifier.
- Representative English/Spanish/Portuguese homepage integration.
- Representative English/Spanish/Portuguese tools-directory integration.
- Removal of oversized globe controls, detached language bars, and standalone language links.
- Exactly one compact selector per page, located inside the header.
- English shared stylesheet reuse on localized pages.
- English lead-section image reuse where localized pages lack the equivalent visual.
- Preservation of translated headings, descriptions, and action labels.
- Preservation of canonical and `hreflang` elements.
- Equivalent-route option generation.
- Automatic copying of CSS and JavaScript into the build output.
- Guarded `package.json` update with backup and existing-script preservation.
- Installer idempotency.
- Post-build processor idempotency (second run produced byte-identical HTML).

## Fixture result

```text
Focused multilingual UI verification passed for 6 HTML page(s).
```

The private production repository was not provided in this run, so the package includes a verifier that must be run against the real `dist` output before commit. The update deliberately avoids replacing `build.mjs`, `multilingual-build.mjs`, translation data, calculator code, video metadata, SEO files, Wrangler configuration, or Cloudflare settings.
