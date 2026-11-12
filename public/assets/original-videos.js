/* TechShift Digital v5.0.6 — canonical YouTube links, thumbnails and safe fallback. */
(() => {
  const normalise = (value) => String(value ?? '').trim().toLowerCase();
  const validVideoId = (value) => {
    const candidate = String(value ?? '').trim();
    return /^[A-Za-z0-9_-]{11}$/.test(candidate) ? candidate : '';
  };
  const youtubeUrl = (videoId) => `https://www.youtube.com/watch?v=${videoId}`;
  const primaryThumbnail = (videoId) => `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  const fallbackThumbnail = (videoId) => `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  const missingText = (value) => /^(?:undefined|null)$/i.test(String(value ?? '').trim());

  const removeMissingMetadata = (card) => {
    const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
    const empty = [];
    while (walker.nextNode()) {
      if (missingText(walker.currentNode.nodeValue)) empty.push(walker.currentNode);
    }
    for (const node of empty) node.nodeValue = '';

    for (const element of card.querySelectorAll('*')) {
      for (const attribute of [...element.attributes]) {
        if (missingText(attribute.value)) element.removeAttribute(attribute.name);
      }
    }
  };

  for (const grid of document.querySelectorAll('[data-original-video-library]')) {
    const cards = [...grid.querySelectorAll('[data-original-video-card]')];
    const scope = grid.closest('main') || document;
    const search = scope.querySelector('[data-video-search], #video-search, input[type="search"]');
    const filters = [...scope.querySelectorAll('[data-video-filter], [data-category-filter], button[data-category]')];
    let activeCategory = 'all';

    for (const card of cards) {
      const image = card.querySelector('img[data-video-id], img.original-video-thumbnail');
      const videoId = validVideoId(card.dataset.videoId || image?.dataset.videoId);
      removeMissingMetadata(card);
      if (!videoId) continue;

      card.dataset.videoId = videoId;
      for (const link of card.querySelectorAll('[data-thumbnail-link], [data-title-link], [data-watch-link]')) {
        link.href = youtubeUrl(videoId);
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }

      if (image) {
        image.dataset.videoId = videoId;
        image.addEventListener('error', () => {
          if (image.dataset.thumbnailFallbackApplied) return;
          image.dataset.thumbnailFallbackApplied = 'true';
          image.src = fallbackThumbnail(videoId);
        });
        image.src = primaryThumbnail(videoId);
      }
    }

    const refresh = () => {
      const query = normalise(search?.value);
      let visible = 0;
      for (const card of cards) {
        const category = normalise(card.dataset.category);
        const text = normalise(card.textContent);
        const showCategory = activeCategory === 'all' || category === activeCategory;
        const showSearch = !query || text.includes(query);
        card.hidden = !(showCategory && showSearch);
        if (!card.hidden) visible += 1;
      }
      for (const node of scope.querySelectorAll('[data-video-count]')) node.textContent = String(visible);
    };

    search?.addEventListener('input', refresh);
    for (const button of filters) {
      button.addEventListener('click', () => {
        activeCategory = normalise(
          button.dataset.videoFilter || button.dataset.categoryFilter || button.dataset.category || 'all'
        );
        for (const item of filters) item.setAttribute('aria-pressed', String(item === button));
        refresh();
      });
    }
    refresh();
  }
})();
