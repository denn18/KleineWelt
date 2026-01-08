import Mobile from './Mobile.jsx';
import ProfilePage from './ProfilePage.jsx';

function ProfilePageWrapper() {
  const isMobile = window.innerWidth < 768;

  return isMobile ? <Mobile /> : <ProfilePage />;
}

export default ProfilePageWrapper;
