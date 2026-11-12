import { cp, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const run = (script, args = []) => {
  const result = spawnSync(process.execPath, [script, ...args], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
};

await rm('dist', { recursive: true, force: true });
await cp('public', 'dist', { recursive: true });

// Apply only the three agreed presentation/accessibility corrections to build output.
run('scripts/apply-agreed-site-fixes.mjs', ['dist']);
run('qa/verify-agreed-site-fixes.mjs', ['dist']);

// Preserve the repository's existing full-site verification gate.
run('qa/verify.mjs', ['dist']);

console.log('TechShift Digital v5.0.5 build complete: dist/');
