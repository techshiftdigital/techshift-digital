# Upload and deploy

1. Back up the current repository or create a branch.
2. Extract this ZIP at the repository root.
3. Upload everything inside the extracted folder to the repository root, preserving paths.
4. Allow GitHub to replace the two matching production files. Do **not** delete any other repository files.
5. Commit with: `Fix original YouTube thumbnails and video card metadata`
6. Let Cloudflare run the existing build command (`npm run build`).
7. After a successful build, the added verifier can be run locally or in CI:

   ```bash
   node qa/verify-video-thumbnail-fix.mjs dist
   ```

8. Check these pages in a private/incognito window so the previous video JavaScript is not cached:
   - `/videos/`
   - `/videos/ai/`
   - `/videos/excel/`
   - the same three paths under `/es/` and `/pt-br/`

Expected result: all thumbnails are visible; every thumbnail, title and Watch link opens the matching YouTube video; no video card displays `undefined`; and the calculator/navigation changes from v5.0.5 remain unchanged.
