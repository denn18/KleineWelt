function Footer() {
  return (
    <footer className="border-t border-brand-100 bg-white/80 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center text-sm text-slate-600 sm:flex-row sm:text-left">
        <p>&copy; {new Date().getFullYear()} Kleine Welt. Alle Rechte vorbehalten.</p>
        <div className="flex gap-4">
          <a className="hover:text-brand-600" href="#">Datenschutz</a>
          <a className="hover:text-brand-600" href="#">Impressum</a>
          <a className="hover:text-brand-600" href="#">Kontakt</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
