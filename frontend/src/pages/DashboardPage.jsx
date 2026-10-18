import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import ImageLightbox from '../components/ImageLightbox.jsx';
import { assetUrl } from '../utils/file.js';
import { formatAvailableSpotsLabel, isAvailabilityHighlighted } from '../utils/availability.js';
import { trackEvent } from '../utils/analytics.js';
import { buildCaregiverProfileUrl, slugify } from '../utils/caregiverProfilePath.js';

function calculateAge(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return null;

  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const hasBirthdayPassed =
    now.getMonth() > date.getMonth() || (now.getMonth() === date.getMonth() && now.getDate() >= date.getDate());
  if (!hasBirthdayPassed) age -= 1;

  return age >= 0 ? age : null;
}

function calculateYearsSince(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return null;

  const now = new Date();
  let years = now.getFullYear() - date.getFullYear();
  const hasAnniversaryPassed =
    now.getMonth() > date.getMonth() || (now.getMonth() === date.getMonth() && now.getDate() >= date.getDate());
  if (!hasAnniversaryPassed) years -= 1;

  return years >= 0 ? years : null;
}


const citySeoExtras = {
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
};

function formatCityFromSlug(slug) {
  return `${slug ?? ''}`
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

// Layout is controlled by CSS; this is only used for existing analytics labels.
function getPlatform() {
  return window.matchMedia('(min-width: 768px)').matches ? 'web' : 'mobile';
}

function DashboardPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ postalCode: '', city: '', citySlug: '', search: '' });
  const [caregivers, setCaregivers] = useState([]);
  const [resolvedCityName, setResolvedCityName] = useState('');
  const [selectedCaregiver, setSelectedCaregiver] = useState(null);

  const [roomImageIndexes, setRoomImageIndexes] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  const suggestionsRef = useRef(null);

  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { citySlug: routeCitySlug } = useParams();

  // Reset the search when navigating to another city or back to the overview.
  useEffect(() => {
    if (routeCitySlug) {
      setSearchTerm(formatCityFromSlug(routeCitySlug));
      setFilters({ postalCode: '', city: '', citySlug: routeCitySlug, search: '' });
      return;
    }

    setSearchTerm('');
    setResolvedCityName('');
    setFilters({ postalCode: '', city: '', citySlug: '', search: '' });
  }, [location.key, routeCitySlug]);

  // Load caregivers for the active filters.
  useEffect(() => {
    let ignore = false;

    async function fetchCaregivers() {
      const params = Object.fromEntries(
        Object.entries(filters)
          .filter(([, value]) => Boolean(value))
          .map(([key, value]) => [key, value]),
      );

      const response = await axios.get('/api/caregivers', {
        params: Object.keys(params).length ? params : undefined,
      });

      const routeFilteredCaregivers = filters.citySlug
        ? response.data.filter((entry) => slugify(entry.city) === filters.citySlug)
        : response.data;

      if (ignore) {
        return;
      }

      setCaregivers(routeFilteredCaregivers);
      if (filters.citySlug) {
        const cityName = routeFilteredCaregivers.find((entry) => entry.city)?.city ?? '';
        setResolvedCityName(cityName);
        if (cityName) {
          setSearchTerm(cityName);
        }
      }

      if (routeFilteredCaregivers.length) {
        setSelectedCaregiver((current) =>
          current && routeFilteredCaregivers.some((entry) => entry.id === current.id)
            ? current
            : routeFilteredCaregivers[0],
        );
      } else {
        setSelectedCaregiver(null);
      }

      setRoomImageIndexes((current) => {
        const next = {};
        routeFilteredCaregivers.forEach((caregiver) => {
          next[caregiver.id] = current[caregiver.id] ?? 0;
        });
        return next;
      });
    }

    fetchCaregivers().catch((error) => {
      if (!ignore) {
        console.error('Failed to load caregivers', error);
      }
    });

    return () => {
      ignore = true;
    };
  }, [filters]);

  // Load matching location suggestions.
  useEffect(() => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    let ignore = false;
    setLoadingSuggestions(true);

    axios
      .get('/api/caregivers/locations', {
        params: { q: searchTerm.trim() },
      })
      .then((response) => {
        if (!ignore) setSuggestions(response.data);
      })
      .catch((error) => {
        console.error('Failed to load caregiver locations', error);
        if (!ignore) setSuggestions([]);
      })
      .finally(() => {
        if (!ignore) setLoadingSuggestions(false);
      });

    return () => {
      ignore = true;
    };
  }, [searchTerm]);

  useEffect(() => {
    let ignore = false;

    axios
      .get('/api/caregivers')
      .then((response) => {
        if (ignore) return;

        const cityMap = new Map();
        response.data.forEach((caregiver) => {
          const normalizedCity = `${caregiver.city ?? ''}`.trim();
          if (!normalizedCity) return;

          const citySlug = slugify(normalizedCity);
          if (!citySlug || cityMap.has(citySlug)) return;
          cityMap.set(citySlug, normalizedCity);
        });

        const sortedCities = [...cityMap.entries()]
          .map(([slug, name]) => ({ slug, name }))
          .sort((a, b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base' }));

        setCities(sortedCities);
      })
      .catch((error) => {
        console.error('Städte und Regionen konnten nicht geladen werden (Mobile)', error);
        if (!ignore) setCities([]);
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Close suggestions on outside click/tap
  useEffect(() => {
    function handleOutside(event) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setSuggestionsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside, { passive: true });

    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, []);

  const activeLocation = useMemo(() => {
    if (filters.citySlug) return resolvedCityName || filters.citySlug;
    if (filters.postalCode || filters.city) return [filters.postalCode, filters.city].filter(Boolean).join(' ');
    if (filters.search) return filters.search;
    return '';
  }, [filters, resolvedCityName]);


  const seoCityName = useMemo(() => {
    if (!routeCitySlug) {
      return '';
    }

    return resolvedCityName || formatCityFromSlug(routeCitySlug);
  }, [resolvedCityName, routeCitySlug]);

  const pageTitle = routeCitySlug ? (
    <>
      <span className="md:hidden">Tagesmütter &amp; Väter in {seoCityName}</span>
      <span className="hidden md:inline">Tagesmütter und Väter in {seoCityName}</span>
    </>
  ) : 'Tagesmutter finden';

  const seoIntro = useMemo(() => {
    if (!seoCityName) {
      return 'Finde schnell eine passende Tagesmutter oder einen Tagesvater in deiner Nähe und entdecke qualifizierte Kindertagespflege mit freien Betreuungsplätzen. Auf Wimmel Welt vergleichst du Kinderbetreuung, prüfst Verfügbarkeit und nimmst direkt Kontakt zu Tagesmüttern und Tagesvätern auf. So findest du schnell eine zuverlässige und liebevolle Kinderbetreuung.';
    }

    return `Finde schnell eine passende Tagesmutter oder einen Tagesvater in ${seoCityName} und entdecke qualifizierte Kindertagespflege mit freien Betreuungsplätzen in deiner Nähe. Auf Wimmel Welt vergleichst du Kinderbetreuung, prüfst Verfügbarkeit und nimmst direkt Kontakt zu Tagesmüttern und Tagesvätern in ${seoCityName} auf. So findest du in ${seoCityName} schnell eine zuverlässige und liebevolle Kinderbetreuung.`;
  }, [seoCityName]);

  useEffect(() => {
    if (!routeCitySlug) {
      return undefined;
    }

    const cityForSeo = seoCityName;
    const previousTitle = document.title;
    document.title = `Tagesmütter & Väter in ${cityForSeo} | Wimmel Welt`;

    let meta = document.querySelector('meta[name="description"]');
    const created = !meta;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    const previousDescription = meta.getAttribute('content');
    meta.setAttribute(
      'content',
      seoIntro,
    );

    return () => {
      document.title = previousTitle;
      if (created) {
        meta.remove();
      } else if (previousDescription) {
        meta.setAttribute('content', previousDescription);
      }
    };
  }, [routeCitySlug, seoCityName, seoIntro]);

  const footerCityPrompt = useMemo(() => {
    if (resolvedCityName) return resolvedCityName;
    if (filters.citySlug) return formatCityFromSlug(filters.citySlug);
    if (filters.city) return filters.city;
    if (filters.postalCode) return filters.postalCode;
    return 'deiner Region';
  }, [filters.city, filters.citySlug, filters.postalCode, resolvedCityName]);

  const footerSeoText = useMemo(() => {
    if (!filters.citySlug) return '';
    return citySeoExtras[filters.citySlug] ?? '';
  }, [filters.citySlug]);

  const footerCities = useMemo(() => {
    if (!filters.citySlug) return cities;
    return cities.filter((city) => city.slug !== filters.citySlug);
  }, [cities, filters.citySlug]);

  const selectedLogo = selectedCaregiver?.logoImageUrl ? assetUrl(selectedCaregiver.logoImageUrl) : '';
  const selectedProfileImage = selectedCaregiver?.profileImageUrl ? assetUrl(selectedCaregiver.profileImageUrl) : '';
  const selectedConceptUrl = selectedCaregiver?.conceptUrl ? assetUrl(selectedCaregiver.conceptUrl) : '';
  const selectedRoomImages = useMemo(
    () => (selectedCaregiver?.roomImages ?? []).map((url) => assetUrl(url)),
    [selectedCaregiver],
  );
  const selectedSinceYear = useMemo(() => {
    if (!selectedCaregiver?.caregiverSince) {
      return null;
    }
    const date = new Date(selectedCaregiver.caregiverSince);
    return Number.isNaN(date.valueOf()) ? null : date.getFullYear();
  }, [selectedCaregiver]);


  function handleCycleRoomImage(caregiverId, direction, area = 'list') {
    setRoomImageIndexes((current) => {
      const caregiverData = caregivers.find((entry) => entry.id === caregiverId);
      const images = caregiverData?.roomImages ?? [];
      if (!images.length) return current;

      const total = images.length;
      const currentIndex = current[caregiverId] ?? 0;
      const nextIndex = (currentIndex + direction + total) % total;
      trackEvent(getPlatform() === 'mobile' ? 'engagement_raeumlichkeiten_anschauen' : 'engagement_raeumlichkeiten_anschauen', { page: 'dashboard', platform: getPlatform(), area, direction: direction > 0 ? 'next' : 'prev' });
      return { ...current, [caregiverId]: nextIndex };
    });
  }

  function openLightbox(url, alt) {
    if (!url) return;
    setLightboxImage({ url, alt });
  }

  function closeLightbox() {
    setLightboxImage(null);
  }

  function handleOpenMessenger(caregiver, area = 'detail') {
    trackEvent('engagement_nachricht_schreiben', { page: 'dashboard', platform: getPlatform(), area });

    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    navigate(`/nachrichten/${caregiver.id}`, {
      state: { partner: { ...caregiver, role: 'caregiver' } },
    });
  }

  function handleSuggestionSelect(suggestion) {
    const label = [suggestion.postalCode, suggestion.city].filter(Boolean).join(' ');
    setSearchTerm(label);
    if (suggestion.city) {
      navigate(`/kindertagespflege/${slugify(suggestion.city)}`);
    } else {
      setFilters({ postalCode: suggestion.postalCode ?? '', city: suggestion.city ?? '', citySlug: '', search: '' });
    }
    setSuggestionsOpen(false);
  }

  async function handleSearchSubmit(event) {
    event.preventDefault();
    const trimmed = searchTerm.trim();

    if (!trimmed) {
      navigate('/kindertagespflege');
      setSuggestionsOpen(false);
      return;
    }

    const parts = trimmed.split(/\s+/);
    const first = parts[0];

    if (/^\d{5}$/.test(first)) {
      try {
        const response = await axios.get(`/api/caregivers/postal-code/${first}/city`);
        if (response?.data?.citySlug) {
          navigate(`/kindertagespflege/${response.data.citySlug}`);
        } else {
          setFilters({ postalCode: first, city: '', citySlug: '', search: '' });
        }
      } catch (_error) {
        setFilters({ postalCode: first, city: '', citySlug: '', search: '' });
      }
    } else {
      setFilters({ postalCode: '', city: '', citySlug: '', search: trimmed });
    }

    trackEvent('engagement_postleitzahl_suche', { page: 'dashboard', platform: getPlatform(), search_value: trimmed || 'empty' });
    setSuggestionsOpen(false);
  }

  function handleSelectCaregiver(caregiver) {
    setSelectedCaregiver(caregiver);
  }

  return (
    <section className="mx-auto flex w-full max-w-[640px] flex-col gap-5 px-4 pb-10 pt-4 md:mx-0 md:max-w-none md:gap-8 md:p-0">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold text-brand-700 md:text-3xl md:font-semibold">{pageTitle}</h1>
        <p className="text-sm text-slate-600">{seoIntro}</p>
      </header>

      {/* Search */}
      <form
        className="relative flex flex-col gap-3 rounded-3xl bg-white/85 p-4 shadow md:gap-4 md:bg-white/80 md:p-6 md:flex-row md:items-center"
        onSubmit={handleSearchSubmit}
        ref={suggestionsRef}
      >
        <div className="contents text-sm font-semibold text-slate-700 md:relative md:flex md:flex-1 md:flex-col md:gap-2 md:font-medium">
          <label className="flex flex-col gap-2">
            Ort oder Postleitzahl suchen
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onFocus={() => setSuggestionsOpen(true)}
              placeholder="hier Postleitzahl eingeben"
              className="rounded-2xl md:rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
            />
          </label>
          {suggestionsOpen && (loadingSuggestions || suggestions.length > 0) ? (
            <div className="absolute left-4 right-4 top-[92px] z-20 overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-lg md:left-auto md:right-auto md:top-full md:z-10 md:mt-2 md:w-full md:overflow-visible">
              {loadingSuggestions ? (
                <p className="px-4 py-3 text-xs text-slate-500">Orte werden geladen…</p>
              ) : (
                <ul className="max-h-60 overflow-y-auto text-sm">
                  {suggestions.map((suggestion, index) => {
                    const label = [suggestion.postalCode, suggestion.city].filter(Boolean).join(' ');
                    return (
                      <li key={`${suggestion.postalCode}-${suggestion.city}-${index}`}>
                        <button
                          type="button"
                          onClick={() => handleSuggestionSelect(suggestion)}
                          className="flex w-full flex-col gap-0.5 px-4 py-3 text-left hover:bg-brand-50"
                        >
                          <span className="font-semibold text-brand-700 md:font-medium">{label || suggestion.daycareName}</span>
                          {suggestion.daycareName ? (
                            <span className="text-xs text-slate-500">Empfohlen: {suggestion.daycareName}</span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : null}
        </div>
        <div className="flex items-center justify-between gap-3 pt-1 md:contents">
          <div className="flex flex-col gap-1 text-xs text-slate-500 md:items-start md:gap-2 md:w-48">
            <span className="w-fit rounded-full bg-brand-50 px-3 py-1 font-semibold text-brand-600">{caregivers.length} Profile</span>
            {activeLocation ? <span className="text-xs">Aktueller Filter: {activeLocation}</span> : null}
          </div>
          <button
            type="submit"
            className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-brand-700 md:px-6 md:duration-200 md:hover:-translate-y-0.5 md:hover:shadow-md"
          >
            <span className="md:hidden">Suche</span><span className="hidden md:inline">Suche aktualisieren</span>
          </button>
        </div>
      </form>

      {/* A single results list; the desktop detail panel shares its selection. */}
      <div className="contents md:grid md:gap-6 xl:grid-cols-[3fr,2fr]">
        <div className="contents md:flex md:flex-col md:gap-6">
          <div className="flex flex-col gap-3 md:h-[620px] md:gap-0 md:rounded-3xl md:bg-white/80 md:p-6 md:shadow">
            <header className="flex items-end justify-between md:flex-row md:items-center md:gap-2">
              <div className="flex flex-col gap-1 md:block">
                <h2 className="text-lg font-extrabold text-brand-700 md:text-xl md:font-semibold">Gefundene Kindertagespflegepersonen</h2>
                <p className="text-xs text-slate-500"><span className="md:hidden">Tippe auf eine Karte, um Details zu öffnen.</span><span className="hidden md:inline">Scroll durch die Kacheln, vergleiche Angebote und öffne Details mit einem Klick.</span></p>
              </div>
              <span className="text-xs font-semibold text-brand-600">{caregivers.length} Profile</span>
            </header>

            <div className="flex flex-col gap-3 md:mt-4 md:min-h-0 md:flex-1 md:gap-4 md:overflow-y-auto md:pr-2">
              {caregivers.map((caregiver) => {
                const locationLabel = [caregiver.postalCode, caregiver.city].filter(Boolean).join(' ');
                const logoUrl = caregiver.logoImageUrl ? assetUrl(caregiver.logoImageUrl) : '';
                const profileImageUrl = caregiver.profileImageUrl ? assetUrl(caregiver.profileImageUrl) : '';

                const roomImages = (caregiver.roomImages ?? []).map((imageUrl) => assetUrl(imageUrl));
                const currentRoomIndex = roomImages.length ? (roomImageIndexes[caregiver.id] ?? 0) % roomImages.length : 0;
                const currentRoomImage = roomImages.length ? roomImages[currentRoomIndex] : '';

                const sinceDate = caregiver.caregiverSince ? new Date(caregiver.caregiverSince) : null;
                const sinceYear = sinceDate && !Number.isNaN(sinceDate.valueOf()) ? sinceDate.getFullYear() : null;

                const caregiverAge = caregiver.age ?? calculateAge(caregiver.birthDate);
                const yearsOfExperience = caregiver.yearsOfExperience ?? calculateYearsSince(caregiver.caregiverSince);

                const experienceText =
                  yearsOfExperience !== null
                    ? yearsOfExperience === 0
                      ? 'Seit diesem Jahr Kindertagespflegeperson'
                      : `Seit ${yearsOfExperience} ${yearsOfExperience === 1 ? 'Jahr' : 'Jahren'} Kindertagespflegeperson`
                    : sinceYear
                      ? `Seit ${sinceYear} aktiv`
                      : null;

                const caregiverFullName = [caregiver.firstName, caregiver.lastName].filter(Boolean).join(' ').trim();

                const personInfoParts = [];
                if (caregiverFullName) personInfoParts.push(`Kindertagespflegeperson: ${caregiverFullName}`);
                else if (caregiver.name) personInfoParts.push(`Kindertagespflegeperson: ${caregiver.name}`);
                if (caregiverAge !== null) personInfoParts.push(`${caregiverAge} ${caregiverAge === 1 ? 'Jahr' : 'Jahre'} alt`);
                if (experienceText) personInfoParts.push(experienceText);

                const personInfo = personInfoParts.join(' · ');

                const isActive = selectedCaregiver?.id === caregiver.id;

                return (
                  <article
                    key={caregiver.id}
                    className={`flex flex-col gap-3 rounded-3xl border p-4 shadow-sm transition-all duration-300 active:scale-[0.99] md:gap-4 md:rounded-2xl md:px-5 md:shadow-none md:transition md:duration-150 md:active:scale-100 md:hover:border-brand-300 md:hover:shadow-lg md:focus-visible:outline md:focus-visible:outline-2 md:focus-visible:outline-offset-2 md:focus-visible:outline-brand-400 md:cursor-pointer ${
                      isActive
                        ? 'scale-[1.02] border-brand-400 bg-brand-50/80 shadow-md md:scale-100 md:shadow-none'
                        : 'border-brand-100 bg-white/90 md:bg-white'
                    }`}
                    onClick={() => handleSelectCaregiver(caregiver)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleSelectCaregiver(caregiver);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                        <div className="flex flex-col gap-3">
                        <div className="grid grid-cols-[auto,1fr] items-start gap-3 md:flex md:gap-4">
                          <div className="flex shrink-0 flex-col gap-2 md:w-16 md:shrink md:items-center">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                openLightbox(logoUrl, `Logo von ${caregiver.daycareName || caregiver.name}`);
                              }}
                              disabled={!logoUrl}
                              className={`flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border md:h-16 md:w-16 ${
                                logoUrl
                                  ? 'border-brand-100 bg-brand-50 transition hover:shadow-lg'
                                  : 'border-dashed border-brand-200 bg-brand-50'
                              }`}
                            >
                              {logoUrl ? (
                                <img
                                  src={logoUrl}
                                  alt={`Logo von ${caregiver.daycareName || caregiver.name}`}
                                  className="h-full w-full object-contain"
                                />
                              ) : (
                                <span className="text-[10px] font-semibold text-slate-400">Logo folgt</span>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                openLightbox(profileImageUrl, caregiver.daycareName || caregiver.name);
                              }}
                              disabled={!profileImageUrl}
                              className={`h-14 w-14 overflow-hidden rounded-2xl border md:h-16 md:w-16 ${
                                profileImageUrl
                                  ? 'border-brand-100 bg-brand-50 transition hover:shadow-lg'
                                  : 'border-dashed border-brand-200 bg-brand-50'
                              }`}
                              aria-label="Profilbild vergrößern"
                            >
                              {profileImageUrl ? (
                                <img
                                  src={profileImageUrl}
                                  alt={caregiver.daycareName || caregiver.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-slate-400">
                                  Kein Bild
                                </div>
                              )}
                            </button>
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col gap-2 md:min-w-[auto]">
                            <h3 className="truncate text-base font-extrabold text-brand-700 md:whitespace-normal md:overflow-visible md:text-clip md:font-semibold">
                              {caregiver.daycareName || caregiver.name}
                              </h3>
                              {personInfo ? (
                                <p className="text-sm text-slate-600">{personInfo}</p>
                              ) : null}
                              <div className="flex flex-wrap gap-2 text-xs text-slate-600 md:text-slate-500">
                                <span className="rounded-full bg-brand-50 px-3 py-1">
                                  {locationLabel || 'Ort folgt'}
                                </span>
                                <span
                                  className={`rounded-full px-3 py-1 ${
                                    isAvailabilityHighlighted({
                                      availableSpots: caregiver.availableSpots ?? 0,
                                      availabilityTiming: caregiver.availabilityTiming,
                                      hasAvailability: caregiver.hasAvailability,
                                    })
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-brand-50 text-slate-600'
                                  }`}
                                >
                                  {formatAvailableSpotsLabel({
                                    availableSpots: caregiver.availableSpots ?? 0,
                                    hasAvailability: caregiver.hasAvailability,
                                    availabilityTiming: caregiver.availabilityTiming,
                                  })}
                                </span>
                                <span className="rounded-full bg-brand-50 px-3 py-1">
                                  {`${caregiver.childrenCount ?? 0} Kinder in Betreuung`}
                                </span>
                                {caregiver.maxChildAge ? (
                                  <span className="rounded-full bg-brand-50 px-3 py-1">
                                    bis {caregiver.maxChildAge} Jahre
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <div className="relative col-span-2 h-32 overflow-hidden rounded-2xl border border-brand-100 bg-brand-50 md:flex md:h-20 md:w-28 md:items-center md:justify-center">
                              {currentRoomImage ? (
                                <img
                                  src={currentRoomImage}
                                  alt={`Räumlichkeit von ${caregiver.daycareName || caregiver.name}`}
                                  onClick={(event) => {
                                    if (getPlatform() === 'mobile') {
                                      event.stopPropagation();
                                      openLightbox(currentRoomImage, `Räumlichkeit von ${caregiver.daycareName || caregiver.name}`);
                                    }
                                  }}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-400 md:block md:h-auto md:w-auto md:text-[10px] md:leading-normal">Noch keine Räume</div>
                              )}
                              {roomImages.length > 1 ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleCycleRoomImage(caregiver.id, -1, 'list');
                                    }}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 px-3 py-2 text-xs font-bold text-brand-600 shadow hover:bg-white md:left-1 md:bg-white/80 md:px-2 md:py-1 md:text-[10px] md:leading-normal md:font-semibold"
                                    aria-label="Vorheriges Raumbild anzeigen"
                                  >
                                    ←
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleCycleRoomImage(caregiver.id, 1, 'list');
                                    }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 px-3 py-2 text-xs font-bold text-brand-600 shadow hover:bg-white md:right-1 md:bg-white/80 md:px-2 md:py-1 md:text-[10px] md:leading-normal md:font-semibold"
                                    aria-label="Nächstes Raumbild anzeigen"
                                  >
                                    →
                                  </button>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </div>

                    {isActive && (caregiver.shortDescription || caregiver.bio) ? (
                      <div className="grid gap-3 rounded-2xl border border-brand-100 bg-white/75 p-3 md:hidden">
                        {caregiver.shortDescription ? (
                          <div className="flex flex-col gap-1">
                            <h3 className="text-xs font-semibold uppercase tracking-widest text-brand-500">Kurzbeschreibung</h3>
                            <p className="text-sm text-slate-600">{caregiver.shortDescription}</p>
                          </div>
                        ) : null}
                        {caregiver.bio ? (
                          <div className="flex flex-col gap-1">
                            <h3 className="text-xs font-semibold uppercase tracking-widest text-brand-500">Über dich</h3>
                            <p className="text-sm leading-relaxed text-slate-600">{caregiver.bio}</p>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {/* Actions */}
                    <div className="flex flex-col gap-2 md:hidden">
                      <Link
                        to={buildCaregiverProfileUrl(caregiver, { citySlug: routeCitySlug })}
                        onClick={(event) => {
                          event.stopPropagation();
                          trackEvent('engagement_kindertagespflege_kennenlernen', { page: 'dashboard', platform: getPlatform(), area: 'list' });
                        }}
                        className="w-full rounded-full border border-brand-600 px-4 py-3 text-center text-sm font-semibold text-brand-600 transition hover:bg-brand-600 hover:text-white"
                      >
                        Kindertagespflege kennenlernen
                      </Link>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleOpenMessenger(caregiver, 'list');
                        }}
                        className={`relative w-full rounded-full bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-brand-700 ${
                          isActive ? 'animate-attention' : ''
                        }`}
                      >
                        Nachricht schreiben
                        {isActive ? (
                          <>
                            <span className="animate-sparkle" style={{ '--sx': '-12px', '--sy': '-20px', top: '-8px', left: '20%' }}>
                              ✨
                            </span>
                            <span
                              className="animate-sparkle"
                              style={{ '--sx': '0px', '--sy': '-30px', top: '-10px', left: '50%', animationDelay: '0.2s' }}
                            >
                              ⭐
                            </span>
                            <span
                              className="animate-sparkle"
                              style={{ '--sx': '12px', '--sy': '-22px', top: '-8px', left: '78%', animationDelay: '0.4s' }}
                            >
                              🎈
                            </span>
                          </>
                        ) : null}
                      </button>
                    </div>
                  </article>
                );
              })}

              {!caregivers.length ? (
                <p className="rounded-2xl border border-dashed border-brand-200 bg-white px-4 py-6 text-sm text-slate-500">
                  Keine Tagespflegepersonen gefunden. Probiere eine andere Postleitzahl oder bitte eine Tagespflegeperson, ein
                  Profil anzulegen.
                </p>
              ) : null}
            </div>
          </div>

        </div>
        <aside className="hidden h-[620px] flex-col gap-4 rounded-3xl bg-white/80 p-6 shadow md:flex">
          {selectedCaregiver ? (
            <div className="flex h-full min-h-0 flex-col gap-4">
              <header className="flex flex-col gap-1">
                <h2 className="text-2xl font-semibold text-brand-700">{selectedCaregiver.daycareName || selectedCaregiver.name}</h2>
                <p className="text-sm text-slate-600">
                  {[
                    selectedCaregiver.address,
                    [selectedCaregiver.postalCode, selectedCaregiver.city].filter(Boolean).join(' '),
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </header>
              <div className="min-h-0 flex-1 overflow-y-auto pr-2">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-4">
                    {selectedLogo ? (
                      <button
                        type="button"
                        onClick={() =>
                          openLightbox(
                            selectedLogo,
                            `Logo von ${selectedCaregiver.daycareName || selectedCaregiver.name}`,
                          )
                        }
                        className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-brand-100 bg-brand-50 transition hover:shadow-lg"
                      >
                        <img
                          src={selectedLogo}
                          alt={`Logo von ${selectedCaregiver.daycareName || selectedCaregiver.name}`}
                          className="h-full w-full object-contain"
                        />
                      </button>
                    ) : null}
                    {selectedProfileImage ? (
                      <button
                        type="button"
                        onClick={() => openLightbox(selectedProfileImage, selectedCaregiver.daycareName || selectedCaregiver.name)}
                        className="h-16 w-16 overflow-hidden rounded-2xl border border-brand-100 bg-brand-50 transition hover:shadow-lg"
                      >
                        <img
                          src={selectedProfileImage}
                          alt={selectedCaregiver.daycareName || selectedCaregiver.name}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ) : null}
                    <div className="flex flex-1 flex-wrap gap-2 text-xs font-semibold text-brand-700">
                      <span
                        className={`rounded-full px-3 py-1 ${
                          isAvailabilityHighlighted({
                            availableSpots: selectedCaregiver.availableSpots ?? 0,
                            availabilityTiming: selectedCaregiver.availabilityTiming,
                            hasAvailability: selectedCaregiver.hasAvailability,
                          })
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-brand-50 text-slate-600'
                        }`}
                      >
                        {formatAvailableSpotsLabel({
                          availableSpots: selectedCaregiver.availableSpots ?? 0,
                          hasAvailability: selectedCaregiver.hasAvailability,
                          availabilityTiming: selectedCaregiver.availabilityTiming,
                        })}
                      </span>
                      <span className="rounded-full bg-brand-50 px-3 py-1">
                        {selectedCaregiver.childrenCount ?? 0} betreute Kinder
                      </span>
                      {selectedCaregiver.maxChildAge ? (
                        <span className="rounded-full bg-brand-50 px-3 py-1">
                          Aufnahme bis {selectedCaregiver.maxChildAge} Jahre
                        </span>
                      ) : null}
                      {selectedSinceYear ? (
                        <span className="rounded-full bg-brand-50 px-3 py-1">Seit {selectedSinceYear} aktiv</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="grid gap-3 text-sm text-slate-600">
                    {selectedRoomImages.length ? (
                      <div className="flex flex-col gap-2">
                        <h3 className="text-xs font-semibold uppercase tracking-widest text-brand-500">Räumlichkeiten</h3>
                        <div className="grid grid-cols-3 gap-2">
                          {selectedRoomImages.slice(0, 3).map((imageUrl, index) => (
                            <img
                              key={`${imageUrl}-${index}`}
                              src={imageUrl}
                              alt={`Räumlichkeit ${index + 1}`}
                              className="h-20 w-full rounded-2xl object-cover"
                            />
                          ))}
                        </div>
                        {selectedRoomImages.length > 3 ? (
                          <span className="text-xs text-slate-500">Weitere Bilder findest du im Profil.</span>
                        ) : null}
                      </div>
                    ) : null}
                    {selectedCaregiver.shortDescription ? (
                      <div className="flex flex-col gap-1">
                        <h3 className="text-xs font-semibold uppercase tracking-widest text-brand-500">Kurzbeschreibung</h3>
                        <p>{selectedCaregiver.shortDescription}</p>
                      </div>
                    ) : null}
                    {selectedCaregiver.bio ? (
                      <div className="flex flex-col gap-1">
                        <h3 className="text-xs font-semibold uppercase tracking-widest text-brand-500">Über dich</h3>
                        <p className="text-sm leading-relaxed">{selectedCaregiver.bio}</p>
                      </div>
                    ) : null}
                    {selectedCaregiver.age ? (
                      <p>
                        <span className="font-semibold text-brand-700">Alter:</span> {selectedCaregiver.age} Jahre
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="mt-auto flex flex-col gap-3 border-t border-brand-100 pt-4">
                {selectedConceptUrl ? (
                  <a
                    href={selectedConceptUrl}
                    onClick={() => trackEvent('engagement_konzeption_durchlesen', { page: 'dashboard', platform: getPlatform(), area: 'detail' })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-200 px-4 py-2 text-xs font-semibold text-brand-600 transition hover:border-brand-400 hover:text-brand-700"
                  >
                    Konzeption als PDF herunterladen
                  </a>
                ) : (
                  <span className="inline-flex items-center justify-center rounded-full border border-dashed border-brand-200 px-4 py-2 text-xs font-semibold text-slate-400">
                    Keine Konzeption hinterlegt
                  </span>
                )}
                <Link
                  to={buildCaregiverProfileUrl(selectedCaregiver, { citySlug: routeCitySlug })}
                  onClick={() => trackEvent('engagement_kindertagespflege_kennenlernen', { page: 'dashboard', platform: getPlatform(), area: 'detail' })}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-600 px-4 py-2 text-xs font-semibold text-brand-600 transition hover:bg-brand-600 hover:text-white"
                >
                  Kindertagespflege kennenlernen
                </Link>
                <button
                  type="button"
                  onClick={() => handleOpenMessenger(selectedCaregiver, 'detail')}
                  className="relative rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition duration-200 hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-lg animate-attention"
                >
                  Nachricht schreiben
                  <>
                    <span
                      className="animate-sparkle"
                      style={{ '--sx': '-12px', '--sy': '-20px', top: '-8px', left: '20%' }}
                    >
                      ✨
                    </span>
                    <span
                      className="animate-sparkle"
                      style={{ '--sx': '0px', '--sy': '-30px', top: '-10px', left: '50%', animationDelay: '0.2s' }}
                    >
                      ⭐
                    </span>
                    <span
                      className="animate-sparkle"
                      style={{ '--sx': '12px', '--sy': '-22px', top: '-8px', left: '78%', animationDelay: '0.4s' }}
                    >
                      🎈
                    </span>
                  </>
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Wähle eine Tagespflegeperson aus der Liste, um weitere Details zu sehen und eine Unterhaltung zu starten.
            </p>
          )}
        </aside>
      </div>

      <section className="rounded-3xl bg-white/85 p-5 shadow md:p-8 md:shadow-lg md:backdrop-blur">
        <h2 className="text-lg font-semibold text-brand-700 md:text-2xl">Städte und Regionen</h2>
        {footerSeoText ? <p className="mt-2 text-sm leading-7 text-slate-600 md:text-base md:leading-8">{footerSeoText}</p> : null}
        <p className={`font-semibold text-brand-600 ${footerSeoText ? 'mt-4 text-xs md:text-sm' : 'mt-2 text-sm'}`}>
          Finde weitere Tagesmütter &amp; Väter in {footerCityPrompt}
        </p>

        {footerCities.length ? (
          <div className="mt-4 flex flex-wrap gap-2 md:mt-6 md:gap-3">
            {footerCities.map((city) => (
              <Link
                key={city.slug}
                to={`/kindertagespflege/${city.slug}`}
                onClick={() => {
                  trackEvent('engagement_city_button_click', {
                    page: 'dashboard',
                    platform: getPlatform(),
                    city: city.slug,
                    location: 'footer',
                  });
                }}
                className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 md:px-4 md:py-2 md:text-sm md:transition md:duration-200 md:hover:-translate-y-0.5 md:hover:border-brand-400 md:hover:bg-brand-100"
              >
                {city.name}
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 md:mt-6">
            Aktuell werden die Städte geladen.
          </p>
        )}
      </section>

      {lightboxImage ? <ImageLightbox image={lightboxImage} onClose={closeLightbox} /> : null}
    </section>
  );
}

export default DashboardPage;
