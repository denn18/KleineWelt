import Mobile from './Mobile.jsx';
import RoleSelectionPage from './RoleSelectionPage.jsx';

function RoleSelectionPageWrapper() {
  const isMobile = window.innerWidth < 768;

  return isMobile ? <Mobile /> : <RoleSelectionPage />;
}

export default RoleSelectionPageWrapper;
