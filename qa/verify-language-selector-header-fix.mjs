import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const distDir = path.resolve(process.cwd(), process.argv[2] || 'dist');
const cssRef = 'href="/assets/language-selector-header-fix.css"';
const jsRef = 'src="/assets/language-selector-header-fix.js"';

async function walkHtml(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkHtml(absolute));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) files.push(absolute);
  }
  return files;
}

function occurrences(haystack, needle) {
  return haystack.split(needle).length - 1;
}

if (!existsSync(distDir)) throw new Error(`Build output not found: ${distDir}`);

for (const name of ['language-selector-header-fix.css', 'language-selector-header-fix.js']) {
  const asset = path.join(distDir, 'assets', name);
  if (!existsSync(asset)) throw new Error(`Missing built asset: ${asset}`);
  if ((await stat(asset)).size === 0) throw new Error(`Built asset is empty: ${asset}`);
}

const htmlFiles = await walkHtml(distDir);
if (htmlFiles.length === 0) throw new Error(`No HTML files found under ${distDir}`);

const failures = [];
const languageCounts = { en: 0, es: 0, 'pt-br': 0 };
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  if (occurrences(html, cssRef) !== 1) failures.push(`${file}: expected one CSS reference`);
  if (occurrences(html, jsRef) !== 1) failures.push(`${file}: expected one JS reference`);

  const relative = path.relative(distDir, file).replaceAll(path.sep, '/');
  if (relative.startsWith('es/')) languageCounts.es += 1;
  else if (relative.startsWith('pt-br/')) languageCounts['pt-br'] += 1;
  else languageCounts.en += 1;
}

for (const [language, count] of Object.entries(languageCounts)) {
  if (count === 0) failures.push(`No ${language} HTML pages found in the build output`);
}

if (failures.length) {
  console.error(failures.slice(0, 30).join('\n'));
  if (failures.length > 30) console.error(`...and ${failures.length - 30} more failures`);
  process.exitCode = 1;
} else {
  console.log(`[TechShift] Selector header verification passed: ${htmlFiles.length} pages (${languageCounts.en} English, ${languageCounts.es} Spanish, ${languageCounts['pt-br']} Brazilian Portuguese).`);
}
