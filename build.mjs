import { access, cp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const sourceDirectory = 'public';
const outputDirectory = 'dist';
const fixHref = '/assets/result-layout-fix.css';
const toolRoute = /^(?:(?:es|pt-br)\/)?tools\/[^/]+\/index\.html$/;

async function collectHtmlFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const itemPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectHtmlFiles(itemPath));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(itemPath);
  }
  return files;
}

function languageFor(relativePath) {
  if (relativePath.startsWith('es/')) return 'es';
  if (relativePath.startsWith('pt-br/')) return 'pt-br';
  return 'en';
}

async function applyResultLayoutFix() {
  await access(path.join(outputDirectory, 'assets', 'result-layout-fix.css'));

  const counts = { en: 0, es: 0, 'pt-br': 0 };
  const files = await collectHtmlFiles(outputDirectory);

  for (const file of files) {
    const relativePath = path.relative(outputDirectory, file).split(path.sep).join('/');
    if (!toolRoute.test(relativePath)) continue;

    let html = await readFile(file, 'utf8');
    const occurrences = html.split(fixHref).length - 1;

    if (occurrences === 0) {
      if (!/<\/head>/i.test(html)) throw new Error(`Missing </head> in ${relativePath}`);
      html = html.replace(/<\/head>/i, `  <link rel="stylesheet" href="${fixHref}">\n</head>`);
      await writeFile(file, html);
    } else if (occurrences > 1) {
      throw new Error(`Duplicate result-layout fix references in ${relativePath}`);
    }

    counts[languageFor(relativePath)] += 1;
  }

  const values = Object.values(counts);
  if (values.some((count) => count === 0)) {
    throw new Error(`Result layout fix did not find tool pages in every language: ${JSON.stringify(counts)}`);
  }
  if (new Set(values).size !== 1) {
    throw new Error(`Tool route counts differ by language: ${JSON.stringify(counts)}`);
  }

  console.log(`Applied result layout fix to ${values.reduce((sum, count) => sum + count, 0)} tool pages (${counts.en} per language).`);
}

await rm(outputDirectory, { recursive: true, force: true });
await cp(sourceDirectory, outputDirectory, { recursive: true });
await applyResultLayoutFix();

const existingVerification = spawnSync(process.execPath, ['qa/verify.mjs', outputDirectory], { stdio: 'inherit' });
if (existingVerification.status !== 0) process.exit(existingVerification.status || 1);

const layoutVerification = spawnSync(process.execPath, ['qa/verify-result-layout-fix.mjs', outputDirectory], { stdio: 'inherit' });
if (layoutVerification.status !== 0) process.exit(layoutVerification.status || 1);

console.log('TechShift Digital build complete: dist/');
