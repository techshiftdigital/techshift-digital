import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = process.cwd();
const DIST_DIR = path.resolve(PROJECT_ROOT, process.env.TSD_DIST_DIR || 'dist');
const PUBLIC_ASSET_DIR = path.resolve(PROJECT_ROOT, 'public', 'assets');
const PACKAGE_ASSET_DIR = path.resolve(SCRIPT_DIR, 'public', 'assets');
const DIST_ASSET_DIR = path.join(DIST_DIR, 'assets');

const assets = [
  'language-selector-header-fix.css',
  'language-selector-header-fix.js'
];

const styleTag = '<link rel="stylesheet" href="/assets/language-selector-header-fix.css" data-tsd-language-header-fix>';
const scriptTag = '<script src="/assets/language-selector-header-fix.js" defer data-tsd-language-header-fix></script>';

async function walkHtml(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkHtml(absolute));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) files.push(absolute);
  }
  return files;
}

function injectAsset(html, marker, tag, closingTag) {
  if (html.includes(marker)) return html;
  const index = html.toLowerCase().lastIndexOf(closingTag);
  if (index === -1) {
    throw new Error(`Cannot inject ${marker}: ${closingTag} is missing.`);
  }
  return `${html.slice(0, index)}  ${tag}\n${html.slice(index)}`;
}

async function resolveAssetSource(name) {
  const repositoryAsset = path.join(PUBLIC_ASSET_DIR, name);
  if (existsSync(repositoryAsset)) return repositoryAsset;

  const packagedAsset = path.join(PACKAGE_ASSET_DIR, name);
  if (existsSync(packagedAsset)) return packagedAsset;

  throw new Error(`Missing source asset: public/assets/${name}`);
}

async function main() {
  if (!existsSync(DIST_DIR)) {
    throw new Error(`Build output not found: ${DIST_DIR}. Run the main and multilingual builds first.`);
  }

  await mkdir(DIST_ASSET_DIR, { recursive: true });
  for (const name of assets) {
    const source = await resolveAssetSource(name);
    const destination = path.join(DIST_ASSET_DIR, name);
    if (path.resolve(source) !== path.resolve(destination)) await copyFile(source, destination);
  }

  const htmlFiles = await walkHtml(DIST_DIR);
  if (htmlFiles.length === 0) throw new Error(`No HTML files found under ${DIST_DIR}.`);

  let changed = 0;
  for (const file of htmlFiles) {
    const original = await readFile(file, 'utf8');
    let updated = injectAsset(
      original,
      'href="/assets/language-selector-header-fix.css"',
      styleTag,
      '</head>'
    );
    updated = injectAsset(
      updated,
      'src="/assets/language-selector-header-fix.js"',
      scriptTag,
      '</body>'
    );

    if (updated !== original) {
      await writeFile(file, updated, 'utf8');
      changed += 1;
    }
  }

  console.log(`[TechShift] Language selector header fix: ${htmlFiles.length} HTML files checked, ${changed} updated.`);
}

await main();
