#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { access, readFile, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const args = process.argv.slice(2);
const sourceOnly = args.includes('--source-only');
const targetArg = args.find((arg) => !arg.startsWith('--'));
const target = path.resolve(targetArg || 'dist');
const source = path.resolve('public');
const problems = [];
const fail = (message) => problems.push(message);
const exists = async (file) => { try { await access(file); return true; } catch { return false; } };
const sha = (text) => createHash('sha256').update(text).digest('hex');

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
function sourceRecords(data, category, label) {
  if (!Array.isArray(data) || data.length === 0) { fail(`${label} must contain a non-empty array`); return []; }
  for (const [index, record] of data.entries()) {
    const id = String(record?.videoId || '').trim();
    if (record.category !== category) fail(`${label}[${index}] has category ${record.category}; expected ${category}`);
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) fail(`${label}[${index}] has an invalid videoId`);
    if (typeof record.title !== 'string' || !record.title.trim()) fail(`${label}[${index}] has no title`);
    if (!String(record.url || '').includes(id)) fail(`${label}[${index}] URL does not contain its videoId`);
  }
  return data;
}

const aiPath = path.join(source, 'data', 'videos-ai.json');
const excelPath = path.join(source, 'data', 'videos-excel.json');
const ai = sourceRecords(await json(aiPath), 'AI', 'public/data/videos-ai.json');
const excel = sourceRecords(await json(excelPath), 'Excel', 'public/data/videos-excel.json');
const originals = [...ai, ...excel];
const ids = new Set(originals.map((record) => String(record.videoId).trim()));
const recordIds = new Set(originals.map((record) => record.id));
if (ai.length !== 94) fail(`Expected 94 AI source records; found ${ai.length}`);
if (excel.length !== 72) fail(`Expected 72 Excel source records; found ${excel.length}`);
if (ids.size !== originals.length) fail('Original YouTube video IDs are not unique');
if (recordIds.size !== originals.length) fail('Original video record IDs are not unique');

for (const asset of ['original-videos.js', 'original-videos.css', 'result-layout-fix.css', 'homepage-hero-height-fix.css']) {
  if (!await exists(path.join(source, 'assets', asset))) fail(`Missing public/assets/${asset}`);
}
const runtimeFile = path.join(source, 'assets', 'original-videos.js');
if (await exists(runtimeFile)) {
  const syntax = spawnSync(process.execPath, ['--check', runtimeFile], { encoding: 'utf8' });
  if (syntax.status !== 0) fail(`Runtime JavaScript syntax failed: ${syntax.stderr || syntax.stdout}`);
}

const toolsPath = path.join(source, 'data', 'tools.json');
if (await exists(toolsPath)) {
  const toolsData = await json(toolsPath);
  const tools = Array.isArray(toolsData) ? toolsData : toolsData?.tools;
  if (!Array.isArray(tools) || tools.length !== 50) fail(`Expected 50 tools; found ${Array.isArray(tools) ? tools.length : 'unsupported data'}`);
}

if (!sourceOnly) {
  const sourceHtml = await list(source, '.html');
  const outputHtml = await list(target, '.html');
  if (sourceHtml.length !== outputHtml.length) fail(`HTML count changed: public has ${sourceHtml.length}; target has ${outputHtml.length}`);

  for (const [sourceFile, outputName] of [[aiPath, 'videos-ai.json'], [excelPath, 'videos-excel.json']]) {
    const sourceRaw = await readFile(sourceFile, 'utf8').catch(() => '');
    const outputRaw = await readFile(path.join(target, 'data', outputName), 'utf8').catch(() => '');
    if (sha(sourceRaw.trim()) !== sha(outputRaw.trim())) fail(`dist/data/${outputName} differs from its authoritative source`);
  }

  const generated = await json(path.join(target, 'data', 'videos.json'));
  if (!Array.isArray(generated) || generated.length !== originals.length) {
    fail(`Generated videos.json must contain ${originals.length} records`);
  } else {
    for (const record of generated) {
      const id = String(record.videoId || '');
      if (!ids.has(id)) fail(`Generated compatibility record has unknown videoId: ${id}`);
      if (record.url !== `https://www.youtube.com/watch?v=${id}`) fail(`Generated record ${id} has a non-canonical URL`);
      if (record.thumbnail !== `https://i.ytimg.com/vi/${id}/hqdefault.jpg`) fail(`Generated record ${id} has a non-canonical thumbnail`);
      if (!['videos-ai.json', 'videos-excel.json'].includes(record.source)) fail(`Generated record ${id} is missing its authoritative source`);
    }
  }

  const manifest = await json(path.join(target, 'data', 'videos-manifest.json'));
  if (manifest?.counts?.total !== 166 || manifest?.counts?.AI !== 94 || manifest?.counts?.Excel !== 72) {
    fail('Generated video manifest counts are incorrect');
  }

  if (await exists(toolsPath)) {
    const sourceTools = await readFile(toolsPath, 'utf8');
    const outputTools = await readFile(path.join(target, 'data', 'tools.json'), 'utf8').catch(() => '');
    if (sha(sourceTools) !== sha(outputTools)) fail('The existing 50-tool data changed during the build');
  }
}

if (problems.length) {
  console.error(`Verification failed (${problems.length} issue${problems.length === 1 ? '' : 's'}):`);
  problems.forEach((problem) => console.error(`- ${problem}`));
  process.exit(1);
}
console.log(sourceOnly
  ? `Source verification passed: ${originals.length} original videos and required assets.`
  : `Verified ${originals.length} original videos, unchanged HTML count, canonical links/thumbnails, and preserved tool data.`);
