import Desktop from './ImprintPage.jsx';
import Mobile from './Mobile.jsx';

function ImprintPageWrapper() {
  const isMobile = window.innerWidth < 768;
  return isMobile ? <Mobile /> : <Desktop />;
}

export default ImprintPageWrapper;
