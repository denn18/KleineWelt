import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';

function formatTimestamp(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  return date.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function fetchUserProfiles(ids) {
  const uniqueIds = Array.from(new Set(ids)).filter(Boolean);
  const entries = await Promise.all(
    uniqueIds.map(async (id) => {
      try {
        const response = await axios.get(`/api/users/${id}`);
        return [id, response.data];
      } catch (error) {
        console.error('Failed to load user', id, error);
        return [id, null];
      }
    }),
  );
  return Object.fromEntries(entries);
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
        const response = await axios.get('/api/messages', { params: { participantId: user.id } });
        setConversations(response.data);
        const partnerIds = response.data
          .map((conversation) => conversation.participants?.find((participant) => participant !== user.id))
          .filter(Boolean);
        if (partnerIds.length) {
          const loadedProfiles = await fetchUserProfiles(partnerIds);
          setProfiles(loadedProfiles);
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
          const partnerName = partnerProfile?.daycareName || partnerProfile?.name || 'Unbekannter Kontakt';
          const preview = conversation.body?.length > 120 ? `${conversation.body.slice(0, 117)}…` : conversation.body;
          const conversationId = [user.id, partnerId].sort().join('--');
          return (
            <Link
              key={conversation.id}
              to={`/nachrichten/${partnerId}`}
              state={{ conversationId, partner: partnerProfile }}
              className="flex flex-col gap-2 rounded-2xl border border-brand-100 bg-white/80 p-5 text-left shadow transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-brand-700">{partnerName}</p>
                <span className="text-xs text-slate-500">{formatTimestamp(conversation.createdAt)}</span>
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
