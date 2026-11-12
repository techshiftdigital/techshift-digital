import { readFile, readdir } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';

const root = resolve(process.argv[2] || 'dist');
const errors = [];

const listFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(path));
    else files.push(path);
  }
  return files;
};

const webPath = (file) => relative(root, file).split(sep).join('/');
const isToolIndex = (path) => /^(?:es\/|pt-br\/)?tools\/index\.html$/i.test(path);
const isToolDetail = (path) => /^(?:es\/|pt-br\/)?tools\/[^/]+\/index\.html$/i.test(path);
const anchorsIn = (html) => [...html.matchAll(/<a\b[^>]*\bhref=(['"])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi)];

const files = await listFiles(root);
const htmlFiles = files.filter((file) => file.toLowerCase().endsWith('.html'));
const details = { en: [], es: [], 'pt-br': [] };
const indexes = {};

for (const file of htmlFiles) {
  const path = webPath(file);
  if (isToolDetail(path)) {
    if (path.startsWith('es/')) details.es.push(file);
    else if (path.startsWith('pt-br/')) details['pt-br'].push(file);
    else details.en.push(file);
  }
  if (isToolIndex(path)) indexes[path] = file;
}

for (const [locale, localeFiles] of Object.entries(details)) {
  if (localeFiles.length !== 50) errors.push(`${locale}: expected 50 tool detail pages, found ${localeFiles.length}`);
  for (const file of localeFiles) {
    const path = webPath(file);
    const html = await readFile(file, 'utf8');
    if (!/\/assets\/agreed-site-fixes\.css\?v=20261112\.2/i.test(html)) errors.push(`${path}: missing agreed fixes stylesheet`);
    if (!/<output\b[^>]*\bclass=(['"])[^'"]*\bresult\b[^'"]*\1/i.test(html)) errors.push(`${path}: missing output.result calculator result`);
    if (!/<select\b[^>]*\bdata-language-select\b/i.test(html)) errors.push(`${path}: missing accessible language selector`);
    if (!/<label\b[^>]*\bclass=(['"])[^'"]*\bsr-only\b[^'"]*\1[^>]*\bfor=(['"])language-select\2/i.test(html)
      && !/<label\b[^>]*\bfor=(['"])language-select\1[^>]*\bclass=(['"])[^'"]*\bsr-only\b[^'"]*\2/i.test(html)) {
      errors.push(`${path}: language label is not screen-reader-only`);
    }
    const nav = html.match(/<nav\b[^>]*\bid=(['"])navigation\1[^>]*>[\s\S]*?<\/nav>/i)?.[0] || '';
    if (!nav) errors.push(`${path}: missing main navigation`);
    else if (!/<a\b[^>]*\bclass=(['"])[^'"]*\byoutube\b[^'"]*\1[^>]*>[\s\S]*?<\/a>\s*<div\b[^>]*\bclass=(['"])[^'"]*\blanguage-menu\b[^'"]*\2/i.test(nav)) {
      errors.push(`${path}: language menu is not immediately after the YouTube button`);
    }
  }
}

const expectedIndexes = ['tools/index.html', 'es/tools/index.html', 'pt-br/tools/index.html'];
for (const path of expectedIndexes) {
  const file = indexes[path];
  if (!file) {
    errors.push(`${path}: missing tool index`);
    continue;
  }
  const html = await readFile(file, 'utf8');
  const cards = html.match(/<article\b[^>]*\bclass=(['"])[^'"]*\btool-card\b[^'"]*\1[^>]*>[\s\S]*?<\/article>/gi) || [];
  if (cards.length !== 50) errors.push(`${path}: expected 50 tool cards, found ${cards.length}`);
  cards.forEach((card, index) => {
    const heading = card.match(/<h[23]\b[^>]*>([\s\S]*?)<\/h[23]>/i)?.[1] || '';
    const titleHref = heading.match(/<a\b[^>]*\bclass=(['"])[^'"]*\btool-title-link\b[^'"]*\1[^>]*\bhref=(['"])(.*?)\2/i)?.[3]
      || heading.match(/<a\b[^>]*\bhref=(['"])(.*?)\1[^>]*\bclass=(['"])[^'"]*\btool-title-link\b[^'"]*\3/i)?.[2];
    const anchors = anchorsIn(card);
    const actionHref = anchors.at(-1)?.[2];
    if (!titleHref) errors.push(`${path}: card ${index + 1} title is not clickable`);
    else if (!actionHref) errors.push(`${path}: card ${index + 1} has no existing action link`);
    else if (titleHref !== actionHref) errors.push(`${path}: card ${index + 1} title URL differs from action URL`);
  });
}

const cssPath = join(root, 'assets', 'agreed-site-fixes.css');
let css = '';
try { css = await readFile(cssPath, 'utf8'); } catch { errors.push('assets/agreed-site-fixes.css: missing'); }
for (const [description, pattern] of [
  ['block-level calculator result rule', /output\.result[\s\S]*?display:\s*block\s*!important/i],
  ['full-width calculator result rule', /output\.result[\s\S]*?width:\s*100%\s*!important/i],
  ['normal-flow calculator result rule', /output\.result[\s\S]*?position:\s*static\s*!important/i],
  ['visually hidden language label rule', /\.language-menu\s*>\s*label[\s\S]*?clip-path:\s*inset\(50%\)/i],
  ['desktop language alignment rule', /header\s+\.language-menu[\s\S]*?align-items:\s*center/i],
  ['mobile language-selector rule', /@media\s*\(max-width:\s*760px\)[\s\S]*?\.language-menu/i],
]) {
  if (!pattern.test(css)) errors.push(`CSS missing ${description}`);
}

let manifest;
try { manifest = JSON.parse(await readFile(join(root, 'assets', 'agreed-site-fixes-manifest.json'), 'utf8')); }
catch { errors.push('assets/agreed-site-fixes-manifest.json: missing or invalid'); }
if (manifest) {
  for (const locale of ['en', 'es', 'pt-br']) {
    if (manifest.toolDetailPages?.[locale] !== 50) errors.push(`manifest: ${locale} tool count is not 50`);
  }
  if (manifest.toolCards !== 150) errors.push(`manifest: expected 150 tool cards, found ${manifest.toolCards}`);
  if (manifest.linkedToolTitles !== 150) errors.push(`manifest: expected 150 linked titles, found ${manifest.linkedToolTitles}`);
}

if (errors.length) {
  console.error(`TechShift Digital agreed-fixes verification failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('TechShift Digital agreed-fixes verification passed.');
console.log('Verified 50 English + 50 Spanish + 50 Brazilian Portuguese tool pages and 150 matching title/action links.');
