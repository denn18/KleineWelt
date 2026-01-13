// frontend/src/pages/RoleSelectionPage/RoleSelectionPageMobile.jsx
import { Link } from 'react-router-dom';

function RoleSelectionPageMobile() {
  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-6">
      {/* Mobile Shell/Card wie in der Handy-App (nur Layout), Inhalt/Funktion wie Web */}
      <div className="flex flex-col gap-6 rounded-3xl border border-brand-100 bg-white/90 p-6 shadow-lg">
        <header className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-extrabold text-brand-700">Wimmel Welt</h1>
          <p className="text-sm text-slate-600">
            Wähle deine Rolle aus, um ein persönliches Profil zu erstellen und passende Angebote zu entdecken.
          </p>
        </header>

        <div className="flex flex-col gap-4">
          <Link
            to="/anmelden/eltern"
            className="flex flex-col gap-3 rounded-3xl border border-brand-100 bg-gradient-to-br from-white to-brand-50 p-5 shadow-sm transition active:scale-[0.99] hover:border-brand-300 hover:shadow-md"
          >
            <div className="flex flex-col gap-1">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-500">Für Eltern</p>
              <h2 className="text-xl font-extrabold text-brand-700">Betreuungsplätze suchen</h2>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              Teile uns mit, wie viele Kinder du betreut haben möchtest, welche Betreuungszeiten wichtig sind und welche
              Postleitzahl dein Zuhause hat.
            </p>
            <span className="text-sm font-semibold text-brand-600">Elternprofil anlegen →</span>
          </Link>

          <Link
            to="/anmelden/tagespflegeperson"
            className="flex flex-col gap-3 rounded-3xl border border-brand-100 bg-gradient-to-br from-white to-brand-50 p-5 shadow-sm transition active:scale-[0.99] hover:border-brand-300 hover:shadow-md"
          >
            <div className="flex flex-col gap-1">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-500">Für Kindertagespflegepersonen</p>
              <h2 className="text-xl font-extrabold text-brand-700">Betreuungsplätze anbieten</h2>
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

export default RoleSelectionPageMobile;
