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

function ContactTile({ profile, selected, onToggle }) {
  const name = formatDisplayName(profile);
  const imageUrl = profile?.profileImageUrl ? assetUrl(profile.profileImageUrl) : '';
  const initials = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <button
      type="button"
      onClick={() => onToggle(profile.id)}
      className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left transition ${
        selected ? 'border-brand-400 bg-brand-50' : 'border-brand-100 bg-white'
      }`}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-brand-100 bg-brand-50">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm font-semibold text-brand-700">{initials}</span>
        )}
      </div>
      <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{name}</p>
      <span
        className={`h-6 w-10 rounded-full border transition ${
          selected ? 'border-brand-500 bg-brand-500' : 'border-slate-300 bg-slate-200'
        }`}
        aria-hidden="true"
      />
    </button>
  );
}

function MobileBetreuungsgruppeErstellen() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [selectedParticipantIds, setSelectedParticipantIds] = useState([]);
  const [existingGroup, setExistingGroup] = useState(null);
  const [caregiverProfile, setCaregiverProfile] = useState(null);
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

        setConversations(messageOverview);
        setProfiles(Object.fromEntries(profileEntries));
        setExistingGroup(group);
        setSelectedParticipantIds(group?.participantIds ?? []);
        setCaregiverProfile(caregiverResponse.data ?? null);
      } catch (error) {
        console.error('Daten konnten nicht geladen werden', error);
      } finally {
        setLoading(false);
      }
    }

    loadData().catch((error) => console.error(error));
  }, [isCaregiver, user]);

  const participantCandidates = useMemo(() => {
    const participants = conversations
      .map((conversation) => {
        const partnerId = conversation.participants?.find((id) => id !== user?.id);
        return profiles[partnerId];
      })
      .filter(Boolean)
      .filter((profile) => profile.role === 'parent');

    const selected = selectedParticipantIds.map((id) => profiles[id]).filter(Boolean);
    return Array.from(new Map([...participants, ...selected].map((profile) => [profile.id, profile])).values());
  }, [conversations, profiles, selectedParticipantIds, user?.id]);

  function toggleParticipant(profileId) {
    setSelectedParticipantIds((current) =>
      current.includes(profileId) ? current.filter((id) => id !== profileId) : [...current, profileId],
    );
  }

  async function handleContinue() {
    if (!isCaregiver || selectedParticipantIds.length === 0) {
      return;
    }

    const daycareName = caregiverProfile?.daycareName || existingGroup?.daycareName || 'Kindertagespflegegruppe';

    await persistCareGroup({
      caregiverId: user.id,
      participantIds: selectedParticipantIds,
      daycareName,
      logoImageUrl: caregiverProfile?.logoImageUrl || existingGroup?.logoImageUrl || '',
      createdAt: existingGroup?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    navigate('/betreuungsgruppe/chat');
  }

  async function handleDeleteGroup() {
    if (!isEditMode) {
      navigate('/betreuungsgruppe/erstellen', { replace: true });
      return;
    }

    await removeCareGroup(user.id);
    setExistingGroup(null);
    setSelectedParticipantIds([]);
    navigate('/betreuungsgruppe/erstellen', { replace: true });
  }

  useEffect(() => {
    if (loading || !isCaregiver) {
      return;
    }

    if (!existingGroup) {
      navigate('/betreuungsgruppe/erstellen', { replace: true });
    }
  }, [existingGroup, isCaregiver, loading, navigate]);

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
    <section className="fixed inset-0 z-[90] bg-[#F3F7FF]">
      <div className="flex h-full flex-col pb-[env(safe-area-inset-bottom)]">
        <header className="border-b border-brand-100 bg-white px-4 pb-4 pt-5">
          <h1 className="text-2xl font-semibold text-brand-700">
            {isEditMode ? 'Betreuungsgruppe bearbeiten' : 'Betreuungsgruppe erstellen'}
          </h1>
          <div className="mt-4 grid grid-cols-[auto_1fr_auto] items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-700"
            >
              zurück
            </button>
            <button
              type="button"
              onClick={handleDeleteGroup}
              className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-center text-sm font-semibold text-rose-700 transition hover:border-rose-500"
            >
              Gruppe löschen
            </button>
            <button
              type="button"
              onClick={handleContinue}
              disabled={selectedParticipantIds.length === 0}
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-brand-300"
            >
              weiter
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-200 px-4 py-5">
          <div className="rounded-2xl border border-slate-300 bg-slate-100 p-4">
            <p className="mb-3 text-center text-sm font-semibold text-slate-500">Elternaccounts aus Nachrichten hinzufügen oder entfernen</p>
            {loading ? <p className="text-center text-xs text-slate-500">Daten werden geladen…</p> : null}
            <div className="space-y-2">
              {participantCandidates.map((profile) => (
                <ContactTile
                  key={`mobile-participant-${profile.id}`}
                  profile={profile}
                  selected={selectedParticipantIds.includes(profile.id)}
                  onToggle={toggleParticipant}
                />
              ))}
            </div>
            {!loading && participantCandidates.length === 0 ? (
              <p className="py-3 text-center text-xs text-slate-500">Noch keine Elternkontakte aus Nachrichten vorhanden.</p>
            ) : null}
          </div>
        </main>
      </div>
    </section>
  );
}

export default MobileBetreuungsgruppeErstellen;
