(() => {
  'use strict';

  const MOUNTED = 'data-tsd-language-mounted';
  const HOST = 'data-tsd-language-host';

  const controlSelectors = [
    '[data-language-selector]',
    '[data-language-switcher]',
    '.tsd-language-selector',
    '.multilingual-language-selector',
    '.multilingual-selector',
    '.language-selector',
    '.language-switcher',
    '.language-dropdown',
    '.locale-selector',
    '.locale-switcher',
    '[class*="language" i] select',
    '[class*="locale" i] select',
    '[id*="language" i] select',
    '[id*="locale" i] select',
    'select[name="language"]',
    'select[name="locale"]',
    'select[id*="language" i]',
    'select[id*="locale" i]',
    'select[aria-label*="language" i]',
    'select[aria-label*="idioma" i]',
    'select[aria-label*="língua" i]',
    'select[aria-label*="lingua" i]'
  ];

  const wrapperSelector = [
    '[data-language-selector]',
    '[data-language-switcher]',
    '.tsd-language-selector',
    '.multilingual-language-selector',
    '.multilingual-selector',
    '.language-selector',
    '.language-switcher',
    '.language-dropdown',
    '.locale-selector',
    '.locale-switcher',
    '[class*="language" i]',
    '[class*="locale" i]',
    '[id*="language" i]',
    '[id*="locale" i]'
  ].join(',');

  const hostSelectors = [
    'header [data-nav-inner]',
    'header .nav-inner',
    'header .navbar-inner',
    'header .header-inner',
    'header .nav-container',
    'header .header-container',
    'header > .container',
    '[role="banner"] [data-nav-inner]',
    '[role="banner"] .nav-inner',
    '[role="banner"] .header-inner',
    '[role="banner"] > .container'
  ];

  function isElement(value) {
    return value && value.nodeType === Node.ELEMENT_NODE;
  }

  function visible(element) {
    if (!isElement(element)) return false;
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }

  function normaliseControl(candidate) {
    if (!isElement(candidate)) return null;

    if (candidate.matches('select')) {
      const knownWrapper = candidate.closest(wrapperSelector);
      if (knownWrapper && knownWrapper !== candidate) return knownWrapper;

      const parent = candidate.parentElement;
      if (parent && !parent.matches('header, nav, body, html')) {
        const parentHasOnlyControl = parent.children.length === 1 ||
          (parent.children.length === 2 && parent.querySelector('label, [aria-hidden="true"], svg'));
        if (parentHasOnlyControl) return parent;
      }
    }

    return candidate;
  }

  function findControl() {
    const mounted = document.querySelector(`[${MOUNTED}="true"]`);
    if (mounted) return mounted;

    for (const selector of controlSelectors) {
      const candidates = Array.from(document.querySelectorAll(selector));
      const candidate = candidates.find((element) => visible(element)) || candidates[0];
      if (candidate) return normaliseControl(candidate);
    }

    // Safe fallback for package variants that changed class names but retained
    // the three language option labels.
    for (const select of document.querySelectorAll('select')) {
      const text = Array.from(select.options, (option) => option.textContent || '').join(' ').toLowerCase();
      const matches = ['english', 'español', 'português', 'portuguese'].filter((term) => text.includes(term)).length;
      if (matches >= 2) return normaliseControl(select);
    }

    return null;
  }

  function findHost(control) {
    const headerRoot = control.closest('header, [role="banner"], .site-header, .main-header') ||
      document.querySelector('header, [role="banner"], .site-header, .main-header');

    for (const selector of hostSelectors) {
      const candidate = document.querySelector(selector);
      if (!candidate || candidate === control || control.contains(candidate)) continue;
      if (headerRoot && !headerRoot.contains(candidate)) continue;
      return candidate;
    }

    if (headerRoot) {
      const rootDisplay = window.getComputedStyle(headerRoot).display;
      if (rootDisplay === 'flex' || rootDisplay === 'inline-flex' || rootDisplay === 'grid' || rootDisplay === 'inline-grid') {
        return headerRoot;
      }

      // Prefer a persistent outer flow container over a collapsible <nav>, so
      // the selector remains visible beside the mobile menu button.
      const flowContainer = Array.from(headerRoot.querySelectorAll(':scope > div, :scope > section, div, section'))
        .find((candidate) => {
          const display = window.getComputedStyle(candidate).display;
          return candidate !== control && !control.contains(candidate) &&
            (display === 'flex' || display === 'inline-flex' || display === 'grid' || display === 'inline-grid');
        });
      return flowContainer || headerRoot;
    }

    return null;
  }

  function findMenuToggle(scope) {
    return scope.querySelector([
      '[data-nav-toggle]',
      '.nav-toggle',
      '.navbar-toggle',
      '.menu-toggle',
      '.mobile-menu-toggle',
      'button[aria-controls*="nav" i]',
      'button[aria-label*="menu" i]',
      'button[aria-label*="menú" i]',
      'button[aria-label*="menu" i]'
    ].join(','));
  }

  function markHost(host) {
    host.setAttribute(HOST, 'true');
    const display = window.getComputedStyle(host).display;
    host.classList.toggle('tsd-language-host--flow', display === 'flex' || display === 'inline-flex' || display === 'grid' || display === 'inline-grid');
    host.classList.toggle('tsd-language-host--overlay', !(display === 'flex' || display === 'inline-flex' || display === 'grid' || display === 'inline-grid'));
  }

  function mount() {
    const control = findControl();
    if (!control) {
      console.warn('[TechShift] Language selector header fix: no language selector was found.');
      return;
    }

    const host = findHost(control);
    if (!host) {
      console.warn('[TechShift] Language selector header fix: no navigation header was found.');
      return;
    }

    markHost(host);
    control.setAttribute(MOUNTED, 'true');
    control.setAttribute('data-tsd-language-compact', 'true');

    const toggle = findMenuToggle(host);
    if (toggle && toggle.parentElement === host) {
      host.insertBefore(control, toggle);
    } else if (control.parentElement !== host) {
      host.appendChild(control);
    }

    const select = control.matches('select') ? control : control.querySelector('select');
    if (select && !select.getAttribute('aria-label')) {
      select.setAttribute('aria-label', 'Language');
    }

    document.documentElement.classList.add('tsd-language-header-fix-ready');
    document.dispatchEvent(new CustomEvent('tsd:language-selector-mounted', {
      detail: { control, host }
    }));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }

  // Re-mount after client-side navigation or a late multilingual render.
  window.addEventListener('pageshow', mount);
})();
