import Desktop from './DashboardPage.jsx';
import Mobile from './Mobile.jsx';

function DashboardPageWrapper() {
  const isMobile = window.innerWidth < 768;
  return isMobile ? <Mobile /> : <Desktop />;
}

export default DashboardPageWrapper;
