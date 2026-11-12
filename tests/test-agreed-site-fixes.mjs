import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { join, relative, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';

const packageRoot = resolve(new URL('..', import.meta.url).pathname);
const fixture = await mkdtemp(join(tmpdir(), 'techshift-v505-'));

const write = async (path, content) => {
  const file = join(fixture, path);
  await mkdir(resolve(file, '..'), { recursive: true });
  await writeFile(file, content);
};

const labels = { en: 'Language', es: 'Idioma', 'pt-br': 'Idioma' };
const prefixes = { en: '', es: '/es', 'pt-br': '/pt-br' };
const actionText = { en: 'Open tool →', es: 'Abrir herramienta →', 'pt-br': 'Abrir ferramenta →' };

const header = (locale, pagePath) => {
  const prefix = prefixes[locale];
  return `<header><nav id="navigation" aria-label="Main navigation"><a href="${prefix}/tools/">Tools</a><div class="language-menu"><label for="language-select">${labels[locale]}</label><select id="language-select" data-language-select aria-label="${labels[locale]}"><option>${locale}</option></select></div><a class="btn youtube" href="https://www.youtube.com/@techshiftdigital">YouTube ↗</a></nav></header>`;
};

const page = (locale, body, pagePath) => `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><title>Fixture</title><link rel="stylesheet" href="/assets/style.css"><link rel="canonical" href="https://techshiftdigital.com${pagePath}"><script src="/assets/site.js" defer></script></head><body>${header(locale, pagePath)}<main>${body}</main></body></html>`;

const slugs = Array.from({ length: 50 }, (_value, index) => `tool-${String(index + 1).padStart(2, '0')}`);
for (const locale of Object.keys(prefixes)) {
  const prefix = prefixes[locale];
  const cards = slugs.map((slug, index) => {
    const href = `${prefix}/tools/${slug}/`;
    return `<article class="card tool-card"><span class="tag">Math</span><h2>Tool ${index + 1}</h2><p>Description</p><a href="${href}">${actionText[locale]}</a></article>`;
  }).join('');
  const indexPath = `${prefix.slice(1)}${prefix ? '/' : ''}tools/index.html`;
  await write(indexPath, page(locale, cards, `${prefix}/tools/`));

  for (const slug of slugs) {
    const detailPath = `${prefix.slice(1)}${prefix ? '/' : ''}tools/${slug}/index.html`;
    const body = `<section class="calculator card"><form data-tool="fixture"><div class="actions"><button type="submit">Calculate</button><button type="reset">Clear</button></div><output class="result" aria-live="polite"><span>Result</span><strong>—</strong><small></small></output></form></section>`;
    await write(detailPath, page(locale, body, `${prefix}/tools/${slug}/`));
  }
}

await write('assets/style.css', ':root{--cyan:#83e7ed}.result{margin-top:25px}');
await write('assets/agreed-site-fixes.css', await readFile(join(packageRoot, 'public/assets/agreed-site-fixes.css'), 'utf8'));

const run = (script) => {
  const result = spawnSync(process.execPath, [join(packageRoot, script), fixture], { encoding: 'utf8' });
  if (result.status !== 0) {
    process.stdout.write(result.stdout || '');
    process.stderr.write(result.stderr || '');
    throw new Error(`${script} failed`);
  }
};

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

const snapshot = async () => {
  const digest = createHash('sha256');
  const files = (await listFiles(fixture)).sort();
  for (const file of files) {
    digest.update(relative(fixture, file).split(sep).join('/'));
    digest.update(await readFile(file));
  }
  return digest.digest('hex');
};

try {
  run('scripts/apply-agreed-site-fixes.mjs');
  run('qa/verify-agreed-site-fixes.mjs');
  const first = await snapshot();
  run('scripts/apply-agreed-site-fixes.mjs');
  run('qa/verify-agreed-site-fixes.mjs');
  const second = await snapshot();
  if (first !== second) throw new Error('Patcher is not idempotent');
  console.log('Fixture test passed: 150 tool pages, 150 tool cards, all three locales, and idempotent output.');
} finally {
  await rm(fixture, { recursive: true, force: true });
}
