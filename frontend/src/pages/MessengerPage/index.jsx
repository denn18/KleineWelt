import Mobile from './Mobile.jsx';
import MessengerPage from './MessengerPage.jsx';

function MessengerPageWrapper() {
  const isMobile = window.innerWidth < 768;

  return isMobile ? <Mobile /> : <MessengerPage />;
}

export default MessengerPageWrapper;
