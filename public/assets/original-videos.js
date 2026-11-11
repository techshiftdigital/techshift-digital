(() => {
  'use strict';

  const pathName = window.location.pathname.replace(/\/+/g, '/');
  if (!/(^|\/)videos(?:\/|$)/i.test(pathName)) return;

  const locale = pathName.startsWith('/es/') ? 'es' : pathName.startsWith('/pt-br/') ? 'pt-br' : 'en';
  const copy = {
    en: { all: 'All', excel: 'Excel videos', ai: 'AI videos', results: 'results', watch: 'Watch on YouTube', search: 'Search videos' },
    es: { all: 'Todos', excel: 'Videos de Excel', ai: 'Videos de IA', results: 'resultados', watch: 'Ver en YouTube', search: 'Buscar videos' },
    'pt-br': { all: 'Todos', excel: 'Vídeos de Excel', ai: 'Vídeos de IA', results: 'resultados', watch: 'Assistir no YouTube', search: 'Pesquisar vídeos' },
  }[locale];

  const state = {
    records: [],
    category: categoryFromPage(),
    query: '',
    rendering: false,
    grid: null,
  };
  const bound = new WeakSet();

  function categoryFromPage() {
    if (/\/excel(?:\/|$)/i.test(pathName)) return 'Excel';
    if (/\/ai(?:\/|$)/i.test(pathName)) return 'AI';
    const heading = document.querySelector('main h1')?.textContent || '';
    if (/excel/i.test(heading)) return 'Excel';
    if (/(^|\s)(ai|ia)(\s|$)/i.test(heading)) return 'AI';
    return 'All';
  }

  function idFor(record) {
    const direct = String(record.videoId || '').trim();
    if (/^[A-Za-z0-9_-]{11}$/.test(direct)) return direct;
    try {
      const parsed = new URL(record.url);
      const candidate = parsed.hostname === 'youtu.be'
        ? parsed.pathname.split('/').filter(Boolean)[0]
        : parsed.searchParams.get('v') || parsed.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1];
      return /^[A-Za-z0-9_-]{11}$/.test(candidate || '') ? candidate : '';
    } catch { return ''; }
  }

  function normalize(record, category) {
    const videoId = idFor(record);
    if (!videoId || !record || typeof record.title !== 'string') return null;
    return {
      ...record,
      category,
      videoId,
      title: record.title.trim(),
      description: String(record.description || record.originalDescription || '').trim(),
      url: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    };
  }

  async function fetchRecords() {
    const sources = [
      ['/data/videos-ai.json', 'AI'],
      ['/data/videos-excel.json', 'Excel'],
    ];
    const responses = await Promise.all(sources.map(async ([url, category]) => {
      const response = await fetch(url, { cache: 'no-cache', credentials: 'same-origin' });
      if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
      const records = await response.json();
      if (!Array.isArray(records)) throw new Error(`${url}: expected an array`);
      return records.map((record) => normalize(record, category)).filter(Boolean);
    }));
    const unique = new Map();
    responses.flat().forEach((record) => unique.set(record.videoId, record));
    return [...unique.values()].sort((a, b) =>
      String(b.publishedAt || b.createdAt || '').localeCompare(String(a.publishedAt || a.createdAt || ''))
    );
  }

  function candidateGrids() {
    const selectors = ['[data-video-grid]', '#video-grid', '#library', '.video-grid', 'main .grid'];
    return [...new Set(selectors.flatMap((selector) => [...document.querySelectorAll(selector)]))]
      .filter((element) => !element.closest('header, nav, footer'));
  }

  function findGrid() {
    const candidates = candidateGrids();
    if (state.grid?.isConnected) return state.grid;
    const scored = candidates.map((element) => {
      const cards = element.querySelectorAll(':scope > article, :scope > .card').length;
      const words = (element.textContent || '').toLowerCase();
      const score = cards * 10 + (/youtube|video|vídeo/.test(words) ? 5 : 0) + (element.id === 'library' ? 4 : 0);
      return { element, score };
    }).sort((a, b) => b.score - a.score);
    if (scored[0]) return scored[0].element;

    const main = document.querySelector('main');
    if (!main) return null;
    const section = document.createElement('section');
    section.className = 'section tsd-original-video-section';
    const wrap = document.createElement('div');
    wrap.className = 'wrap';
    const grid = document.createElement('div');
    grid.id = 'library';
    grid.className = 'grid';
    grid.dataset.videoGrid = 'original';
    wrap.append(grid);
    section.append(wrap);
    main.append(section);
    return grid;
  }

  function textElement(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = text;
    return node;
  }

  function videoCard(record) {
    const article = document.createElement('article');
    article.className = 'card tsd-original-video-card';
    article.dataset.category = record.category;
    article.dataset.videoId = record.videoId;
    article.dataset.originalVideo = 'true';

    const thumbnailLink = document.createElement('a');
    thumbnailLink.className = 'tsd-video-thumbnail';
    thumbnailLink.href = record.url;
    thumbnailLink.target = '_blank';
    thumbnailLink.rel = 'noopener noreferrer';
    thumbnailLink.setAttribute('aria-label', `${record.title} — YouTube`);
    const image = document.createElement('img');
    image.src = record.thumbnail;
    image.alt = record.title;
    image.width = 480;
    image.height = 360;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.referrerPolicy = 'no-referrer';
    thumbnailLink.append(image);

    const body = document.createElement('div');
    body.className = 'card-body';
    body.append(textElement('span', 'tag', record.category === 'AI' ? copy.ai : copy.excel));

    const title = document.createElement('h3');
    const titleLink = document.createElement('a');
    titleLink.href = record.url;
    titleLink.target = '_blank';
    titleLink.rel = 'noopener noreferrer';
    titleLink.textContent = record.title;
    title.append(titleLink);
    body.append(title);

    if (record.description) body.append(textElement('p', '', record.description));

    const action = document.createElement('a');
    action.className = 'textlink';
    action.href = record.url;
    action.target = '_blank';
    action.rel = 'noopener noreferrer';
    action.textContent = `${copy.watch} ↗`;
    body.append(action);

    article.append(thumbnailLink, body);
    return article;
  }

  function filteredRecords() {
    const query = state.query.trim().toLocaleLowerCase(locale);
    return state.records.filter((record) => {
      if (state.category !== 'All' && record.category !== state.category) return false;
      if (!query) return true;
      return `${record.title} ${record.description} ${record.category}`.toLocaleLowerCase(locale).includes(query);
    });
  }

  function updateCount(count) {
    const candidates = [...document.querySelectorAll('[data-results], #results-count, .results-count, main .micro, main p')]
      .filter((element) => !element.closest('.card') && /result|resultado|video|vídeo/i.test(element.textContent || ''));
    const countNode = candidates.find((element) => {
      const position = element.compareDocumentPosition(state.grid);
      return Boolean(position & Node.DOCUMENT_POSITION_FOLLOWING);
    }) || candidates[0];
    if (countNode) countNode.textContent = `${count} ${copy.results}`;
  }

  function render() {
    const grid = findGrid();
    if (!grid || !state.records.length) return;
    state.grid = grid;
    const records = filteredRecords();
    state.rendering = true;
    grid.replaceChildren(...records.map(videoCard));
    grid.dataset.videoGrid = 'original';
    grid.dataset.videoCount = String(records.length);
    updateCount(records.length);
    state.rendering = false;
  }

  function categoryForControl(control) {
    const value = `${control.dataset.category || ''} ${control.textContent || ''}`.toLowerCase();
    if (/excel/.test(value)) return 'Excel';
    if (/(^|\s)(ai|ia)(\s|$)/.test(value)) return 'AI';
    if (/all|todos|todas/.test(value)) return 'All';
    return null;
  }

  function bindControls() {
    const search = document.querySelector('main input[type="search"], main input[data-video-search], main #library-search input, main input[placeholder*="video" i], main input[aria-label*="video" i]');
    if (search && !bound.has(search)) {
      bound.add(search);
      if (!search.getAttribute('aria-label')) search.setAttribute('aria-label', copy.search);
      search.addEventListener('input', () => { state.query = search.value; render(); });
    }

    document.querySelectorAll('main button, main [role="button"], main a').forEach((control) => {
      const category = categoryForControl(control);
      if (!category || bound.has(control) || control.closest('.card')) return;
      bound.add(control);
      control.addEventListener('click', (event) => {
        const href = control.getAttribute('href');
        if (href && !href.startsWith('#') && !href.includes('/videos')) return;
        if (!href || href.startsWith('#')) event.preventDefault();
        state.category = category;
        document.querySelectorAll('main [aria-pressed="true"]').forEach((node) => node.setAttribute('aria-pressed', 'false'));
        control.setAttribute('aria-pressed', 'true');
        render();
      });
    });
  }

  async function start() {
    try {
      state.records = await fetchRecords();
      if (!state.records.length) throw new Error('No valid original video records were found');
      bindControls();
      render();
      const main = document.querySelector('main');
      if (main) {
        new MutationObserver(() => {
          if (state.rendering) return;
          bindControls();
          const grid = findGrid();
          const cards = grid?.querySelectorAll(':scope > [data-original-video="true"]').length || 0;
          if (grid && cards !== filteredRecords().length) queueMicrotask(render);
        }).observe(main, { childList: true, subtree: true });
      }
      document.documentElement.dataset.originalVideosReady = 'true';
    } catch (error) {
      console.error('TechShift original video library could not be loaded.', error);
      document.documentElement.dataset.originalVideosReady = 'error';
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
