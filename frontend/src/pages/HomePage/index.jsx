import Desktop from './HomePage.jsx';
import Mobile from './Mobile.jsx';

function HomePageWrapper() {
  const isMobile = window.innerWidth < 768;
  return isMobile ? <Mobile /> : <Desktop />;
}

export default HomePageWrapper;
