import { Link } from 'react-router-dom';
import heroImage from '../assets/hero-family.svg';

const features = [
  {
    title: 'Persönliche Tagespflege',
    description:
      'Finde liebevolle Tagespflegepersonen in deiner Nähe, die genau zu den Bedürfnissen deiner Familie passen.',
  },
  {
    title: 'Transparente Verfügbarkeit',
    description:
      'Sieh sofort, wie viele freie Plätze noch verfügbar sind und welche Betreuungszeiten angeboten werden.',
  },
  {
    title: 'Direkte Kommunikation',
    description:
      'Nutze unseren Messenger, um schnell und sicher Fragen zu klären und Kennenlerntermine zu vereinbaren.',
  },
];

function HomePage() {
  return (
    <div className="flex flex-col gap-24">
      <section className="grid gap-12 rounded-3xl bg-white/70 p-10 shadow-lg backdrop-blur sm:grid-cols-2">
        <div className="flex flex-col gap-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-500">Willkommen bei Kleine Welt</p>
          <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">
            Gemeinsam schaffen wir einen sicheren Ort zum Wachsen.
          </h1>
          <p className="text-lg text-slate-600">
            Unsere Plattform verbindet Familien mit engagierten Tagespflegepersonen. Entdecke Betreuungsmöglichkeiten,
            koordiniere Anfragen und bleibe mit deinem Netzwerk in Kontakt – alles an einem Ort.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/anmelden"
              className="rounded-full bg-brand-600 px-6 py-3 text-center text-sm font-semibold text-white shadow-md transition hover:bg-brand-700"
            >
              Jetzt registrieren
            </Link>
            <Link
              to="/familienzentrum"
              className="rounded-full border border-brand-200 px-6 py-3 text-center text-sm font-semibold text-brand-700 transition hover:border-brand-400 hover:text-brand-800"
            >
              Mehr erfahren
            </Link>
          </div>
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
