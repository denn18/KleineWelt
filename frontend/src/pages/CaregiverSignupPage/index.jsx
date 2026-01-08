import Desktop from './CaregiverSignupPage.jsx';
import Mobile from './Mobile.jsx';

function CaregiverSignupPageWrapper() {
  const isMobile = window.innerWidth < 768;
  return isMobile ? <Mobile /> : <Desktop />;
}

export default CaregiverSignupPageWrapper;
