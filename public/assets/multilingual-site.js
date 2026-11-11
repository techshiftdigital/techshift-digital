(() => {
  'use strict';
  const payloadNode = document.getElementById('tsd-i18n-page');
  if (!payloadNode) return;
  let page; try { page = JSON.parse(payloadNode.textContent); } catch { return; }
  const locale = page.locale || 'en';
  const labels = {
    en:{current:'English',choose:'Choose language',home:'Home',tools:'Tools',resources:'Resources',calculate:'Calculate',reset:'Reset',search:'Search tools',all:'All categories',open:'Open tool'},
    es:{current:'Español',choose:'Elegir idioma',home:'Inicio',tools:'Herramientas',resources:'Recursos',calculate:'Calcular',reset:'Restablecer',search:'Buscar herramientas',all:'Todas las categorías',open:'Abrir herramienta'},
    'pt-br':{current:'Português',choose:'Escolher idioma',home:'Início',tools:'Ferramentas',resources:'Recursos',calculate:'Calcular',reset:'Redefinir',search:'Pesquisar ferramentas',all:'Todas as categorias',open:'Abrir ferramenta'}
  };
  const pathFor = lang => lang === 'en' ? page.basePath : `/${lang}${page.basePath === '/' ? '/' : page.basePath}`;
  const picker = document.createElement('details');
  picker.className = 'tsd-language-picker';
  picker.innerHTML = `<summary aria-label="${labels[locale].choose}"><span aria-hidden="true">🌐</span><span>${labels[locale].current}</span></summary><ul class="tsd-language-menu"><li><a href="${pathFor('en')}" lang="en"${locale==='en'?' aria-current="page"':''}>English</a></li><li><a href="${pathFor('es')}" lang="es"${locale==='es'?' aria-current="page"':''}>Español</a></li><li><a href="${pathFor('pt-br')}" lang="pt-BR"${locale==='pt-br'?' aria-current="page"':''}>Português (Brasil)</a></li></ul>`;
  const old = document.querySelectorAll('.language-links,.all-languages-link,[data-language-list],[data-language-selector]');
  old.forEach(el => { if (!el.classList.contains('tsd-language-picker')) el.hidden = true; });
  [...document.querySelectorAll('a')].filter(a => /all languages|todos los idiomas|todos os idiomas/i.test(a.textContent.trim())).forEach(a => a.hidden=true);
  const host = document.querySelector('[data-header-actions], .header-actions, header nav, .site-header nav, header, .site-header') || document.body;
  host.appendChild(picker);
  document.addEventListener('click', e => { if (picker.open && !picker.contains(e.target)) picker.open=false; });
  document.addEventListener('keydown', e => { if (e.key==='Escape') { picker.open=false; picker.querySelector('summary')?.focus(); } });

  if (locale !== 'en') {
    document.documentElement.lang = locale === 'pt-br' ? 'pt-BR' : 'es';
    const dict = {
      es:{Home:'Inicio',Tools:'Herramientas',Resources:'Recursos',Calculate:'Calcular',Reset:'Restablecer','Search tools':'Buscar herramientas','All categories':'Todas las categorías','Open tool':'Abrir herramienta','Related tools':'Herramientas relacionadas','How it works':'Cómo funciona',Formula:'Fórmula',Example:'Ejemplo','Frequently asked questions':'Preguntas frecuentes','Original value':'Valor inicial','New value':'Nuevo valor','Start date':'Fecha inicial','End date':'Fecha final','Amount':'Importe','Interest rate':'Tasa de interés','Years':'Años','Months':'Meses','Result':'Resultado','Copy':'Copiar','Clear':'Limpiar'},
      'pt-br':{Home:'Início',Tools:'Ferramentas',Resources:'Recursos',Calculate:'Calcular',Reset:'Redefinir','Search tools':'Pesquisar ferramentas','All categories':'Todas as categorias','Open tool':'Abrir ferramenta','Related tools':'Ferramentas relacionadas','How it works':'Como funciona',Formula:'Fórmula',Example:'Exemplo','Frequently asked questions':'Perguntas frequentes','Original value':'Valor inicial','New value':'Novo valor','Start date':'Data inicial','End date':'Data final','Amount':'Valor','Interest rate':'Taxa de juros','Years':'Anos','Months':'Meses','Result':'Resultado','Copy':'Copiar','Clear':'Limpar'}
    }[locale];
    const translateText = root => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {acceptNode:n => /^(SCRIPT|STYLE|CODE|PRE)$/.test(n.parentElement?.tagName||'') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT});
      const nodes=[]; while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(n => { const raw=n.nodeValue, trim=raw.trim(); if (dict[trim]) n.nodeValue=raw.replace(trim,dict[trim]); });
      root.querySelectorAll?.('input[placeholder],textarea[placeholder]').forEach(el => { if (dict[el.placeholder]) el.placeholder=dict[el.placeholder]; });
    };
    translateText(document.body);
    new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType===1) translateText(n); }))).observe(document.body,{subtree:true,childList:true});
  }

  const tool = page.tool;
  if (locale !== 'en' && tool) {
    const h1 = document.querySelector('main h1, h1'); if (h1) h1.textContent = tool.title;
    const intro = document.querySelector('[data-tool-description], .tool-intro, main h1 + p'); if (intro) intro.textContent = tool.intro;
    const inventory = new Map((page.inventory||[]).map(x=>[x.slug,x]));
    const related = (tool.related||[]).map(slug => { const item=inventory.get(slug); if(!item) return ''; const name=item[locale]||slug; return `<li><a href="/${locale}/tools/${slug}/">${name}</a></li>`; }).join('');
    const section = document.createElement('section');
    section.className='tsd-localized-details'; section.dataset.localizedToolDetails='';
    section.innerHTML = `<h2>${tool.howTitle}</h2><ol>${tool.how.map(x=>`<li>${x}</li>`).join('')}</ol><div class="tsd-info-grid"><article class="tsd-info-card"><h3>${tool.methodTitle}</h3><p><code>${tool.method}</code></p></article><article class="tsd-info-card"><h3>${tool.exampleTitle}</h3><p>${tool.example}</p></article></div><h2>${tool.mistakesTitle}</h2><ul>${tool.mistakes.map(x=>`<li>${x}</li>`).join('')}</ul><h2>${tool.faqTitle}</h2>${tool.faqs.map(x=>`<details><summary>${x.q}</summary><p>${x.a}</p></details>`).join('')}<h2>${tool.relatedTitle}</h2><ul>${related}</ul>`;
    const existing = document.querySelector('[data-tool-details],.tool-details,.seo-content,.tool-explanation');
    if (existing) { existing.replaceWith(section); } else {
      const main=document.querySelector('main')||document.body; const footer=main.querySelector('footer'); footer ? main.insertBefore(section,footer) : main.appendChild(section);
    }
    document.title = `${tool.title} | TechShift Digital`;
  }

  if (locale !== 'en') {
    document.querySelectorAll('a[href^="/"]').forEach(a => {
      const href=a.getAttribute('href');
      if (a.closest('.tsd-language-picker') || !href || href.startsWith('/assets/') || href.startsWith('/es/') || href.startsWith('/pt-br/') || href==='/favicon.ico') return;
      a.href=`/${locale}${href==='/'?'/':href}`;
    });
  }
})();
