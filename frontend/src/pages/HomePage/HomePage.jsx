import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import heroImage from '../assets/hero-family.svg';
import heroImage2 from '../assets/hero-family2.png';
import heroImage3 from '../assets/hero-family3.svg';
import { useAuth } from '../context/AuthContext.jsx';
import { trackEvent } from '../utils/analytics.js';
import LogoCarousel from '../../components/LogoCarousel.jsx';
import { slugify } from '../../utils/caregiverProfilePath.js';

const darkbluefont = '#353e73';

const pressArticles = [
  {
    newspaper: 'Neue Westfälische',
    title: '„Hilfe für Eltern in Gütersloh: Neue Plattform vermittelt freie Betreuungsplätze“',
    description:
      'Die Neue Westfälische berichtet über Wimmel Welt als neue digitale Unterstützung, damit Familien schneller passende Betreuungsplätze finden.',
    url: 'https://www.nw.de/lokal/kreis_guetersloh/guetersloh/24268119_Hilfe-fuer-Eltern-in-Guetersloh-Neue-Plattform-vermittelt-jetzt-freie-Betreuungsplaetze.html',
    domain: 'nw.de',
    logo: '/nw.png',
  },
  {
    newspaper: 'Die Glocke',
    title: '„Kreis Gütersloh: So einfach klappt’s mit dem Betreuungsplatz“',
    description:
      'Die Glocke hebt hervor, wie Wimmel Welt die Suche nach Kindertagespflege strukturiert, transparent und alltagsnah für Eltern macht.',
    url: 'https://www.die-glocke.de/kreis-guetersloh/guetersloh/artikel/kreis-guetersloh-so-einfach-klappts-mit-dem-betreuungsplatz-1775999127?bo_pwl=1&cHash=35ae1ce2afa968bc74dd65d17c6cf586',
    domain: 'die-glocke.de',
    logo: '/glocke.png',
  },
  {
    newspaper: 'GT-Info',
    title: '„Neue Plattform erleichtert Eltern die Suche“',
    description:
      'Auch GT-Info zeigt, wie Wimmel Welt Familien in der Region mit einem modernen Zugang zur Kinderbetreuung aktiv entlastet.',
    url: 'https://www.gt-info.de/neue-plattform-erleichtert-eltern-die-suche/',
    domain: 'gt-info.de',
    logo: '/gt-info.png',
  },
];


const features = [
  {
    title: 'Persönliche Kindertagespflege',
    description:
      'Finde liebevolle Tagesmütter und Tagesväter in deiner Nähe, die genau zu den Bedürfnissen deiner Familie passen.',
  },
  {
    title: 'Transparente Kinderbetreuung',
    description:
      'Vergleiche pädagogische Konzepte, freie Betreuungsplätze und Altersgrenzen auf einen Blick.',
  },
  {
    title: 'Direkte Kommunikation',
    description:
      'Nutze unseren Messenger für schnelle Absprachen, Kennenlerntermine und individuelle Fragen rund um deine Betreuung.',
  },
];



function HomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [cities, setCities] = useState([]);
  const [animateCta, setAnimateCta] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateCta(false), 2100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let ignore = false;

    axios
      .get('/api/caregivers')
      .then((response) => {
        if (ignore) {
          return;
        }

        const cityMap = new Map();
        response.data.forEach((caregiver) => {
          const normalizedCity = `${caregiver.city ?? ''}`.trim();
          if (!normalizedCity) {
            return;
          }
          const citySlug = slugify(normalizedCity);
          if (!citySlug || cityMap.has(citySlug)) {
            return;
          }
          cityMap.set(citySlug, normalizedCity);
        });

        const sortedCities = [...cityMap.entries()]
          .map(([slug, name]) => ({ slug, name }))
          .sort((a, b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base' }));
        setCities(sortedCities);
      })
      .catch((error) => {
        console.error('Städte und Regionen konnten nicht geladen werden', error);
        if (!ignore) {
          setCities([]);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const hasCities = useMemo(() => cities.length > 0, [cities]);

  function handleAuthButtonClick() {
    if (user) {
      console.info('Nutzer abgemeldet über Home CTA');
      logout();
    } else {
      console.info('Navigation zur Login-Seite von Home CTA');
      trackEvent('engagement_login_page', { page: 'home', platform: 'web', location: 'hero' });
      navigate('/login');
    }
  }

  return (
    <div className="flex flex-col gap-24">
      <section className="grid gap-12 rounded-3xl bg-white/70 p-10 shadow-lg backdrop-blur sm:grid-cols-2">
        <div className="flex flex-col gap-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-500">Willkommen bei Wimmel Welt</p>
          <h1 className="text-4xl font-bold text-[#353e73] sm:text-5xl">
            Gemeinsam schaffen wir einen sicheren Ort zum Wachsen.
          </h1>
          <p className="text-lg text-slate-600">
            Unsere Plattform verbindet Familien mit engagierten Kindertagespflegepersonen. Entdecke Betreuungsmöglichkeiten,
            koordiniere Anfragen und bleibe mit deinem Netzwerk in Kontakt – alles an einem Ort.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/kindertagespflege"
              onClick={() => {
                trackEvent('cta_click', { label: 'Kindertagespflege finden', location: 'hero' });
                trackEvent('engagement_kindertagespflege_finden', { page: 'home', platform: 'web', location: 'hero' });
              }}
              className="relative rounded-full bg-brand-600 px-6 py-3 text-center text-sm font-semibold text-white shadow-md transition duration-200 hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-lg animate-attention"
            >
              Tagesmutter finden
              <>
                <span
                  className="animate-sparkle"
                  style={{ '--sx': '-14px', '--sy': '-24px', top: '-10px', left: '16%' }}
                >
                  ✨
                </span>
                <span
                  className="animate-sparkle"
                  style={{ '--sx': '0px', '--sy': '-34px', top: '-12px', left: '48%', animationDelay: '0.2s' }}
                >
                  ⭐
                </span>
                <span
                  className="animate-sparkle"
                  style={{ '--sx': '14px', '--sy': '-26px', top: '-8px', left: '76%', animationDelay: '0.4s' }}
                >
                  🎈
                </span>
              </>
            </Link>
            <button
              type="button"
              onClick={handleAuthButtonClick}
              className="rounded-full border border-brand-200 px-6 py-3 text-center text-sm font-semibold text-brand-700 transition duration-200 hover:-translate-y-0.5 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-800 hover:shadow-sm"
            >
              {user ? 'Abmelden' : 'Anmelden'}
            </button>
          </div>
          <p className="text-sm leading-relaxed text-slate-500">
            Wimmel Welt macht Kindertagespflege, Kindervermittlung und die Suche nach freien Betreuungsplätzen so einfach wie
            möglich – für Familien und Tagespflegepersonen gleichermaßen.
          </p>
        </div>
        <div className="flex items-center justify-center">
          <img src={heroImage3} alt="Familie" className="max-h-130 w-full object-contain" />
        </div>
      </section>
       <section className="grid gap-8 sm:grid-cols-3">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="flex flex-col gap-3 rounded-2xl bg-white/80 p-6 shadow transition duration-300 md:hover:-translate-y-1 md:hover:shadow-lg"
          >
            <h2 className="text-xl font-semibold text-brand-700">{feature.title}</h2>
            <p className="text-sm leading-relaxed text-slate-600">{feature.description}</p>
          </article>
        ))}
      </section>
           <LogoCarousel />

      <section>
        <div className="mb-6 flex flex-col gap-2">
          <h2 className="text-2xl font-semibold text-brand-700">Wimmel Welt in der Presse</h2>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {pressArticles.map((article) => (
            <article
              key={article.url}
              className="group flex flex-col gap-3 rounded-2xl bg-white/80 p-6 shadow transition duration-300 md:hover:-translate-y-1 md:hover:shadow-lg"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-brand-100">
                <img src={article.logo} alt={`${article.newspaper} Logo`} className="h-full w-full object-contain p-1" loading="lazy" />
              </div>

              <p className="text-sm font-semibold text-brand-600">{article.newspaper}</p>
              <h3 className="mt-2 text-lg font-semibold text-brand-700 transition-colors duration-300 group-hover:text-brand-600">
                {article.title}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{article.description}</p>

              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 transition-colors duration-200 hover:text-brand-700"
              >
                Zum Artikel auf {article.domain}
                <svg
                  viewBox="0 0 20 20"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 10h11" />
                  <path d="m10 5 5 5-5 5" />
                </svg>
              </a>
            </article>
          ))}
        </div>
      </section>

           <section className="rounded-3xl bg-white/85 p-8 shadow-lg backdrop-blur">
        <h2 className="text-2xl font-semibold text-brand-700">Städte und Regionen</h2>
        <p className="mt-2 text-sm text-slate-600">
          Entdecke Kindertagespflegepersonen aus deiner Nähe und springe direkt zur passenden Stadtseite.
        </p>

        {hasCities ? (
          <div className="mt-6 flex flex-wrap gap-3">
            {cities.map((city) => (
              <Link
                key={city.slug}
                to={`/kindertagespflege/${city.slug}`}
                onClick={() => {
                  trackEvent('engagement_city_button_click', {
                    page: 'home',
                    platform: 'web',
                    city: city.slug,
                  });
                }}
                className="rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition duration-200 hover:-translate-y-0.5 hover:border-brand-400 hover:bg-brand-100"
              >
                {city.name}
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Aktuell werden die Städte geladen.
          </p>
        )}
      </section>
    </div>
    
  );
}

export default HomePage;
