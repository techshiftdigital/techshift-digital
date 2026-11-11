import { access, cp, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const run = (script, args = []) => {
  const result = spawnSync(process.execPath, [script, ...args], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
};

await rm('dist', { recursive: true, force: true });
await cp('public', 'dist', { recursive: true });

// Reapply both focused deployment corrections after every clean copy.
run('scripts/apply-site-fixes.mjs', ['dist']);
run('qa/verify-site-fixes.mjs', ['dist']);

// Preserve the repository's existing complete-site verification.
await access('qa/verify.mjs');
run('qa/verify.mjs', ['dist']);

console.log('TechShift Digital build complete: dist/');
