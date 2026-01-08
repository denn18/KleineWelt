import Desktop from './CaregiverDetailPage.jsx';
import Mobile from './Mobile.jsx';

function CaregiverDetailPageWrapper() {
  const isMobile = window.innerWidth < 768;
  return isMobile ? <Mobile /> : <Desktop />;
}

export default CaregiverDetailPageWrapper;
