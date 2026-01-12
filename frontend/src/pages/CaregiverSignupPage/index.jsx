import { useEffect, useState } from 'react';
import Desktop from './CaregiverSignupPage.jsx';
import Mobile from './CaregiverSignupPageMobile.jsx';

const BREAKPOINT = 768;

function PageWrapper() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < BREAKPOINT;
  });

  useEffect(() => {
    function update() {
      setIsMobile(window.innerWidth < BREAKPOINT);
    }

    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return isMobile ? <Mobile /> : <Desktop />;
}

export default PageWrapper;
