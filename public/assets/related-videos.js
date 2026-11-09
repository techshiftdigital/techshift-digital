(() => {
  'use strict';
  const root=document.querySelector('[data-related-videos]');
  const page=document.querySelector('[data-video-keywords]');
  if(!root||!page)return;
  const terms=(page.dataset.videoKeywords||'').toLowerCase().split(/\s+/).filter(x=>x.length>2);
  const sources=[['/data/videos-excel.json','Excel'],['/data/videos-ai.json','AI']];
  const flatten=(node,bucket=[])=>{
    if(Array.isArray(node))node.forEach(x=>flatten(x,bucket));
    else if(node&&typeof node==='object'){
      const title=node.title||node.name||node.videoTitle;
      const url=node.url||node.youtubeUrl||node.youtube_url||node.link||node.videoUrl;
      if(title&&url)bucket.push({title:String(title),url:String(url),description:String(node.description||node.summary||'')});
      else Object.values(node).forEach(x=>flatten(x,bucket));
    }
    return bucket;
  };
  Promise.all(sources.map(([url,type])=>fetch(url).then(r=>r.ok?r.json():[]).then(data=>flatten(data).map(v=>({...v,type}))).catch(()=>[])))
    .then(groups=>{
      const seen=new Set();
      const videos=groups.flat().filter(v=>{if(seen.has(v.url))return false;seen.add(v.url);return true;});
      videos.forEach(v=>{const hay=(v.title+' '+v.description).toLowerCase();v.score=terms.reduce((n,t)=>n+(hay.includes(t)?(v.title.toLowerCase().includes(t)?3:1):0),0);});
      const matches=videos.filter(v=>v.score>0).sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title)).slice(0,3);
      if(!matches.length){root.innerHTML='<p class="muted">No closely matched tutorial is currently available. Browse the <a href="/videos/excel/">Excel videos</a> or <a href="/videos/ai/">AI videos</a>.</p>';return;}
      root.innerHTML=matches.map(v=>`<article><p class="video-type">${v.type} tutorial</p><h3><a href="${v.url.replace(/"/g,'&quot;')}" target="_blank" rel="noopener noreferrer">${v.title.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</a></h3><a href="${v.url.replace(/"/g,'&quot;')}" target="_blank" rel="noopener noreferrer">Watch on YouTube →</a></article>`).join('');
    });
})();
