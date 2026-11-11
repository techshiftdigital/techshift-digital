# Upload this replacement to GitHub — no terminal required

## Before you start

1. Download and extract the ZIP on your computer.
2. Open your existing GitHub repository and select the `main` branch.
3. Keep a backup of the old repository ZIP until the new Cloudflare deployment is confirmed.

## Replace the repository contents in GitHub

GitHub's normal web upload cannot reliably delete a large old tree and replace it in one click. The simplest no-terminal method is:

1. In the repository, delete the old top-level files and folders using GitHub's web interface. If GitHub offers **Delete directory**, use it. Commit the deletion.
2. Return to the repository root.
3. Choose **Add file → Upload files**.
4. Open the extracted `techshift-digital-complete` folder on your computer.
5. Select **everything inside the folder** — including `public`, `qa`, `.github`, `package.json`, `build.mjs`, `wrangler.toml`, `README.md` and the instruction files. Do not upload the outer folder itself.
6. Drag the selected items into GitHub's upload area. Preserve all folder names.
7. Enter the commit message `Replace website with complete multilingual repository`.
8. Choose **Commit directly to the main branch**, then select **Commit changes**.

If your browser refuses the large folder upload, use GitHub Desktop: **File → Add local repository**, choose the extracted folder, publish/commit to the existing repository, and push. This still requires no shell commands.

## Cloudflare

A commit to `main` should trigger Cloudflare automatically. In **Workers & Pages → techshift-digital → Settings → Builds & deployments**, confirm:

- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: blank / repository root

Then open **Deployments** and wait for **Ready**. Do not run an installer and do not add another build command.

## Check after deployment

1. Open `/`, `/es/` and `/pt-br/`.
2. Confirm the same dark theme and hero image appear in all three.
3. Confirm one compact language dropdown appears inside the top navigation; there is no globe and no separate language-link row.
4. Open `/tools/percentage-change/`, switch language and calculate a result.
5. Open `/videos/`, search, and filter Excel and AI videos.
6. Check mobile width and confirm the selector appears inside the menu without horizontal scrolling.
