import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import heroImage from '../../assets/hero-family.svg';
import heroImage3 from '../assets/hero-family3.svg';
import { useAuth } from '../../context/AuthContext.jsx';
import { trackEvent } from '../utils/analytics.js';
import { slugify } from '../../utils/caregiverProfilePath.js';

const features = [
  {
    title: 'Persönliche Kindertagespflege',
    description:
      'Finde liebevolle Kindertagespflegepersonen in deiner Nähe, die genau zu den Bedürfnissen deiner Familie passen.',
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

const darkbluefont = '#353e73';

export default function HomePageMobile() {
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
        console.error('Städte und Regionen konnten nicht geladen werden (Mobile)', error);
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
      console.info('Nutzer abgemeldet über Home CTA (Mobile)');
      logout();
    } else {
      console.info('Navigation zur Login-Seite von Home CTA (Mobile)');
      trackEvent('engagement_login_page', { page: 'home', platform: 'mobile', location: 'hero' });
      navigate('/login');
    }
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Hero Card */}
      <section className="rounded-3xl bg-white/70 p-5 shadow-lg backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-500">
          Willkommen bei Wimmel Welt
        </p>

        <h1 className="mt-2 text-3xl font-bold  text-[#353e73]">
          Gemeinsam schaffen wir einen sicheren Ort zum Wachsen.
        </h1>

        <div className="mt-4 overflow-hidden rounded-2xl">
          <img
            src={heroImage3}
            alt="Familie"
            className="h-56 w-full object-contain"
          />
        </div>

        <p className="mt-4 text-base leading-relaxed text-slate-600">
          Unsere Plattform verbindet Familien mit engagierten
          Kindertagespflegepersonen. Entdecke Betreuungsmöglichkeiten,
          koordiniere Anfragen und bleibe mit deinem Netzwerk in Kontakt – alles
          an einem Ort.
        </p>

        <div className="mt-5 flex flex-col gap-3">
          <Link
            to="/kindertagespflege"
            onClick={() => {
              trackEvent('cta_click', { label: 'Kindertagespflege finden', location: 'hero' });
              trackEvent('engagement_kindertagespflege_finden', { page: 'home', platform: 'mobile', location: 'hero' });
            }}
            className={`relative rounded-full bg-brand-600 px-6 py-3 text-center text-sm font-semibold text-white shadow-md transition duration-200 hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-lg ${animateCta ? 'animate-attention' : ''}`}
          >
            Kindertagespflege finden
            {animateCta && (
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
            )}
          </Link>

          <button
            type="button"
            onClick={handleAuthButtonClick}
            className="rounded-full border border-brand-200 px-6 py-3 text-center text-sm font-semibold text-brand-700 transition duration-200 hover:-translate-y-0.5 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-800 hover:shadow-sm"
          >
            {user ? 'Abmelden' : 'Anmelden'}
          </button>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-500">
          Wimmel Welt macht Kindertagespflege, Kindervermittlung und die Suche
          nach freien Betreuungsplätzen so einfach wie möglich – für Familien
          und Tagespflegepersonen gleichermaßen.
        </p>
      </section>

    
       {/* Feature Karten mit Erklärung */}
      <section className="grid gap-4">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="flex flex-col gap-2 rounded-2xl bg-white/80 p-5 shadow"
          >
            <h2 className="text-lg font-semibold text-brand-700">
              {feature.title}
            </h2>
            <p className="text-sm leading-relaxed text-slate-600">
              {feature.description}
            </p>
          </article>
        ))}
      </section>


      {/* Stäfte und Regionen Kachel für SEO Optimierung */}
      <section className="rounded-3xl bg-white/85 p-5 shadow-lg backdrop-blur">
        <h2 className="text-xl font-semibold text-brand-700">Städte und Regionen</h2>
        <p className="mt-2 text-sm text-slate-600">
          Entdecke Kindertagespflegepersonen aus deiner Nähe und springe direkt zur passenden Stadtseite.
        </p>

        {hasCities ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {cities.map((city) => (
              <Link
                key={city.slug}
                to={`/kindertagespflege/${city.slug}`}
                onClick={() => {
                  trackEvent('engagement_city_button_click', {
                    page: 'home',
                    platform: 'mobile',
                    city: city.slug,
                  });
                }}
                className="rounded-full border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700"
              >
                {city.name}
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Aktuell werden die Städte geladen.
          </p>
        )}
      </section>
    </div>
  );
}
