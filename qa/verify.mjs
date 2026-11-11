#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { access, readFile, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const target = path.resolve(process.argv[2] || 'dist');
const sourceOnly = process.argv.includes('--source-only');
const source = path.resolve('public');
const problems = [];
const fail = (message) => problems.push(message);

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

async function json(file) {
  try { return JSON.parse(await readFile(file, 'utf8')); }
  catch (error) { fail(`${path.relative(process.cwd(), file)}: ${error.message}`); return null; }
}

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

function sha(text) { return createHash('sha256').update(text).digest('hex'); }
function videoId(record) { return String(record?.videoId || '').trim(); }
function sourceRecords(data, category, label) {
  if (!Array.isArray(data) || data.length === 0) { fail(`${label} must contain a non-empty array`); return []; }
  for (const [index, record] of data.entries()) {
    if (record.category !== category) fail(`${label}[${index}] has category ${record.category}; expected ${category}`);
    if (!/^[A-Za-z0-9_-]{11}$/.test(videoId(record))) fail(`${label}[${index}] has an invalid videoId`);
    if (typeof record.title !== 'string' || !record.title.trim()) fail(`${label}[${index}] has no title`);
    if (!String(record.url || '').includes(videoId(record))) fail(`${label}[${index}] URL does not contain its videoId`);
  }
  return data;
}

const aiPath = path.join(source, 'data', 'videos-ai.json');
const excelPath = path.join(source, 'data', 'videos-excel.json');
const ai = sourceRecords(await json(aiPath), 'AI', 'public/data/videos-ai.json');
const excel = sourceRecords(await json(excelPath), 'Excel', 'public/data/videos-excel.json');
const originals = [...ai, ...excel];
const recordIds = new Set(originals.map((record) => record.id));
const videoIds = new Set(originals.map(videoId));
if (recordIds.size !== originals.length) fail('Original video record IDs are not unique');
if (videoIds.size !== originals.length) fail('Original YouTube video IDs are not unique');
if (ai.length !== 94) fail(`Expected 94 AI records from the supplied source; found ${ai.length}`);
if (excel.length !== 72) fail(`Expected 72 Excel records from the supplied source; found ${excel.length}`);

const sourceCompatibilityPath = path.join(source, 'data', 'videos.json');
if (await exists(sourceCompatibilityPath)) {
  const sourceCompatibility = await json(sourceCompatibilityPath);
  if (!Array.isArray(sourceCompatibility) || sourceCompatibility.length !== originals.length) {
    fail(`public/data/videos.json must be a generated ${originals.length}-record compatibility file`);
  } else {
    const compatibilityIds = new Set(sourceCompatibility.map(videoId));
    if (compatibilityIds.size !== originals.length || [...videoIds].some((id) => !compatibilityIds.has(id))) {
      fail('public/data/videos.json does not match the two authoritative categorized sources');
    }
  }
}

for (const asset of ['assets/original-videos.js', 'assets/original-videos.css']) {
  if (!await exists(path.join(source, asset))) fail(`Missing public/${asset}`);
}
const runtimeFile = path.join(source, 'assets', 'original-videos.js');
if (await exists(runtimeFile)) {
  const runtime = await readFile(runtimeFile, 'utf8');
  for (const required of ['videos-ai.json', 'videos-excel.json', 'i.ytimg.com/vi/', 'Watch on YouTube', 'titleLink', 'thumbnailLink']) {
    if (!runtime.includes(required)) fail(`Runtime does not contain required behavior: ${required}`);
  }
  const syntax = spawnSync(process.execPath, ['--check', runtimeFile], { encoding: 'utf8' });
  if (syntax.status !== 0) fail(`Runtime JavaScript syntax failed: ${syntax.stderr || syntax.stdout}`);
}

