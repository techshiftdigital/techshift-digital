import { cp, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

await rm('dist', { recursive: true, force: true });
await cp('public', 'dist', { recursive: true });

for (const [script, args] of [
  ['scripts/apply-original-video-library.mjs', ['dist']],
  ['qa/verify.mjs', ['dist']],
]) {
  const result = spawnSync(process.execPath, [script, ...args], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}

console.log('TechShift Digital v5.0.1 build complete: dist/');
