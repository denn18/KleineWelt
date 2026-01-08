import Desktop from './ParentSignupPage.jsx';
import Mobile from './Mobile.jsx';

function ParentSignupPageWrapper() {
  const isMobile = window.innerWidth < 768;
  return isMobile ? <Mobile /> : <Desktop />;
}

export default ParentSignupPageWrapper;
