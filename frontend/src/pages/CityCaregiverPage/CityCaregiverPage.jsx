import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import DashboardPage from '../DashboardPage/index.jsx';
import { toReadableCityName } from '../../utils/citySlug.js';

function buildCanonicalUrl(pathname) {
  if (typeof window === 'undefined') {
    return pathname;
  }
  return new URL(pathname, window.location.origin).toString();
}

function CityCaregiverPage() {
  const { citySlug = '' } = useParams();

  // Für SEO-Texte verwenden wir immer einen menschenlesbaren Ortsnamen.
  const readableCityName = useMemo(() => toReadableCityName(citySlug), [citySlug]);

  useEffect(() => {
    const previousTitle = document.title;
    const title = `Kindertagespflege in ${readableCityName} | Wimmel Welt`;
    document.title = title;

    // SEO: Meta-Description je Stadt-Landingpage individuell setzen.
    let descriptionMeta = document.querySelector('meta[name="description"]');
    const descriptionWasCreated = !descriptionMeta;
    if (!descriptionMeta) {
      descriptionMeta = document.createElement('meta');
      descriptionMeta.setAttribute('name', 'description');
      document.head.appendChild(descriptionMeta);
    }
    const previousDescription = descriptionMeta.getAttribute('content');
    descriptionMeta.setAttribute(
      'content',
      `Finde Kindertagespflegepersonen in ${readableCityName}. Vergleiche Profile, freie Plätze und Betreuungskonzepte auf Wimmel Welt.`,
    );

    // SEO: Canonical URL verhindert Duplicate-Content-Signale zwischen ähnlichen Pfaden.
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    const canonicalWasCreated = !canonicalLink;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    const previousCanonical = canonicalLink.getAttribute('href');
    canonicalLink.setAttribute('href', buildCanonicalUrl(`/kindertagespflege/${citySlug}`));

    return () => {
      document.title = previousTitle;
      if (descriptionWasCreated) {
        descriptionMeta.remove();
      } else if (previousDescription) {
        descriptionMeta.setAttribute('content', previousDescription);
      }

      if (canonicalWasCreated) {
        canonicalLink.remove();
      } else if (previousCanonical) {
        canonicalLink.setAttribute('href', previousCanonical);
      }
    };
  }, [citySlug, readableCityName]);

  return <DashboardPage citySlug={citySlug} />;
}

export default CityCaregiverPage;
