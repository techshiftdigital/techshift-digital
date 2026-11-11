import {cp,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
await rm('dist',{recursive:true,force:true});
await cp('public','dist',{recursive:true});
const r=spawnSync(process.execPath,['qa/verify.mjs','dist'],{stdio:'inherit'});
if(r.status!==0)process.exit(r.status||1);
console.log('TechShift Digital build complete: dist/');
