import Desktop from './MessengerPage.jsx';
import Mobile from './Mobile.jsx';

function MessengerPageWrapper() {
  const isMobile = window.innerWidth < 768;
  return isMobile ? <Mobile /> : <Desktop />;
}

export default MessengerPageWrapper;
