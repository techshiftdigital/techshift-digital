#!/usr/bin/env node
import { access, copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = path.resolve(process.argv[2] || process.env.TECHSHIFT_OUTPUT_DIR || 'dist');
const VERSION = '20261111.1';
const STYLE_HREF = `/assets/multilingual-unified.css?v=${VERSION}`;
const SCRIPT_SRC = `/assets/multilingual-unified.js?v=${VERSION}`;
const LOCALES = ['en', 'es', 'pt-br'];

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

async function listHtml(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await listHtml(full));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) out.push(full);
  }
  return out;
}

function normalizeRel(file) {
  return path.relative(outputRoot, file).split(path.sep).join('/');
}

function localeFor(rel) {
  if (rel === 'es/index.html' || rel.startsWith('es/')) return 'es';
  if (rel === 'pt-br/index.html' || rel.startsWith('pt-br/')) return 'pt-br';
  return 'en';
}

function englishRel(rel) {
  if (rel.startsWith('es/')) return rel.slice(3);
  if (rel.startsWith('pt-br/')) return rel.slice(6);
  return rel;
}

function localizedRel(english, locale) {
  return locale === 'en' ? english : `${locale}/${english}`;
}

function urlForRel(rel) {
  const normalized = rel.replace(/\\/g, '/');
  if (normalized === 'index.html') return '/';
  if (normalized.endsWith('/index.html')) return `/${normalized.slice(0, -10)}`;
  return `/${normalized}`;
}

function getBlock(html, tag) {
  const match = html.match(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'i'));
  return match?.[0] || '';
}

function replaceBlock(html, tag, replacement) {
  const pattern = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'i');
  return pattern.test(html) ? html.replace(pattern, replacement) : html;
}

