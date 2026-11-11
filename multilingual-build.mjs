#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(process.argv[2] || process.env.TSD_BUILD_DIR || 'dist');
const locales = ['es', 'pt-br'];
const site = 'https://techshiftdigital.com';
const START_HEAD = '<!-- TSD-MULTILINGUAL:HEAD:START -->';
const END_HEAD = '<!-- TSD-MULTILINGUAL:HEAD:END -->';
const START_BODY = '<!-- TSD-MULTILINGUAL:BODY:START -->';
const END_BODY = '<!-- TSD-MULTILINGUAL:BODY:END -->';

const content = JSON.parse(await fs.readFile(path.join(HERE, 'translations/tool-content.json'), 'utf8'));
const inventory = JSON.parse(await fs.readFile(path.join(HERE, 'translations/tool-inventory.json'), 'utf8'));
const bySlug = new Map(content.tools.map(x => [x.slug, x]));

async function exists(p) { try { await fs.access(p); return true; } catch { return false; } }
async function walk(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, {withFileTypes:true})) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p)); else out.push(p);
  }
  return out;
}
function cleanInjected(html) {
  html = html.replace(new RegExp(`\\s*${START_HEAD}[\\s\\S]*?${END_HEAD}\\s*`, 'g'), '\n');
  html = html.replace(new RegExp(`\\s*${START_BODY}[\\s\\S]*?${END_BODY}\\s*`, 'g'), '\n');
  return html;
}
function sourceWebPath(file) {
  const rel = path.relative(OUT, file).split(path.sep).join('/');
  if (rel === 'index.html') return '/';
  return '/' + rel.replace(/index\.html$/, '');
}
function localizedPath(webPath, locale) { return `/${locale}${webPath === '/' ? '/' : webPath}`; }
function slugFrom(webPath) {
  const m = webPath.match(/^\/tools\/([^/]+)\/$/); return m ? m[1] : null;
}
function escJson(value) { return JSON.stringify(value).replace(/</g, '\\u003c'); }
function replaceLang(html, locale) {
  return /<html\b[^>]*\blang=/i.test(html)
    ? html.replace(/(<html\b[^>]*\blang=)["'][^"']*["']/i, `$1"${locale === 'pt-br' ? 'pt-BR' : locale}"`)
    : html.replace(/<html\b/i, `<html lang="${locale === 'pt-br' ? 'pt-BR' : locale}"`);
}
function replaceCanonical(html, url) {
  const tag = `<link rel="canonical" href="${url}">`;
  if (/<link\b[^>]*rel=["']canonical["'][^>]*>/i.test(html)) return html.replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/i, tag);
  return html.replace(/<\/head>/i, `  ${tag}\n</head>`);
}
function inject(html, webPath, locale, pageData) {
  html = cleanInjected(replaceLang(html, locale));
  const equivalent = locale === 'en' ? webPath : localizedPath(webPath, locale);
  html = replaceCanonical(html, site + equivalent);
  const alternate = [
    `<link rel="alternate" hreflang="en" href="${site + webPath}">`,
    `<link rel="alternate" hreflang="es" href="${site + localizedPath(webPath,'es')}">`,
    `<link rel="alternate" hreflang="pt-BR" href="${site + localizedPath(webPath,'pt-br')}">`,
    `<link rel="alternate" hreflang="x-default" href="${site + webPath}">`
  ].join('\n  ');
  const head = `${START_HEAD}\n  <link rel="stylesheet" href="/assets/multilingual-site.css" data-tsd-i18n>\n  ${alternate}\n  <script src="/assets/multilingual-site.js" defer data-tsd-i18n></script>\n  ${END_HEAD}`;
  html = html.replace(/<\/head>/i, `  ${head}\n</head>`);
  const payload = {locale, basePath:webPath, equivalentPath:equivalent, tool:pageData || null, inventory};
  const body = `${START_BODY}\n<div data-tsd-language-selector-anchor></div>\n<script type="application/json" id="tsd-i18n-page">${escJson(payload)}</script>\n${END_BODY}`;
  html = html.replace(/<body([^>]*)>/i, `<body$1>\n${body}`);
  return html;
}
function localizeMetadata(html, data) {
  if (!data) return html;
  const title = `${data.title} | TechShift Digital`;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
  const description = data.metaDescription;
  const meta = `<meta name="description" content="${description.replace(/"/g,'&quot;')}">`;
  html = /<meta\b[^>]*name=["']description["'][^>]*>/i.test(html)
    ? html.replace(/<meta\b[^>]*name=["']description["'][^>]*>/i, meta)
    : html.replace(/<\/head>/i, `  ${meta}\n</head>`);
  return html;
}

if (!await exists(OUT)) throw new Error(`Build output not found: ${OUT}. Run the normal site build first or pass its output directory.`);
await fs.mkdir(path.join(OUT,'assets'), {recursive:true});
for (const name of ['multilingual-site.css','multilingual-site.js']) {
  await fs.copyFile(path.join(HERE,'public/assets',name), path.join(OUT,'assets',name));
}
// Remove previously generated localized output so obsolete files cannot survive a rebuild.
for (const locale of locales) await fs.rm(path.join(OUT, locale), {recursive:true, force:true});

const files = (await walk(OUT)).filter(f => f.endsWith('.html'));
const english = files.filter(f => {
  const rel = path.relative(OUT,f).split(path.sep);
  return rel[0] !== 'es' && rel[0] !== 'pt-br';
});
let localizedCount = 0;
const webPaths = [];
for (const file of english) {
  const webPath = sourceWebPath(file);
  webPaths.push(webPath);
  const slug = slugFrom(webPath);
  const page = slug ? bySlug.get(slug) : null;
  const original = cleanInjected(await fs.readFile(file,'utf8'));
  await fs.writeFile(file, inject(original,webPath,'en',null));
  for (const locale of locales) {
    let html = original;
    const localData = page ? page[locale] : null;
    html = localizeMetadata(html, localData);
    html = inject(html,webPath,locale,localData ? {...localData,slug,related:page.related} : null);
    const rel = path.relative(OUT,file);
    const destination = path.join(OUT,locale,rel);
    await fs.mkdir(path.dirname(destination),{recursive:true});
    await fs.writeFile(destination,html);
    localizedCount++;
  }
}

const xmlEsc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const sitemapRows = [];
for (const webPath of webPaths) {
  const variants = [webPath, localizedPath(webPath,'es'), localizedPath(webPath,'pt-br')];
  for (const variant of variants) sitemapRows.push(`  <url>\n    <loc>${xmlEsc(site + variant)}</loc>\n    <xhtml:link rel="alternate" hreflang="en" href="${xmlEsc(site + webPath)}"/>\n    <xhtml:link rel="alternate" hreflang="es" href="${xmlEsc(site + localizedPath(webPath,'es'))}"/>\n    <xhtml:link rel="alternate" hreflang="pt-BR" href="${xmlEsc(site + localizedPath(webPath,'pt-br'))}"/>\n    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEsc(site + webPath)}"/>\n  </url>`);
}
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${sitemapRows.join('\n')}\n</urlset>\n`;
await fs.writeFile(path.join(OUT,'sitemap-multilingual.xml'), sitemap);

const report = {generatedAt:new Date().toISOString(),output:OUT,englishPages:english.length,localizedPages:localizedCount,toolTranslations:content.tools.length*2,sitemapUrls:webPaths.length*3,locales};
await fs.writeFile(path.join(OUT,'multilingual-build-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(`Multilingual build complete: ${english.length} English pages enhanced; ${localizedCount} localized pages generated; 100 detailed tool translations available.`);
