# Validation report

Validation completed on 2026-11-11 against representative generated English, Spanish and Brazilian Portuguese pages.

## Automated checks passed

- JavaScript syntax for the post-build and browser scripts.
- CSS and JavaScript references injected exactly once per HTML page.
- Repeat post-build execution produced no duplicate references.
- Assets copied to `dist/assets/`.
- Existing `package.json` scripts and dependencies preserved by the installer.
- Installer execution was idempotent.
- Existing selector DOM nodes were moved, not cloned.
- Known selector variants and an unknown-class three-language `<select>` fallback were detected.

## Browser checks passed

Headless Chromium checks covered native-select and custom-button selector variants.

| Language | Desktop 1440 × 900 | Mobile 390 × 844 |
|---|---:|---:|
| English | Passed | Passed |
| Spanish | Passed | Passed |
| Brazilian Portuguese | Passed | Passed |

Assertions:

- control is completely within the dark header bounds;
- desktop control is no wider than 145 px;
- mobile control is no wider than 120 px;
- no horizontal page overflow;
- no overlap with the mobile menu button;
- selector remains visible after changing a page from desktop to mobile width.

## Repository-specific verification

The source repository is private and was not available in the task workspace. The included verifier therefore checks every generated page in the actual repository after `npm run build`. Complete the visual smoke tests in `DEPLOYMENT-CHECKLIST.md` before merging the GitHub change.
