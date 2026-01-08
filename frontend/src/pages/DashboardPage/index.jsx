import Mobile from './Mobile.jsx';
import DashboardPage from './DashboardPage.jsx';

function DashboardPageWrapper() {
  const isMobile = window.innerWidth < 768;

  return isMobile ? <Mobile /> : <DashboardPage />;
}

export default DashboardPageWrapper;
