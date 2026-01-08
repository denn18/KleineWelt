import Mobile from './Mobile.jsx';
import CaregiverDetailPage from './CaregiverDetailPage.jsx';

function CaregiverDetailPageWrapper() {
  const isMobile = window.innerWidth < 768;

  return isMobile ? <Mobile /> : <CaregiverDetailPage />;
}

export default CaregiverDetailPageWrapper;
