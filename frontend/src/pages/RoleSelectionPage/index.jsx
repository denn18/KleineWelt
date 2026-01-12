import { useEffect, useState } from 'react';
import Desktop from './RoleSelectionPage.jsx';
import Mobile from './RoleSelectionPageMobile.jsx';

const BREAKPOINT = 768;

function PageWrapper() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth < BREAKPOINT
  );

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < BREAKPOINT);
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
