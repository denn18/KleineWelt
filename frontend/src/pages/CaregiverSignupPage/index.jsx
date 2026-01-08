import Mobile from './Mobile.jsx';
import CaregiverSignupPage from './CaregiverSignupPage.jsx';

function CaregiverSignupPageWrapper() {
  const isMobile = window.innerWidth < 768;

  return isMobile ? <Mobile /> : <CaregiverSignupPage />;
}

export default CaregiverSignupPageWrapper;
