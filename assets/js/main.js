(function () {
  function normalizePath(pathname) {
    return pathname.toLowerCase().replace(/\/index\.html$/, '/');
  }

  function isLegalPath(pathname) {
    return pathname.indexOf('/impressum/') !== -1 || pathname.indexOf('/datenschutz/') !== -1;
  }

  function track(eventName, props) {
    if (!eventName) return;
    var payload = props && typeof props === 'object' ? props : {};

    try {
      window.dispatchEvent(
        new CustomEvent('babytools:track', {
          detail: { event: eventName, props: payload },
        })
      );
    } catch (_error) {}

    if (typeof window.plausible === 'function') {
      try {
        window.plausible(eventName, { props: payload });
      } catch (_error) {}
    }

    if (typeof window.gtag === 'function') {
      try {
        window.gtag('event', eventName, payload);
      } catch (_error) {}
    }
  }

  function setupTracking() {
    var path = normalizePath(window.location.pathname);
    if (!isLegalPath(path)) {
      track('page_view', { path: path, title: document.title });
    }

    document.addEventListener('click', function (event) {
      var link = event.target.closest('a[href]');
      if (!link) return;

      var href = link.getAttribute('href') || '';
      if (!href || href.indexOf('#') === 0) return;

      var kind = 'content';
      if (link.closest('.tool-card')) kind = 'tool_card';
      else if (link.closest('.site-nav')) kind = 'nav';
      else if (link.closest('.footer-links')) kind = 'footer';

      var label = (link.textContent || '').trim().slice(0, 100);
      track('link_click', {
        kind: kind,
        href: href,
        label: label,
        path: path,
      });
    });
  }

  function setYear() {
    var year = String(new Date().getFullYear());
    var targets = document.querySelectorAll('.js-year');
    targets.forEach(function (node) {
      node.textContent = year;
    });
  }

  function detectCurrentPage(pathname, hash) {
    var currentHash = (hash || '').toLowerCase();
    if (isLegalPath(pathname)) {
      return '';
    }
    if (pathname === '/' || pathname === '') {
      if (currentHash === '#ratgeber-heading') {
        return 'ratgeber';
      }
      return 'tools';
    }
    if (pathname.indexOf('/baby-richtig-anziehen-temperatur/') !== -1) {
      return 'ratgeber';
    }
    if (pathname.indexOf('/baby-anziehen-nachts-temperatur/') !== -1) {
      return 'ratgeber';
    }
    if (pathname.indexOf('/windelbedarf-baby/') !== -1) {
      return 'ratgeber';
    }
    if (pathname.indexOf('/windeln-pro-monat-baby/') !== -1) {
      return 'ratgeber';
    }
    if (pathname.indexOf('/tools/babywetter/') !== -1) {
      return 'tools';
    }
    if (pathname.indexOf('/tools/windelrechner/') !== -1) {
      return 'tools';
    }
    return 'tools';
  }

  function setActiveNav() {
    var path = normalizePath(window.location.pathname);
    var current = detectCurrentPage(path, window.location.hash);
    var links = document.querySelectorAll('.site-nav [data-nav]');

    links.forEach(function (link) {
      var isActive = link.getAttribute('data-nav') === current;
      link.classList.toggle('is-active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function setupMenu() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var menu = document.querySelector('[data-site-menu]');
    if (!toggle || !menu) return;

    function setOpenState(isOpen) {
      menu.classList.toggle('is-open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }

    toggle.addEventListener('click', function () {
      var nextState = !menu.classList.contains('is-open');
      setOpenState(nextState);
    });

    document.addEventListener('click', function (event) {
      if (!menu.classList.contains('is-open')) return;
      if (menu.contains(event.target) || toggle.contains(event.target)) return;
      setOpenState(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        setOpenState(false);
      }
    });

    menu.addEventListener('click', function (event) {
      var link = event.target.closest('a[href]');
      if (link) {
        setOpenState(false);
      }
    });
  }

  window.babytoolsTrack = track;
  setYear();
  setActiveNav();
  setupMenu();
  window.addEventListener('hashchange', setActiveNav);
  setupTracking();
})();
