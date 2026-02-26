import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAuth } from './context/AuthContext.jsx';
import { assetUrl } from './utils/file.js';

function formatDisplayName(profile) {
  if (!profile) {
    return 'Unbekannter Kontakt';
  }

  const baseName = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();
  if (profile.role === 'caregiver') {
    if (baseName && profile.daycareName) {
      return `${baseName} : ${profile.daycareName}`;
    }
    return baseName || profile.daycareName || 'Kindertagespflegeperson';
  }

  return baseName || profile.name || 'Elternteil';
}

function formatCareTimes(careTimes) {
  if (!Array.isArray(careTimes) || careTimes.length === 0) {
    return ['Keine Betreuungszeiten hinterlegt.'];
  }

  return careTimes.map((entry, index) => {
    const start = entry.startTime || '??:??';
    const end = entry.endTime || '??:??';
    const activity = entry.activity?.trim() ? ` • ${entry.activity}` : '';
    return `${index + 1}. ${start} - ${end}${activity}`;
  });
}

function ParticipantCard({ profile, selected, onToggle }) {
  const name = formatDisplayName(profile);
  const imageUrl = profile?.profileImageUrl ? assetUrl(profile.profileImageUrl) : '';
  const initials = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <button
      type="button"
      onClick={() => onToggle(profile.id)}
      className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
        selected
          ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-300'
          : 'border-brand-100 bg-white hover:border-brand-300 hover:bg-brand-50/60'
      }`}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-brand-100 bg-brand-50">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm font-semibold text-brand-700">{initials}</span>
        )}
      </div>
      <div className="flex min-w-0 flex-col">
        <p className="truncate text-sm font-semibold text-brand-700">{name}</p>
        <span className="text-xs text-slate-500">{profile.role === 'parent' ? 'Elternaccount' : 'Kontakt'}</span>
      </div>
    </button>
  );
}

function Kindertagespflegegruppe() {
  const { user } = useAuth();
  const [caregiverProfile, setCaregiverProfile] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [selectedParticipantIds, setSelectedParticipantIds] = useState([]);
  const [creationMode, setCreationMode] = useState(false);
  const [groupCreated, setGroupCreated] = useState(false);
  const [groupMessages, setGroupMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);

  const isCaregiver = user?.role === 'caregiver';

  useEffect(() => {
    async function loadData() {
      if (!user) {
        return;
      }

      setLoading(true);
      try {
        const requests = [axios.get('/api/messages')];
        if (isCaregiver) {
          requests.push(axios.get(`/api/caregivers/${user.id}`));
        }

        const [messagesResponse, caregiverResponse] = await Promise.all(requests);
        const messageOverview = messagesResponse.data ?? [];
        setConversations(messageOverview);

        if (caregiverResponse?.data) {
          setCaregiverProfile(caregiverResponse.data);
        }

        const partnerIds = messageOverview
          .map((conversation) => conversation.participants?.find((id) => id !== user.id))
          .filter(Boolean);

        const uniquePartnerIds = Array.from(new Set(partnerIds));
        const profileEntries = await Promise.all(
          uniquePartnerIds.map(async (id) => {
            try {
              const response = await axios.get(`/api/users/${id}`);
              return [id, response.data];
            } catch (error) {
              console.error('Profil konnte nicht geladen werden', id, error);
              return [id, null];
            }
          }),
        );

        setProfiles(Object.fromEntries(profileEntries));
      } catch (error) {
        console.error('Daten für Betreuungsgruppe konnten nicht geladen werden', error);
      } finally {
        setLoading(false);
      }
    }

    loadData().catch((error) => console.error(error));
  }, [user, isCaregiver]);

  const contacts = useMemo(
    () =>
      conversations
        .map((conversation) => {
          const partnerId = conversation.participants?.find((id) => id !== user?.id);
          return profiles[partnerId];
        })
        .filter(Boolean),
    [conversations, profiles, user?.id],
  );

  const participantCandidates = useMemo(
    () => contacts.filter((profile) => profile.role === 'parent'),
    [contacts],
  );

  const careTimesLabel = useMemo(() => formatCareTimes(caregiverProfile?.careTimes), [caregiverProfile?.careTimes]);

  function toggleParticipant(profileId) {
    setSelectedParticipantIds((current) =>
      current.includes(profileId) ? current.filter((id) => id !== profileId) : [...current, profileId],
    );
  }

  function handleCreateGroup() {
    if (!isCaregiver || selectedParticipantIds.length === 0) {
      return;
    }

    const introMessage = {
      id: `${Date.now()}-system`,
      senderId: user.id,
      body: 'Willkommen in der Betreuungsgruppe. Hier werden künftig wichtige Infos geteilt.',
      createdAt: new Date().toISOString(),
    };

    setGroupMessages([introMessage]);
    setGroupCreated(true);
    setCreationMode(false);
  }

  function handleSendMessage(event) {
    event.preventDefault();
    const trimmed = draft.trim();

    if (!trimmed || !isCaregiver || !groupCreated) {
      return;
    }

    const nextMessage = {
      id: `${Date.now()}-${Math.random()}`,
      senderId: user.id,
      body: trimmed,
      createdAt: new Date().toISOString(),
    };

    setGroupMessages((current) => [...current, nextMessage]);
    setDraft('');
  }

  const selectedProfiles = selectedParticipantIds.map((id) => profiles[id]).filter(Boolean);
  const bannerLogoUrl = caregiverProfile?.logoImageUrl ? assetUrl(caregiverProfile.logoImageUrl) : '';
  const daycareName = caregiverProfile?.daycareName || 'Kindertagespflegegruppe';

  if (!user) {
    return null;
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 rounded-3xl bg-white/85 p-6 shadow-lg sm:p-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-brand-700">Betreuungsgruppe</h1>
        <p className="text-sm text-slate-600">
          Erstelle als Kindertagespflegeperson eine eigene Gruppenunterhaltung und teile wichtige Informationen mit allen
          teilnehmenden Eltern.
        </p>
      </header>

      {loading ? <p className="text-sm text-slate-500">Daten werden geladen…</p> : null}

      {!isCaregiver ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Diese Seite ist aktuell nur für Kindertagespflegepersonen zum Erstellen von Betreuungsgruppen vorgesehen.
        </p>
      ) : null}

      {isCaregiver && !groupCreated && !creationMode ? (
        <div className="rounded-3xl border border-brand-100 bg-white p-6 shadow">
          <button
            type="button"
            onClick={() => setCreationMode(true)}
            className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Betreuungsgruppe erstellen
          </button>
        </div>
      ) : null}

      {isCaregiver && creationMode ? (
        <div className="grid gap-5 rounded-3xl border border-brand-100 bg-white p-6 shadow">
          <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Name der Gruppe</p>
            <p className="text-lg font-semibold text-brand-800">{daycareName}</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-brand-100 p-4">
              <h2 className="mb-3 text-sm font-semibold text-brand-700">Teilnehmer hinzufügen</h2>
              <div className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
                {participantCandidates.length ? (
                  participantCandidates.map((profile) => (
                    <ParticipantCard
                      key={`participant-${profile.id}`}
                      profile={profile}
                      selected={selectedParticipantIds.includes(profile.id)}
                      onToggle={toggleParticipant}
                    />
                  ))
                ) : (
                  <p className="text-xs text-slate-500">Noch keine Elternkontakte vorhanden.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-brand-100 p-4">
              <h2 className="mb-3 text-sm font-semibold text-brand-700">Gruppenbeschreibung</h2>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Betreuungszeiten</p>
              <ul className="space-y-2 text-sm text-slate-700">
                {careTimesLabel.map((line) => (
                  <li key={line} className="rounded-xl bg-brand-50 px-3 py-2">
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-brand-100 p-4">
              <h2 className="mb-3 text-sm font-semibold text-brand-700">Kontakte</h2>
              <div className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
                {contacts.length ? (
                  contacts.map((profile) => (
                    <ParticipantCard
                      key={`contact-${profile.id}`}
                      profile={profile}
                      selected={selectedParticipantIds.includes(profile.id)}
                      onToggle={toggleParticipant}
                    />
                  ))
                ) : (
                  <p className="text-xs text-slate-500">Keine Chatpartner verfügbar.</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleCreateGroup}
              disabled={selectedParticipantIds.length === 0}
              className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
            >
              Betreuungsgruppe erstellen
            </button>
            <button
              type="button"
              onClick={() => setCreationMode(false)}
              className="rounded-full border border-brand-200 px-5 py-3 text-sm font-semibold text-brand-700 transition hover:border-brand-400"
            >
              Abbrechen
            </button>
          </div>
        </div>
      ) : null}

      {groupCreated ? (
        <div className="grid gap-5 rounded-3xl border border-brand-100 bg-white p-5 shadow">
          <header className="flex items-center gap-4 rounded-2xl bg-brand-600 px-4 py-3 text-white">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/40 bg-white/20">
              {bannerLogoUrl ? (
                <img src={bannerLogoUrl} alt={`${daycareName} Logo`} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-semibold">Logo</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">{daycareName}</p>
              <p className="text-xs text-white/90">{selectedProfiles.length} Teilnehmer ausgewählt</p>
            </div>
          </header>

          <div className="rounded-2xl border border-brand-100 bg-white p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Teilnehmer</p>
            <div className="flex flex-wrap gap-2">
              {selectedProfiles.map((profile) => (
                <span key={`selected-${profile.id}`} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                  {formatDisplayName(profile)}
                </span>
              ))}
            </div>
          </div>

          <div className="flex max-h-[420px] flex-col gap-3 overflow-y-auto rounded-2xl border border-brand-100 bg-brand-50/50 p-4">
            {groupMessages.map((message) => (
              <div key={message.id} className="ml-auto max-w-[85%] rounded-2xl bg-brand-600 px-4 py-2 text-sm text-white shadow">
                <p className="whitespace-pre-wrap">{message.body}</p>
                <p className="mt-1 text-[10px] text-white/80">
                  {new Date(message.createdAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="flex flex-col gap-3 sm:flex-row">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={2}
              placeholder={isCaregiver ? 'Nachricht an die Betreuungsgruppe…' : 'Nur Lesen'}
              disabled={!isCaregiver}
              className="w-full rounded-2xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
            />
            <button
              type="submit"
              disabled={!isCaregiver || !draft.trim()}
              className="self-end rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
            >
              Senden
            </button>
          </form>
        </div>
      ) : null}
    </section>
  );
}

export default Kindertagespflegegruppe;
