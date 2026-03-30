import { SEO_CITY_SLUGS } from './siteConfig.js';

export const citySeoExtras = {
  bielefeld:
    'In Bielefeld suchen viele Familien nach flexibler und verlässlicher Kinderbetreuung in der Nähe. Eine Tagesmutter oder ein Tagesvater kann hier eine passende Alternative zur klassischen Kita sein, vor allem wenn Eltern eine persönliche Betreuung in kleiner Gruppe bevorzugen. Wer eine Tagesmutter finden oder gezielt Kindertagespflege finden möchte, achtet oft auf Betreuungszeiten, freie Plätze, Erfahrung und das pädagogische Konzept. Genau dabei hilft diese Übersicht für Bielefeld.',
  guetersloh:
    'In Gütersloh ist die Nachfrage nach persönlicher und familiennaher Betreuung besonders hoch. Viele Eltern möchten eine Tagesmutter in der Nähe finden, die flexible Zeiten, kleine Gruppen und eine ruhige Betreuungsumgebung bietet. Wenn du in Gütersloh Kinderbetreuung suchen oder eine passende Kindertagespflege finden möchtest, sind transparente Profile, freie Plätze und direkte Kontaktmöglichkeiten besonders wichtig. Diese Seite unterstützt dich bei der Tagesmutter Suche in Gütersloh.',
  herzberg:
    'In Herzberg wünschen sich viele Familien eine übersichtliche Möglichkeit, passende Kinderbetreuung zu finden. Eine Tagesmutter kann hier eine gute Lösung sein, wenn Eltern eine individuelle Betreuung und ein vertrautes Umfeld für ihr Kind suchen. Wer nach Kindertagespflege in der Nähe sucht, möchte schnell erkennen, welche Betreuungspersonen verfügbar sind, wie das Betreuungskonzept aussieht und ob die Betreuung zum eigenen Alltag passt. Genau dafür ist diese Übersicht für Herzberg gedacht.',
  'schloss-holte-stukenbrock':
    'In Schloß Holte-Stukenbrock spielt eine verlässliche und wohnortnahe Betreuung für viele Familien eine wichtige Rolle. Eltern, die eine Tagesmutter in meiner Nähe oder eine flexible Kinderbetreuung in der Nähe suchen, achten besonders auf freie Plätze, Betreuungszeiten und Erfahrung. Eine gute Kindertagespflege kann den Familienalltag deutlich entlasten und Kindern eine persönliche Betreuung in kleiner Runde bieten. Diese Seite hilft dir dabei, passende Angebote in Schloß Holte-Stukenbrock schneller zu vergleichen.',
  'spenge-wallenbruck':
    'In Spenge Wallenbrück ist eine persönliche Betreuung oft besonders gefragt, weil Familien kurze Wege und direkte Ansprechpartner schätzen. Wer eine Tagesmutter finden oder Kinderbetreuung suchen möchte, sucht nicht nur freie Plätze, sondern auch Vertrauen, Erfahrung und ein passendes Konzept für die Kindertagespflege. Eine Tagesmutter oder ein Tagesvater kann hier eine familiennahe Lösung sein, wenn Eltern eine flexible und individuelle Betreuung wünschen. Diese Übersicht erleichtert dir die Suche nach passender Kindertagespflege in Spenge Wallenbrück.',
  'spenge-wallenbrueck':
    'In Spenge Wallenbrück ist eine persönliche Betreuung oft besonders gefragt, weil Familien kurze Wege und direkte Ansprechpartner schätzen. Wer eine Tagesmutter finden oder Kinderbetreuung suchen möchte, sucht nicht nur freie Plätze, sondern auch Vertrauen, Erfahrung und ein passendes Konzept für die Kindertagespflege. Eine Tagesmutter oder ein Tagesvater kann hier eine familiennahe Lösung sein, wenn Eltern eine flexible und individuelle Betreuung wünschen. Diese Übersicht erleichtert dir die Suche nach passender Kindertagespflege in Spenge Wallenbrück.',
};

export function formatCityFromSlug(slug) {
  return `${slug ?? ''}`
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getCitySeoData(routeCitySlug, resolvedCityName = '') {
  const hasCitySlug = Boolean(routeCitySlug);

  const seoCityName = hasCitySlug
    ? (resolvedCityName || formatCityFromSlug(routeCitySlug))
    : '';

  const genericIntro =
    'Finde schnell eine passende Tagesmutter oder einen Tagesvater in deiner Nähe und entdecke qualifizierte Kindertagespflege mit freien Betreuungsplätzen. Auf Wimmel Welt vergleichst du Kinderbetreuung, prüfst Verfügbarkeit und nimmst direkt Kontakt zu Tagesmüttern und Tagesvätern auf. So findest du schnell eine zuverlässige und liebevolle Kinderbetreuung.';

  const cityIntro = seoCityName
    ? `Finde schnell eine passende Tagesmutter oder einen Tagesvater in ${seoCityName} und entdecke qualifizierte Kindertagespflege mit freien Betreuungsplätzen in deiner Nähe. Auf Wimmel Welt vergleichst du Kinderbetreuung, prüfst Verfügbarkeit und nimmst direkt Kontakt zu Tagesmüttern und Tagesvätern in ${seoCityName} auf. So findest du in ${seoCityName} schnell eine zuverlässige und liebevolle Kinderbetreuung.`
    : genericIntro;

  const genericMeta =
    'Tagesmutter und Tagesvater in deiner Nähe finden – qualifizierte Kindertagespflege mit freien Plätzen auf Wimmel Welt.';

  const cityMeta = seoCityName
    ? `Tagesmutter und Tagesvater in ${seoCityName} finden – qualifizierte Kindertagespflege mit freien Plätzen auf Wimmel Welt.`
    : genericMeta;

  return {
    seoCityName,
    seoIntro: hasCitySlug ? cityIntro : genericIntro,
    metaDescription: hasCitySlug ? cityMeta : genericMeta,
  };
}

export function buildCitySeo({ routeCitySlug, resolvedCityName = '' } = {}) {
  const { seoCityName, seoIntro, metaDescription } = getCitySeoData(routeCitySlug, resolvedCityName);

  return {
    seoCityName,
    pageTitle: routeCitySlug ? `Tagesmütter und Väter in ${seoCityName}` : 'Kindertagespflege finden',
    headTitle: routeCitySlug
      ? `Tagesmütter & Väter in ${seoCityName} | Wimmel Welt`
      : 'Kindertagespflege finden | Wimmel Welt',
    metaDescription,
    seoIntro,
  };
}

export function getStaticSeoCitySlugs() {
  return [...new Set([...SEO_CITY_SLUGS, ...Object.keys(citySeoExtras)])];
}
