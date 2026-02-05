export function trackEvent(name, params = {}) {
  if (typeof window === 'undefined') {
    return;
  }

  if (typeof window.gtag !== 'function') {
    return;
  }

  window.gtag('event', name, params);
}

export function getPagePath() {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.location?.pathname || '';
}
