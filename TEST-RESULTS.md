# Validation results

Completed on 2026-11-12 against a generated full multilingual fixture.

- JavaScript syntax checks passed for both production files and the verifier.
- Preserved exactly 166 source videos: 94 AI and 72 Excel.
- Regenerated and verified all 9 localized listing pages.
- Verified a canonical thumbnail, clickable thumbnail, clickable title and localized Watch link for every generated card.
- Verified no generated card contained visible or attribute-level `undefined`/`null` metadata.
- Verified the repaired alternate-host thumbnail fallback.
- Preserved 150 calculator pages: 50 English, 50 Spanish and 50 Brazilian Portuguese.
- Preserved fixture navigation and clickable-tool-title markers on every applicable page.
- A second application produced byte-identical output (idempotence passed).
- ZIP syntax/integrity and extracted-file checks are performed before publication.
