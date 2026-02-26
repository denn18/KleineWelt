import { useEffect, useState } from 'react';
import Desktop from './BetreuungsgruppeChat.jsx';
import Mobile from './mobile.jsx';

const MOBILE_BREAKPOINT = 768;

function BetreuungsgruppeChatWrapper() {
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

export default BetreuungsgruppeChatWrapper;
