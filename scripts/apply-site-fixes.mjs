#!/usr/bin/env node
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.argv[2] || 'dist');
const localeRoots = ['', 'es', 'pt-br'];
const resultCssHref = '/assets/result-layout-fix.css?v=20261111.2';
const videoCssHref = '/assets/original-videos.css?v=20261111.2';
const videoJsSrc = '/assets/original-videos.js?v=20261111.2';

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const cleanText = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));

const sourcePath = (name) => path.join(root, 'data', name);
const aiSource = await readJson(sourcePath('videos-ai.json'));
const excelSource = await readJson(sourcePath('videos-excel.json'));

const normaliseVideo = (record, category, index) => {
  const videoId = cleanText(record.videoId);
  const title = cleanText(record.title);
  const url = cleanText(record.url);
  if (!videoId || !title || !url) {
    throw new Error(`${category} video ${index + 1} is missing videoId, title, or url`);
  }
  return {
    ...record,
    id: record.id || `video-${videoId}`,
    category,
    title,
    description: cleanText(record.description || record.originalDescription || title),
    url,
    videoId,
    thumbnail: `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`
  };
};

const ai = aiSource.map((item, index) => normaliseVideo(item, 'AI', index));
const excel = excelSource.map((item, index) => normaliseVideo(item, 'Excel', index));
const all = [...ai, ...excel];
const uniqueIds = new Set(all.map((item) => item.videoId));
if (uniqueIds.size !== all.length) throw new Error('The categorized video sources contain duplicate YouTube IDs');

const localized = {
  en: { watch: 'Watch on YouTube', thumbnail: 'Watch on YouTube:', count: 'videos' },
  es: { watch: 'Ver en YouTube', thumbnail: 'Ver en YouTube:', count: 'videos' },
  'pt-br': { watch: 'Assistir no YouTube', thumbnail: 'Assistir no YouTube:', count: 'vídeos' }
};

const compatibility = all.map((video, index) => ({
  id: index + 1,
  sourceId: video.id,
  category: video.category,
  title: { en: video.title, es: video.title, 'pt-br': video.title },
  description: { en: video.description, es: video.description, 'pt-br': video.description },
  url: video.url,
  videoId: video.videoId,
  youtubeId: video.videoId,
  thumbnail: video.thumbnail,
  durationSeconds: video.durationSeconds ?? null,
  publishedAt: video.publishedAt ?? null,
  createdAt: video.createdAt ?? null,
  privacy: video.privacy ?? 'Public'
}));

const manifest = {
  schemaVersion: 1,
  generatedFrom: ['videos-ai.json', 'videos-excel.json'],
  sources: { ai: 'videos-ai.json', excel: 'videos-excel.json' },
  counts: {
    ai: ai.length,
    excel: excel.length,
    total: all.length,
    AI: ai.length,
    Excel: excel.length,
    aiVideos: ai.length,
    excelVideos: excel.length,
    totalVideos: all.length
  },
  sourceCounts: { ai: ai.length, excel: excel.length, total: all.length },
  categories: { ai: ai.length, excel: excel.length, AI: ai.length, Excel: excel.length },
  ai: ai.length,
  excel: excel.length,
  total: all.length,
  aiVideos: ai.length,
  excelVideos: excel.length,
  totalVideos: all.length,
  videoCount: all.length,
  uniqueVideoCount: uniqueIds.size
};

