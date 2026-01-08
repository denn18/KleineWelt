import Desktop from './PrivacyPolicyPage.jsx';
import Mobile from './Mobile.jsx';

function PrivacyPolicyPageWrapper() {
  const isMobile = window.innerWidth < 768;
  return isMobile ? <Mobile /> : <Desktop />;
}

export default PrivacyPolicyPageWrapper;
