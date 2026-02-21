// frontend/src/pages/DashboardPage/DashboardPageMobile.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
// import MapView from '../components/MapView.jsx'; Google Maps API später einrichten, kostet Geld
import { useAuth } from '../context/AuthContext.jsx';
import ImageLightbox from '../components/ImageLightbox.jsx';
import { assetUrl } from '../utils/file.js';
import { formatAvailableSpotsLabel, isAvailabilityHighlighted } from '../utils/availability.js';
import { trackEvent } from '../utils/analytics.js';

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

function DashboardPageMobile() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ postalCode: '', city: '', search: '' });
  const [caregivers, setCaregivers] = useState([]);
  const [selectedCaregiver, setSelectedCaregiver] = useState(null);

  const [roomImageIndexes, setRoomImageIndexes] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  const suggestionsRef = useRef(null);
  const detailsRef = useRef(null);

  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Reset when route changes (same as web)
  useEffect(() => {
    setSearchTerm('');
    setFilters((current) => {
      if (!current.postalCode && !current.city && !current.search) return current;
      return { postalCode: '', city: '', search: '' };
    });
  }, [location.key]);

  // Fetch caregivers (same logic as web)
  useEffect(() => {
    async function fetchCaregivers() {
      const params = Object.fromEntries(
        Object.entries(filters)
          .filter(([, value]) => Boolean(value))
          .map(([key, value]) => [key, value]),
      );

      const response = await axios.get('/api/caregivers', {
        params: Object.keys(params).length ? params : undefined,
      });

      setCaregivers(response.data);

      if (response.data.length) {
        setSelectedCaregiver((current) => current ?? response.data[0]);
      } else {
        setSelectedCaregiver(null);
      }

      setRoomImageIndexes((current) => {
        const next = { ...current };
        response.data.forEach((caregiver) => {
          next[caregiver.id] = next[caregiver.id] ?? 0;
        });
        return next;
      });
    }

    fetchCaregivers().catch((error) => {
      console.error('Failed to load caregivers', error);
    });
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
    if (filters.postalCode || filters.city) return [filters.postalCode, filters.city].filter(Boolean).join(' ');
    if (filters.search) return filters.search;
    return '';
  }, [filters]);

  const selectedLogo = selectedCaregiver?.logoImageUrl ? assetUrl(selectedCaregiver.logoImageUrl) : '';
  const selectedProfileImage = selectedCaregiver?.profileImageUrl ? assetUrl(selectedCaregiver.profileImageUrl) : '';
  const selectedConceptUrl = selectedCaregiver?.conceptUrl ? assetUrl(selectedCaregiver.conceptUrl) : '';
  const selectedRoomImages = useMemo(
    () => (selectedCaregiver?.roomImages ?? []).map((url) => assetUrl(url)),
    [selectedCaregiver],
  );

  const selectedSinceYear = useMemo(() => {
    if (!selectedCaregiver?.caregiverSince) return null;
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
      trackEvent('engagement_raeumlichkeiten_anschauen', { page: 'dashboard', platform: 'mobile', area, direction: direction > 0 ? 'next' : 'prev' });
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
    setFilters({ postalCode: suggestion.postalCode ?? '', city: suggestion.city ?? '', search: '' });
    setSuggestionsOpen(false);
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    const trimmed = searchTerm.trim();

    if (!trimmed) {
      setFilters({ postalCode: '', city: '', search: '' });
      setSuggestionsOpen(false);
      return;
    }

    const parts = trimmed.split(/\s+/);
    const first = parts[0];

    if (/^\d{5}$/.test(first)) {
      const cityName = parts.slice(1).join(' ').trim();
      setFilters({ postalCode: first, city: cityName, search: '' });
    } else {
      setFilters({ postalCode: '', city: '', search: trimmed });
    }

    trackEvent('engagement_postleitzahl_suche', { page: 'dashboard', platform: 'mobile', search_value: trimmed || 'empty' });
    setSuggestionsOpen(false);
  }

  function handleSelectCaregiver(caregiver) {
    setSelectedCaregiver(caregiver);
    // Auf Mobile: Details sichtbar machen
    requestAnimationFrame(() => {
      detailsRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    });
  }

  return (
    <section className="mx-auto flex w-full max-w-[640px] flex-col gap-5 px-4 pb-10 pt-4">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold text-brand-700">Familienzentrum</h1>
        <p className="text-sm text-slate-600">
          Finde Tagespflegepersonen in deiner Nähe, vergleiche Profile und starte persönliche Gespräche.
        </p>
      </header>

      {/* Search */}
      <form
        className="relative flex flex-col gap-3 rounded-3xl bg-white/85 p-4 shadow"
        onSubmit={handleSearchSubmit}
        ref={suggestionsRef}
      >
        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
          Ort oder Postleitzahl suchen
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            onFocus={() => setSuggestionsOpen(true)}
            placeholder="hier Postleitzahl eingeben"
            className="rounded-2xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
          />
        </label>

        {/* Suggestions */}
        {suggestionsOpen && (loadingSuggestions || suggestions.length > 0) ? (
          <div className="absolute left-4 right-4 top-[92px] z-20 overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-lg">
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
                        <span className="font-semibold text-brand-700">{label || suggestion.daycareName}</span>
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

        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex flex-col gap-1 text-xs text-slate-500">
            <span className="w-fit rounded-full bg-brand-50 px-3 py-1 font-semibold text-brand-600">
              {caregivers.length} Profile
            </span>
            {activeLocation ? <span>Aktueller Filter: {activeLocation}</span> : null}
          </div>

          <button
            type="submit"
            className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-brand-700"
          >
            Suche
          </button>
        </div>
      </form>

      {/* List */}
      <div className="flex flex-col gap-3">
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-extrabold text-brand-700">Gefundene Kindertagespflegepersonen</h2>
            <p className="text-xs text-slate-500">Tippe auf eine Karte, um Details zu öffnen.</p>
          </div>
          <span className="text-xs font-semibold text-brand-600">{caregivers.length} Profile</span>
        </div>

        <div className="flex flex-col gap-3">
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
                className={`flex flex-col gap-3 rounded-3xl border p-4 shadow-sm transition active:scale-[0.99] ${
                  isActive ? 'border-brand-400 bg-brand-50/80' : 'border-brand-100 bg-white/90'
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
                {/* Top row: images + title */}
                <div className="flex items-start gap-3">
                  <div className="flex shrink-0 flex-col gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openLightbox(logoUrl, `Logo von ${caregiver.daycareName || caregiver.name}`);
                      }}
                      disabled={!logoUrl}
                      className={`flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border ${
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
                      className={`h-14 w-14 overflow-hidden rounded-2xl border ${
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

                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <h3 className="truncate text-base font-extrabold text-brand-700">
                      {caregiver.daycareName || caregiver.name}
                    </h3>

                    {personInfo ? <p className="text-sm text-slate-600">{personInfo}</p> : null}

                    <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                      <span className="rounded-full bg-brand-50 px-3 py-1">{locationLabel || 'Ort folgt'}</span>

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
                        <span className="rounded-full bg-brand-50 px-3 py-1">bis {caregiver.maxChildAge} Jahre</span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Room preview */}
                <div className="relative h-32 overflow-hidden rounded-2xl border border-brand-100 bg-brand-50">
                  {currentRoomImage ? (
                    <img
                      src={currentRoomImage}
                      alt={`Räumlichkeit von ${caregiver.daycareName || caregiver.name}`}
                      className="h-full w-full object-cover"
                      onClick={(event) => {
                        event.stopPropagation();
                        openLightbox(currentRoomImage, `Räumlichkeit von ${caregiver.daycareName || caregiver.name}`);
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-400">
                      Noch keine Räume
                    </div>
                  )}

                  {roomImages.length > 1 ? (
                    <>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleCycleRoomImage(caregiver.id, -1, 'list');
                        }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 px-3 py-2 text-xs font-bold text-brand-600 shadow hover:bg-white"
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
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 px-3 py-2 text-xs font-bold text-brand-600 shadow hover:bg-white"
                        aria-label="Nächstes Raumbild anzeigen"
                      >
                        →
                      </button>
                    </>
                  ) : null}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Link
                    to={`/kindertagespflege/${caregiver.id}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      trackEvent('engagement_kindertagespflege_kennenlernen', { page: 'dashboard', platform: 'mobile', area: 'list' });
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
                    className="w-full rounded-full bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-brand-700"
                  >
                    Nachricht schreiben
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

      {/* Details (mobile: unter der Liste als große Karte) */}
      <div ref={detailsRef} className="rounded-3xl bg-white/90 p-5 shadow">
        {selectedCaregiver ? (
          <div className="flex flex-col gap-4">
            <header className="flex flex-col gap-1">
              <h2 className="text-xl font-extrabold text-brand-700">
                {selectedCaregiver.daycareName || selectedCaregiver.name}
              </h2>
              <p className="text-sm text-slate-600">
                {[
                  selectedCaregiver.address,
                  [selectedCaregiver.postalCode, selectedCaregiver.city].filter(Boolean).join(' '),
                ]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            </header>

            <div className="flex items-center gap-3">
              {selectedLogo ? (
                <button
                  type="button"
                  onClick={() =>
                    openLightbox(selectedLogo, `Logo von ${selectedCaregiver.daycareName || selectedCaregiver.name}`)
                  }
                  className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-brand-100 bg-brand-50 transition hover:shadow-lg"
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
                  onClick={() =>
                    openLightbox(selectedProfileImage, selectedCaregiver.daycareName || selectedCaregiver.name)
                  }
                  className="h-14 w-14 overflow-hidden rounded-2xl border border-brand-100 bg-brand-50 transition hover:shadow-lg"
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
                  <span className="rounded-full bg-brand-50 px-3 py-1">Aufnahme bis {selectedCaregiver.maxChildAge} Jahre</span>
                ) : null}

                {selectedSinceYear ? (
                  <span className="rounded-full bg-brand-50 px-3 py-1">Seit {selectedSinceYear} aktiv</span>
                ) : null}
              </div>
            </div>

            {selectedRoomImages.length ? (
              <div className="flex flex-col gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-brand-500">Räumlichkeiten</h3>
                <div className="grid grid-cols-3 gap-2">
                  {selectedRoomImages.slice(0, 3).map((imageUrl, index) => (
                    <button
                      key={`${imageUrl}-${index}`}
                      type="button"
                      onClick={() => openLightbox(imageUrl, `Räumlichkeit ${index + 1}`)}
                      className="overflow-hidden rounded-2xl"
                    >
                      <img src={imageUrl} alt={`Räumlichkeit ${index + 1}`} className="h-20 w-full object-cover" />
                    </button>
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
                <p className="text-sm text-slate-600">{selectedCaregiver.shortDescription}</p>
              </div>
            ) : null}

            {selectedCaregiver.bio ? (
              <div className="flex flex-col gap-1">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-brand-500">Über dich</h3>
                <p className="text-sm leading-relaxed text-slate-600">{selectedCaregiver.bio}</p>
              </div>
            ) : null}

            {/* Alter im Web-Detail nur wenn vorhanden – wir bleiben dabei */}
            {selectedCaregiver.age ? (
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-brand-700">Alter:</span> {selectedCaregiver.age} Jahre
              </p>
            ) : null}

            {selectedConceptUrl ? (
              <a
                href={selectedConceptUrl}
                onClick={() => trackEvent('engagement_konzeption_durchlesen', { page: 'dashboard', platform: 'mobile', area: 'detail' })}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-200 px-4 py-2 text-xs font-semibold text-brand-600 transition hover:border-brand-400 hover:text-brand-700"
              >
                Konzeption als PDF herunterladen
              </a>
            ) : null}

            <div className="flex flex-col gap-2">
              <Link
                to={`/kindertagespflege/${selectedCaregiver.id}`}
                onClick={() => trackEvent('engagement_kindertagespflege_kennenlernen', { page: 'dashboard', platform: 'mobile', area: 'detail' })}
                className="w-full rounded-full border border-brand-600 px-4 py-3 text-center text-sm font-semibold text-brand-600 transition hover:bg-brand-600 hover:text-white"
              >
                Kindertagespflege kennenlernen
              </Link>

              <button
                type="button"
                onClick={() => handleOpenMessenger(selectedCaregiver, 'detail')}
                className="w-full rounded-full bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-brand-700"
              >
                Nachricht schreiben
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Wähle eine Tagespflegeperson aus der Liste, um weitere Details zu sehen und eine Unterhaltung zu starten.
          </p>
        )}
      </div>

      {lightboxImage ? <ImageLightbox image={lightboxImage} onClose={closeLightbox} /> : null}
    </section>
  );
}

export default DashboardPageMobile;
