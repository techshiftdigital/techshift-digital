import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const projectRoot = process.cwd();
const packagePath = path.join(projectRoot, 'package.json');
const packageText = await readFile(packagePath, 'utf8');
const packageJson = JSON.parse(packageText);

if (!packageJson.scripts || typeof packageJson.scripts.build !== 'string' || !packageJson.scripts.build.trim()) {
  throw new Error('package.json must already contain scripts.build. Restore the main TechShift build before applying this focused update.');
}

const command = 'node language-selector-header-fix.mjs';
if (!packageJson.scripts.build.includes(command)) {
  packageJson.scripts.build = `${packageJson.scripts.build.trim()} && ${command}`;
  await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');
  console.log(`[TechShift] Updated package.json build script: ${packageJson.scripts.build}`);
} else {
  console.log('[TechShift] package.json already includes the language selector header fix.');
}
