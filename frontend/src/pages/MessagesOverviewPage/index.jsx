import Mobile from './Mobile.jsx';
import MessagesOverviewPage from './MessagesOverviewPage.jsx';

function MessagesOverviewPageWrapper() {
  const isMobile = window.innerWidth < 768;

  return isMobile ? <Mobile /> : <MessagesOverviewPage />;
}

export default MessagesOverviewPageWrapper;
