# TechShift Digital — combined Cloudflare build correction

This is a focused overlay for the existing repository. It does not replace the website.

## Upload without terminal commands

1. Extract the ZIP on your computer.
2. Open the `techshift-digital` repository on GitHub and make sure the branch is `main`.
3. Choose **Add file → Upload files**.
4. Drag everything inside the extracted folder onto the GitHub upload page. Keep the folders and paths exactly as supplied.
5. Choose **Commit directly to the `main` branch**.
6. Use the commit message: `Fix combined video and result layout build`.
7. Click **Commit changes**.
8. Cloudflare should automatically run `npm run build` and deploy `dist`.

Do not delete the existing `public`, `qa`, `scripts`, tools, language pages, GitHub workflow, or Cloudflare configuration. Upload this package over the repository and replace matching files only.

## Expected successful build messages

- `Restored 166 original videos (94 AI, 72 Excel) on 9 localized listing pages.`
- `Applied result layout fix to 150 tool pages (50 per language).`
- `Focused site-fix verification passed...`
- the existing complete-site verification message
- `TechShift Digital build complete: dist/`
