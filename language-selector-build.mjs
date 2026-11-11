import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const SITE_ORIGIN = 'https://techshiftdigital.com';
const ROOT = process.cwd();
const LANGUAGE_PREFIXES = ['/es', '/pt-br'];
const HEAD_START = '<!-- techshift-language-selector:head:start -->';
const HEAD_END = '<!-- techshift-language-selector:head:end -->';
const DATA_START = '<!-- techshift-language-selector:data:start -->';
const DATA_END = '<!-- techshift-language-selector:data:end -->';

async function exists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function findOutputDirectory() {
  const requested = process.env.TSD_OUTPUT_DIR;
  const candidates = [requested, 'dist', 'build', 'out']
    .filter(Boolean)
    .map((entry) => path.resolve(ROOT, entry));

  for (const candidate of candidates) {
    if (await exists(path.join(candidate, 'index.html'))) return candidate;
  }

  throw new Error(
    'Language selector integration could not find the generated site. ' +
      'Run this module after the existing build has created dist/index.html, ' +
      'or set TSD_OUTPUT_DIR to the generated output directory.'
  );
}

async function walkHtml(directory) {
  const files = [];
  const entries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walkHtml(fullPath)));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) files.push(fullPath);
  }
  return files;
}

function toRoute(filePath, outputDirectory) {
  const relative = path.relative(outputDirectory, filePath).split(path.sep).join('/');
  if (relative === 'index.html') return '/';
  if (relative.endsWith('/index.html')) return `/${relative.slice(0, -'index.html'.length)}`;
  return `/${relative.replace(/\.html$/i, '')}`;
}

function languageForRoute(route) {
  if (route === '/es' || route.startsWith('/es/')) return 'es';
  if (route === '/pt-br' || route.startsWith('/pt-br/')) return 'pt-br';
  return 'en';
}

function baseRoute(route) {
  for (const prefix of LANGUAGE_PREFIXES) {
    if (route === prefix) return '/';
    if (route.startsWith(`${prefix}/`)) {
      const base = route.slice(prefix.length);
      return base || '/';
    }
  }
  return route;
}

function localizedRoute(base, language) {
  if (language === 'en') return base;
  if (base === '/') return `/${language}/`;
  return `/${language}${base.startsWith('/') ? base : `/${base}`}`;
}

function absoluteUrl(route) {
  return new URL(route, SITE_ORIGIN).href;
}

function removeMarkedBlock(html, start, end) {
  const escapedStart = start.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedEnd = end.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.replace(new RegExp(`${escapedStart}[\\s\\S]*?${escapedEnd}\\s*`, 'g'), '');
}

function injectBeforeClosing(html, closingTag, block) {
  const lower = html.toLowerCase();
  const index = lower.lastIndexOf(closingTag.toLowerCase());
  if (index === -1) return `${html}\n${block}\n`;
  return `${html.slice(0, index)}${block}\n${html.slice(index)}`;
}

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function buildRouteConfig(route, routeSet) {
  const current = languageForRoute(route);
  const base = baseRoute(route);
  const desired = {
    en: localizedRoute(base, 'en'),
    es: localizedRoute(base, 'es'),
    'pt-br': localizedRoute(base, 'pt-br')
  };
  const homes = { en: '/', es: '/es/', 'pt-br': '/pt-br/' };
  const available = Object.fromEntries(
    Object.entries(desired).map(([language, target]) => [language, routeSet.has(target)])
  );
  const routes = Object.fromEntries(
    Object.entries(desired).map(([language, target]) => [
      language,
      available[language] ? target : homes[language]
    ])
  );
  return { current, basePath: base, routes, available };
}

function headBlock(config) {
  const alternateLinks = Object.entries(config.routes)
    .filter(([language]) => config.available[language])
    .map(([language, route]) => {
      const hreflang = language === 'pt-br' ? 'pt-BR' : language;
      return `<link rel="alternate" hreflang="${hreflang}" href="${absoluteUrl(route)}">`;
    });
  if (config.available.en) {
    alternateLinks.push(
      `<link rel="alternate" hreflang="x-default" href="${absoluteUrl(config.routes.en)}">`
    );
  }

  return [
    HEAD_START,
    '<link rel="stylesheet" href="/assets/language-selector.css">',
    ...alternateLinks,
    '<script src="/assets/language-selector.js" defer></script>',
    HEAD_END
  ].join('\n');
}

function dataBlock(config) {
  return [
    DATA_START,
    `<script id="tsd-language-routes" type="application/json">${safeJson(config)}</script>`,
    DATA_END
  ].join('\n');
}

async function copyAssets(outputDirectory) {
  const sourceDirectory = path.join(ROOT, 'public', 'assets');
  const outputAssets = path.join(outputDirectory, 'assets');
  await fs.mkdir(outputAssets, { recursive: true });
  for (const name of ['language-selector.css', 'language-selector.js']) {
    const source = path.join(sourceDirectory, name);
    if (!(await exists(source))) {
      throw new Error(`Missing required source asset: ${path.relative(ROOT, source)}`);
    }
    await fs.copyFile(source, path.join(outputAssets, name));
  }
}

export async function integrateLanguageSelector() {
  const outputDirectory = await findOutputDirectory();
  await copyAssets(outputDirectory);

  const htmlFiles = await walkHtml(outputDirectory);
  const routeByFile = new Map(htmlFiles.map((file) => [file, toRoute(file, outputDirectory)]));
  const routeSet = new Set(routeByFile.values());
  let exactMappings = 0;
  let fallbackMappings = 0;

  for (const file of htmlFiles) {
    const route = routeByFile.get(file);
    const config = buildRouteConfig(route, routeSet);
    exactMappings += Object.values(config.available).filter(Boolean).length;
    fallbackMappings += Object.values(config.available).filter((value) => !value).length;

    let html = await fs.readFile(file, 'utf8');
    html = removeMarkedBlock(html, HEAD_START, HEAD_END);
    html = removeMarkedBlock(html, DATA_START, DATA_END);
    html = injectBeforeClosing(html, '</head>', `${headBlock(config)}\n`);
    html = injectBeforeClosing(html, '</body>', `${dataBlock(config)}\n`);
    await fs.writeFile(file, html, 'utf8');
  }

  console.log(
    `[language-selector] Updated ${htmlFiles.length} HTML pages in ${path.relative(ROOT, outputDirectory) || '.'}.`
  );
  console.log(
    `[language-selector] ${exactMappings} language destinations map to equivalent pages; ` +
      `${fallbackMappings} missing equivalents fall back to their language homepage.`
  );
  if (fallbackMappings) {
    console.warn(
      '[language-selector] Run node qa/verify-language-selector.mjs after the build to identify missing equivalents.'
    );
  }
}

await integrateLanguageSelector();
