import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.argv[2] || 'dist';
const fixHref = '/assets/result-layout-fix.css';
const toolRoute = /^(?:(?:es|pt-br)\/)?tools\/[^/]+\/index\.html$/;

async function collectHtmlFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const itemPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectHtmlFiles(itemPath));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(itemPath);
  }
  return files;
}

function languageFor(relativePath) {
  if (relativePath.startsWith('es/')) return 'es';
  if (relativePath.startsWith('pt-br/')) return 'pt-br';
  return 'en';
}

const cssPath = path.join(root, 'assets', 'result-layout-fix.css');
await access(cssPath);
const css = await readFile(cssPath, 'utf8');

const requiredRules = [
  'position: static !important',
  'clear: both',
  'height: auto !important',
  'max-height: none !important',
  'flex: 1 0 100% !important',
  'grid-column: 1 / -1',
  'overflow-wrap: anywhere'
];
for (const rule of requiredRules) {
  if (!css.includes(rule)) throw new Error(`Result layout stylesheet is missing: ${rule}`);
}

const counts = { en: 0, es: 0, 'pt-br': 0 };
const files = await collectHtmlFiles(root);
for (const file of files) {
  const relativePath = path.relative(root, file).split(path.sep).join('/');
  if (!toolRoute.test(relativePath)) continue;

  const html = await readFile(file, 'utf8');
  const occurrences = html.split(fixHref).length - 1;
  if (occurrences !== 1) {
    throw new Error(`${relativePath} contains ${occurrences} result-layout fix references; expected 1`);
  }
  counts[languageFor(relativePath)] += 1;
}

const values = Object.values(counts);
if (values.some((count) => count === 0)) throw new Error(`Missing tool pages for a language: ${JSON.stringify(counts)}`);
if (new Set(values).size !== 1) throw new Error(`Tool route counts differ by language: ${JSON.stringify(counts)}`);

console.log(`Result layout verification passed: ${values.reduce((sum, count) => sum + count, 0)} tool pages (${counts.en} per language).`);
