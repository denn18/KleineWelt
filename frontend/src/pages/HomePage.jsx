import { Link } from 'react-router-dom';
import heroImage from '../assets/hero-family.svg';
import { useAuth } from '../context/AuthContext.jsx';

const features = [
  {
<<<<<<< Updated upstream
    title: 'Kindervermittlung mit Herz',
    description:
      'Erhalte passende Vorschläge für Kindertagespflegepersonen, die freie Betreuungsplätze und dein Betreuungsmodell abdecken.',
=======
    title: 'Persönliche Kindertagespflege',
    description:
      'Finde liebevolle Kindertagespflegepersonen in deiner Nähe, die genau zu den Bedürfnissen deiner Familie passen.',
>>>>>>> Stashed changes
  },
  {
    title: 'Transparente Kindertagespflege',
    description:
      'Vergleiche pädagogische Konzepte, freie Kindertagespflegeplätze und Altersgrenzen auf einen Blick.',
  },
  {
    title: 'Direkte Kommunikation',
    description:
      'Nutze unseren Messenger für schnelle Absprachen, Kennenlerntermine und individuelle Fragen rund um deine Betreuung.',
  },
];

function HomePage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-24">
      <section className="grid gap-12 rounded-3xl bg-white/70 p-10 shadow-lg backdrop-blur sm:grid-cols-2">
        <div className="flex flex-col gap-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-500">Willkommen bei Wimmel Welt</p>
          <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">
            Gemeinsam schaffen wir einen sicheren Ort zum Wachsen.
          </h1>
          <p className="text-lg text-slate-600">
<<<<<<< Updated upstream
            Unsere Plattform verbindet Familien mit engagierten Tagespflegepersonen. Entdecke Betreuungsmöglichkeiten,
            finde freie Kindertagespflegeplätze in deiner Nähe und koordiniere Kindervermittlung, Kennenlernen und
            Betreuungsplätze in einem digitalen Familienzentrum.
=======
            Unsere Plattform verbindet Familien mit engagierten Kindertagespflegepersonen. Entdecke Betreuungsmöglichkeiten,
            koordiniere Anfragen und bleibe mit deinem Netzwerk in Kontakt – alles an einem Ort.
>>>>>>> Stashed changes
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            {!user ? (
              <Link
                to="/anmelden"
                className="rounded-full bg-brand-600 px-6 py-3 text-center text-sm font-semibold text-white shadow-md transition hover:bg-brand-700"
              >
                Jetzt registrieren
              </Link>
            ) : null}
            <Link
              to="/login"
              className="rounded-full border border-brand-200 px-6 py-3 text-center text-sm font-semibold text-brand-700 transition hover:border-brand-400 hover:text-brand-800"
            >
              Bereits registriert? Jetzt einloggen
            </Link>
          </div>
          <p className="text-sm leading-relaxed text-slate-500">
            Kleine Welt macht Kindertagespflege, Kindervermittlung und die Suche nach freien Betreuungsplätzen so einfach wie
            möglich – für Familien und Tagespflegepersonen gleichermaßen.
          </p>
        </div>
        <div className="flex items-center justify-center">
          <img src={heroImage} alt="Familie" className="max-h-80 w-full object-contain" />
        </div>
      </section>

      <section className="grid gap-8 sm:grid-cols-3">
        {features.map((feature) => (
          <article key={feature.title} className="flex flex-col gap-3 rounded-2xl bg-white/80 p-6 shadow">
            <h2 className="text-xl font-semibold text-brand-700">{feature.title}</h2>
            <p className="text-sm leading-relaxed text-slate-600">{feature.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}

export default HomePage;
