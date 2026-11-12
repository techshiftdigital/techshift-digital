#!/usr/bin/env node
import { access, readFile, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const target = path.resolve(process.argv[2] || 'dist');
const problems = [];
const fail = (message) => problems.push(message);
const exists = async (file) => { try { await access(file); return true; } catch { return false; } };
const read = async (file) => readFile(file, 'utf8').catch(() => '');
const json = async (file) => {
  try { return JSON.parse(await readFile(file, 'utf8')); }
  catch (error) { fail(`${path.relative(process.cwd(), file)}: ${error.message}`); return null; }
};
const videoId = (record) => String(record?.videoId || '').trim();
const youtubeUrl = (id) => `https://www.youtube.com/watch?v=${id}`;
const thumbnailUrl = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
const count = (text, pattern) => (text.match(pattern) || []).length;

async function walk(dir) {
  const found = [];
  if (!await exists(dir)) return found;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...await walk(full));
    else found.push(full);
  }
  return found;
}

const ai = await json(path.join(target, 'data', 'videos-ai.json'));
const excel = await json(path.join(target, 'data', 'videos-excel.json'));
if (!Array.isArray(ai) || ai.length !== 94) fail(`Expected 94 AI source records; found ${Array.isArray(ai) ? ai.length : 'invalid data'}`);
if (!Array.isArray(excel) || excel.length !== 72) fail(`Expected 72 Excel source records; found ${Array.isArray(excel) ? excel.length : 'invalid data'}`);
const originals = [...(Array.isArray(ai) ? ai : []), ...(Array.isArray(excel) ? excel : [])];
const expectedIds = new Set();
for (const [index, record] of originals.entries()) {
  const id = videoId(record);
  if (!/^[A-Za-z0-9_-]{11}$/.test(id)) fail(`Source record ${index} has invalid videoId`);
  if (expectedIds.has(id)) fail(`Duplicate source videoId: ${id}`);
  expectedIds.add(id);
}
if (originals.length !== 166 || expectedIds.size !== 166) fail(`Expected 166 unique original videos; found ${expectedIds.size}`);

const compatibility = await json(path.join(target, 'data', 'videos.json'));
if (!Array.isArray(compatibility) || compatibility.length !== 166) {
  fail(`Expected generated data/videos.json to contain 166 records; found ${Array.isArray(compatibility) ? compatibility.length : 'invalid data'}`);
} else {
  for (const record of compatibility) {
    const id = videoId(record);
    if (!expectedIds.has(id)) fail(`Generated compatibility data contains unknown videoId: ${id}`);
    if (record.url !== youtubeUrl(id)) fail(`Generated ${id} has a non-canonical YouTube URL`);
    if (record.thumbnail !== thumbnailUrl(id)) fail(`Generated ${id} has a non-canonical thumbnail URL`);
    for (const locale of ['en', 'es', 'pt-br']) {
      if (/^(?:undefined|null)$/i.test(String(record.title?.[locale] ?? '').trim())) fail(`${id} has invalid ${locale} title text`);
      if (/^(?:undefined|null)$/i.test(String(record.description?.[locale] ?? '').trim())) fail(`${id} has invalid ${locale} description text`);
    }
  }
}

