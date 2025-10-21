import { Link } from 'react-router-dom';

function RoleSelectionPage() {
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 rounded-3xl bg-white/80 p-12 shadow-lg">
      <header className="flex flex-col gap-2 text-center">
<<<<<<< Updated upstream
        <h1 className="text-3xl font-bold text-brand-700">Wie möchtest du Kleine Welt nutzen?</h1>
        <p className="text-brand-600">
=======
        <h1 className="text-3xl font-bold text-slate-900">Wie möchtest du Kleine Welt nutzen?</h1>
        <p className="text-slate-600">
>>>>>>> Stashed changes
          Wähle deine Rolle aus, um ein persönliches Profil zu erstellen und passende Angebote zu entdecken.
        </p>
      </header>
      <div className="grid gap-6 sm:grid-cols-2">
        <Link
          to="/anmelden/eltern"
          className="flex flex-col gap-4 rounded-2xl border border-brand-100 bg-gradient-to-br from-white to-brand-50 p-8 text-left shadow transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg"
        >
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-500">Für Eltern</p>
            <h2 className="text-2xl font-semibold text-brand-700">Familienprofil erstellen</h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-600">
            Teile uns mit, wie viele Kinder du betreut haben möchtest, welche Betreuungszeiten wichtig sind und welche
            Postleitzahl dein Zuhause hat.
          </p>
          <span className="text-sm font-semibold text-brand-600">Jetzt starten →</span>
        </Link>
        <Link
          to="/anmelden/tagespflegeperson"
          className="flex flex-col gap-4 rounded-2xl border border-brand-100 bg-gradient-to-br from-white to-brand-50 p-8 text-left shadow transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg"
        >
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-500">Für Tagespflegepersonen</p>
            <h2 className="text-2xl font-semibold text-brand-700">Betreuungsplätze anbieten</h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-600">
            Beschreibe deine Kindertagespflege, verfügbare Plätze, dein pädagogisches Konzept und wo man dich findet.
          </p>
          <span className="text-sm font-semibold text-brand-600">Profil anlegen →</span>
        </Link>
      </div>
    </section>
  );
}

export default RoleSelectionPage;
