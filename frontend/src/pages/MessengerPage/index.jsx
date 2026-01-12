import { useEffect, useState } from 'react';
import Desktop from './MessengerPage.jsx';
import Mobile from './Mobile.jsx';

const MOBILE_BREAKPOINT = 768;

function MessengerPageWrapper() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BREAKPOINT);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile ? <Mobile /> : <Desktop />;
}

export default MessengerPageWrapper;