const runtimeFile = path.join(target, 'assets', 'original-videos.js');
if (!await exists(runtimeFile)) {
  fail('Missing assets/original-videos.js');
} else {
  const runtime = await read(runtimeFile);
  const syntax = spawnSync(process.execPath, ['--check', runtimeFile], { encoding: 'utf8' });
  if (syntax.status !== 0) fail(`Runtime JavaScript syntax failed: ${syntax.stderr || syntax.stdout}`);
  for (const required of [
    'https://www.youtube.com/watch?v=${videoId}',
    'https://i.ytimg.com/vi/${videoId}/hqdefault.jpg',
    'https://img.youtube.com/vi/${videoId}/hqdefault.jpg',
    'thumbnailFallbackApplied',
    'removeMissingMetadata'
  ]) if (!runtime.includes(required)) fail(`Runtime is missing required behavior: ${required}`);
  if (/image\.src\s*=\s*`\s*;/.test(runtime)) fail('Runtime still contains the broken empty template-literal fallback');
}

const pageSpecs = [
  ['videos/index.html', 166],
  ['videos/ai/index.html', 94],
  ['videos/excel/index.html', 72]
];
for (const localeRoot of ['', 'es', 'pt-br']) {
  const locale = localeRoot || 'en';
  for (const [relative, expected] of pageSpecs) {
    const file = path.join(target, localeRoot, relative);
    const rel = path.relative(target, file).split(path.sep).join('/');
    if (!await exists(file)) { fail(`Missing localized video page: ${rel}`); continue; }
    const html = await read(file);
    const cards = count(html, /<article\b[^>]*\bdata-original-video-card\b/gi);
    const images = count(html, /<img\b[^>]*\bclass=["'][^"']*\boriginal-video-thumbnail\b/gi);
    const titleLinks = count(html, /<a\b[^>]*\bdata-title-link\b/gi);
    const thumbnailLinks = count(html, /<a\b[^>]*\bdata-thumbnail-link\b/gi);
    const watchLinks = count(html, /<a\b[^>]*\bdata-watch-link\b/gi);
    if (cards !== expected || images !== expected || titleLinks !== expected || thumbnailLinks !== expected || watchLinks !== expected) {
      fail(`${rel} expected ${expected} complete cards; found cards=${cards}, images=${images}, titleLinks=${titleLinks}, thumbnailLinks=${thumbnailLinks}, watchLinks=${watchLinks}`);
    }
    if (!html.includes('original-videos.css?v=20261112.2') || !html.includes('original-videos.js?v=20261112.2')) {
      fail(`${rel} is missing the v5.0.6 video assets`);
    }
    if (/href=["'](?:&lt;)?<a\b/i.test(html) || /src=["'](?:&lt;)?<a\b/i.test(html)) fail(`${rel} contains an HTML anchor embedded in a URL attribute`);
    if (/href=["'][^"']*%60/i.test(html) || /src=["'][^"']*%60/i.test(html)) fail(`${rel} contains an encoded backtick in a media URL`);
    if (/>\s*(?:undefined|null)\s*</i.test(html) || /\b(?:data-[\w-]+|title|aria-label)=["'](?:undefined|null)["']/i.test(html)) {
      fail(`${rel} contains visible or attribute-level undefined/null metadata`);
    }
    const articlePattern = /<article\b[^>]*\bdata-original-video-card\b[\s\S]*?<\/article>/gi;
    for (const card of html.match(articlePattern) || []) {
      const id = card.match(/\bdata-video-id=["']([A-Za-z0-9_-]{11})["']/i)?.[1];
      if (!id) { fail(`${rel} contains a card without a valid videoId`); continue; }
      const hrefs = [...card.matchAll(/\bhref=["']([^"']+)["']/gi)].map((match) => match[1]);
      if (hrefs.length !== 3 || hrefs.some((href) => href !== youtubeUrl(id))) fail(`${rel} card ${id} does not have three canonical YouTube links`);
      const src = card.match(/\bsrc=["']([^"']+)["']/i)?.[1];
      if (src !== thumbnailUrl(id)) fail(`${rel} card ${id} has a non-canonical thumbnail source`);
    }
    const expectedWatch = locale === 'en' ? 'Watch on YouTube' : locale === 'es' ? 'Ver en YouTube' : 'Assistir no YouTube';
    if (count(html, new RegExp(`>${expectedWatch}<`, 'g')) !== expected) fail(`${rel} does not contain ${expected} localized watch links`);
  }
}

const allHtml = (await walk(target)).filter((file) => file.endsWith('.html'));
const toolCounts = { en: 0, es: 0, 'pt-br': 0 };
for (const file of allHtml) {
  const rel = path.relative(target, file).split(path.sep).join('/');
  const match = rel.match(/^(?:(es|pt-br)\/)?tools\/[^/]+\/index\.html$/);
  if (!match) continue;
  toolCounts[match[1] || 'en'] += 1;
  const html = await read(file);
  if (!html.includes('result-layout-fix.css?v=20261112.1')) fail(`${rel} lost the v5.0.5 result-layout asset`);
}
const toolTotal = Object.values(toolCounts).reduce((sum, value) => sum + value, 0);
if (toolTotal && (toolCounts.en !== 50 || toolCounts.es !== 50 || toolCounts['pt-br'] !== 50)) {
  fail(`Tool-page counts changed: ${toolCounts.en} EN, ${toolCounts.es} ES, ${toolCounts['pt-br']} pt-BR`);
}

if (problems.length) {
  console.error(`Video thumbnail verification failed (${problems.length} issue${problems.length === 1 ? '' : 's'}):`);
  problems.forEach((problem) => console.error(`- ${problem}`));
  process.exit(1);
}
console.log(`Verified 166 original videos (94 AI, 72 Excel), 9 localized listing pages, canonical clickable YouTube links/thumbnails, safe fallback behavior, and no undefined metadata.${toolTotal ? ` Preserved ${toolTotal} calculator pages (${toolCounts.en} EN, ${toolCounts.es} ES, ${toolCounts['pt-br']} pt-BR).` : ''}`);
