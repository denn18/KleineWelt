import Mobile from './Mobile.jsx';
import HomePage from './HomePage.jsx';

function HomePageWrapper() {
  const isMobile = window.innerWidth < 768;

  return isMobile ? <Mobile /> : <HomePage />;
}

export default HomePageWrapper;
