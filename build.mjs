#!/usr/bin/env node
/**
 * TechShift Digital static build.
 *
 * 1. Recreates dist/ from public/ without changing the source files.
 * 2. Runs the idempotent multilingual post-processor.
 *
 * Cloudflare Pages build command: node build.mjs
 * Cloudflare Pages output directory: dist
 */

import { cp, mkdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMultilingualBuild } from './multilingual-build.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(ROOT, process.env.TECHSHIFT_PUBLIC_DIR || 'public');
const DIST_DIR = path.resolve(ROOT, process.env.TECHSHIFT_DIST_DIR || 'dist');

function isSameOrChild(candidate, parent) {
  const relative = path.relative(parent, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

async function assertDirectory(directory, label) {
  let details;
  try {
    details = await stat(directory);
  } catch {
    throw new Error(`${label} was not found: ${directory}`);
  }

  if (!details.isDirectory()) {
    throw new Error(`${label} is not a directory: ${directory}`);
  }
}

async function main() {
  await assertDirectory(PUBLIC_DIR, 'Public source directory');

  if (PUBLIC_DIR === DIST_DIR || isSameOrChild(PUBLIC_DIR, DIST_DIR)) {
    throw new Error('Refusing to build because public/ is the same as, or is inside, dist/.');
  }

  await rm(DIST_DIR, { recursive: true, force: true });
  await mkdir(DIST_DIR, { recursive: true });
  await cp(PUBLIC_DIR, DIST_DIR, {
    recursive: true,
    force: true,
    errorOnExist: false,
    preserveTimestamps: false,
  });

  const result = await runMultilingualBuild({
    rootDir: ROOT,
    outDir: DIST_DIR,
    quiet: true,
  });

  console.log(
    `TechShift build complete: ${result.htmlFiles} HTML pages processed; ` +
      `${result.localizedRoutes} localized route groups; output ${path.relative(ROOT, DIST_DIR) || '.'}/`,
  );
}

main().catch((error) => {
  console.error(`Build failed: ${error.message}`);
  process.exitCode = 1;
});