if (!sourceOnly) {
  const outputAi = await readFile(path.join(target, 'data', 'videos-ai.json'), 'utf8').catch(() => '');
  const outputExcel = await readFile(path.join(target, 'data', 'videos-excel.json'), 'utf8').catch(() => '');
  const sourceAi = await readFile(aiPath, 'utf8').catch(() => '');
  const sourceExcel = await readFile(excelPath, 'utf8').catch(() => '');
  if (sha(outputAi.trim()) !== sha(sourceAi.trim())) fail('dist/data/videos-ai.json differs from the supplied original');
  if (sha(outputExcel.trim()) !== sha(sourceExcel.trim())) fail('dist/data/videos-excel.json differs from the supplied original');

  const compatibility = await json(path.join(target, 'data', 'videos.json'));
  if (!Array.isArray(compatibility) || compatibility.length !== originals.length) {
    fail(`Generated data/videos.json must contain ${originals.length} compatibility records`);
  } else {
    for (const record of compatibility) {
      if (!videoIds.has(videoId(record))) fail(`Generated compatibility record has unknown videoId: ${videoId(record)}`);
      if (record.url !== `https://www.youtube.com/watch?v=${videoId(record)}`) fail(`Generated record ${record.id} has a non-canonical YouTube URL`);
      if (record.thumbnail !== `https://i.ytimg.com/vi/${videoId(record)}/hqdefault.jpg`) fail(`Generated record ${record.id} has the wrong thumbnail`);
      if (!['videos-ai.json', 'videos-excel.json'].includes(record.source)) fail(`Generated record ${record.id} is missing its authoritative source`);
    }
  }

  const manifest = await json(path.join(target, 'data', 'videos-manifest.json'));
  if (manifest?.counts?.total !== originals.length || manifest?.counts?.AI !== ai.length || manifest?.counts?.Excel !== excel.length) {
    fail('Video manifest counts do not match the supplied categorized sources');
  }

  const htmlFiles = await list(target, '.html');
  const sourceHtml = await list(source, '.html');
  if (htmlFiles.length !== sourceHtml.length) fail(`HTML page count changed during the focused build: source ${sourceHtml.length}, dist ${htmlFiles.length}`);
  const localizedVideoPages = { en: 0, es: 0, 'pt-br': 0 };
  for (const file of htmlFiles) {
    const rel = path.relative(target, file).split(path.sep).join('/');
    if (!/(^|\/)(?:es\/|pt-br\/)?videos(?:\/|index\.html|\.html)/i.test(rel)) continue;
    const html = await readFile(file, 'utf8');
    if (!html.includes('TSD:ORIGINAL-VIDEOS:STYLE') || !html.includes('TSD:ORIGINAL-VIDEOS:SCRIPT')) fail(`${rel} is missing the original-video assets`);
    const locale = rel.startsWith('es/') ? 'es' : rel.startsWith('pt-br/') ? 'pt-br' : 'en';
    localizedVideoPages[locale] += 1;
  }
  for (const [locale, count] of Object.entries(localizedVideoPages)) if (count < 1) fail(`No patched ${locale} video page found`);

  const sourceTools = path.join(source, 'data', 'tools.json');
  const outputTools = path.join(target, 'data', 'tools.json');
  if (await exists(sourceTools)) {
    const sourceRaw = await readFile(sourceTools, 'utf8');
    const outputRaw = await readFile(outputTools, 'utf8').catch(() => '');
    if (sha(sourceRaw) !== sha(outputRaw)) fail('The existing 50-tool data changed during the focused build');
    const toolsData = JSON.parse(sourceRaw);
    const tools = Array.isArray(toolsData) ? toolsData : toolsData.tools;
    if (!Array.isArray(tools) || tools.length !== 50) fail(`Expected the existing tool inventory to contain 50 tools; found ${Array.isArray(tools) ? tools.length : 'an unsupported structure'}`);
  }
}

if (problems.length) {
  console.error(`Verification failed (${problems.length} issue${problems.length === 1 ? '' : 's'}):`);
  problems.forEach((problem) => console.error(`- ${problem}`));
  process.exit(1);
}
console.log(`Verified ${originals.length} original videos (${ai.length} AI, ${excel.length} Excel)${sourceOnly ? ' in source files' : ', multilingual video-page injection, YouTube links/thumbnails, unchanged HTML count, and preserved 50-tool data'}.`);
