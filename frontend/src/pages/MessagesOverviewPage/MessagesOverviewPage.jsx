import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import { assetUrl } from '../utils/file.js';

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
  if (!profile) {
    return 'Unbekannter Kontakt';
  }
  const baseName = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();
  const personName = baseName || profile.name || '';
  const daycareName = profile.daycareName || '';

  if (profile.role === 'caregiver') {
    if (personName && daycareName) {
      return `${personName} : ${daycareName}`;
    }
    return personName || daycareName || 'Unbekannter Kontakt';
  }

  return personName || 'Unbekannter Kontakt';
}

function MessagesOverviewPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadConversations() {
      if (!user) {
        return;
      }
      setLoading(true);
      setError(null);
      try {
        console.info('API Log: GET /api/messages');
        const response = await axios.get('/api/messages');
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

  const handleDeleteConversation = async (event, conversationId) => {
    event.preventDefault();
    event.stopPropagation();

    const confirmed = window.confirm('Möchtest du diese Konversation wirklich löschen?');
    if (!confirmed) {
      return;
    }

    try {
      await axios.delete(`/api/messages/${conversationId}`);
      setConversations((current) => current.filter((conversation) => conversation.conversationId !== conversationId));
    } catch (deleteError) {
      console.error('Failed to delete conversation', deleteError);
      setError('Unterhaltung konnte nicht gelöscht werden.');
    }
  };

  const handleMarkAsRead = async (conversationId) => {
    try {
      await axios.post(`/api/messages/${conversationId}/read`);
      setConversations((current) =>
        current.map((conversation) =>
          conversation.conversationId === conversationId
            ? {
                ...conversation,
                readBy: conversation.readBy?.includes(user.id)
                  ? conversation.readBy
                  : [...(conversation.readBy ?? []), user.id],
              }
            : conversation,
        ),
      );
    } catch (readError) {
      console.error('Failed to mark conversation as read', readError);
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 rounded-3xl bg-white/85 p-10 shadow-lg">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-brand-700">Deine Nachrichtenübersicht</h1>
        <p className="text-sm text-slate-600">
          Behalte den Überblick über alle Gespräche mit Familien und Tagespflegepersonen. Klicke auf eine Unterhaltung, um sie
          fortzusetzen.
        </p>
      </header>
      {loading ? <p className="text-sm text-slate-500">Nachrichten werden geladen…</p> : null}
      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      <div className="flex flex-col gap-4">
        {conversations.length === 0 && !loading ? (
          <p className="rounded-2xl border border-dashed border-brand-200 bg-white/80 p-6 text-sm text-slate-500">
            Noch keine Nachrichten vorhanden. Besuche das Familienzentrum, um Gespräche zu starten.
          </p>
        ) : null}
        {conversations.map((conversation) => {
          const partnerId = conversation.participants?.find((participant) => participant !== user.id) || conversation.senderId;
          const partnerProfile = profiles[partnerId];
          const partnerName = formatConversationPartner(partnerProfile);
          const partnerRoleLabel = partnerProfile?.role === 'caregiver' ? 'Kindertagespflegeperson' : 'Elternteil';
          const profileImageUrl = partnerProfile?.profileImageUrl ? assetUrl(partnerProfile.profileImageUrl) : '';
          const logoUrl = partnerProfile?.logoImageUrl ? assetUrl(partnerProfile.logoImageUrl) : '';
          const initials = partnerName ? partnerName.trim().charAt(0).toUpperCase() : '?';
          const hasAttachments = Array.isArray(conversation.attachments) && conversation.attachments.length > 0;
          const previewText = conversation.body?.trim();
          const preview = previewText
            ? previewText.length > 120
              ? `${previewText.slice(0, 117)}…`
              : previewText
            : hasAttachments
              ? `${conversation.attachments.length} ${conversation.attachments.length === 1 ? 'Anhang' : 'Anhänge'}`
              : '';
          const conversationId = conversation.conversationId;
          const isUnread = !conversation.readBy?.includes(user.id);
          return (
            <Link
              key={conversation.id}
              to={`/nachrichten/${partnerId}`}
              state={{ conversationId, partner: partnerProfile }}
              className={`flex flex-col gap-2 rounded-2xl border bg-white/80 p-5 text-left shadow transition hover:-translate-y-1 hover:shadow-lg ${
                isUnread ? 'border-brand-500 ring-2 ring-brand-200' : 'border-brand-100 hover:border-brand-300'
              }`}
              onClick={() => handleMarkAsRead(conversationId)}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {partnerProfile?.role === 'caregiver' ? (
                    <>
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-brand-100 bg-brand-50">
                        {logoUrl ? (
                          <img src={logoUrl} alt={`${partnerName} Logo`} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs font-semibold text-slate-500">Logo</span>
                        )}
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-brand-100 bg-brand-50">
                        {profileImageUrl ? (
                          <img src={profileImageUrl} alt={partnerName} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-sm font-semibold text-brand-700">{initials}</span>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-brand-100 bg-brand-50">
                      {profileImageUrl ? (
                        <img src={profileImageUrl} alt={partnerName} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-sm font-semibold text-brand-700">{initials}</span>
                      )}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <p className="text-base font-semibold text-brand-700">{partnerName}</p>
                    <span className="text-xs font-semibold text-brand-500">{partnerRoleLabel}</span>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Konversation löschen"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-rose-500 transition hover:bg-rose-50"
                  onClick={(event) => handleDeleteConversation(event, conversationId)}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v9h-2V9Zm4 0h2v9h-2V9ZM7 9h2v9H7V9Z"
                    />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-slate-600">{preview}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default MessagesOverviewPage;
