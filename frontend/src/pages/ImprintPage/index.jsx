import Mobile from './Mobile.jsx';
import ImprintPage from './ImprintPage.jsx';

function ImprintPageWrapper() {
  const isMobile = window.innerWidth < 768;

  return isMobile ? <Mobile /> : <ImprintPage />;
}

export default ImprintPageWrapper;
