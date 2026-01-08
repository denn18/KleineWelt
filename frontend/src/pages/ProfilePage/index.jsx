import Desktop from './ProfilePage.jsx';
import Mobile from './Mobile.jsx';

function ProfilePageWrapper() {
  const isMobile = window.innerWidth < 768;
  return isMobile ? <Mobile /> : <Desktop />;
}

export default ProfilePageWrapper;
