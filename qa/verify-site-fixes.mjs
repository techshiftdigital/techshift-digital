#!/usr/bin/env node
import { access, readFile, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const target = path.resolve(process.argv[2] || 'dist');
const source = path.resolve('public');
const problems = [];
const fail = (message) => problems.push(message);
const exists = async (file) => { try { await access(file); return true; } catch { return false; } };
const readJson = async (file) => { try { return JSON.parse(await readFile(file, 'utf8')); } catch (e) { fail(`${path.relative(process.cwd(), file)}: ${e.message}`); return null; } };
const countOf = (text, pattern) => (text.match(pattern) || []).length;

async function list(dir, extension) {
  const files = [];
  if (!await exists(dir)) return files;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await list(full, extension));
    else if (!extension || entry.name.toLowerCase().endsWith(extension)) files.push(full);
  }
  return files;
}

const ai = await readJson(path.join(source, 'data', 'videos-ai.json'));
const excel = await readJson(path.join(source, 'data', 'videos-excel.json'));
if (!Array.isArray(ai) || ai.length !== 94) fail(`Expected 94 AI source records; found ${Array.isArray(ai) ? ai.length : 'invalid JSON'}`);
if (!Array.isArray(excel) || excel.length !== 72) fail(`Expected 72 Excel source records; found ${Array.isArray(excel) ? excel.length : 'invalid JSON'}`);
const originals = [...(Array.isArray(ai) ? ai : []), ...(Array.isArray(excel) ? excel : [])];
const expected = new Map();
for (const [index, record] of originals.entries()) {
  const videoId = String(record?.videoId || '').trim();
  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) fail(`Source record ${index + 1} has an invalid videoId`);
  if (expected.has(videoId)) fail(`Duplicate source videoId: ${videoId}`);
  expected.set(videoId, record.category);
}

for (const asset of [
  'assets/original-videos.js',
  'assets/original-videos.css',
  'assets/result-layout-fix.css',
  'assets/homepage-hero-height-fix.css'
]) {
  if (!await exists(path.join(target, asset))) fail(`Missing ${path.relative(process.cwd(), path.join(target, asset))}`);
}
const runtimeFile = path.join(target, 'assets', 'original-videos.js');
if (await exists(runtimeFile)) {
  const runtime = await readFile(runtimeFile, 'utf8');
  for (const required of ['data-original-video-library', 'data-original-video-card', 'data-video-id', 'img.youtube.com/vi/']) {
    if (!runtime.includes(required)) fail(`Video runtime is missing behavior marker: ${required}`);
  }
  const syntax = spawnSync(process.execPath, ['--check', runtimeFile], { encoding: 'utf8' });
  if (syntax.status !== 0) fail(`Video runtime syntax failed: ${syntax.stderr || syntax.stdout}`);
}

const compatibility = await readJson(path.join(target, 'data', 'videos.json'));
if (!Array.isArray(compatibility) || compatibility.length !== originals.length) {
  fail(`Generated videos.json must contain ${originals.length} records`);
} else {
  const seen = new Set();
  for (const record of compatibility) {
    const id = String(record.videoId || '');
    seen.add(id);
    if (!expected.has(id)) fail(`Generated videos.json contains unknown videoId ${id}`);
    if (record.url !== `https://www.youtube.com/watch?v=${id}`) fail(`Generated record ${id} has a non-canonical URL`);
    if (record.thumbnail !== `https://i.ytimg.com/vi/${id}/hqdefault.jpg`) fail(`Generated record ${id} has a non-canonical thumbnail`);
    const expectedSource = record.category === 'AI' ? 'videos-ai.json' : record.category === 'Excel' ? 'videos-excel.json' : '';
    if (record.source !== expectedSource) fail(`Generated record ${id} has an invalid source field`);
  }
  if (seen.size !== originals.length) fail('Generated videos.json has duplicate or missing video IDs');
}

const manifest = await readJson(path.join(target, 'data', 'videos-manifest.json'));
if (manifest?.counts?.AI !== 94 || manifest?.counts?.Excel !== 72 || manifest?.counts?.total !== 166 || manifest?.uniqueVideoCount !== 166) {
  fail('videos-manifest.json does not report 94 AI, 72 Excel, and 166 unique total videos');
}

const pageSpecs = [
  ['videos/index.html', 166], ['videos/ai/index.html', 94], ['videos/excel/index.html', 72],
  ['es/videos/index.html', 166], ['es/videos/ai/index.html', 94], ['es/videos/excel/index.html', 72],
  ['pt-br/videos/index.html', 166], ['pt-br/videos/ai/index.html', 94], ['pt-br/videos/excel/index.html', 72]
];
for (const [relative, expectedCount] of pageSpecs) {
  const file = path.join(target, relative);
  if (!await exists(file)) { fail(`Missing required video page ${relative}`); continue; }
  const html = await readFile(file, 'utf8');
  if (countOf(html, /TSD:ORIGINAL-VIDEOS:STYLE:START/g) !== 1) fail(`${relative} does not contain exactly one video stylesheet marker`);
  if (countOf(html, /TSD:ORIGINAL-VIDEOS:SCRIPT:START/g) !== 1) fail(`${relative} does not contain exactly one video runtime marker`);
  if (countOf(html, /data-original-video-card(?:\s|>)/g) !== expectedCount) fail(`${relative} does not contain ${expectedCount} video cards`);
  if (countOf(html, /data-title-link/g) !== expectedCount) fail(`${relative} does not contain ${expectedCount} clickable titles`);
  if (countOf(html, /data-thumbnail-link/g) !== expectedCount) fail(`${relative} does not contain ${expectedCount} clickable thumbnails`);
  if (countOf(html, /data-watch-link/g) !== expectedCount) fail(`${relative} does not contain ${expectedCount} watch links`);
  if (/https:\/\/(?:youtu\.be\/|www\.youtube\.com\/shorts\/)/i.test(html)) fail(`${relative} contains a non-canonical YouTube link`);
}

const htmlFiles = await list(target, '.html');
const toolRoute = /^(?:(es|pt-br)\/)?tools\/[^/]+\/index\.html$/;
const toolCounts = { en: 0, es: 0, 'pt-br': 0 };
for (const file of htmlFiles) {
  const relative = path.relative(target, file).split(path.sep).join('/');
  const match = relative.match(toolRoute);
  if (!match) continue;
  const html = await readFile(file, 'utf8');
  if (countOf(html, /TSD:RESULT-LAYOUT:STYLE:START/g) !== 1) fail(`${relative} does not contain exactly one result-layout marker`);
  toolCounts[match[1] || 'en'] += 1;
}
for (const locale of Object.keys(toolCounts)) if (toolCounts[locale] !== 50) fail(`Expected 50 ${locale} tool pages; found ${toolCounts[locale]}`);

for (const relative of ['index.html', 'es/index.html', 'pt-br/index.html']) {
  const file = path.join(target, relative);
  if (!await exists(file)) { fail(`Missing homepage ${relative}`); continue; }
  const html = await readFile(file, 'utf8');
  if (countOf(html, /TSD:HERO-HEIGHT:STYLE:START/g) !== 1) fail(`${relative} does not contain exactly one hero-height marker`);
}

if (problems.length) {
  console.error(`Focused verification failed (${problems.length} issue${problems.length === 1 ? '' : 's'}):`);
  problems.slice(0, 100).forEach((problem) => console.error(`- ${problem}`));
  if (problems.length > 100) console.error(`- …and ${problems.length - 100} more`);
  process.exit(1);
}
console.log('Focused site-fix verification passed: 166 original videos, 9 video pages, 150 tool pages, and 3 localized homepages.');
