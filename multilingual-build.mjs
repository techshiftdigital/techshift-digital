#!/usr/bin/env node
/**
 * TechShift Digital multilingual post-build integration.
 *
 * The script is intentionally dependency-free and idempotent. It does not
 * translate, replace or redesign page content. It only:
 *   - copies the shared language-selector runtime to dist/assets/;
 *   - removes legacy full-width language-selector markup;
 *   - injects the compact header selector runtime on every HTML page;
 *   - normalizes each document's lang attribute; and
 *   - writes hreflang links only for equivalent routes that really exist.
 */

import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const MANAGED_HEAD_START = '<!-- TSD:MULTILINGUAL:START -->';
const MANAGED_HEAD_END = '<!-- TSD:MULTILINGUAL:END -->';
const LEGACY_START = '<!-- TSD:LANGUAGE_SELECTOR:START -->';
const LEGACY_END = '<!-- TSD:LANGUAGE_SELECTOR:END -->';

const LANGUAGES = Object.freeze([
  { code: 'en', prefix: '', htmlLang: 'en' },
  { code: 'es', prefix: '/es', htmlLang: 'es' },
  { code: 'pt-BR', prefix: '/pt-br', htmlLang: 'pt-BR' },
]);

const CRITICAL_CSS = `
/* Prevent the former full-width language bar from flashing before JS cleanup. */
.language-selector:not(.tsd-language-selector),
.language-switcher:not(.tsd-language-selector),
.lang-selector:not(.tsd-language-selector),
#language-selector:not(.tsd-language-selector),
#language-switcher:not(.tsd-language-selector),
[data-language-selector]:not(.tsd-language-selector),
[data-lang-switcher]:not(.tsd-language-selector),
.all-languages-link,
[data-all-languages] { display: none !important; }
.tsd-language-selector { display: inline-flex !important; }
`.trim();

async function isDirectory(directory) {
  try {
    return (await stat(directory)).isDirectory();
  } catch {
    return false;
  }
}

async function walkHtml(directory) {
  const files = [];
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkHtml(fullPath)));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
      files.push(fullPath);
    }
  }

  return files.sort((left, right) => left.localeCompare(right));
}

function routeFromFile(filePath, outDir) {
  const relative = path.relative(outDir, filePath).split(path.sep).join('/');
  if (relative === 'index.html') return '/';
  if (relative.endsWith('/index.html')) return `/${relative.slice(0, -'index.html'.length)}`;
  return `/${relative}`;
}

function normalizedRoute(route) {
  let value = route || '/';
  if (!value.startsWith('/')) value = `/${value}`;
  value = value.replace(/\/{2,}/g, '/');
  return value === '/' || /\.[a-z0-9]+$/i.test(value) || value.endsWith('/') ? value : `${value}/`;
}

function routeInfo(route) {
  const pathname = normalizedRoute(route);
  const match = pathname.match(/^\/(es|pt-br)(?=\/|$)/i);
  const prefix = match ? match[1].toLowerCase() : '';
  let baseRoute = match ? pathname.slice(match[0].length) : pathname;
  baseRoute = normalizedRoute(baseRoute || '/');

  return {
    pathname,
    baseRoute,
    language: prefix === 'es' ? 'es' : prefix === 'pt-br' ? 'pt-BR' : 'en',
  };
}

function routeForLanguage(baseRoute, languageCode) {
  const language = LANGUAGES.find((item) => item.code === languageCode) || LANGUAGES[0];
  if (!language.prefix) return normalizedRoute(baseRoute);
  return normalizedRoute(`${language.prefix}${baseRoute === '/' ? '/' : baseRoute}`);
}

