import { useEffect, useState } from 'react';
import { createElement } from 'react';
import Desktop from './VerificationPendingPage.jsx';
import Mobile from './mobile.js';

const MOBILE_BREAKPOINT = 768;

function VerificationPendingPageWrapper() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BREAKPOINT);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return createElement(isMobile ? Mobile : Desktop);
}

export default VerificationPendingPageWrapper;
