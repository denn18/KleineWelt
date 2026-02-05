import { Link } from 'react-router-dom';
import { trackEvent } from '../utils/analytics.js';

function RoleSelectionPage() {
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 rounded-3xl bg-white/80 p-12 shadow-lg">
      <header className="flex flex-col gap-2 text-center">
        <h1 className="text-3xl font-bold text-brand-700">Wimmel Welt</h1>
        <p className="text-brand-600">
          Wähle deine Rolle aus, um ein persönliches Profil zu erstellen und passende Angebote zu entdecken.
        </p>
      </header>
      <div className="grid gap-6 sm:grid-cols-2">
        <Link
          to="/anmelden/eltern"
          onClick={() => trackEvent('cta_click', { label: 'Elternprofil anlegen', location: 'role_selection' })}
          className="flex flex-col gap-4 rounded-2xl border border-brand-100 bg-gradient-to-br from-white to-brand-50 p-8 text-left shadow transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg"
        >
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-500">Für Eltern</p>
            <h2 className="text-2xl font-semibold text-brand-700">Betreuungsplätze suchen</h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-600">
            Teile uns mit, wie viele Kinder du betreut haben möchtest, welche Betreuungszeiten wichtig sind und welche
            Postleitzahl dein Zuhause hat.
          </p>
          <span className="text-sm font-semibold text-brand-600">Elternprofil anlegen →</span>
        </Link>
        <Link
          to="/anmelden/tagespflegeperson"
          onClick={() => trackEvent('cta_click', { label: 'Kindertagespflegeprofil anlegen', location: 'role_selection' })}
          className="flex flex-col gap-4 rounded-2xl border border-brand-100 bg-gradient-to-br from-white to-brand-50 p-8 text-left shadow transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg"
        >
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-500">Für Kindertagespflegepersonen</p>
            <h2 className="text-2xl font-semibold text-brand-700">Betreuungsplätze anbieten</h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-600">
            Beschreibe deine Kindertagespflege, verfügbare Plätze, dein pädagogisches Konzept und wo man dich findet.
          </p>
          <span className="text-sm font-semibold text-brand-600">Kindertagespflegeprofil anlegen →</span>
        </Link>
      </div>
    </section>
  );
}

export default RoleSelectionPage;