function escapeAttribute(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function removeManagedBlock(html, start, end) {
  const escapedStart = start.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedEnd = end.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.replace(new RegExp(`${escapedStart}[\\s\\S]*?${escapedEnd}\\s*`, 'gi'), '');
}

function removeLegacySelectorMarkup(html) {
  let output = removeManagedBlock(html, LEGACY_START, LEGACY_END);

  // Remove previous versions of the same asset so each page receives one copy.
  output = output.replace(
    /<script\b[^>]*\bsrc=["'][^"']*\/assets\/multilingual-site\.js(?:\?[^"']*)?["'][^>]*>\s*<\/script>\s*/gi,
    '',
  );

  // Remove common standalone legacy bars. The expression is deliberately
  // limited to a single div/section so it cannot consume the page header.
  output = output.replace(
    /<(div|section)\b(?=[^>]*(?:data-language-selector|data-lang-switcher|id=["'](?:language-selector|language-switcher)["']|class=["'][^"']*(?:language-selector|language-switcher|lang-selector)[^"']*["']))[^>]*>[\s\S]*?<\/\1>\s*/gi,
    '',
  );

  return output;
}

function setHtmlLanguage(html, htmlLang) {
  if (/<html\b[^>]*\blang\s*=/i.test(html)) {
    return html.replace(/(<html\b[^>]*\blang\s*=\s*)["'][^"']*["']/i, `$1"${htmlLang}"`);
  }
  return html.replace(/<html\b/i, `<html lang="${htmlLang}"`);
}

function removeExistingHreflang(html) {
  return html.replace(/<link\b(?=[^>]*\brel=["'][^"']*alternate[^"']*["'])(?=[^>]*\bhreflang=)[^>]*>\s*/gi, '');
}

function injectIntoHead(html, content) {
  if (/<\/head\s*>/i.test(html)) {
    return html.replace(/<\/head\s*>/i, `${content}\n</head>`);
  }
  if (/<body\b/i.test(html)) {
    return html.replace(/<body\b/i, `<head>\n${content}\n</head>\n<body`);
  }
  return `${content}\n${html}`;
}

function buildManagedHead({ route, routeSet, assetVersion, siteOrigin }) {
  const { baseRoute } = routeInfo(route);
  const alternates = [];

  for (const language of LANGUAGES) {
    const candidate = routeForLanguage(baseRoute, language.code);
    if (!routeSet.has(candidate)) continue;
    alternates.push(
      `<link rel="alternate" hreflang="${language.code}" href="${escapeAttribute(siteOrigin + candidate)}">`,
    );
  }

  const englishRoute = routeForLanguage(baseRoute, 'en');
  if (routeSet.has(englishRoute)) {
    alternates.push(
      `<link rel="alternate" hreflang="x-default" href="${escapeAttribute(siteOrigin + englishRoute)}">`,
    );
  }

  return [
    MANAGED_HEAD_START,
    `<style id="tsd-language-selector-critical">${CRITICAL_CSS}</style>`,
    ...alternates,
    `<script defer src="/assets/multilingual-site.js?v=${assetVersion}" data-tsd-multilingual></script>`,
    MANAGED_HEAD_END,
  ].join('\n');
}

export async function runMultilingualBuild(options = {}) {
  const rootDir = path.resolve(options.rootDir || MODULE_DIR);
  const outDir = path.resolve(options.outDir || process.env.TECHSHIFT_DIST_DIR || path.join(rootDir, 'dist'));
  const sourceAsset = path.resolve(
    options.sourceAsset || path.join(rootDir, 'public', 'assets', 'multilingual-site.js'),
  );
  const targetAsset = path.join(outDir, 'assets', 'multilingual-site.js');
  const siteOrigin = String(options.siteOrigin || process.env.TECHSHIFT_SITE_ORIGIN || 'https://techshiftdigital.com')
    .replace(/\/+$/, '');

  if (!(await isDirectory(outDir))) {
    throw new Error(`Build output directory was not found: ${outDir}`);
  }

  const assetContent = await readFile(sourceAsset);
  const assetVersion = createHash('sha256').update(assetContent).digest('hex').slice(0, 12);
  await mkdir(path.dirname(targetAsset), { recursive: true });
  if (path.resolve(sourceAsset) !== path.resolve(targetAsset)) {
    await cp(sourceAsset, targetAsset, { force: true });
  }

  const htmlFiles = await walkHtml(outDir);
  if (htmlFiles.length === 0) {
    throw new Error(`No HTML files were found in ${outDir}`);
  }

  const routeEntries = htmlFiles.map((filePath) => ({
    filePath,
    route: normalizedRoute(routeFromFile(filePath, outDir)),
  }));
  const routeSet = new Set(routeEntries.map(({ route }) => route));
  const localizedGroups = new Set();

  for (const entry of routeEntries) {
    const info = routeInfo(entry.route);
    localizedGroups.add(info.baseRoute);

    let html = await readFile(entry.filePath, 'utf8');
    html = removeManagedBlock(html, MANAGED_HEAD_START, MANAGED_HEAD_END);
    html = removeLegacySelectorMarkup(html);
    html = removeExistingHreflang(html);
    html = setHtmlLanguage(html, LANGUAGES.find((item) => item.code === info.language)?.htmlLang || 'en');
    html = injectIntoHead(
      html,
      buildManagedHead({
        route: entry.route,
        routeSet,
        assetVersion,
        siteOrigin,
      }),
    );
    await writeFile(entry.filePath, html, 'utf8');
  }

  const result = {
    htmlFiles: htmlFiles.length,
    localizedRoutes: localizedGroups.size,
    assetVersion,
    outDir,
  };

  if (!options.quiet) {
    console.log(
      `Multilingual integration complete: ${result.htmlFiles} pages; ` +
        `${result.localizedRoutes} equivalent route groups; asset ${result.assetVersion}.`,
    );
  }
  return result;
}

const invokedDirectly = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (invokedDirectly) {
  runMultilingualBuild().catch((error) => {
    console.error(`Multilingual build failed: ${error.message}`);
    process.exitCode = 1;
  });
}

export const __test = Object.freeze({ normalizedRoute, routeInfo, routeForLanguage });
