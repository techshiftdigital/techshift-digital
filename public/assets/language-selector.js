(function () {
  'use strict';

  if (window.__techShiftLanguageSelectorLoaded) return;
  window.__techShiftLanguageSelectorLoaded = true;

  var LABELS = {
    en: { option: 'English', aria: 'Choose language' },
    es: { option: 'Español', aria: 'Elegir idioma' },
    'pt-br': { option: 'Português (Brasil)', aria: 'Escolher idioma' }
  };

  function currentLanguage(pathname) {
    if (pathname === '/es' || pathname.indexOf('/es/') === 0) return 'es';
    if (pathname === '/pt-br' || pathname.indexOf('/pt-br/') === 0) return 'pt-br';
    return 'en';
  }

  function stripLanguage(pathname) {
    if (pathname === '/es' || pathname === '/pt-br') return '/';
    if (pathname.indexOf('/es/') === 0) return pathname.slice(3) || '/';
    if (pathname.indexOf('/pt-br/') === 0) return pathname.slice(6) || '/';
    return pathname || '/';
  }

  function addLanguage(basePath, language) {
    if (language === 'en') return basePath;
    if (basePath === '/') return '/' + language + '/';
    return '/' + language + (basePath.charAt(0) === '/' ? basePath : '/' + basePath);
  }

  function fallbackConfig() {
    var path = window.location.pathname || '/';
    var base = stripLanguage(path);
    return {
      current: currentLanguage(path),
      basePath: base,
      routes: {
        en: addLanguage(base, 'en'),
        es: addLanguage(base, 'es'),
        'pt-br': addLanguage(base, 'pt-br')
      },
      available: { en: true, es: true, 'pt-br': true }
    };
  }

  function readConfig() {
    var node = document.getElementById('tsd-language-routes');
    if (!node) return fallbackConfig();
    try {
      var parsed = JSON.parse(node.textContent || '{}');
      if (!parsed.routes || !parsed.current) return fallbackConfig();
      return parsed;
    } catch (error) {
      console.warn('[language-selector] Invalid route configuration; using path-based mapping.', error);
      return fallbackConfig();
    }
  }

  function insertionTarget() {
    return (
      document.querySelector('[data-language-selector-slot]') ||
      document.querySelector('header nav') ||
      document.querySelector('.site-nav') ||
      document.querySelector('nav[aria-label="Primary"]') ||
      document.querySelector('header .header-inner') ||
      document.querySelector('header .container') ||
      document.querySelector('header') ||
      document.body
    );
  }

  function buildSelector(config) {
    var wrapper = document.createElement('div');
    wrapper.className = 'tsd-language-selector';
    wrapper.setAttribute('data-techshift-language-selector', '');

    var icon = document.createElement('span');
    icon.className = 'tsd-language-selector__icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '🌐';

    var label = document.createElement('label');
    label.className = 'tsd-language-selector__label';
    label.htmlFor = 'tsd-language-select';
    label.textContent = (LABELS[config.current] || LABELS.en).aria;

    var select = document.createElement('select');
    select.id = 'tsd-language-select';
    select.className = 'tsd-language-selector__select';
    select.setAttribute('aria-label', label.textContent);

    ['en', 'es', 'pt-br'].forEach(function (language) {
      var option = document.createElement('option');
      option.value = language;
      option.textContent = LABELS[language].option;
      option.selected = language === config.current;
      if (config.available && config.available[language] === false) {
        option.title = 'Equivalent page unavailable; opens the language homepage.';
      }
      select.appendChild(option);
    });

    select.addEventListener('change', function () {
      var destination = config.routes[select.value] || '/';
      var suffix = (window.location.search || '') + (window.location.hash || '');
      window.location.assign(destination + suffix);
    });

    wrapper.appendChild(icon);
    wrapper.appendChild(label);
    wrapper.appendChild(select);
    return wrapper;
  }

  function mount() {
    if (document.querySelector('[data-techshift-language-selector]')) return;
    var config = readConfig();
    var selector = buildSelector(config);
    var target = insertionTarget();
    if (target === document.body) selector.classList.add('tsd-language-selector--fallback');
    target.appendChild(selector);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
