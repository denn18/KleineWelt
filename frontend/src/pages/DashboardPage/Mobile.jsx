// frontend/src/pages/DashboardPage/DashboardPageMobile.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
// import MapView from '../components/MapView.jsx'; Google Maps API später einrichten, kostet Geld
import { useAuth } from '../context/AuthContext.jsx';
import ImageLightbox from '../components/ImageLightbox.jsx';
import { assetUrl } from '../utils/file.js';
import { formatAvailableSpotsLabel, isAvailabilityHighlighted } from '../utils/availability.js';
import { trackEvent } from '../utils/analytics.js';
import { buildCaregiverProfileUrl, slugify } from '../../utils/caregiverProfilePath.js';
import { FaCommentDots, FaEnvelope, FaHome, FaThLarge, FaUserCircle, FaUsers } from 'react-icons/fa';

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



function formatCityFromSlug(slug) {
  return `${slug ?? ''}`
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function DashboardPageMobile() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ postalCode: '', city: '', citySlug: '', search: '' });
  const [caregivers, setCaregivers] = useState([]);
  const [resolvedCityName, setResolvedCityName] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  const suggestionsRef = useRef(null);

  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { citySlug: routeCitySlug } = useParams();

  // Reset when route changes (same as web)
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

  // Fetch caregivers (same logic as web)
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

  // Suggestions (same as web)
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

  function openLightbox(url, alt) {
    if (!url) return;
    setLightboxImage({ url, alt });
  }

  function closeLightbox() {
    setLightboxImage(null);
  }

  function handleOpenMessenger(caregiver, area = 'detail') {
    trackEvent('engagement_nachricht_schreiben', { page: 'dashboard', platform: 'mobile', area });

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

    trackEvent('engagement_postleitzahl_suche', { page: 'dashboard', platform: 'mobile', search_value: trimmed || 'empty' });
    setSuggestionsOpen(false);
  }


  const bottomNavItems = [
    { to: '/', label: 'Home', icon: FaHome },
    { to: '/kindertagespflege', label: 'Dashboard', icon: FaThLarge },
    { to: '/nachrichten', label: 'Chat', icon: FaCommentDots },
    { to: '/betreuungsgruppe', label: 'Gruppe', icon: FaUsers },
    { to: '/profil', label: 'Profil', icon: FaUserCircle },
  ];

  return (
    <section className="mx-auto -mt-16 flex w-full max-w-[430px] flex-col gap-7 px-5 pb-36 pt-4 md:mt-0">
      <form
        className="relative flex flex-col gap-4 rounded-[28px] bg-white/95 p-5 shadow-[0_18px_45px_rgba(55,88,196,0.10)] ring-1 ring-brand-100/70"
        onSubmit={handleSearchSubmit}
        ref={suggestionsRef}
      >
        <label className="flex flex-col gap-3 text-lg font-extrabold text-brand-800">
          Ort oder Postleitzahl suchen
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            onFocus={() => setSuggestionsOpen(true)}
            placeholder="hier Postleitzahl eingeben"
            className="rounded-[22px] border-2 border-brand-200 bg-white px-4 py-3 text-xl font-medium text-slate-700 shadow-sm outline-none placeholder:text-slate-400 focus:border-brand-400"
          />
        </label>

        {suggestionsOpen && (loadingSuggestions || suggestions.length > 0) ? (
          <div className="absolute left-5 right-5 top-[112px] z-20 overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-lg">
            {loadingSuggestions ? (
              <p className="px-4 py-3 text-sm text-slate-500">Orte werden geladen…</p>
            ) : (
              <ul className="max-h-60 overflow-y-auto text-sm">
                {suggestions.map((suggestion, index) => {
                  const label = [suggestion.postalCode, suggestion.city].filter(Boolean).join(' ');
                  return (
                    <li key={`${suggestion.postalCode}-${suggestion.city}-${index}`}>
                      <button type="button" onClick={() => handleSuggestionSelect(suggestion)} className="flex w-full flex-col gap-0.5 px-4 py-3 text-left hover:bg-brand-50">
                        <span className="font-semibold text-brand-700">{label || suggestion.daycareName}</span>
                        {suggestion.daycareName ? <span className="text-xs text-slate-500">Empfohlen: {suggestion.daycareName}</span> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : null}

        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="w-fit rounded-full bg-brand-50 px-4 py-2 text-base font-extrabold text-brand-700">
              {caregivers.length} Profile
            </span>
            {activeLocation ? <span className="text-xs font-semibold text-slate-500">Filter: {activeLocation}</span> : null}
          </div>

          <button
            type="submit"
            className="rounded-full bg-brand-600 px-6 py-4 text-lg font-extrabold text-white shadow-[0_14px_28px_rgba(55,88,196,0.25)] transition hover:bg-brand-700"
          >
            Suche aktualisieren
          </button>
        </div>
      </form>

      <header className="flex flex-col gap-1">
        <h1 className="text-[2rem] font-black leading-tight text-brand-700">Gefundene Kindertagespflegepersonen</h1>
        <p className="text-lg leading-snug text-slate-500">Scroll durch die Kacheln, vergleiche Angebote und öffne Details.</p>
      </header>

      <div className="flex flex-col gap-4">
        {caregivers.map((caregiver) => {
          const locationLabel = [caregiver.postalCode, caregiver.city].filter(Boolean).join(' ');
          const logoUrl = caregiver.logoImageUrl ? assetUrl(caregiver.logoImageUrl) : '';
          const profileImageUrl = caregiver.profileImageUrl ? assetUrl(caregiver.profileImageUrl) : '';
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
          if (caregiverFullName) personInfoParts.push(`Tagespflegeperson: ${caregiverFullName}`);
          else if (caregiver.name) personInfoParts.push(`Tagespflegeperson: ${caregiver.name}`);
          if (caregiverAge !== null) personInfoParts.push(`${caregiverAge} ${caregiverAge === 1 ? 'Jahr' : 'Jahre'} alt`);
          if (experienceText) personInfoParts.push(experienceText);

          return (
            <article
              key={caregiver.id}
              className="rounded-[28px] border border-brand-100 bg-white/95 p-5 shadow-[0_14px_36px_rgba(55,88,196,0.10)]"
            >
              <div className="grid grid-cols-[84px_minmax(0,1fr)] gap-4">
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => openLightbox(logoUrl, `Logo von ${caregiver.daycareName || caregiver.name}`)}
                    disabled={!logoUrl}
                    className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-3xl border-2 border-brand-100 bg-brand-50 text-center"
                  >
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt={`Logo von ${caregiver.daycareName || caregiver.name}`}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="px-1 text-sm font-extrabold text-slate-400">Logo folgt</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => openLightbox(profileImageUrl, caregiver.daycareName || caregiver.name)}
                    disabled={!profileImageUrl}
                    className="h-[72px] w-[72px] overflow-hidden rounded-3xl border-2 border-brand-100 bg-brand-50"
                    aria-label="Profilbild vergrößern"
                  >
                    {profileImageUrl ? (
                      <img src={profileImageUrl} alt={caregiver.daycareName || caregiver.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center px-1 text-center text-xs font-bold text-slate-400">
                        Kein Bild
                      </div>
                    )}
                  </button>
                </div>

                <div className="min-w-0">
                  <h2 className="mb-2 text-[1.6rem] font-black leading-tight text-brand-700">
                    {caregiver.daycareName || caregiver.name}
                  </h2>
                  {personInfoParts.length ? <p className="mb-3 text-xl leading-snug text-slate-600">{personInfoParts.join(' · ')}</p> : null}

                  <div className="flex flex-wrap gap-2 text-base font-extrabold text-slate-700">
                    <span className="rounded-full bg-brand-50 px-4 py-2">{locationLabel || 'Ort folgt'}</span>
                    <span
                      className={`rounded-full px-4 py-2 ${
                        isAvailabilityHighlighted({
                          availableSpots: caregiver.availableSpots ?? 0,
                          availabilityTiming: caregiver.availabilityTiming,
                          hasAvailability: caregiver.hasAvailability,
                        })
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-brand-50 text-slate-700'
                      }`}
                    >
                      {formatAvailableSpotsLabel({
                        availableSpots: caregiver.availableSpots ?? 0,
                        hasAvailability: caregiver.hasAvailability,
                        availabilityTiming: caregiver.availabilityTiming,
                      })}
                    </span>
                    <span className="rounded-full bg-brand-50 px-4 py-2">{`${caregiver.childrenCount ?? 0} Kinder in Betreuung`}</span>
                    {caregiver.maxChildAge ? <span className="rounded-full bg-brand-50 px-4 py-2">bis {caregiver.maxChildAge} Jahre</span> : null}
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <Link
                      to={buildCaregiverProfileUrl(caregiver, { citySlug: routeCitySlug })}
                      onClick={() => {
                        trackEvent('engagement_kindertagespflege_kennenlernen', { page: 'dashboard', platform: 'mobile', area: 'list' });
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-3 py-3 text-base font-black text-white shadow transition hover:bg-brand-700"
                    >
                      <FaCommentDots className="h-5 w-5" aria-hidden="true" />
                      Kennenlernen
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleOpenMessenger(caregiver, 'list')}
                      className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-brand-200 bg-white px-3 py-3 text-base font-black text-brand-700 transition hover:border-brand-400 hover:bg-brand-50"
                    >
                      <FaEnvelope className="h-5 w-5" aria-hidden="true" />
                      Nachricht
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}

        {!caregivers.length ? (
          <p className="rounded-3xl border border-dashed border-brand-200 bg-white px-5 py-7 text-sm text-slate-500">
            Keine Tagespflegepersonen gefunden. Probiere eine andere Postleitzahl oder bitte eine Tagespflegeperson, ein Profil anzulegen.
          </p>
        ) : null}
      </div>

      <section className="rounded-3xl bg-white/85 p-5 shadow">
        <h2 className="text-lg font-semibold text-brand-700">Städte und Regionen</h2>
        {footerSeoText ? <p className="mt-2 text-sm leading-7 text-slate-600">{footerSeoText}</p> : null}
        <p className={`font-semibold text-brand-600 ${footerSeoText ? 'mt-4 text-xs' : 'mt-2 text-sm'}`}>
          Finde weitere Tagesmütter &amp; Väter in {footerCityPrompt}
        </p>

        {footerCities.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {footerCities.map((city) => (
              <Link
                key={city.slug}
                to={`/kindertagespflege/${city.slug}`}
                onClick={() => {
                  trackEvent('engagement_city_button_click', {
                    page: 'dashboard',
                    platform: 'mobile',
                    city: city.slug,
                    location: 'footer',
                  });
                }}
                className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700"
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
      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[430px] border border-brand-100 bg-white/95 px-5 pb-6 pt-3 shadow-[0_-12px_30px_rgba(55,88,196,0.10)] backdrop-blur">
        <div className="grid grid-cols-5 gap-2">
          {bottomNavItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-sm font-black ${isActive ? 'text-brand-700' : 'text-slate-400'}`
              }
            >
              <Icon className="h-7 w-7" aria-hidden="true" />
              <span className="leading-none">{label}</span>
            </NavLink>
          ))}
        </div>
        <div className="mx-auto mt-5 h-1.5 w-36 rounded-full bg-black" />
      </nav>

      {lightboxImage ? <ImageLightbox image={lightboxImage} onClose={closeLightbox} /> : null}
    </section>
  );
}

export default DashboardPageMobile;
