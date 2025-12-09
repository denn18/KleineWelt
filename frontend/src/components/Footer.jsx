import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="border-t border-brand-100 bg-white/80 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center text-sm text-slate-600 sm:flex-row sm:text-left">
        <p>&copy; {new Date().getFullYear()} Wimmel Welt. Alle Rechte vorbehalten.</p>
        <div className="flex gap-4">
          <Link className="hover:text-brand-600" to="/datenschutz">
            Datenschutz
          </Link>
          <Link className="hover:text-brand-600" to="/impressum">
            Impressum
          </Link>
          <Link className="hover:text-brand-600" to="/kontakt">
            Kontakt
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
