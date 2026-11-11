#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const outputRoot = path.resolve(process.argv[2] || 'dist');
const sourceRoot = path.resolve('public');
const categories = [
  { file: 'videos-ai.json', category: 'AI' },
  { file: 'videos-excel.json', category: 'Excel' },
];

const cleanText = (value, field) => {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Invalid ${field}`);
  return value.trim();
};

function videoIdFor(record) {
  const direct = String(record.videoId || '').trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(direct)) return direct;
  let parsed;
  try { parsed = new URL(record.url); } catch { throw new Error(`Invalid YouTube URL for ${record.id}`); }
  const fromUrl = parsed.hostname === 'youtu.be'
    ? parsed.pathname.split('/').filter(Boolean)[0]
    : parsed.searchParams.get('v') || parsed.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1];
  if (!/^[A-Za-z0-9_-]{11}$/.test(fromUrl || '')) throw new Error(`Invalid YouTube video ID for ${record.id}`);
  return fromUrl;
}

function normalize(record, expectedCategory, index) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) throw new Error(`Invalid record ${index}`);
  if (record.category !== expectedCategory) throw new Error(`${record.id || index} has category ${record.category}; expected ${expectedCategory}`);
  if (record.privacy && String(record.privacy).toLowerCase() !== 'public') throw new Error(`${record.id || index} is not public`);
  const id = cleanText(record.id, 'id');
  const title = cleanText(record.title, `title for ${id}`);
  const description = cleanText(record.description || record.originalDescription, `description for ${id}`);
  const videoId = videoIdFor(record);
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  return {
    ...record,
    id,
    category: expectedCategory,
    title,
    description,
    url,
    videoId,
    thumbnail,
  };
}

async function loadSources() {
  const combined = [];
  const originals = {};
  for (const { file, category } of categories) {
    const sourceFile = path.join(sourceRoot, 'data', file);
    const raw = await readFile(sourceFile, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error(`${sourceFile} must contain a non-empty array`);
    originals[file] = raw;
    combined.push(...parsed.map((record, index) => normalize(record, category, index)));
  }
  const ids = new Set();
  const videoIds = new Set();
  for (const record of combined) {
    if (ids.has(record.id)) throw new Error(`Duplicate record ID: ${record.id}`);
    if (videoIds.has(record.videoId)) throw new Error(`Duplicate YouTube video ID: ${record.videoId}`);
    ids.add(record.id);
    videoIds.add(record.videoId);
  }
  return { combined, originals };
}

async function listHtml(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await listHtml(full));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) files.push(full);
  }
  return files;
}

function localeFor(relativeFile) {
  if (relativeFile === 'es/index.html' || relativeFile.startsWith('es/')) return 'es';
  if (relativeFile === 'pt-br/index.html' || relativeFile.startsWith('pt-br/')) return 'pt-br';
  return 'en';
}

function isVideoPage(relativeFile) {
  const clean = `/${relativeFile.replace(/\\/g, '/')}`;
  return /\/(?:es\/|pt-br\/)?videos(?:\/|index\.html|\.html)/i.test(clean);
}

function injectAssets(html) {
  const styleMarker = '<!-- TSD:ORIGINAL-VIDEOS:STYLE -->';
  const scriptMarker = '<!-- TSD:ORIGINAL-VIDEOS:SCRIPT -->';
  const style = `${styleMarker}<link rel="stylesheet" href="/assets/original-videos.css?v=5.0.1">`;
  const script = `${scriptMarker}<script src="/assets/original-videos.js?v=5.0.1" defer></script>`;
  let next = html
    .replace(/<!-- TSD:ORIGINAL-VIDEOS:STYLE -->\s*<link\b[^>]*>/gi, '')
    .replace(/<!-- TSD:ORIGINAL-VIDEOS:SCRIPT -->\s*<script\b[^>]*><\/script>/gi, '');
  if (!/<\/head>/i.test(next) || !/<\/body>/i.test(next)) throw new Error('Video page is missing </head> or </body>');
  next = next.replace(/<\/head>/i, `${style}</head>`);
  next = next.replace(/<\/body>/i, `${script}</body>`);
  return next;
}

const { combined, originals } = await loadSources();
await mkdir(path.join(outputRoot, 'data'), { recursive: true });
for (const [file, raw] of Object.entries(originals)) {
  await writeFile(path.join(outputRoot, 'data', file), raw.endsWith('\n') ? raw : `${raw}\n`);
}

const sorted = [...combined].sort((a, b) =>
  String(b.publishedAt || b.createdAt || '').localeCompare(String(a.publishedAt || a.createdAt || ''))
);
const compatibility = sorted.map((record, index) => ({
  ...record,
  id: record.id || index + 1,
  title: { en: record.title, es: record.title, 'pt-br': record.title },
  description: { en: record.description, es: record.description, 'pt-br': record.description },
  source: record.category === 'AI' ? 'videos-ai.json' : 'videos-excel.json',
}));
await writeFile(path.join(outputRoot, 'data', 'videos.json'), `${JSON.stringify(compatibility, null, 2)}\n`);

const htmlFiles = await listHtml(outputRoot);
const injectedByLocale = { en: 0, es: 0, 'pt-br': 0 };
for (const file of htmlFiles) {
  const relative = path.relative(outputRoot, file).split(path.sep).join('/');
  if (!isVideoPage(relative)) continue;
  const current = await readFile(file, 'utf8');
  await writeFile(file, injectAssets(current));
  injectedByLocale[localeFor(relative)] += 1;
}
for (const locale of Object.keys(injectedByLocale)) {
  if (injectedByLocale[locale] < 1) throw new Error(`No ${locale} video page found under ${outputRoot}`);
}

const manifest = {
  version: '5.0.1',
  generatedAt: new Date().toISOString(),
  authoritativeSources: categories.map(({ file }) => `/data/${file}`),
  compatibilityFile: '/data/videos.json',
  counts: {
    total: combined.length,
    AI: combined.filter((record) => record.category === 'AI').length,
    Excel: combined.filter((record) => record.category === 'Excel').length,
  },
  injectedVideoPages: injectedByLocale,
  sourceSha256: Object.fromEntries(Object.entries(originals).map(([file, raw]) => [file, createHash('sha256').update(raw).digest('hex')])),
};
await writeFile(path.join(outputRoot, 'data', 'videos-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`Prepared ${combined.length} original videos (${manifest.counts.AI} AI, ${manifest.counts.Excel} Excel); patched ${Object.values(injectedByLocale).reduce((a, b) => a + b, 0)} multilingual video pages.`);
