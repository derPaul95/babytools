(function () {
  function setYear() {
    var year = String(new Date().getFullYear());
    var targets = document.querySelectorAll('.js-year');
    targets.forEach(function (node) {
      node.textContent = year;
    });
  }

  function normalizePath(pathname) {
    return pathname.toLowerCase().replace(/\/index\.html$/, '/');
  }

  function detectCurrentPage(pathname) {
    if (pathname.indexOf('/tools/babywetter/') !== -1) {
      return 'babywetter';
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

  setYear();
  setActiveNav();
})();
