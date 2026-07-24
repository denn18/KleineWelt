import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SCROLL_RESTORE_EXCLUDED_PATHS = ['/betreuungsgruppe/chat'];
const SCROLL_RESTORE_EXCLUDED_PREFIXES = ['/nachrichten/'];

function shouldPreserveScroll(pathname) {
  return (
    SCROLL_RESTORE_EXCLUDED_PATHS.includes(pathname) ||
    SCROLL_RESTORE_EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (shouldPreserveScroll(pathname)) {
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}

export default ScrollToTop;
