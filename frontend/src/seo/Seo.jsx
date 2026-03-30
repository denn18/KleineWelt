import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { SITE_NAME, toAbsoluteUrl } from './siteConfig.js';
import { buildCitySeo } from './citySeo.js';

const DEFAULT_TITLE = `${SITE_NAME} – Kindertagespflege in deiner Nähe`;
const DEFAULT_DESCRIPTION =
  'Wimmel Welt vermittelt liebevolle Kindertagespflege – finde eine passende Kindertagespflege oder freie Betreuungsplätze in deiner Nähe. Persönlich, sicher, transparent.';

export function getSeoData(pathname) {
  if (pathname === '/') {
    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      canonicalPath: '/',
      robots: 'index,follow',
    };
  }

  if (pathname === '/kindertagespflege') {
    return {
      title: 'Kindertagespflege finden | Wimmel Welt',
      description:
        'Finde passende Kindertagespflege, freie Betreuungsplätze und liebevolle Tagesmütter oder Tagesväter in deiner Nähe.',
      canonicalPath: pathname,
      robots: 'index,follow',
    };
  }

  if (/^\/kindertagespflege\/[^/]+$/.test(pathname)) {
    const citySlug = pathname.split('/')[2] ?? '';
    const citySeo = buildCitySeo({ routeCitySlug: citySlug });
    return {
      title: citySeo.headTitle,
      description: citySeo.metaDescription,
      canonicalPath: pathname,
      robots: 'index,follow',
    };
  }

  if (/^\/kindertagespflege\/[^/]+\/[^/]+$/.test(pathname)) {
    return {
      title: `Kindertagespflege-Profil | ${SITE_NAME}`,
      description:
        'Öffentliches Profil einer Kindertagespflege mit Informationen zu Betreuung, freien Plätzen und Kontaktmöglichkeiten.',
      canonicalPath: pathname,
      robots: 'index,follow',
    };
  }

  const staticRoutes = {
    '/familienzentrum': {
      title: 'Familienzentrum | Wimmel Welt',
      description: 'Informationen zum Familienzentrum von Wimmel Welt und zur Suche nach passender Kindertagespflege.',
      canonicalPath: pathname,
      robots: 'index,follow',
    },
    '/faq': {
      title: 'FAQ | Wimmel Welt',
      description: 'Antworten auf häufige Fragen rund um Kindertagespflege, Betreuungssuche und die Nutzung von Wimmel Welt.',
      canonicalPath: pathname,
      robots: 'index,follow',
    },
    '/kontakt': {
      title: 'Kontakt | Wimmel Welt',
      description: 'Kontaktiere Wimmel Welt bei Fragen zur Kindertagespflege, Plattformnutzung oder Zusammenarbeit.',
      canonicalPath: pathname,
      robots: 'index,follow',
    },
    '/datenschutz': {
      title: 'Datenschutz | Wimmel Welt',
      description: 'Datenschutzhinweise von Wimmel Welt.',
      canonicalPath: pathname,
      robots: 'index,follow',
    },
    '/impressum': {
      title: 'Impressum | Wimmel Welt',
      description: 'Impressum von Wimmel Welt.',
      canonicalPath: pathname,
      robots: 'index,follow',
    },
    '/anmelden': {
      title: 'Anmelden | Wimmel Welt',
      description: 'Zugang für Eltern und Kindertagespflegepersonen.',
      canonicalPath: pathname,
      robots: 'noindex,nofollow',
    },
    '/anmelden/eltern': {
      title: 'Eltern registrieren | Wimmel Welt',
      description: 'Registrierung für Eltern bei Wimmel Welt.',
      canonicalPath: pathname,
      robots: 'noindex,nofollow',
    },
    '/anmelden/tagespflegeperson': {
      title: 'Tagespflegeperson registrieren | Wimmel Welt',
      description: 'Registrierung für Tagespflegepersonen bei Wimmel Welt.',
      canonicalPath: pathname,
      robots: 'noindex,nofollow',
    },
    '/login': {
      title: 'Login | Wimmel Welt',
      description: 'Login für bestehende Nutzerinnen und Nutzer von Wimmel Welt.',
      canonicalPath: pathname,
      robots: 'noindex,nofollow',
    },
    '/profil': {
      title: 'Profil | Wimmel Welt',
      description: 'Geschützter Profilbereich.',
      canonicalPath: pathname,
      robots: 'noindex,nofollow',
    },
    '/nachrichten': {
      title: 'Nachrichten | Wimmel Welt',
      description: 'Geschützter Nachrichtenbereich.',
      canonicalPath: pathname,
      robots: 'noindex,nofollow',
    },
    '/kontakte': {
      title: 'Kontakte | Wimmel Welt',
      description: 'Geschützter Kontaktbereich.',
      canonicalPath: pathname,
      robots: 'noindex,nofollow',
    },
    '/betreuungsgruppe': {
      title: 'Betreuungsgruppe | Wimmel Welt',
      description: 'Geschützter Betreuungsgruppenbereich.',
      canonicalPath: pathname,
      robots: 'noindex,nofollow',
    },
    '/betreuungsgruppe/erstellen': {
      title: 'Betreuungsgruppe erstellen | Wimmel Welt',
      description: 'Geschützter Bereich zum Erstellen von Betreuungsgruppen.',
      canonicalPath: pathname,
      robots: 'noindex,nofollow',
    },
    '/betreuungsgruppe/chat': {
      title: 'Betreuungsgruppen-Chat | Wimmel Welt',
      description: 'Geschützter Chat-Bereich.',
      canonicalPath: pathname,
      robots: 'noindex,nofollow',
    },
  };

  return (
    staticRoutes[pathname] ?? {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      canonicalPath: pathname,
      robots: 'noindex,nofollow',
    }
  );
}

export default function Seo() {
  const location = useLocation();
  const { title, description, canonicalPath, robots } = getSeoData(location.pathname);
  const canonicalUrl = toAbsoluteUrl(canonicalPath);

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:url" content={canonicalUrl} />
    </Helmet>
  );
}
