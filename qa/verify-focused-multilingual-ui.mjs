#!/usr/bin/env node
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(process.argv[2] || 'dist');

async function exists(file) { try { await access(file); return true; } catch { return false; } }
async function listHtml(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await listHtml(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}
function rel(file) { return path.relative(root, file).split(path.sep).join('/'); }
function locale(file) { const r = rel(file); return r.startsWith('es/') ? 'es' : r.startsWith('pt-br/') ? 'pt-br' : 'en'; }
function englishRel(file) { return rel(file).replace(/^(?:es|pt-br)\//, ''); }
function block(html, tag) { return html.match(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'i'))?.[0] || ''; }
function imageSources(html) { return new Set([...html.matchAll(/<img\b[^>]*\bsrc=(['"])(.*?)\1/gi)].map(m => m[2])); }

if (!await exists(root)) {
  console.error(`Output directory not found: ${root}`);
  process.exit(1);
}

const files = await listHtml(root);
const failures = [];
let checked = 0;

for (const file of files) {
  const html = await readFile(file, 'utf8');
  const fileRel = rel(file);
  const header = block(html, 'header');
  const menus = (html.match(/data-tsd-language-menu/g) || []).length;
  const selectors = (html.match(/data-tsd-language-select/g) || []).length;

  if (menus !== 1) failures.push(`${fileRel}: expected one compact language menu, found ${menus}`);
  if (selectors !== 1) failures.push(`${fileRel}: expected one language select, found ${selectors}`);
  if (!/data-tsd-language-menu/.test(header)) failures.push(`${fileRel}: language menu is not inside the header`);
  if (!/multilingual-unified\.css/.test(html)) failures.push(`${fileRel}: unified stylesheet is missing`);
  if (!/multilingual-unified\.js/.test(html)) failures.push(`${fileRel}: unified script is missing`);
  if (!/<body\b[^>]*class=(['"])[^'"]*tsd-unified-dark/.test(html)) failures.push(`${fileRel}: dark theme body class is missing`);
  if (/<a\b[^>]*>\s*(?:English|Español|Português)\s*<\/a>/i.test(header)) failures.push(`${fileRel}: duplicate standalone language link remains in header`);
  if (/<(?:div|section|aside|nav|form)\b[^>]*(?:language-(?:selector|switcher|picker|bar)|locale-(?:selector|switcher)|lang-(?:selector|switcher))[^>]*>/i.test(html.replace(header, ''))) failures.push(`${fileRel}: legacy language UI remains outside header`);

  if (locale(file) !== 'en') {
    const englishFile = path.join(root, ...englishRel(file).split('/'));
    if (await exists(englishFile)) {
      const english = await readFile(englishFile, 'utf8');
      const englishLead = block(block(english, 'main'), 'section');
      const localLead = block(block(html, 'main'), 'section');
      const expected = imageSources(englishLead);
      const actual = imageSources(localLead);
      const missing = [...expected].filter(src => !actual.has(src));
      if (missing.length) failures.push(`${fileRel}: localized lead section is missing English visual(s): ${missing.join(', ')}`);
    }
  }

  checked += 1;
}

if (failures.length) {
  console.error(`Focused multilingual UI verification failed (${failures.length} issue(s)):`);
  failures.slice(0, 100).forEach(item => console.error(`- ${item}`));
  process.exit(1);
}

console.log(`Focused multilingual UI verification passed for ${checked} HTML page(s).`);
