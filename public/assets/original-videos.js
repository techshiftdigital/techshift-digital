(() => {
  const normalise = (value) => String(value || '').trim().toLowerCase();

  for (const grid of document.querySelectorAll('[data-original-video-library]')) {
    const cards = [...grid.querySelectorAll('[data-original-video-card]')];
    const scope = grid.closest('main') || document;
    const search = scope.querySelector('[data-video-search], #video-search, input[type="search"]');
    const filters = [...scope.querySelectorAll('[data-video-filter], [data-category-filter], button[data-category]')];
    let activeCategory = 'all';

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

    for (const image of grid.querySelectorAll('img[data-video-id]')) {
      image.addEventListener('error', () => {
        if (image.dataset.thumbnailFallbackApplied) return;
        image.dataset.thumbnailFallbackApplied = 'true';
        image.src = `https://img.youtube.com/vi/${image.dataset.videoId}/hqdefault.jpg`;
      }, { once: true });
    }
    refresh();
  }
})();
