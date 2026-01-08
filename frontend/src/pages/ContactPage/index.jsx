import Mobile from './Mobile.jsx';
import ContactPage from './ContactPage.jsx';

function ContactPageWrapper() {
  const isMobile = window.innerWidth < 768;

  return isMobile ? <Mobile /> : <ContactPage />;
}

export default ContactPageWrapper;
