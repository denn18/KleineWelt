import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { MagnifyingGlassIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext.jsx';
import { assetUrl } from '../../utils/file.js';

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

function formatParentName(profile) {
  if (!profile) {
    return 'Unbekannter Kontakt';
  }
  return [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() || profile.name || 'Unbekannter Kontakt';
}

function toLowerText(value) {
  return String(value || '').toLowerCase();
}

function ContactsPage() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedContactId, setExpandedContactId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadContacts() {
      if (!user?.id || user.role !== 'caregiver') {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data: conversations } = await axios.get('/api/messages');
        const partnerIds = conversations
          .map((conversation) => conversation.participants?.find((participant) => participant !== user.id))
          .filter(Boolean);

        const profilesById = await fetchUserProfiles(partnerIds);

        const parentConversations = conversations.filter((conversation) => {
          const partnerId = conversation.participants?.find((participant) => participant !== user.id);
          const partnerProfile = profilesById[partnerId];
          return partnerId && partnerProfile?.role === 'parent';
        });

        const parentConversationChecks = await Promise.all(
          parentConversations.map(async (conversation) => {
            const partnerId = conversation.participants?.find((participant) => participant !== user.id);
            if (!partnerId) {
              return null;
            }

            try {
              const { data: conversationMessages } = await axios.get(`/api/messages/${conversation.conversationId}`);
              const parentHasWritten = conversationMessages.some((message) => message.senderId === partnerId);
              if (!parentHasWritten) {
                return null;
              }

              return {
                conversationId: conversation.conversationId,
                partnerId,
                profile: profilesById[partnerId],
              };
            } catch (messagesError) {
              console.error('Failed to validate parent conversation', messagesError);
              return null;
            }
          }),
        );

        setContacts(parentConversationChecks.filter(Boolean));
      } catch (requestError) {
        console.error('Failed to load contacts', requestError);
        setError('Kontakte konnten nicht geladen werden.');
      } finally {
        setLoading(false);
      }
    }

    loadContacts().catch((requestError) => {
      console.error(requestError);
      setError('Kontakte konnten nicht geladen werden.');
      setLoading(false);
    });
  }, [user?.id, user?.role]);

  const filteredContacts = useMemo(() => {
    const query = toLowerText(searchQuery).trim();
    if (!query) {
      return contacts;
    }

    return contacts.filter(({ profile }) => {
      const fullName = formatParentName(profile);
      return toLowerText(fullName).includes(query);
    });
  }, [contacts, searchQuery]);

  const handleDeleteContact = async (event, conversationId) => {
    event.preventDefault();
    event.stopPropagation();

    const confirmed = window.confirm('Möchtest du diesen Kontakt wirklich entfernen?');
    if (!confirmed) {
      return;
    }

    try {
      await axios.delete(`/api/messages/${conversationId}`);
      setContacts((current) => current.filter((contact) => contact.conversationId !== conversationId));
      setExpandedContactId((current) => (current === conversationId ? null : current));
    } catch (deleteError) {
      console.error('Failed to delete contact', deleteError);
      setError('Kontakt konnte nicht gelöscht werden.');
    }
  };

  if (!user || user.role !== 'caregiver') {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-4 rounded-3xl bg-white/90 p-8 shadow-lg">
        <h1 className="text-2xl font-semibold text-brand-700">Kontakte</h1>
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Diese Seite ist nur für Kindertagespflegepersonen verfügbar.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 rounded-3xl bg-white/85 p-10 shadow-lg">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold text-brand-700">Kontakte</h1>
        <p className="text-sm text-slate-600">
          Hier siehst du alle Eltern, die dir bereits eine Nachricht geschickt haben. Klicke auf eine Kachel, um weitere
          Kontaktdaten zu sehen.
        </p>
      </header>

      <div className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50/70 px-4 py-3">
        <MagnifyingGlassIcon className="h-5 w-5 text-brand-500" aria-hidden="true" />
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Kontakt nach Namen suchen"
          className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
        />
      </div>

      {loading ? <p className="text-sm text-slate-500">Kontakte werden geladen…</p> : null}
      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        {!loading && filteredContacts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-brand-200 bg-white/80 p-6 text-sm text-slate-500 md:col-span-2">
            Keine passenden Kontakte gefunden.
          </p>
        ) : null}

        {filteredContacts.map(({ conversationId, partnerId, profile }) => {
          const name = formatParentName(profile);
          const profileImageUrl = profile?.profileImageUrl ? assetUrl(profile.profileImageUrl) : '';
          const initials = name ? name.charAt(0).toUpperCase() : '?';
          const isExpanded = expandedContactId === conversationId;

          return (
            <div
              key={conversationId}
              className={`rounded-2xl border bg-white/90 p-5 shadow transition ${
                isExpanded ? 'border-brand-400 ring-2 ring-brand-100' : 'border-brand-100 hover:border-brand-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setExpandedContactId((current) => (current === conversationId ? null : conversationId))}
                  className="flex flex-1 items-center gap-3 text-left"
                >
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-brand-100 bg-brand-50">
                    {profileImageUrl ? (
                      <img src={profileImageUrl} alt={name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm font-semibold text-brand-700">{initials}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-brand-700">{name}</p>
                    <p className="text-xs font-medium text-brand-500">Elternkontakt</p>
                  </div>
                </button>

                <button
                  type="button"
                  aria-label="Kontakt löschen"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-rose-500 transition hover:bg-rose-50"
                  onClick={(event) => handleDeleteContact(event, conversationId)}
                >
                  <TrashIcon className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              {isExpanded ? (
                <div className="mt-4 space-y-2 rounded-xl border border-brand-100 bg-brand-50/40 p-3 text-sm text-slate-600">
                  <p>
                    <span className="font-semibold text-slate-700">Adresse:</span> {profile?.address || 'Nicht angegeben'}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Telefon:</span> {profile?.phoneNumber || 'Nicht angegeben'}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">E-Mail:</span> {profile?.email || 'Nicht angegeben'}
                  </p>
                  <Link
                    to={`/nachrichten/${partnerId}`}
                    state={{ conversationId, partner: profile }}
                    className="inline-flex rounded-full bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-700"
                  >
                    Nachricht öffnen
                  </Link>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default ContactsPage;
