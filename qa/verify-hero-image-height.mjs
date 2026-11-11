import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.argv[2] || '.');
const desktop = '.hero-image{width:100%;height:clamp(430px,36vw,560px);aspect-ratio:auto;object-fit:cover;border-radius:12px;border:1px solid var(--line)}';
const mobile = '.hero-image{height:auto;aspect-ratio:1.6}';
const localePages = ['index.html', 'es/index.html', 'pt-br/index.html'];

function verifyTree(tree) {
  const base = resolve(root, tree);
  const cssPath = resolve(base, 'assets/style.css');
  if (!existsSync(cssPath)) throw new Error(`Missing ${tree}/assets/style.css`);
  const css = readFileSync(cssPath, 'utf8');
  if (!css.includes(desktop)) throw new Error(`${tree}: desktop hero image sizing rule is missing.`);
  if (!css.includes(mobile)) throw new Error(`${tree}: mobile hero image reset is missing.`);

  for (const rel of localePages) {
    const path = resolve(base, rel);
    if (!existsSync(path)) throw new Error(`Missing locale homepage: ${tree}/${rel}`);
    const html = readFileSync(path, 'utf8');
    if (!html.includes('/assets/style.css')) throw new Error(`${tree}/${rel} does not use the shared stylesheet.`);
    if (!html.includes('class="hero-image"')) throw new Error(`${tree}/${rel} does not contain the shared hero image.`);
  }
}

verifyTree('public');
if (existsSync(resolve(root, 'dist'))) verifyTree('dist');
console.log('Verified the shared desktop hero height and mobile reset on English, Spanish and Brazilian Portuguese homepages.');
