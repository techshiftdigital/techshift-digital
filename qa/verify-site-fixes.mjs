#!/usr/bin/env node
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.argv[2] || 'dist');
const issues = [];
const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));
const data = (name) => path.join(root, 'data', name);

let ai = [];
let excel = [];
let manifest = {};
try { ai = await readJson(data('videos-ai.json')); } catch (error) { issues.push(`data/videos-ai.json: ${error.message}`); }
try { excel = await readJson(data('videos-excel.json')); } catch (error) { issues.push(`data/videos-excel.json: ${error.message}`); }
try { manifest = await readJson(data('videos-manifest.json')); } catch (error) { issues.push(`data/videos-manifest.json: ${error.message}`); }

const total = ai.length + excel.length;
if (
  manifest.counts?.ai !== ai.length ||
  manifest.counts?.excel !== excel.length ||
  manifest.counts?.total !== total ||
  manifest.uniqueVideoCount !== total
) issues.push('Video manifest counts do not match the supplied categorized sources');

const all = [...ai, ...excel];
const uniqueIds = new Set(all.map((item) => item.videoId));
const uniqueUrls = new Set(all.map((item) => item.url));
if (uniqueIds.size !== total || uniqueUrls.size !== total) issues.push('Original video IDs and URLs must be complete and unique');

const pageSpecs = [
  ['videos/index.html', all],
  ['videos/ai/index.html', ai],
  ['videos/excel/index.html', excel]
];
for (const locale of ['', 'es', 'pt-br']) {
  for (const [relative, videos] of pageSpecs) {
    const route = [locale, relative].filter(Boolean).join('/');
    try {
      const html = await readFile(path.join(root, route), 'utf8');
      if (!html.includes('/assets/original-videos.css') || !html.includes('/assets/original-videos.js')) {
        issues.push(`${route} is missing the original-video assets`);
      }
      const cards = (html.match(/data-original-video-card/g) || []).length;
      if (cards !== videos.length) issues.push(`${route} has ${cards} original video cards; expected ${videos.length}`);
      for (const sample of videos) {
        if (!html.includes(sample.url)) issues.push(`${route} is missing original link ${sample.url}`);
        const thumbnail = `https://i.ytimg.com/vi/${encodeURIComponent(sample.videoId)}/hqdefault.jpg`;
        if (!html.includes(thumbnail)) issues.push(`${route} is missing original thumbnail ${sample.videoId}`);
      }
    } catch (error) {
      issues.push(`${route}: ${error.message}`);
    }
  }
}

async function walk(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...await walk(full));
    else found.push(full);
  }
  return found;
}

const toolCounts = { en: 0, es: 0, 'pt-br': 0 };
const routePattern = /^(?:(es|pt-br)\/)?tools\/[^/]+\/index\.html$/;
for (const file of (await walk(root)).filter((item) => item.endsWith('.html'))) {
  const route = path.relative(root, file).split(path.sep).join('/');
  const match = route.match(routePattern);
  if (!match) continue;
  const html = await readFile(file, 'utf8');
  const links = html.match(/\/assets\/result-layout-fix\.css(?:\?[^"']*)?/g) || [];
  if (links.length !== 1) issues.push(`${route} has ${links.length} result-layout stylesheet links; expected 1`);
  toolCounts[match[1] || 'en'] += 1;
}

if (toolCounts.en !== 50 || toolCounts.es !== 50 || toolCounts['pt-br'] !== 50) {
  issues.push(`Tool route parity failed: EN ${toolCounts.en}, ES ${toolCounts.es}, pt-BR ${toolCounts['pt-br']}`);
}

if (issues.length) {
  console.error(`Focused site-fix verification failed (${issues.length} issue(s)):`);
  for (const issue of issues.slice(0, 100)) console.error(`- ${issue}`);
  if (issues.length > 100) console.error(`- ...and ${issues.length - 100} more`);
  process.exit(1);
}

console.log(`Focused site-fix verification passed: ${total} original videos, 9 video pages, and 150 tool pages.`);
