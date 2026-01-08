import Mobile from './Mobile.jsx';
import PrivacyPolicyPage from './PrivacyPolicyPage.jsx';

function PrivacyPolicyPageWrapper() {
  const isMobile = window.innerWidth < 768;

  return isMobile ? <Mobile /> : <PrivacyPolicyPage />;
}

export default PrivacyPolicyPageWrapper;
