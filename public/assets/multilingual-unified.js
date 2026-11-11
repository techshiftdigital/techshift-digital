(() => {
  'use strict';

  const LANGUAGE_NAMES = new Set(['english', 'español', 'espanol', 'português', 'portugues', 'spanish', 'portuguese']);

  function removeResidualLegacyUi() {
    const legacy = document.querySelectorAll([
      '.language-selector', '.language-switcher', '.language-picker', '.language-bar',
      '.locale-selector', '.locale-switcher', '.lang-selector', '.lang-switcher',
      '[data-language-selector]', '[data-language-switcher]'
    ].join(','));
    legacy.forEach(element => {
      if (!element.closest('[data-tsd-language-menu]')) element.remove();
    });

    document.querySelectorAll('header a').forEach(anchor => {
      if (LANGUAGE_NAMES.has(anchor.textContent.trim().toLowerCase())) anchor.remove();
    });
  }

  function activateSelect() {
    const select = document.querySelector('[data-tsd-language-select]');
    if (!select) return;
    select.addEventListener('change', () => {
      const target = new URL(select.value, window.location.origin);
      target.search = window.location.search;
      target.hash = window.location.hash;
      window.location.assign(target.href);
    });
  }

  function start() {
    removeResidualLegacyUi();
    activateSelect();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
