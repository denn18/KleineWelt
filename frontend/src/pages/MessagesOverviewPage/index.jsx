import Desktop from './MessagesOverviewPage.jsx';
import Mobile from './Mobile.jsx';

function MessagesOverviewPageWrapper() {
  const isMobile = window.innerWidth < 768;
  return isMobile ? <Mobile /> : <Desktop />;
}

export default MessagesOverviewPageWrapper;
