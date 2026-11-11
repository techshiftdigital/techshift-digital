/* TechShift Digital compact language selector (English / Spanish / Portuguese). */
(() => {
  'use strict';

  const LANGUAGES = Object.freeze([
    { code: 'en', prefix: '', label: 'English', htmlLang: 'en' },
    { code: 'es', prefix: '/es', label: 'Español', htmlLang: 'es' },
    { code: 'pt-BR', prefix: '/pt-br', label: 'Português', htmlLang: 'pt-BR' },
  ]);

  const SELECTOR_CLASS = 'tsd-language-selector';
  const HOST_CLASS = 'tsd-language-host';
  const SLOT_CLASS = 'tsd-language-slot';
  const STYLE_ID = 'tsd-language-selector-styles';

  function normalizePath(pathname) {
    let value = String(pathname || '/').split('?')[0].split('#')[0];
    if (!value.startsWith('/')) value = `/${value}`;
    value = value.replace(/\/{2,}/g, '/');
    if (value !== '/' && !/\.[a-z0-9]+$/i.test(value) && !value.endsWith('/')) value += '/';
    return value;
  }

  function pathInfo(pathname) {
    const path = normalizePath(pathname);
    const match = path.match(/^\/(es|pt-br)(?=\/|$)/i);
    const prefix = match ? match[1].toLowerCase() : '';
    let basePath = match ? path.slice(match[0].length) : path;
    basePath = normalizePath(basePath || '/');

    return {
      path,
      basePath,
      language: prefix === 'es' ? 'es' : prefix === 'pt-br' ? 'pt-BR' : 'en',
    };
  }

  function pathForLanguage(pathname, languageCode) {
    const { basePath } = pathInfo(pathname);
    const language = LANGUAGES.find((item) => item.code === languageCode) || LANGUAGES[0];
    if (!language.prefix) return basePath;
    return normalizePath(`${language.prefix}${basePath === '/' ? '/' : basePath}`);
  }

  function removeLegacySelectors() {
    const selectors = [
      '[data-language-selector]',
      '[data-lang-switcher]',
      '#language-selector',
      '#language-switcher',
      '.language-selector',
      '.language-switcher',
      '.lang-selector',
      '.all-languages-link',
      '[data-all-languages]',
    ];

    document.querySelectorAll(selectors.join(',')).forEach((node) => {
      if (!node.classList.contains(SELECTOR_CLASS) && !node.closest(`.${SELECTOR_CLASS}`)) node.remove();
    });
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .${HOST_CLASS} {
        position: relative !important;
        box-sizing: border-box !important;
        padding-inline-end: 9.25rem !important;
      }
      .${SELECTOR_CLASS} {
        position: absolute !important;
        inset-inline-end: .75rem !important;
        top: 50% !important;
        transform: translateY(-50%) !important;
        z-index: 1001 !important;
        display: inline-flex !important;
        align-items: center !important;
        gap: .35rem !important;
        width: 8.15rem !important;
        min-width: 0 !important;
        max-width: 8.15rem !important;
        height: 2rem !important;
        margin: 0 !important;
        padding: 0 .4rem !important;
        border: 1px solid rgba(148, 163, 184, .38) !important;
        border-radius: .45rem !important;
        background: rgba(15, 29, 46, .92) !important;
        color: #eaf4ff !important;
        box-shadow: none !important;
        white-space: nowrap !important;
        font: 600 .75rem/1 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
      }
      .${SLOT_CLASS} {
        display: inline-flex !important;
        align-items: center !important;
      }
      .${SLOT_CLASS} > .${SELECTOR_CLASS} {
        position: static !important;
        inset: auto !important;
        transform: none !important;
      }
      .${SELECTOR_CLASS}:focus-within {
        border-color: #67e8f9 !important;
        box-shadow: 0 0 0 2px rgba(103, 232, 249, .22) !important;
      }
      .${SELECTOR_CLASS}__icon {
        flex: 0 0 auto !important;
        width: .85rem !important;
        height: .85rem !important;
        color: #67e8f9 !important;
      }
      .${SELECTOR_CLASS}__select {
        appearance: auto !important;
        -webkit-appearance: menulist !important;
        flex: 1 1 auto !important;
        min-width: 0 !important;
        width: 100% !important;
        height: 1.6rem !important;
        margin: 0 !important;
        padding: 0 .1rem !important;
        border: 0 !important;
        outline: 0 !important;
        background: transparent !important;
        color: inherit !important;
        box-shadow: none !important;
        font: inherit !important;
        cursor: pointer !important;
      }
      .${SELECTOR_CLASS}__select option {
        background: #0b1422 !important;
        color: #f8fafc !important;
      }
      .${SELECTOR_CLASS}__sr-only {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      }
      @media (max-width: 760px) {
        .${HOST_CLASS} { padding-inline-end: 7.55rem !important; }
        .${SELECTOR_CLASS} {
          inset-inline-end: 3rem !important;
          width: 6.65rem !important;
          max-width: 6.65rem !important;
          height: 1.9rem !important;
          padding-inline: .3rem !important;
        }
        .${SELECTOR_CLASS}__select { font-size: .7rem !important; }
      }
      @media (max-width: 390px) {
        .${HOST_CLASS} { padding-inline-end: 6.8rem !important; }
        .${SELECTOR_CLASS} {
          inset-inline-end: 2.65rem !important;
          width: 6rem !important;
          max-width: 6rem !important;
        }
        .${SELECTOR_CLASS}__icon { display: none !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function locateHeader() {
    return (
      document.querySelector('[data-site-header]') ||
      document.querySelector('.site-header') ||
      document.querySelector('.main-header') ||
      document.querySelector('body > header') ||
      document.querySelector('header')
    );
  }

  function locateHost(header) {
    const explicitSlot = header.querySelector('[data-language-selector-slot], .language-selector-slot');
    if (explicitSlot) return { host: explicitSlot, isSlot: true };

    const candidates = [
      '.header-inner',
      '.nav-inner',
      '.navbar-inner',
      '.topbar-inner',
      '.nav-container',
      '.header-container',
      '.topbar',
      ':scope > .container',
      ':scope > div',
      ':scope > nav',
    ];

    for (const selector of candidates) {
      try {
        const element = header.querySelector(selector);
        if (element) return { host: element, isSlot: false };
      } catch {
        // Older browsers can reject :scope; continue with the header fallback.
      }
    }
    return { host: header, isSlot: false };
  }

  function createSelector(currentLanguage) {
    const wrapper = document.createElement('div');
    wrapper.className = SELECTOR_CLASS;
    wrapper.setAttribute('data-tsd-language-selector', '');

    const label = document.createElement('label');
    label.className = `${SELECTOR_CLASS}__sr-only`;
    label.htmlFor = 'tsd-language-select';
    label.textContent = 'Choose language';

    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('class', `${SELECTOR_CLASS}__icon`);
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML =
      '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/>' +
      '<path d="M3.5 12h17M12 3c2.5 2.7 3.7 5.7 3.7 9S14.5 18.3 12 21M12 3C9.5 5.7 8.3 8.7 8.3 12S9.5 18.3 12 21" fill="none" stroke="currentColor" stroke-width="1.5"/>';

    const select = document.createElement('select');
    select.id = 'tsd-language-select';
    select.className = `${SELECTOR_CLASS}__select`;
    select.setAttribute('aria-label', 'Choose language');

    LANGUAGES.forEach((language) => {
      const option = document.createElement('option');
      option.value = language.code;
      option.textContent = language.label;
      option.selected = language.code === currentLanguage;
      select.appendChild(option);
    });

    select.addEventListener('change', () => {
      const destination = pathForLanguage(window.location.pathname, select.value);
      const nextUrl = `${destination}${window.location.search}${window.location.hash}`;
      if (nextUrl !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
        window.location.assign(nextUrl);
      }
    });

    wrapper.append(label, icon, select);
    return wrapper;
  }

  function mount() {
    if (!document.body || document.querySelector(`.${SELECTOR_CLASS}`)) return;

    removeLegacySelectors();
    injectStyles();

    const header = locateHeader();
    if (!header) {
      // Never recreate the former full-width body bar. Pages without a header
      // simply omit the selector rather than altering their content layout.
      return;
    }

    const { host, isSlot } = locateHost(header);
    const currentLanguage = pathInfo(window.location.pathname).language;
    document.documentElement.lang = LANGUAGES.find((item) => item.code === currentLanguage)?.htmlLang || 'en';

    host.classList.add(isSlot ? SLOT_CLASS : HOST_CLASS);
    host.appendChild(createSelector(currentLanguage));
  }

  const api = Object.freeze({ normalizePath, pathInfo, pathForLanguage });
  if (typeof document === 'undefined') {
    globalThis.__TSD_MULTILINGUAL_TEST__ = api;
    return;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }
})();
