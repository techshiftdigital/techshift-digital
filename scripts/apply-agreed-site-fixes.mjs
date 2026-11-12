import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';

const root = resolve(process.argv[2] || 'dist');
const stylesheetHref = '/assets/agreed-site-fixes.css?v=20261112.2';
const stylesheetTag = `<link rel="stylesheet" href="${stylesheetHref}">`;

const listFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(path));
    else files.push(path);
  }
  return files;
};

const addClass = (attributes, token) => {
  const classMatch = attributes.match(/\bclass=(['"])(.*?)\1/i);
  if (!classMatch) return `${attributes} class="${token}"`;
  const classes = classMatch[2].split(/\s+/).filter(Boolean);
  if (!classes.includes(token)) classes.push(token);
  return attributes.replace(classMatch[0], `class=${classMatch[1]}${classes.join(' ')}${classMatch[1]}`);
};

const makeLanguageLabelScreenReaderOnly = (html) => html.replace(
  /<label\b([^>]*\bfor=(['"])language-select\2[^>]*)>([\s\S]*?)<\/label>/gi,
  (_match, attributes, _quote, text) => `<label${addClass(attributes, 'sr-only')}>${text}</label>`,
);

const moveLanguageMenuAfterYouTube = (html) => html.replace(
  /<nav\b([^>]*\bid=(['"])navigation\2[^>]*)>([\s\S]*?)<\/nav>/gi,
  (navigation, navAttributes, _quote, content) => {
    const menuPattern = /<div\b[^>]*\bclass=(['"])[^'"]*\blanguage-menu\b[^'"]*\1[^>]*>[\s\S]*?<\/div>/i;
    const menuMatch = content.match(menuPattern);
    if (!menuMatch) return navigation;

    const withoutMenu = content.replace(menuMatch[0], '');
    const youtubePattern = /<a\b[^>]*\bclass=(['"])[^'"]*\byoutube\b[^'"]*\1[^>]*>[\s\S]*?<\/a>/i;
    const youtubeMatch = withoutMenu.match(youtubePattern);
    if (!youtubeMatch) return navigation;

    const insertionPoint = youtubeMatch.index + youtubeMatch[0].length;
    const reordered = `${withoutMenu.slice(0, insertionPoint)}${menuMatch[0]}${withoutMenu.slice(insertionPoint)}`;
    return `<nav${navAttributes}>${reordered}</nav>`;
  },
);

const ensureStylesheet = (html) => {
  if (/\/assets\/agreed-site-fixes\.css(?:\?[^'"\s>]*)?/i.test(html)) return html;
  const styleLink = /<link\b[^>]*\bhref=(['"])\/assets\/style\.css(?:\?[^'"]*)?\1[^>]*>/i;
  if (styleLink.test(html)) return html.replace(styleLink, (match) => `${match}${stylesheetTag}`);
  return html.replace(/<\/head>/i, `${stylesheetTag}</head>`);
};

const anchorsIn = (html) => [...html.matchAll(/<a\b[^>]*\bhref=(['"])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi)];

const makeToolCardTitlesClickable = (html) => html.replace(
  /<article\b[^>]*\bclass=(['"])[^'"]*\btool-card\b[^'"]*\1[^>]*>[\s\S]*?<\/article>/gi,
  (card) => {
    const anchors = anchorsIn(card);
    if (!anchors.length) return card;
    const actionHref = anchors.at(-1)[2];
    const headingPattern = /<h([23])\b([^>]*)>([\s\S]*?)<\/h\1>/i;
    const heading = card.match(headingPattern);
    if (!heading) return card;
    let headingContent = heading[3];
    if (/<a\b/i.test(headingContent)) {
      headingContent = headingContent.replace(/<a\b([^>]*)>/i, (_anchor, attributes) => {
        let updatedAttributes = addClass(attributes, 'tool-title-link');
        if (/\bhref=(['"]).*?\1/i.test(updatedAttributes)) {
          updatedAttributes = updatedAttributes.replace(/\bhref=(['"]).*?\1/i, `href="${actionHref}"`);
        } else {
          updatedAttributes += ` href="${actionHref}"`;
        }
        return `<a${updatedAttributes}>`;
      });
    } else {
      headingContent = `<a class="tool-title-link" href="${actionHref}">${headingContent}</a>`;
    }
    const linkedHeading = `<h${heading[1]}${heading[2]}>${headingContent}</h${heading[1]}>`;
    return card.replace(heading[0], linkedHeading);
  },
);

const relativeWebPath = (file) => relative(root, file).split(sep).join('/');
const isToolIndex = (path) => /^(?:es\/|pt-br\/)?tools\/index\.html$/i.test(path);
const isToolDetail = (path) => /^(?:es\/|pt-br\/)?tools\/[^/]+\/index\.html$/i.test(path);

const allFiles = await listFiles(root);
const htmlFiles = allFiles.filter((file) => file.toLowerCase().endsWith('.html'));

for (const file of htmlFiles) {
  const path = relativeWebPath(file);
  const original = await readFile(file, 'utf8');
  let updated = ensureStylesheet(original);
  updated = makeLanguageLabelScreenReaderOnly(updated);
  updated = moveLanguageMenuAfterYouTube(updated);
  if (isToolIndex(path)) updated = makeToolCardTitlesClickable(updated);
  if (updated !== original) await writeFile(file, updated);
}

const finalFiles = await listFiles(root);
const finalHtmlFiles = finalFiles.filter((file) => file.toLowerCase().endsWith('.html'));
const localeCounts = { en: 0, es: 0, 'pt-br': 0 };
let languageMenus = 0;
let toolCards = 0;
let linkedToolTitles = 0;
let resultOutputs = 0;

for (const file of finalHtmlFiles) {
  const path = relativeWebPath(file);
  const html = await readFile(file, 'utf8');
  languageMenus += (html.match(/\bclass=(['"])[^'"]*\blanguage-menu\b[^'"]*\1/gi) || []).length;
  resultOutputs += (html.match(/<output\b[^>]*\bclass=(['"])[^'"]*\bresult\b[^'"]*\1/gi) || []).length;
  if (isToolDetail(path)) {
    if (path.startsWith('es/')) localeCounts.es += 1;
    else if (path.startsWith('pt-br/')) localeCounts['pt-br'] += 1;
    else localeCounts.en += 1;
  }
  if (isToolIndex(path)) {
    toolCards += (html.match(/<article\b[^>]*\bclass=(['"])[^'"]*\btool-card\b[^'"]*\1/gi) || []).length;
    linkedToolTitles += (html.match(/\bclass=(['"])[^'"]*\btool-title-link\b[^'"]*\1/gi) || []).length;
  }
}

const manifest = {
  release: 'TechShift Digital v5.0.5',
  stylesheet: stylesheetHref,
  htmlFiles: finalHtmlFiles.length,
  toolDetailPages: localeCounts,
  resultOutputs,
  languageMenus,
  toolCards,
  linkedToolTitles,
  scope: [
    'calculator result flow',
    'compact accessible language selector alignment',
    'tool title links matching existing action links',
  ],
};

const manifestPath = join(root, 'assets', 'agreed-site-fixes-manifest.json');
await mkdir(dirname(manifestPath), { recursive: true });
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`Applied TechShift Digital v5.0.5 agreed fixes to ${root}`);
console.log(JSON.stringify(manifest));
