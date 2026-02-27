(function () {
  var STORAGE_KEY = 'babytools_consent_v1';
  var VALUE_ACCEPTED = 'accepted';
  var VALUE_REJECTED = 'rejected';
  var GA_ID = 'G-7ZHVCRYMKP';
  var gtagLoaded = false;
  var banner;
  var settingsButton;

  function getStoredConsent() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (_error) {
      return null;
    }
  }

  function setStoredConsent(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch (_error) {}
  }

  function ensureGtag() {
    if (gtagLoaded) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', GA_ID, {
      anonymize_ip: true,
      send_page_view: false,
    });

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(script);

    gtagLoaded = true;
  }

  function updateConsentStatus(status) {
    if (typeof window.gtag !== 'function') return;

    if (status === VALUE_ACCEPTED) {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      });
      return;
    }

    window.gtag('consent', 'update', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
  }

  function applyConsent(status) {
    if (status === VALUE_ACCEPTED) {
      ensureGtag();
      updateConsentStatus(VALUE_ACCEPTED);
      return;
    }
    if (status === VALUE_REJECTED) {
      updateConsentStatus(VALUE_REJECTED);
    }
  }

  function hideBanner() {
    if (!banner) return;
    banner.classList.add('is-hidden');
    if (settingsButton) settingsButton.classList.remove('is-hidden');
  }

  function showBanner() {
    if (!banner) return;
    banner.classList.remove('is-hidden');
    if (settingsButton) settingsButton.classList.add('is-hidden');
  }

  function isLegalPath(pathname) {
    return pathname.indexOf('/impressum/') !== -1 || pathname.indexOf('/datenschutz/') !== -1;
  }

  function createBanner() {
    banner = document.createElement('aside');
    banner.className = 'consent-banner is-hidden';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', 'Cookie-Einstellungen');

    var privacyHref = './datenschutz/';
    var path = window.location.pathname.toLowerCase();
    if (path.indexOf('/tools/') !== -1) {
      privacyHref = '../../datenschutz/';
    } else if (
      path.indexOf('/baby-richtig-anziehen-temperatur/') !== -1 ||
      path.indexOf('/windelbedarf-baby/') !== -1 ||
      path.indexOf('/baby-anziehen-nachts-temperatur/') !== -1 ||
      path.indexOf('/windeln-pro-monat-baby/') !== -1 ||
      path.indexOf('/impressum/') !== -1 ||
      path.indexOf('/datenschutz/') !== -1
    ) {
      privacyHref = '../datenschutz/';
    }

    banner.innerHTML =
      '<p><strong>Analyse-Cookies</strong></p>' +
      '<p class="consent-subline">Nur mit Zustimmung: Reichweite und Nutzung der Tools anonymisiert messen.</p>' +
      '<div class="consent-actions">' +
      '<button type="button" class="consent-btn accept" data-consent="accept">Akzeptieren</button>' +
      '<button type="button" class="consent-btn reject" data-consent="reject">Ablehnen</button>' +
      '</div>';
    banner.innerHTML +=
      '<div class="consent-meta">' +
      '<a href="' + privacyHref + '" class="consent-link">Datenschutz</a>' +
      '<span aria-hidden="true">•</span>' +
      '<span>Widerruf jederzeit ueber Cookie-Einstellungen</span>' +
      '</div>';

    document.body.appendChild(banner);

    banner.addEventListener('click', function (event) {
      var button = event.target.closest('[data-consent]');
      if (!button) return;

      var value = button.getAttribute('data-consent') === 'accept' ? VALUE_ACCEPTED : VALUE_REJECTED;
      setStoredConsent(value);
      applyConsent(value);
      if (
        value === VALUE_ACCEPTED &&
        typeof window.babytoolsTrack === 'function' &&
        !isLegalPath(window.location.pathname.toLowerCase())
      ) {
        window.babytoolsTrack('page_view', {
          path: window.location.pathname,
          title: document.title,
          source: 'consent_accept',
        });
      }
      hideBanner();
    });
  }

  function createSettingsButton() {
    settingsButton = document.createElement('button');
    settingsButton.type = 'button';
    settingsButton.className = 'consent-settings-btn';
    settingsButton.textContent = 'Cookies';
    settingsButton.setAttribute('aria-label', 'Cookie-Einstellungen oeffnen');
    settingsButton.addEventListener('click', showBanner);
    document.body.appendChild(settingsButton);
  }

  function init() {
    createBanner();
    createSettingsButton();

    var consent = getStoredConsent();
    if (consent === VALUE_ACCEPTED || consent === VALUE_REJECTED) {
      applyConsent(consent);
      hideBanner();
      return;
    }

    showBanner();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
