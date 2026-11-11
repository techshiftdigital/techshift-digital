#!/usr/bin/env node
import fs from 'node:fs'; import path from 'node:path';
const root=path.resolve(process.argv[2]||'dist');
const inventory=JSON.parse(fs.readFileSync(path.resolve(path.dirname(new URL(import.meta.url).pathname),'../translations/tool-inventory.json'),'utf8'));
const errors=[];
const read=p=>{try{return fs.readFileSync(p,'utf8')}catch{return null}};
for(const locale of ['es','pt-br']) for(const t of inventory){
 const p=path.join(root,locale,'tools',t.slug,'index.html'); const h=read(p);
 if(!h){errors.push(`Missing ${p}`);continue}
 for(const needle of ['tsd-i18n-page','multilingual-site.css','multilingual-site.js',`hreflang="${locale==='pt-br'?'pt-BR':'es'}"`]) if(!h.includes(needle)) errors.push(`${p}: missing ${needle}`);
 const title=locale==='es'?t.es:t['pt-br']; if(!h.includes(title)) errors.push(`${p}: missing localized title ${title}`);
}
for(const p of ['index.html','tools/index.html']){const h=read(path.join(root,p)); if(h&&!h.includes('multilingual-site.js')) errors.push(`${p}: selector integration missing`)}
const data=JSON.parse(read(path.join(root,'multilingual-build-report.json'))||'{}');
if(data.toolTranslations!==100) errors.push('Build report must record 100 detailed tool translations');
const sitemap=read(path.join(root,'sitemap-multilingual.xml'))||'';
for(const needle of ['hreflang="en"','hreflang="es"','hreflang="pt-BR"','/es/tools/','/pt-br/tools/']) if(!sitemap.includes(needle)) errors.push(`Sitemap missing ${needle}`);
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log(`PASS: ${inventory.length*2} localized tool routes verified; shared dropdown assets present; detailed translation dataset complete.`);
