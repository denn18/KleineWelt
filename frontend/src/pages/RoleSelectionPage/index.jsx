import Desktop from './RoleSelectionPage.jsx';
import Mobile from './Mobile.jsx';

function RoleSelectionPageWrapper() {
  const isMobile = window.innerWidth < 768;
  return isMobile ? <Mobile /> : <Desktop />;
}

export default RoleSelectionPageWrapper;
