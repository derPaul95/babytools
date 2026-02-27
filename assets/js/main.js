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

  function detectCurrentPage(pathname) {
    if (isLegalPath(pathname)) {
      return '';
    }
    if (pathname.indexOf('/baby-richtig-anziehen-temperatur/') !== -1) {
      return 'anziehen';
    }
    if (pathname.indexOf('/baby-anziehen-nachts-temperatur/') !== -1) {
      return 'anziehen';
    }
    if (pathname.indexOf('/windelbedarf-baby/') !== -1) {
      return 'windelbedarf';
    }
    if (pathname.indexOf('/windeln-pro-monat-baby/') !== -1) {
      return 'windelbedarf';
    }
    if (pathname.indexOf('/tools/babywetter/') !== -1) {
      return 'babywetter';
    }
    if (pathname.indexOf('/tools/windelrechner/') !== -1) {
      return 'windelrechner';
    }
    return 'home';
  }

  function setActiveNav() {
    var path = normalizePath(window.location.pathname);
    var current = detectCurrentPage(path);
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

  window.babytoolsTrack = track;
  setYear();
  setActiveNav();
  setupTracking();
})();
