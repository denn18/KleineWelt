import Mobile from './Mobile.jsx';
import ParentSignupPage from './ParentSignupPage.jsx';

function ParentSignupPageWrapper() {
  const isMobile = window.innerWidth < 768;

  return isMobile ? <Mobile /> : <ParentSignupPage />;
}

export default ParentSignupPageWrapper;
