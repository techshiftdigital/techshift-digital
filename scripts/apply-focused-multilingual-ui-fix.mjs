#!/usr/bin/env node
import { access, copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const packageFile = path.join(root, 'package.json');
const required = [
  'scripts/unify-multilingual-ui.mjs',
  'public/assets/multilingual-unified.css',
  'public/assets/multilingual-unified.js',
  'qa/verify-focused-multilingual-ui.mjs'
];

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

for (const relative of required) {
  if (!await exists(path.join(root, relative))) {
    console.error(`Missing ${relative}. Extract the complete update at the repository root, then rerun this command.`);
    process.exit(1);
  }
}

if (!await exists(packageFile)) {
  console.error('package.json was not found. Run this installer from the repository root.');
  process.exit(1);
}

const raw = await readFile(packageFile, 'utf8');
let pkg;
try { pkg = JSON.parse(raw); }
catch (error) {
  console.error(`package.json is not valid JSON: ${error.message}`);
  process.exit(1);
}

pkg.scripts ||= {};
if (!pkg.scripts.build) {
  console.error('package.json has no build script. Restore the existing site build first; this update intentionally does not replace build.mjs.');
  process.exit(1);
}

const command = 'node scripts/unify-multilingual-ui.mjs dist';
let build = pkg.scripts.build.trim();
if (!build.includes('scripts/unify-multilingual-ui.mjs')) build = `${build} && ${command}`;
pkg.scripts.build = build;
pkg.scripts['verify:multilingual-ui'] = 'node qa/verify-focused-multilingual-ui.mjs dist';

const backupDir = path.join(root, '.techshift-backups');
await mkdir(backupDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
await copyFile(packageFile, path.join(backupDir, `package.json.${stamp}.bak`));
await writeFile(packageFile, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');

console.log('Focused multilingual UI fix installed.');
console.log(`Build command: ${pkg.scripts.build}`);
console.log('Next: npm run build && npm run verify:multilingual-ui');