await mkdir(path.join(root, 'data'), { recursive: true });
await writeFile(path.join(root, 'data', 'videos.json'), `${JSON.stringify(compatibility, null, 2)}\n`);
await writeFile(path.join(root, 'data', 'videos-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

const stripAsset = (html, asset) => html
  .replace(new RegExp(`<link\\b[^>]*href=["'][^"']*${asset.replace('.', '\\.')}[^"']*["'][^>]*>\\s*`, 'gi'), '')
  .replace(new RegExp(`<script\\b[^>]*src=["'][^"']*${asset.replace('.', '\\.')}[^"']*["'][^>]*>\\s*</script>\\s*`, 'gi'), '');

const injectStyle = (html, href, asset) => {
  let next = stripAsset(html, asset);
  const tag = `<link rel="stylesheet" href="${href}">`;
  return /<\/head>/i.test(next) ? next.replace(/<\/head>/i, `${tag}</head>`) : `${tag}${next}`;
};

const injectScript = (html, src, asset) => {
  let next = stripAsset(html, asset);
  const tag = `<script src="${src}" defer></script>`;
  return /<\/body>/i.test(next) ? next.replace(/<\/body>/i, `${tag}</body>`) : `${next}${tag}`;
};

const openingGrid = /<(div|section|ul)\b[^>]*(?:class=["'][^"']*\bvideo-grid\b[^"']*["']|id=["']video-grid["'])[^>]*>/i;

function findMatchingClose(html, start, tagName) {
  const tagPattern = new RegExp(`<\\/?${tagName}\\b[^>]*>`, 'gi');
  tagPattern.lastIndex = start;
  let depth = 0;
  let match;
  while ((match = tagPattern.exec(html))) {
    if (/^<\//.test(match[0])) depth -= 1;
    else if (!/\/>$/.test(match[0])) depth += 1;
    if (depth === 0) return tagPattern.lastIndex;
  }
  return -1;
}

function replaceVideoGrid(html, grid) {
  const startMarker = '<!-- TECHSHIFT ORIGINAL VIDEOS START -->';
  const endMarker = '<!-- TECHSHIFT ORIGINAL VIDEOS END -->';
  const marked = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, 'i');
  const replacement = `${startMarker}\n${grid}\n${endMarker}`;
  if (marked.test(html)) return html.replace(marked, replacement);

  const match = openingGrid.exec(html);
  if (match) {
    const close = findMatchingClose(html, match.index, match[1]);
    if (close > match.index) return `${html.slice(0, match.index)}${replacement}${html.slice(close)}`;
  }

  if (/<\/main>/i.test(html)) return html.replace(/<\/main>/i, `${replacement}\n</main>`);
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `<main>${replacement}</main>\n</body>`);
  return `${html}\n<main>${replacement}</main>\n`;
}

function cardsHtml(videos, locale) {
  const words = localized[locale];
  const cards = videos.map((video) => {
    const title = escapeHtml(video.title);
    const description = escapeHtml(video.description);
    const url = escapeHtml(video.url);
    const category = escapeHtml(video.category);
    const videoId = escapeHtml(video.videoId);
    const thumbnail = escapeHtml(video.thumbnail);
    return `<article class="video-card original-video-card" data-video-card data-original-video-card data-category="${category}">
  <a class="video-thumbnail original-video-thumbnail-link" href="${url}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(words.thumbnail)} ${title}">
    <img class="original-video-thumbnail" src="${thumbnail}" data-video-id="${videoId}" alt="${title}" width="480" height="360" loading="lazy" decoding="async">
  </a>
  <div class="video-card-body original-video-body">
    <p class="video-category">${category}</p>
    <h2 class="video-card-title original-video-title"><a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a></h2>
    <p class="video-card-description original-video-description">${description}</p>
    <a class="video-card-link original-video-watch" href="${url}" target="_blank" rel="noopener noreferrer">${escapeHtml(words.watch)}</a>
  </div>
</article>`;
  }).join('\n');
  return `<div class="video-grid original-video-grid" data-original-video-library data-video-count-total="${videos.length}" aria-label="${videos.length} ${escapeHtml(words.count)}">\n${cards}\n</div>`;
}

const pageSpecs = [
  ['videos/index.html', all],
  ['videos/ai/index.html', ai],
  ['videos/excel/index.html', excel]
];
let patchedVideoPages = 0;
for (const localeRoot of localeRoots) {
  const locale = localeRoot || 'en';
  for (const [relative, videos] of pageSpecs) {
    const file = path.join(root, localeRoot, relative);
    let html = await readFile(file, 'utf8');
    html = injectStyle(html, videoCssHref, 'original-videos.css');
    html = injectScript(html, videoJsSrc, 'original-videos.js');
    html = replaceVideoGrid(html, cardsHtml(videos, locale));
    await writeFile(file, html);
    patchedVideoPages += 1;
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

const htmlFiles = (await walk(root)).filter((file) => file.endsWith('.html'));
const routeFromFile = (file) => path.relative(root, file).split(path.sep).join('/');
const toolRoute = /^(?:(es|pt-br)\/)?tools\/[^/]+\/index\.html$/;
const toolCounts = { en: 0, es: 0, 'pt-br': 0 };
for (const file of htmlFiles) {
  const route = routeFromFile(file);
  const match = route.match(toolRoute);
  if (!match) continue;
  let html = await readFile(file, 'utf8');
  html = injectStyle(html, resultCssHref, 'result-layout-fix.css');
  await writeFile(file, html);
  toolCounts[match[1] || 'en'] += 1;
}

const toolTotal = Object.values(toolCounts).reduce((sum, count) => sum + count, 0);
console.log(`Restored ${all.length} original videos (${ai.length} AI, ${excel.length} Excel) on ${patchedVideoPages} localized listing pages.`);
console.log(`Applied result layout fix to ${toolTotal} tool pages (${toolCounts.en} EN, ${toolCounts.es} ES, ${toolCounts['pt-br']} pt-BR).`);
