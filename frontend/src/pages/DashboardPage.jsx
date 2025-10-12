import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MapView from '../components/MapView.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function DashboardPage() {
  const [postalCode, setPostalCode] = useState('');
  const [caregivers, setCaregivers] = useState([]);
  const [selectedCaregiver, setSelectedCaregiver] = useState(null);
  const [collapsedCards, setCollapsedCards] = useState({});
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    async function fetchCaregivers() {
      const response = await axios.get('/api/caregivers', {
        params: postalCode ? { postalCode } : undefined,
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
  }, [postalCode]);

  const caregiversForMap = useMemo(() => caregivers.filter((caregiver) => caregiver.location), [caregivers]);

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

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-brand-700">Familienzentrum</h1>
        <p className="text-sm text-slate-600">
          Finde Tagespflegepersonen in deiner Nähe, vergleiche Profile und starte persönliche Gespräche.
        </p>
      </header>

      <form className="flex flex-col gap-4 rounded-3xl bg-white/80 p-6 shadow md:flex-row md:items-center" onSubmit={(event) => event.preventDefault()}>
        <label className="flex flex-1 flex-col gap-2 text-sm font-medium text-slate-700">
          Postleitzahl suchen
          <input
            value={postalCode}
            onChange={(event) => setPostalCode(event.target.value)}
            placeholder="z. B. 10115"
            className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
          />
        </label>
        <p className="text-xs text-slate-500">Die Liste aktualisiert sich automatisch, sobald du die Postleitzahl eingibst.</p>
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
                          {caregiver.postalCode} ·{' '}
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
                            src={caregiver.profileImageUrl}
                            alt={caregiver.daycareName || caregiver.name}
                            className="h-20 w-20 rounded-2xl object-cover"
                          />
                        ) : (
                          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-50 text-xs text-slate-500">
                            Kein Bild
                          </div>
                        )}
                        <div className="flex flex-col gap-2 text-sm text-slate-600">
                          {caregiver.shortDescription ? <p>{caregiver.shortDescription}</p> : null}
                          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                            <span className="rounded-full bg-brand-50 px-3 py-1">
                              {caregiver.childrenCount ?? 0} Kinder in Betreuung
                            </span>
                            <span className="rounded-full bg-brand-50 px-3 py-1">
                              {caregiver.availableSpots ?? 0} freie Plätze
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedCaregiver(caregiver)}
                              className="rounded-full border border-brand-200 px-4 py-2 text-xs font-semibold text-brand-600 transition hover:border-brand-400 hover:text-brand-700"
                            >
                              Details öffnen
                            </button>
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
                  {selectedCaregiver.address}, {selectedCaregiver.postalCode}
                </p>
              </header>
              <div className="grid gap-3 text-sm text-slate-600">
                {selectedCaregiver.profileImageUrl ? (
                  <img
                    src={selectedCaregiver.profileImageUrl}
                    alt={selectedCaregiver.daycareName || selectedCaregiver.name}
                    className="h-40 w-full rounded-2xl object-cover"
                  />
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
                {selectedCaregiver.shortDescription ? <p>{selectedCaregiver.shortDescription}</p> : null}
                {selectedCaregiver.bio ? (
                  <p className="text-sm leading-relaxed">{selectedCaregiver.bio}</p>
                ) : null}
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
