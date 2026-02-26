import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from './context/AuthContext.jsx';
import { assetUrl } from './utils/file.js';
import { isGroupMember, readCareGroup, saveCareGroup } from '../utils/careGroupStorage.js';

function formatDisplayName(profile) {
  if (!profile) {
    return 'Unbekannter Kontakt';
  }
  return [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() || profile.name || 'Kontakt';
}

function BetreuungsgruppeChatPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState(() => readCareGroup());
  const [profiles, setProfiles] = useState({});
  const [draft, setDraft] = useState('');

  const isCaregiver = user?.role === 'caregiver' && group?.caregiverId === user?.id;

  useEffect(() => {
    setGroup(readCareGroup());
  }, []);

  useEffect(() => {
    async function loadProfiles() {
      if (!group) {
        return;
      }

      const ids = [group.caregiverId, ...group.participantIds].filter(Boolean);
      const entries = await Promise.all(
        ids.map(async (id) => {
          try {
            const response = await axios.get(`/api/users/${id}`);
            return [id, response.data];
          } catch (error) {
            return [id, null];
          }
        }),
      );
      setProfiles(Object.fromEntries(entries));
    }

    loadProfiles().catch((error) => console.error(error));
  }, [group]);

  const selectedProfiles = useMemo(
    () => (group?.participantIds ?? []).map((id) => profiles[id]).filter(Boolean),
    [group?.participantIds, profiles],
  );

  function handleSendMessage(event) {
    event.preventDefault();
    const trimmed = draft.trim();

    if (!trimmed || !isCaregiver || !group) {
      return;
    }

    const nextMessage = {
      id: `${Date.now()}-${Math.random()}`,
      senderId: user.id,
      body: trimmed,
      createdAt: new Date().toISOString(),
      senderLabel: 'Du',
    };

    const nextGroup = {
      ...group,
      messages: [...group.messages, nextMessage],
      updatedAt: new Date().toISOString(),
    };

    const saved = saveCareGroup(nextGroup);
    setGroup(saved);
    setDraft('');
  }

  if (!user) {
    return null;
  }

  if (!group) {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-4 rounded-3xl bg-white/90 p-6 shadow-lg sm:p-8">
        <h1 className="text-2xl font-semibold text-brand-700">Gruppenchat</h1>
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Es gibt aktuell keine Betreuungsgruppe. Bitte zuerst eine Gruppe erstellen.
        </p>
        {user.role === 'caregiver' ? (
          <button
            type="button"
            onClick={() => navigate('/betreuungsgruppe/erstellen')}
            className="w-fit rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white"
          >
            Betreuungsgruppe erstellen
          </button>
        ) : null}
      </section>
    );
  }

  if (!isGroupMember(group, user.id)) {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-4 rounded-3xl bg-white/90 p-6 shadow-lg sm:p-8">
        <h1 className="text-2xl font-semibold text-brand-700">Gruppenchat</h1>
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Du bist kein Mitglied dieser Betreuungsgruppe.
        </p>
      </section>
    );
  }

  const daycareName = group.daycareName || 'Kindertagespflegegruppe';
  const bannerLogoUrl = group.logoImageUrl ? assetUrl(group.logoImageUrl) : '';

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 rounded-3xl bg-white/85 p-6 shadow-lg sm:p-8">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold text-brand-700">Messenger</h1>
        {isCaregiver ? (
          <button
            type="button"
            onClick={() => navigate('/betreuungsgruppe/erstellen')}
            className="rounded-full border border-brand-200 px-5 py-3 text-sm font-semibold text-brand-700 transition hover:border-brand-400"
          >
            Betreuungsgruppe bearbeiten
          </button>
        ) : null}
      </header>

      <div className="rounded-3xl border border-brand-100 bg-white p-5 shadow">
        <header className="mb-4 flex items-center gap-4 rounded-2xl bg-brand-600 px-4 py-3 text-white">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/40 bg-white/20">
            {bannerLogoUrl ? <img src={bannerLogoUrl} alt={`${daycareName} Logo`} className="h-full w-full object-cover" /> : <span>Logo</span>}
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{daycareName}</p>
            <p className="text-xs text-white/90">Teilnehmer: {selectedProfiles.map(formatDisplayName).join(', ') || 'Keine'}</p>
          </div>
        </header>

        <div className="flex min-h-[420px] max-h-[520px] flex-col gap-3 overflow-y-auto rounded-2xl border border-brand-100 bg-slate-50 p-4">
          {group.messages.map((message) => {
            const isOwnMessage = message.senderId === user.id;
            const senderName = profiles[message.senderId] ? formatDisplayName(profiles[message.senderId]) : message.senderLabel || 'Kontakt';

            return (
              <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[82%]">
                  <p className={`mb-1 text-xs font-semibold uppercase tracking-wide ${isOwnMessage ? 'text-right text-brand-600' : 'text-slate-500'}`}>
                    {isOwnMessage ? 'Du' : senderName}
                  </p>
                  <div className={`rounded-3xl px-4 py-3 shadow ${isOwnMessage ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    <p className="whitespace-pre-wrap text-sm">{message.body}</p>
                    <p className={`mt-2 text-xs ${isOwnMessage ? 'text-white/80' : 'text-slate-500'}`}>
                      {new Date(message.createdAt).toLocaleString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSendMessage} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={isCaregiver ? 'Nachricht schreiben…' : 'Nur Lesen'}
            disabled={!isCaregiver}
            className="w-full rounded-full border border-brand-200 px-5 py-3 text-sm focus:border-brand-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
          />
          <button
            type="submit"
            disabled={!isCaregiver || !draft.trim()}
            className="rounded-full bg-brand-500 px-8 py-3 text-base font-semibold text-white shadow hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
          >
            Senden
          </button>
        </form>
      </div>
    </section>
  );
}

export default BetreuungsgruppeChatPage;
