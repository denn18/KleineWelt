import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext.jsx';
import { assetUrl } from '../../utils/file.js';

function ParentCard({ parent, selected, onClick, expanded, onToggleExpand, showExpand }) {
  const fullName = [parent.firstName, parent.lastName].filter(Boolean).join(' ').trim() || parent.name || 'Elternaccount';
  const imageUrl = parent.profileImageUrl ? assetUrl(parent.profileImageUrl) : '';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border p-3 text-left ${selected ? 'border-brand-500 bg-brand-50' : 'border-brand-100 bg-white'}`}
    >
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 overflow-hidden rounded-xl bg-brand-100">
          {imageUrl ? <img src={imageUrl} alt={fullName} className="h-full w-full object-cover" /> : null}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-brand-700">{fullName}</p>
          <p className="text-xs text-slate-500">{parent.email || 'ohne E-Mail'}</p>
        </div>
        {showExpand ? (
          <span
            role="button"
            tabIndex={0}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onToggleExpand?.();
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                event.stopPropagation();
                onToggleExpand?.();
              }
            }}
            className="rounded-full bg-slate-100 px-3 py-1 text-xs"
          >
            {expanded ? 'Weniger' : 'Info'}
          </span>
        ) : null}
      </div>
      {showExpand && expanded ? (
        <div className="mt-3 grid gap-1 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
          <p>Adresse: {parent.address || 'Keine Angabe'}</p>
          <p>Telefon: {parent.phone || 'Keine Angabe'}</p>
          <p>PLZ: {parent.postalCode || 'Keine Angabe'}</p>
        </div>
      ) : null}
    </button>
  );
}

export default function KindertagespflegegruppePage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [query, setQuery] = useState('');
  const [expandedContactId, setExpandedContactId] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);

  const isCaregiver = user?.role === 'caregiver';

  async function loadData() {
    const [groupsRes, suggestionsRes] = await Promise.all([axios.get('/api/groups'), isCaregiver ? axios.get('/api/groups/suggestions') : Promise.resolve({ data: [] })]);
    setGroups(groupsRes.data);
    setSuggestions(suggestionsRes.data || []);

    if (isCaregiver) {
      const contactsRes = await axios.get('/api/groups/contacts');
      setContacts(contactsRes.data || []);
    }
  }

  useEffect(() => {
    if (!user) {
      return;
    }
    loadData().catch((error) => console.error('Gruppen laden fehlgeschlagen', error));
  }, [user]);

  const candidateEntries = useMemo(() => {
    const lower = query.trim().toLowerCase();
    return suggestions.filter((entry) => {
      const fullName = [entry.parent?.firstName, entry.parent?.lastName].filter(Boolean).join(' ').trim() || entry.parent?.name || '';
      return !lower || fullName.toLowerCase().includes(lower);
    });
  }, [query, suggestions]);

  const handleCreateGroup = async () => {
    const response = await axios.post('/api/groups', { participantIds: selectedIds });
    setSelectedIds([]);
    setGroups((current) => [response.data, ...current]);
    setActiveGroup(response.data);
  };

  const handleToggleContact = async (parentId, isContact) => {
    if (isContact) {
      await axios.delete(`/api/groups/contacts/${parentId}`);
    } else {
      await axios.put(`/api/groups/contacts/${parentId}`);
    }
    await loadData();
  };

  if (!user) {
    return null;
  }

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 rounded-3xl bg-white/90 p-8 shadow-lg">
      <header>
        <h1 className="text-3xl font-semibold text-brand-700">Kindertagespflegegruppe</h1>
        <p className="text-sm text-slate-600">Gruppen-Kommunikation nach WhatsApp-Prinzip mit nur einem Schreibrecht für die KTP.</p>
      </header>

      {isCaregiver ? (
        <div className="rounded-2xl border border-brand-100 bg-brand-50/70 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-700">Betreuungsgruppe erstellen</h2>
            <button
              type="button"
              onClick={handleCreateGroup}
              className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-brand-200"
            >
              Betreuungsgruppe erstellen
            </button>
          </div>
          <div className="relative mb-3">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Eltern per Namen suchen"
              className="w-full rounded-xl border border-brand-200 py-2 pl-9 pr-3 text-sm"
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {candidateEntries.map((entry) => (
              <div key={entry.parentId} className="space-y-2">
                <ParentCard
                  parent={entry.parent}
                  selected={selectedIds.includes(entry.parentId)}
                  onClick={() =>
                    setSelectedIds((current) =>
                      current.includes(entry.parentId) ? current.filter((id) => id !== entry.parentId) : [...current, entry.parentId],
                    )
                  }
                />
                <button
                  type="button"
                  onClick={() => handleToggleContact(entry.parentId, entry.isContact)}
                  className="text-xs font-semibold text-brand-600"
                >
                  {entry.isContact ? 'Aus Kontakten entfernen' : 'Zu Kontakten hinzufügen'}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-brand-100 p-4">
          <h2 className="mb-3 text-lg font-semibold text-brand-700">Gruppen</h2>
          <div className="space-y-3">
            {groups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => setActiveGroup(group)}
                className="w-full rounded-xl border border-brand-100 bg-white p-3 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-xl bg-brand-100">
                    {group.logoImageUrl ? <img src={assetUrl(group.logoImageUrl)} alt={group.name} className="h-full w-full object-cover" /> : null}
                  </div>
                  <div>
                    <p className="font-semibold text-brand-700">{group.name}</p>
                    <p className="text-xs text-slate-500">Teilnehmende Eltern: {group.participantIds?.length || 0}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-brand-100 p-4">
          <h2 className="mb-3 text-lg font-semibold text-brand-700">Gruppenprofil</h2>
          {activeGroup ? (
            <div className="space-y-3">
              <p className="font-semibold text-brand-700">{activeGroup.name}</p>
              <p className="text-sm text-slate-600">{activeGroup.description || 'Keine Beschreibung hinterlegt.'}</p>
              <div className="rounded-xl border border-brand-200 bg-brand-50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-700">Betreuungszeiten</p>
                {(activeGroup.careTimes || []).map((slot, index) => (
                  <p key={`${slot.startTime}-${index}`} className="text-sm text-slate-700">{slot.startTime} - {slot.endTime}: {slot.activity}</p>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Wähle eine Gruppe aus, um Profil und Betreuungszeiten zu sehen.</p>
          )}
        </article>
      </div>

      {isCaregiver ? (
        <article id="kontakte" className="rounded-2xl border border-brand-100 p-4">
          <h2 className="mb-3 text-lg font-semibold text-brand-700">Kontakte</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {contacts.map((entry) => (
              <ParentCard
                key={entry.parentId}
                parent={entry.parent}
                showExpand
                expanded={expandedContactId === entry.parentId}
                onToggleExpand={() => setExpandedContactId((current) => (current === entry.parentId ? null : entry.parentId))}
                onClick={() => setExpandedContactId((current) => (current === entry.parentId ? null : entry.parentId))}
              />
            ))}
          </div>
        </article>
      ) : null}
    </section>
  );
}
