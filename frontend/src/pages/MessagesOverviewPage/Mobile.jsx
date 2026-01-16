// frontend/src/pages/MessagesOverviewPage/Mobile.jsx
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext.jsx';
import { assetUrl } from '../../utils/file.js';

function formatTimestampParts(value) {
  if (!value) return { date: '', time: '' };
  const date = new Date(value);
  return {
    date: date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
    time: date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

async function fetchUserProfiles(ids) {
  const uniqueIds = Array.from(new Set(ids)).filter(Boolean);
  console.info('API Log: Lade Nutzerprofile', uniqueIds);

  const entries = await Promise.all(
    uniqueIds.map(async (id) => {
      try {
        const response = await axios.get(`/api/users/${id}`);
        console.info('API Log: Profil geladen', id);
        return [id, response.data];
      } catch (error) {
        console.error('Failed to load user', id, error);
        return [id, null];
      }
    }),
  );

  return Object.fromEntries(entries);
}

function formatConversationPartner(profile) {
  if (!profile) return 'Unbekannter Kontakt';

  const baseName = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();
  const personName = baseName || profile.name || '';
  const daycareName = profile.daycareName || '';

  if (profile.role === 'caregiver') {
    if (personName && daycareName) return `${personName} : ${daycareName}`;
    return personName || daycareName || 'Unbekannter Kontakt';
  }

  return personName || 'Unbekannter Kontakt';
}

function buildPreview(conversation) {
  const hasAttachments = Array.isArray(conversation.attachments) && conversation.attachments.length > 0;
  const previewText = conversation.body?.trim();

  if (previewText) {
    return previewText.length > 120 ? `${previewText.slice(0, 117)}…` : previewText;
  }

  if (hasAttachments) {
    const count = conversation.attachments.length;
    return `${count} ${count === 1 ? 'Anhang' : 'Anhänge'}`;
  }

  return '';
}

function AvatarStack({ partnerProfile, partnerName }) {
  const profileImageUrl = partnerProfile?.profileImageUrl ? assetUrl(partnerProfile.profileImageUrl) : '';
  const logoUrl = partnerProfile?.logoImageUrl ? assetUrl(partnerProfile.logoImageUrl) : '';
  const initials = partnerName ? partnerName.trim().charAt(0).toUpperCase() : '?';

  if (partnerProfile?.role === 'caregiver') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-brand-100 bg-brand-50">
          {logoUrl ? (
            <img src={logoUrl} alt={`${partnerName} Logo`} className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] font-semibold text-slate-500">Logo</span>
          )}
        </div>
        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-brand-100 bg-brand-50">
          {profileImageUrl ? (
            <img src={profileImageUrl} alt={partnerName} className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm font-semibold text-brand-700">{initials}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-brand-100 bg-brand-50">
      {profileImageUrl ? (
        <img src={profileImageUrl} alt={partnerName} className="h-full w-full object-cover" />
      ) : (
        <span className="text-sm font-semibold text-brand-700">{initials}</span>
      )}
    </div>
  );
}

export default function Mobile() {
  const { user } = useAuth();
  const location = useLocation();

  const [conversations, setConversations] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadConversations() {
      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        console.info('API Log: GET /api/messages', { participantId: user.id });
        const response = await axios.get('/api/messages', { params: { participantId: user.id } });

        setConversations(response.data);
        console.info('API Log: Nachrichten geladen', response.data.length);

        const partnerIds = response.data
          .map((conversation) => conversation.participants?.find((participant) => participant !== user.id))
          .filter(Boolean);

        if (partnerIds.length) {
          const loadedProfiles = await fetchUserProfiles(partnerIds);
          setProfiles(loadedProfiles);
          console.info('API Log: Partnerprofile geladen', Object.keys(loadedProfiles).length);
        } else {
          setProfiles({});
        }
      } catch (requestError) {
        console.error('Failed to load conversations', requestError);
        setError('Nachrichten konnten nicht geladen werden.');
      } finally {
        setLoading(false);
      }
    }

    loadConversations().catch((requestError) => {
      console.error(requestError);
      setError('Nachrichten konnten nicht geladen werden.');
      setLoading(false);
    });
  }, [user]);

  if (!user) {
    return null;
  }

  return (
    <section className="mx-auto mt-6 flex w-full max-w-md flex-col gap-5 rounded-3xl bg-white/85 p-5 shadow-lg">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-brand-700">Deine Nachrichtenübersicht</h1>
        <p className="text-sm text-slate-600">
          Tippe auf eine Unterhaltung, um sie fortzusetzen.
        </p>
      </header>

      {loading ? <p className="text-sm text-slate-500">Nachrichten werden geladen…</p> : null}
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      ) : null}

      <div className="flex flex-col gap-3">
        {conversations.length === 0 && !loading ? (
          <p className="rounded-2xl border border-dashed border-brand-200 bg-white/80 p-5 text-sm text-slate-500">
            Noch keine Nachrichten vorhanden. Besuche das Familienzentrum, um Gespräche zu starten.
          </p>
        ) : null}

        {[...conversations]
          .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime())
          .map((conversation) => {
            const partnerId =
              conversation.participants?.find((participant) => participant !== user.id) || conversation.senderId;

            const partnerProfile = profiles[partnerId];
            const partnerName = formatConversationPartner(partnerProfile);
            const partnerRoleLabel = partnerProfile?.role === 'caregiver' ? 'Kindertagespflegeperson' : 'Elternteil';

            const preview = buildPreview(conversation);
            const conversationId = [user.id, partnerId].sort().join('--');
            const isUnread = conversation.senderId && conversation.senderId !== user.id;
            const timestamp = formatTimestampParts(conversation.createdAt);

            return (
              <Link
                key={conversation.id}
                to={`/nachrichten/${partnerId}`}
                state={{ conversationId, partner: partnerProfile, from: location.pathname }}
                className={`flex flex-col gap-3 rounded-2xl border bg-white/90 p-4 text-left shadow-sm transition hover:border-brand-300 hover:shadow ${
                  isUnread ? 'border-2 border-brand-400 bg-brand-50/40' : 'border-brand-100'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <AvatarStack partnerProfile={partnerProfile} partnerName={partnerName} />
                    <div className="flex flex-col">
                      <p className="text-sm font-semibold text-brand-700 leading-snug">{partnerName}</p>
                      <span className="text-[11px] font-semibold text-brand-500">{partnerRoleLabel}</span>
                    </div>
                  </div>
                  <div className="flex flex-col text-[11px] text-slate-500 leading-tight text-right">
                    <span>{timestamp.date}</span>
                    <span>{timestamp.time}</span>
                  </div>
                </div>

                {preview ? <p className="text-sm text-slate-600">{preview}</p> : null}
              </Link>
            );
          })}
      </div>
    </section>
  );
}
