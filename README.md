# TechShift Digital v5.0.2 — homepage hero image height fix

This focused overlay reduces the large image on the right side of the homepage while keeping the existing crop, border, and rounded-corner treatment.

## What changes

- Desktop and tablet hero image height: `clamp(430px, 36vw, 560px)`.
- The image keeps `object-fit: cover`, so it fills the available frame without distortion.
- Mobile layout keeps its existing wide `1.6` aspect ratio and returns to automatic height.
- The shared `/assets/style.css` rule applies to the English, Spanish, and Brazilian Portuguese homepages.
- No text, navigation, tools, video data, images, build settings, or Cloudflare settings are changed.

## Deploy

1. Extract the ZIP.
2. Upload **everything inside the extracted folder** into the root of the existing GitHub repository.
3. Replace `public/assets/style.css` when prompted.
4. Commit to `main`; Cloudflare can then run the existing `npm run build` workflow.

Optional verification from the repository root:

```bash
node qa/verify-hero-image-height.mjs .
npm run build
```

The verification expects all three locale homepages to use `/assets/style.css` and the shared `hero-image` class.