function getBodyClass(html) {
  return html.match(/<body\b[^>]*\bclass=(['"])(.*?)\1/i)?.[2] || '';
}

function setBodyClass(html, value) {
  return html.replace(/<body\b([^>]*)>/i, (whole, attrs) => {
    const clean = attrs.replace(/\sclass=(['"])[\s\S]*?\1/i, '');
    return `<body${clean} class="${value}">`;
  });
}

function stripTags(value) {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function tagInner(block, tag, index = 0) {
  const matches = [...block.matchAll(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi'))];
  return matches[index]?.[1] ?? null;
}

function replaceTagInner(block, tag, index, replacement) {
  let seen = -1;
  return block.replace(new RegExp(`(<${tag}\\b[^>]*>)([\\s\\S]*?)(<\\/${tag}>)`, 'gi'), (whole, open, inner, close) => {
    seen += 1;
    return seen === index ? `${open}${replacement}${close}` : whole;
  });
}

function firstSection(main) {
  return main.match(/<section\b[^>]*>[\s\S]*?<\/section>/i)?.[0] || '';
}

function localizedHero(englishMain, localeMain) {
  const source = firstSection(englishMain);
  const translated = firstSection(localeMain);
  if (!source || !translated) return localeMain;

  let merged = source;
  for (const tag of ['h1', 'h2']) {
    const value = tagInner(translated, tag);
    if (value !== null && stripTags(value)) merged = replaceTagInner(merged, tag, 0, value);
  }

  const translatedParagraphs = [...translated.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(match => match[1]);
  translatedParagraphs.forEach((value, index) => {
    if (stripTags(value)) merged = replaceTagInner(merged, 'p', index, value);
  });

  const translatedActions = [...translated.matchAll(/<(a|button)\b[^>]*>([\s\S]*?)<\/\1>/gi)]
    .map(match => ({ tag: match[1].toLowerCase(), inner: match[2] }));
  const counters = { a: 0, button: 0 };
  for (const action of translatedActions) {
    if (!stripTags(action.inner)) continue;
    merged = replaceTagInner(merged, action.tag, counters[action.tag], action.inner);
    counters[action.tag] += 1;
  }

  return localeMain.replace(firstSection(localeMain), merged);
}

function cleanLegacyLanguageUi(html) {
  let result = html;
  result = result.replace(/(<\/header>)\s*(<(div|section|aside|form)\b[^>]*>[\s\S]{0,20000}?<\/\3>)\s*(?=<main\b)/gi, (whole, closeHeader, container) => {
    const hasSelect = /<select\b/i.test(container);
    const languageHits = ['English', 'Español', 'Português'].filter(name => container.includes(name)).length;
    return hasSelect && languageHits >= 2 ? closeHeader : whole;
  });
  result = result.replace(/<div\b[^>]*data-tsd-language-menu[^>]*>[\s\S]*?<\/div>/gi, '');
  const namedContainer = /<(div|section|aside|nav|form|li|span)\b(?=[^>]*(?:id|class)=(['"])[^'"]*(?:language-(?:selector|switcher|picker|bar)|locale-(?:selector|switcher|picker)|lang-(?:selector|switcher|picker))[^'"]*\2)[^>]*>[\s\S]*?<\/\1>/gi;
  result = result.replace(namedContainer, '');

  const oldCustom = /<(section|aside|form)\b(?![^>]*data-tsd-language-menu)[^>]*>[\s\S]{0,6000}?<select\b[^>]*>[\s\S]{0,3000}?(?:English)[\s\S]{0,3000}?(?:Espa(?:ñ|&ntilde;)ol)[\s\S]{0,3000}?(?:Portugu(?:ê|&ecirc;|e)s)[\s\S]{0,3000}?<\/select>[\s\S]{0,1000}?<\/\1>/gi;
  result = result.replace(oldCustom, '');

  result = result.replace(/<a\b[^>]*>\s*(?:English|Espa(?:ñ|&ntilde;)ol|Portugu(?:ê|&ecirc;|e)s|Spanish|Portuguese)\s*<\/a>/gi, '');
  result = result.replace(/<(div|span|svg)\b(?=[^>]*(?:id|class)=(['"])[^'"]*(?:big-)?globe[^'"]*\2)[^>]*>[\s\S]*?<\/\1>/gi, '');
  result = result.replace(/<svg\b[^>]*(?:aria-label|title)=(['"])(?:Choose language|Language|Globe)\1[^>]*>[\s\S]*?<\/svg>/gi, '');
  result = result.replace(/<(p|span|label)\b[^>]*>\s*(?:Choose language|Seleccionar idioma|Escolher idioma)\s*<\/\1>/gi, '');
  return result;
}

const NAV_TRANSLATIONS = {
  es: new Map([
    ['Tools', 'Herramientas'], ['Excel resources', 'Recursos de Excel'], ['AI & Copilot', 'IA y Copilot'],
    ['Insights', 'Artículos'], ['Excel Videos', 'Videos de Excel'], ['AI Videos', 'Videos de IA'],
    ['Videos', 'Videos'], ['About', 'Acerca de'], ['YouTube', 'YouTube']
  ]),
  'pt-br': new Map([
    ['Tools', 'Ferramentas'], ['Excel resources', 'Recursos de Excel'], ['AI & Copilot', 'IA e Copilot'],
    ['Insights', 'Artigos'], ['Excel Videos', 'Vídeos de Excel'], ['AI Videos', 'Vídeos de IA'],
    ['Videos', 'Vídeos'], ['About', 'Sobre'], ['YouTube', 'YouTube']
  ])
};

function translateHeader(header, locale) {
  if (locale === 'en') return header;
  const dictionary = NAV_TRANSLATIONS[locale];
  return header.replace(/>([^<>]+)</g, (whole, text) => {
    const trimmed = text.trim();
    const replacement = dictionary.get(trimmed);
    return replacement ? `>${text.replace(trimmed, replacement)}<` : whole;
  });
}

function splitUrl(value) {
  const match = value.match(/^([^?#]*)([?#][\s\S]*)?$/);
  return { pathname: match?.[1] || value, suffix: match?.[2] || '' };
}

function relFromPathname(pathname) {
  let clean = pathname.replace(/^https?:\/\/(?:www\.)?techshiftdigital\.com/i, '');
  if (!clean.startsWith('/')) return null;
  clean = clean.replace(/^\/+/, '');
  if (!clean || clean.endsWith('/')) return `${clean}index.html`;
  return clean;
}

function localizeInternalLinks(fragment, locale, relSet) {
  return fragment.replace(/\b(href|action)=(['"])([^'"]+)\2/gi, (whole, attribute, quote, raw) => {
    if (/^(?:#|mailto:|tel:|javascript:|data:)/i.test(raw)) return whole;
    const { pathname, suffix } = splitUrl(raw);
    const rel = relFromPathname(pathname);
    if (!rel || rel.startsWith('assets/')) return whole;
    const base = englishRel(rel);
    const candidate = localizedRel(base, locale);
    if (!relSet.has(candidate)) return whole;
    return `${attribute}=${quote}${urlForRel(candidate)}${suffix}${quote}`;
  });
}

function routesFor(english, relSet) {
  const routes = {};
  for (const locale of LOCALES) {
    const candidate = localizedRel(english, locale);
    routes[locale] = relSet.has(candidate) ? urlForRel(candidate) : urlForRel(localizedRel('index.html', locale));
  }
  return routes;
}

function languageMenu(locale, routes) {
  const labels = { en: 'English', es: 'Español', 'pt-br': 'Português' };
  const accessible = locale === 'es' ? 'Idioma' : locale === 'pt-br' ? 'Idioma' : 'Language';
  const options = LOCALES.map(code => `<option value="${routes[code]}"${code === locale ? ' selected' : ''}>${labels[code]}</option>`).join('');
  return `<div class="tsd-language-menu" data-tsd-language-menu><label class="tsd-visually-hidden" for="tsd-language-select">${accessible}</label><select id="tsd-language-select" data-tsd-language-select aria-label="${accessible}">${options}</select></div>`;
}

function insertLanguageMenu(header, menu) {
  if (/<\/nav>/i.test(header)) return header.replace(/<\/nav>/i, `${menu}</nav>`);
  return header.replace(/<\/header>/i, `${menu}</header>`);
}

function sharedStyleLinks(english) {
  return [...english.matchAll(/<link\b[^>]*\brel=(['"])[^'"]*stylesheet[^'"]*\1[^>]*>/gi)]
    .map(match => match[0])
    .filter(tag => !/multilingual-(?:localized|unified)/i.test(tag));
}

function ensureHeadAssets(html, english) {
  let result = html.replace(/<link\b[^>]*\bhref=(['"])[^'"]*(?:localized-site|language-selector-header-fix)\.css[^'"]*\1[^>]*>\s*/gi, '');
  for (const tag of sharedStyleLinks(english)) {
    const href = tag.match(/\bhref=(['"])(.*?)\1/i)?.[2];
    if (href && !result.includes(href)) result = result.replace(/<\/head>/i, `${tag}\n</head>`);
  }
  if (!result.includes('/assets/multilingual-unified.css')) {
    result = result.replace(/<\/head>/i, `<link rel="stylesheet" href="${STYLE_HREF}">\n</head>`);
  }
  result = result.replace(/<script\b[^>]*\bsrc=(['"])[^'"]*(?:language-selector-header-fix|language-selector)\.js[^'"]*\1[^>]*><\/script>\s*/gi, '');
  if (!result.includes('/assets/multilingual-unified.js')) {
    result = result.replace(/<\/body>/i, `<script src="${SCRIPT_SRC}" defer></script>\n</body>`);
  }
  return result;
}

function harmonizePage(html, english, rel, relSet) {
  const locale = localeFor(rel);
  const englishPath = englishRel(rel);
  let result = cleanLegacyLanguageUi(html);

  let header = getBlock(english, 'header') || getBlock(result, 'header');
  if (header) {
    header = cleanLegacyLanguageUi(header);
    header = translateHeader(header, locale);
    header = localizeInternalLinks(header, locale, relSet);
    header = insertLanguageMenu(header, languageMenu(locale, routesFor(englishPath, relSet)));
    result = replaceBlock(result, 'header', header);
  }

  const classes = [...new Set(`${getBodyClass(english)} tsd-unified-dark`.split(/\s+/).filter(Boolean))].join(' ');
  result = setBodyClass(result, classes);

  if (locale !== 'en') {
    const englishMain = getBlock(english, 'main');
    let localMain = getBlock(result, 'main');
    const englishLead = firstSection(englishMain);
    const localLead = firstSection(localMain);
    const englishImages = [...englishLead.matchAll(/<img\b[^>]*\bsrc=(['"])(.*?)\1/gi)].map(match => match[2]);
    const localImages = new Set([...localLead.matchAll(/<img\b[^>]*\bsrc=(['"])(.*?)\1/gi)].map(match => match[2]));
    const needsEnglishVisual = englishImages.length > 0 && englishImages.some(source => !localImages.has(source));
    if (englishMain && localMain && (englishPath === 'index.html' || needsEnglishVisual)) {
      localMain = localizedHero(englishMain, localMain);
      localMain = localizeInternalLinks(localMain, locale, relSet);
      result = replaceBlock(result, 'main', localMain);
    }
  }

  result = ensureHeadAssets(result, english);
  return result;
}

if (!await exists(outputRoot)) {
  console.error(`[TechShift UI] Build output not found: ${outputRoot}`);
  process.exit(1);
}

const outputAssets = path.join(outputRoot, 'assets');
await mkdir(outputAssets, { recursive: true });
for (const asset of ['multilingual-unified.css', 'multilingual-unified.js']) {
  const source = path.join(packageRoot, 'public', 'assets', asset);
  if (!await exists(source)) {
    console.error(`[TechShift UI] Required source asset is missing: ${source}`);
    process.exit(1);
  }
  await copyFile(source, path.join(outputAssets, asset));
}

const files = await listHtml(outputRoot);
const relSet = new Set(files.map(normalizeRel));
let changed = 0;
let skipped = 0;

for (const file of files) {
  const rel = normalizeRel(file);
  const englishPath = path.join(outputRoot, ...englishRel(rel).split('/'));
  if (!await exists(englishPath)) { skipped += 1; continue; }
  const [html, english] = await Promise.all([readFile(file, 'utf8'), readFile(englishPath, 'utf8')]);
  const updated = harmonizePage(html, english, rel, relSet);
  if (updated !== html) {
    await writeFile(file, updated, 'utf8');
    changed += 1;
  }
}

console.log(`[TechShift UI] Unified ${changed} page(s); skipped ${skipped} page(s) without an English counterpart.`);
