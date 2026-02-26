import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext.jsx';
import { assetUrl } from '../../utils/file.js';
import { loadCareGroup, persistCareGroup, removeCareGroup } from '../../utils/careGroupStorage.js';

function formatDisplayName(profile) {
  if (!profile) {
    return 'Unbekannter Kontakt';
  }

  const baseName = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();
  if (profile.role === 'caregiver') {
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

function BertreuungsgruppeErstellen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [caregiverProfile, setCaregiverProfile] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [selectedParticipantIds, setSelectedParticipantIds] = useState([]);
  const [existingGroup, setExistingGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  const isCaregiver = user?.role === 'caregiver';
  const isEditMode = isCaregiver && existingGroup?.caregiverId === user?.id;

  useEffect(() => {
    async function loadData() {
      if (!user || !isCaregiver) {
        return;
      }

      setLoading(true);
      try {
        const [messagesResponse, caregiverResponse, group] = await Promise.all([
          axios.get('/api/messages'),
          axios.get(`/api/caregivers/${user.id}`),
          loadCareGroup(user.id),
        ]);

        const messageOverview = messagesResponse.data ?? [];
        setConversations(messageOverview);
        setCaregiverProfile(caregiverResponse.data ?? null);
        setExistingGroup(group);
        setSelectedParticipantIds(group?.participantIds ?? []);

        const partnerIds = messageOverview
          .map((conversation) => conversation.participants?.find((id) => id !== user.id))
          .filter(Boolean);

        const requiredIds = Array.from(new Set([...(group?.participantIds ?? []), ...partnerIds]));
        const profileEntries = await Promise.all(
          requiredIds.map(async (id) => {
            try {
              const response = await axios.get(`/api/users/${id}`);
              return [id, response.data];
            } catch (_error) {
              return [id, null];
            }
          }),
        );

        setProfiles(Object.fromEntries(profileEntries));
      } catch (error) {
        console.error('Daten konnten nicht geladen werden', error);
      } finally {
        setLoading(false);
      }
    }

    loadData().catch((error) => console.error(error));
  }, [isCaregiver, user]);

  const contacts = useMemo(() => {
    const participants = conversations
      .map((conversation) => {
        const partnerId = conversation.participants?.find((id) => id !== user?.id);
        return profiles[partnerId];
      })
      .filter(Boolean);

    const selected = selectedParticipantIds.map((id) => profiles[id]).filter(Boolean);
    const unique = new Map([...participants, ...selected].map((profile) => [profile.id, profile]));
    return Array.from(unique.values());
  }, [conversations, profiles, selectedParticipantIds, user?.id]);

  const participantCandidates = useMemo(() => contacts.filter((profile) => profile.role === 'parent'), [contacts]);

  const selectedProfiles = selectedParticipantIds.map((id) => profiles[id]).filter(Boolean);
  const careTimesLabel = useMemo(() => formatCareTimes(caregiverProfile?.careTimes), [caregiverProfile?.careTimes]);
  const daycareName = caregiverProfile?.daycareName || existingGroup?.daycareName || 'Kindertagespflegegruppe';

  function toggleParticipant(profileId) {
    setSelectedParticipantIds((current) =>
      current.includes(profileId) ? current.filter((id) => id !== profileId) : [...current, profileId],
    );
  }

  async function handleSaveGroup() {
    if (!isCaregiver || selectedParticipantIds.length === 0) {
      return;
    }

    const nextGroup = {
      caregiverId: user.id,
      participantIds: selectedParticipantIds,
      daycareName,
      logoImageUrl: caregiverProfile?.logoImageUrl || existingGroup?.logoImageUrl || '',
      createdAt: isEditMode ? existingGroup.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await persistCareGroup(nextGroup);
    navigate('/betreuungsgruppe/chat');
  }

  async function handleDeleteGroup() {
    if (!isEditMode) {
      return;
    }

    await removeCareGroup(user.id);
    navigate('/betreuungsgruppe/erstellen');
    setExistingGroup(null);
    setSelectedParticipantIds([]);
  }

  if (!user) {
    return null;
  }

  if (!isCaregiver) {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-4 rounded-3xl bg-white/90 p-6 shadow-lg sm:p-8">
        <h1 className="text-2xl font-semibold text-brand-700">Betreuungsgruppe erstellen</h1>
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Nur Kindertagespflegepersonen können Betreuungsgruppen erstellen oder bearbeiten.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 rounded-3xl bg-white/85 p-6 shadow-lg sm:p-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-brand-700">
          {isEditMode ? 'Betreuungsgruppe bearbeiten' : 'Betreuungsgruppe erstellen'}
        </h1>
        <p className="text-sm text-slate-600">
          {isEditMode
            ? 'Teilnehmer entfernen oder neue Elternaccounts hinzufügen.'
            : 'Erstelle als Kindertagespflegeperson eine eigene Gruppenunterhaltung.'}
        </p>
      </header>

      {loading ? <p className="text-sm text-slate-500">Daten werden geladen…</p> : null}

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
            <h2 className="mb-3 text-sm font-semibold text-brand-700">Ausgewählte Teilnehmer</h2>
            <div className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
              {selectedProfiles.length ? (
                selectedProfiles.map((profile) => (
                  <div key={`selected-${profile.id}`} className="flex items-center justify-between rounded-xl border border-brand-100 px-3 py-2">
                    <span className="text-sm text-slate-700">{formatDisplayName(profile)}</span>
                    <button
                      type="button"
                      onClick={() => toggleParticipant(profile.id)}
                      className="rounded-full px-3 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-50"
                    >
                      Entfernen
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">Keine Teilnehmer ausgewählt.</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSaveGroup}
            disabled={selectedParticipantIds.length === 0}
            className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
          >
            {isEditMode ? 'Änderungen speichern' : 'Betreuungsgruppe erstellen'}
          </button>
          {isEditMode ? (
            <button
              type="button"
              onClick={handleDeleteGroup}
              className="rounded-full border border-rose-300 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:border-rose-500"
            >
              Gruppe löschen
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => navigate('/betreuungsgruppe/chat')}
            className="rounded-full border border-brand-200 px-5 py-3 text-sm font-semibold text-brand-700 transition hover:border-brand-400"
          >
            Zurück
          </button>
        </div>
      </div>
    </section>
  );
}

export default BertreuungsgruppeErstellen;
