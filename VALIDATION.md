# Validation report

Validated on 11 November 2026.

## Automated checks

- `build.mjs` syntax: passed with Node.js.
- `qa/verify-result-layout-fix.mjs` syntax: passed with Node.js.
- Synthetic full inventory: 50 tools × 3 languages (150 tool pages).
- Fix injection: exactly one stylesheet reference on every generated tool detail page.
- Language parity: 50 English, 50 Spanish and 50 Brazilian Portuguese routes.
- Source preservation: the test confirmed no stylesheet references were written back into source HTML; the change is applied only to generated `dist` pages.
- Existing-verification handoff: passed; the original `qa/verify.mjs` remains in the build chain.

## Visual regression fixture

A representative Average calculator fixture reproduced the original fixed-height/absolutely-positioned result behavior. After the update, the result returned to normal document flow, gained clear spacing after the buttons, and expanded the calculator container before the Formula section. The update does not set colours, fonts, border colours or typography.

## Scope

Changed/added files are limited to:

1. `build.mjs`
2. `public/assets/result-layout-fix.css`
3. `qa/verify-result-layout-fix.mjs`

No calculator JavaScript, content, routes, data, videos, language-selector files or Cloudflare configuration are changed.
