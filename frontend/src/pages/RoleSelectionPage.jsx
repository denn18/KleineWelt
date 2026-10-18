import { Link } from 'react-router-dom';
import { trackEvent } from '../utils/analytics.js';

function trackRoleSelection(label) {
  if (window.matchMedia('(min-width: 768px)').matches) {
    trackEvent('cta_click', { label, location: 'role_selection' });
  }
}

function RoleSelectionPage() {
  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-6 md:max-w-4xl md:gap-8 md:rounded-3xl md:bg-white/80 md:p-12 md:shadow-lg">
      <div className="flex flex-col gap-6 rounded-3xl border border-brand-100 bg-white/90 p-6 shadow-lg md:contents">
        <header className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-extrabold text-brand-700 md:text-3xl md:font-bold">Wimmel Welt</h1>
          <p className="text-sm text-slate-600 md:text-base md:text-brand-600">
            Wähle deine Rolle aus, um ein persönliches Profil zu erstellen und passende Angebote zu entdecken.
          </p>
        </header>

        <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-6">
          <Link
            to="/anmelden/eltern"
            onClick={() => trackRoleSelection('Elternprofil anlegen')}
            className="flex flex-col gap-3 rounded-3xl border border-brand-100 bg-gradient-to-br from-white to-brand-50 p-5 shadow-sm transition active:scale-[0.99] hover:border-brand-300 hover:shadow-md md:gap-4 md:rounded-2xl md:p-8 md:text-left md:shadow md:active:scale-100 md:hover:-translate-y-1 md:hover:shadow-lg"
          >
            <div className="flex flex-col gap-1 md:block">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-500 md:text-sm md:font-semibold">Für Eltern</p>
              <h2 className="text-xl font-extrabold text-brand-700 md:text-2xl md:font-semibold">Betreuungsplätze suchen</h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              Teile uns mit, wie viele Kinder du betreut haben möchtest, welche Betreuungszeiten wichtig sind und welche
              Postleitzahl dein Zuhause hat.
            </p>
            <span className="text-sm font-semibold text-brand-600">Elternprofil anlegen →</span>
          </Link>

          <Link
            to="/anmelden/tagespflegeperson"
            onClick={() => trackRoleSelection('Kindertagespflegeprofil anlegen')}
            className="flex flex-col gap-3 rounded-3xl border border-brand-100 bg-gradient-to-br from-white to-brand-50 p-5 shadow-sm transition active:scale-[0.99] hover:border-brand-300 hover:shadow-md md:gap-4 md:rounded-2xl md:p-8 md:text-left md:shadow md:active:scale-100 md:hover:-translate-y-1 md:hover:shadow-lg"
          >
            <div className="flex flex-col gap-1 md:block">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-500 md:text-sm md:font-semibold">Für Kindertagespflegepersonen</p>
              <h2 className="text-xl font-extrabold text-brand-700 md:text-2xl md:font-semibold">Betreuungsplätze anbieten</h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              Beschreibe deine Kindertagespflege, verfügbare Plätze, dein pädagogisches Konzept und wo man dich findet.
            </p>
            <span className="text-sm font-semibold text-brand-600">Kindertagespflegeprofil anlegen →</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default RoleSelectionPage;
