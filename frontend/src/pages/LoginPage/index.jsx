import Mobile from './Mobile.jsx';
import LoginPage from './LoginPage.jsx';

function LoginPageWrapper() {
  const isMobile = window.innerWidth < 768;

  return isMobile ? <Mobile /> : <LoginPage />;
}

export default LoginPageWrapper;
