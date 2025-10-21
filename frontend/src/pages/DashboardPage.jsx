import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MapView from '../components/MapView.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { assetUrl } from '../utils/file.js';

function DashboardPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ postalCode: '', city: '', search: '' });
  const [caregivers, setCaregivers] = useState([]);
  const [selectedCaregiver, setSelectedCaregiver] = useState(null);
  const [collapsedCards, setCollapsedCards] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const suggestionsRef = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setSearchTerm('');
    setFilters((current) => {
      if (!current.postalCode && !current.city && !current.search) {
        return current;
      }
      return { postalCode: '', city: '', search: '' };
    });
  }, [location.key]);

  useEffect(() => {
    async function fetchCaregivers() {
      const params = Object.fromEntries(
        Object.entries(filters)
          .filter(([, value]) => Boolean(value))
          .map(([key, value]) => [key, value])
      );

      const response = await axios.get('/api/caregivers', {
        params: Object.keys(params).length ? params : undefined,
      });
      setCaregivers(response.data);
      if (response.data.length) {
        setSelectedCaregiver(response.data[0]);
      } else {
        setSelectedCaregiver(null);
      }
    }

    fetchCaregivers().catch((error) => {
      console.error('Failed to load caregivers', error);
    });
  }, [filters]);

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
        if (!ignore) {
          setSuggestions(response.data);
        }
      })
      .catch((error) => {
        console.error('Failed to load caregiver locations', error);
        if (!ignore) {
          setSuggestions([]);
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoadingSuggestions(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [searchTerm]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setSuggestionsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const caregiversForMap = useMemo(() => caregivers.filter((caregiver) => caregiver.location), [caregivers]);

  const activeLocation = useMemo(() => {
    if (filters.postalCode || filters.city) {
      return [filters.postalCode, filters.city].filter(Boolean).join(' ');
    }
    if (filters.search) {
      return filters.search;
    }
    return '';
  }, [filters]);

  function toggleCard(caregiverId) {
    setCollapsedCards((current) => ({ ...current, [caregiverId]: !current[caregiverId] }));
  }

  function handleOpenMessenger(caregiver) {
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
    setSuggestionsOpen(false);
  }

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-brand-700">Familienzentrum</h1>
        <p className="text-sm text-slate-600">
          Finde Tagespflegepersonen in deiner Nähe, vergleiche Profile und starte persönliche Gespräche.
        </p>
      </header>

      <form
        className="flex flex-col gap-4 rounded-3xl bg-white/80 p-6 shadow md:flex-row md:items-center"
        onSubmit={handleSearchSubmit}
      >
        <div className="relative flex flex-1 flex-col gap-2 text-sm font-medium text-slate-700" ref={suggestionsRef}>
          <label className="flex flex-col gap-2">
            Ort oder Postleitzahl suchen
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onFocus={() => setSuggestionsOpen(true)}
              placeholder="z. B. 10115 Berlin oder Prenzlauer Berg"
              className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
            />
          </label>
          {suggestionsOpen && (loadingSuggestions || suggestions.length > 0) ? (
            <div className="absolute top-full z-10 mt-2 w-full rounded-2xl border border-brand-100 bg-white shadow-lg">
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
                          <span className="font-medium text-brand-700">{label || suggestion.daycareName}</span>
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
        <div className="flex flex-col items-start gap-2 text-xs text-slate-500 md:w-48">
          <span className="rounded-full bg-brand-50 px-3 py-1 font-semibold text-brand-600">{caregivers.length} Profile</span>
          {activeLocation ? <span className="text-xs">Aktueller Filter: {activeLocation}</span> : null}
        </div>
        <button
          type="submit"
          className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-brand-700"
        >
          Suche aktualisieren
        </button>
      </form>

      <div className="grid gap-6 xl:grid-cols-[3fr,2fr]">
        <div className="flex flex-col gap-6">
          <div className="rounded-3xl bg-white/80 p-6 shadow">
            <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-brand-700">Gefundene Tagespflegepersonen</h2>
                <p className="text-xs text-slate-500">
                  Scroll durch die Kacheln, vergleiche Angebote und öffne Details mit einem Klick.
                </p>
              </div>
              <span className="text-xs font-semibold text-brand-600">{caregivers.length} Profile</span>
            </header>
            <div className="mt-4 flex max-h-[480px] flex-col gap-4 overflow-y-auto pr-2">
              {caregivers.map((caregiver) => {
                const collapsed = collapsedCards[caregiver.id];
                const locationLabel = [caregiver.postalCode, caregiver.city].filter(Boolean).join(' ');
                return (
                  <article
                    key={caregiver.id}
                    className={`flex flex-col gap-3 rounded-2xl border px-5 py-4 transition hover:border-brand-300 hover:shadow-lg ${
                      selectedCaregiver?.id === caregiver.id
                        ? 'border-brand-400 bg-brand-50/80'
                        : 'border-brand-100 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-1 flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedCaregiver(caregiver)}
                          className="text-left text-base font-semibold text-brand-700"
                        >
                          {caregiver.daycareName || caregiver.name}
                        </button>
                        <p className="text-xs text-slate-500">
                          {(locationLabel || 'Ort noch nicht angegeben') + ' · '}
                          {caregiver.hasAvailability ? 'Freie Plätze verfügbar' : 'Zurzeit ausgebucht'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleCard(caregiver.id)}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                      >
                        {collapsed ? 'Kachel vergrößern' : 'Kachel minimieren'}
                      </button>
                    </div>
                    {!collapsed ? (
                      <div className="grid gap-3 sm:grid-cols-[auto,1fr]">
                        {caregiver.profileImageUrl ? (
                          <img
                          src={assetUrl(caregiver.profileImageUrl)}
                           // src={caregiver.profileImageUrl} so war es vorher
                            alt={caregiver.daycareName || caregiver.name}
                            className="h-20 w-20 rounded-2xl bg-brand-50 object-contain"
                          />
                        ) : (
                          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-50 text-xs text-slate-500">
                            Kein Bild
                          </div>
                        )}
                        <div className="flex flex-col gap-2 text-sm text-slate-600">
                          {caregiver.shortDescription ? (
                            <div className="flex flex-col gap-1">
                              <h3 className="text-xs font-semibold uppercase tracking-widest text-brand-500">Kurzbeschreibung</h3>
                              <p>{caregiver.shortDescription}</p>
                            </div>
                          ) : null}
                          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                            <span className="rounded-full bg-brand-50 px-3 py-1">
                              {caregiver.childrenCount ?? 0} Kinder in Betreuung
                            </span>
                            <span className="rounded-full bg-brand-50 px-3 py-1">
                              {caregiver.availableSpots ?? 0} freie Plätze
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedCaregiver(caregiver)}
                              className="rounded-full border border-brand-200 px-4 py-2 text-xs font-semibold text-brand-600 transition hover:border-brand-400 hover:text-brand-700"
                            >
                              Details öffnen
                            </button>
                            <Link
                              to={`/kindertagespflege/${caregiver.id}`}
                              className="rounded-full border border-brand-600 px-4 py-2 text-xs font-semibold text-brand-600 transition hover:bg-brand-600 hover:text-white"
                            >
                              Kindertagespflege kennenlernen
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleOpenMessenger(caregiver)}
                              className="rounded-full bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700"
                            >
                              Nachricht schreiben
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : null}
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
          <div className="rounded-3xl bg-white/80 p-6 shadow">
            <h2 className="text-xl font-semibold text-brand-700">Live-Karte</h2>
            <p className="mb-4 text-xs text-slate-500">
              Die Karte zeigt dir eine Vorschau der Tagespflegepersonen in deiner Nähe. Für eine genaue Positionierung kannst du
              später API-Schlüssel für deinen Lieblingskartenanbieter hinterlegen.
            </p>
            <MapView caregivers={caregiversForMap} />
          </div>
        </div>

        <aside className="flex flex-col gap-4 rounded-3xl bg-white/80 p-6 shadow">
          {selectedCaregiver ? (
            <div className="flex flex-col gap-4">
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
              <div className="grid gap-3 text-sm text-slate-600">
                {selectedCaregiver.profileImageUrl ? (
                  <img
                    src={selectedCaregiver.profileImageUrl}
                    alt={selectedCaregiver.daycareName || selectedCaregiver.name}
                    className="h-40 w-full rounded-2xl bg-brand-50 object-contain"
                  />
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
                <p>
                  <span className="font-semibold text-brand-700">Betreute Kinder:</span> {selectedCaregiver.childrenCount ?? 0}
                </p>
                <p>
                  <span className="font-semibold text-brand-700">Freie Plätze:</span> {selectedCaregiver.availableSpots ?? 0}
                </p>
                {selectedCaregiver.conceptUrl ? (
                  <a
                    href={selectedCaregiver.conceptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-200 px-4 py-2 text-xs font-semibold text-brand-600 transition hover:border-brand-400 hover:text-brand-700"
                  >
                    Konzeption als PDF herunterladen
                  </a>
                ) : null}
                <Link
                  to={`/kindertagespflege/${selectedCaregiver.id}`}
                  className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-600 px-4 py-2 text-xs font-semibold text-brand-600 transition hover:bg-brand-600 hover:text-white"
                >
                  Kindertagespflege kennenlernen
                </Link>
              </div>
              <button
                type="button"
                onClick={() => handleOpenMessenger(selectedCaregiver)}
                className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand-700"
              >
                Nachricht schreiben
              </button>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Wähle eine Tagespflegeperson aus der Liste, um weitere Details zu sehen und eine Unterhaltung zu starten.
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}

export default DashboardPage;
