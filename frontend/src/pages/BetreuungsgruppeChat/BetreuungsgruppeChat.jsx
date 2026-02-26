import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MdAttachFile } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext.jsx';
import { assetUrl, readFileAsDataUrl } from '../../utils/file.js';
import { isGroupMember, readCareGroup, saveCareGroup } from '../../utils/careGroupStorage.js';

function formatDisplayName(profile) {
  if (!profile) {
    return 'Unbekannter Kontakt';
  }
  return [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() || profile.name || 'Kontakt';
}

function formatMessageTime(timestamp) {
  return new Date(timestamp).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function BetreuungsgruppeChat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [group, setGroup] = useState(() => readCareGroup());
  const [profiles, setProfiles] = useState({});
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [feedback, setFeedback] = useState('');

  const isCaregiver = user?.role === 'caregiver' && group?.caregiverId === user?.id;

  useEffect(() => {
    async function syncGroup() {
      if (!user) return;

      try {
        const response = await axios.get('/api/care-groups/me');
        if (!response.data) {
          setGroup(null);
          saveCareGroup(null);
          setMessages([]);
          return;
        }

        saveCareGroup(response.data);
        setGroup(response.data);
      } catch (_error) {
        setGroup(readCareGroup());
      }
    }

    syncGroup().catch(() => true);
  }, [user]);

  useEffect(() => {
    async function loadProfiles() {
      if (!group) {
        return;
      }

      const ids = [group.caregiverId, ...(group.participantIds || [])].filter(Boolean);
      const entries = await Promise.all(
        ids.map(async (id) => {
          try {
            const response = await axios.get(`/api/users/${id}`);
            return [id, response.data];
          } catch (_error) {
            return [id, null];
          }
        }),
      );
      setProfiles(Object.fromEntries(entries));
    }

    loadProfiles().catch((error) => console.error(error));
  }, [group]);

  useEffect(() => {
    async function loadMessages() {
      if (!group || !user || !isGroupMember(group, user.id)) {
        return;
      }

      const conversationId = `caregroup--${group.caregiverId}`;

      try {
        const response = await axios.get(`/api/messages/group/${conversationId}`);
        setMessages(response.data ?? []);
      } catch (error) {
        setFeedback('Gruppennachrichten konnten nicht vollständig geladen werden.');
        setMessages([]);
      }
    }

    loadMessages().catch((error) => console.error(error));
  }, [group, user]);

  const selectedProfiles = useMemo(
    () => (group?.participantIds ?? []).map((id) => profiles[id]).filter(Boolean),
    [group?.participantIds, profiles],
  );

  async function handleSendMessage(event) {
    event.preventDefault();
    const trimmed = draft.trim();

    if ((!trimmed && pendingFiles.length === 0) || !group) {
      return;
    }

    try {
      const attachments = await Promise.all(
        pendingFiles.map(async (file) => ({
          data: await readFileAsDataUrl(file),
          name: file.name,
          mimeType: file.type || null,
          size: file.size,
        })),
      );

      const response = await axios.post(`/api/messages/group/${group.caregiverId}`, {
        participantIds: group.participantIds,
        body: trimmed,
        attachments,
      });

      setMessages((current) => [...current, response.data]);
      setDraft('');
      setPendingFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setFeedback(error.response?.data?.message || 'Gruppennachricht konnte nicht gesendet werden.');
    }
  }

  async function handleLeaveGroup() {
    if (!window.confirm('Möchtest du die Betreuungsgruppe wirklich verlassen?')) {
      return;
    }

    try {
      await axios.post('/api/care-groups/me/leave');
      saveCareGroup(null);
      navigate('/betreuungsgruppe');
    } catch (error) {
      setFeedback(error.response?.data?.message || 'Betreuungsgruppe konnte nicht verlassen werden.');
    }
  }

  if (!user) {
    return null;
  }

  if (!group) {
    return (
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-4 rounded-3xl bg-white/90 p-6 shadow-lg sm:p-8">
        <h1 className="text-2xl font-semibold text-brand-700">Gruppenchat</h1>
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Es gibt aktuell keine Betreuungsgruppe.
        </p>
      </section>
    );
  }

  if (!isGroupMember(group, user.id)) {
    saveCareGroup(null);
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
        <div className="flex gap-2">
          {isCaregiver ? (
            <button
              type="button"
              onClick={() => navigate('/betreuungsgruppe/erstellen')}
              className="rounded-full border border-brand-200 px-5 py-3 text-sm font-semibold text-brand-700 transition hover:border-brand-400"
            >
              Betreuungsgruppe bearbeiten
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLeaveGroup}
              className="rounded-full border border-red-200 px-5 py-3 text-sm font-semibold text-red-700 transition hover:border-red-400"
            >
              Gruppe verlassen
            </button>
          )}
        </div>
      </header>
      {feedback ? <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">{feedback}</p> : null}

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
          {messages.map((message) => {
            const isOwnMessage = message.senderId === user.id;
            const senderName = profiles[message.senderId] ? formatDisplayName(profiles[message.senderId]) : message.senderLabel || 'Kontakt';

            return (
              <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[82%]">
                  <p className={`mb-1 text-xs font-semibold uppercase tracking-wide ${isOwnMessage ? 'text-right text-brand-600' : 'text-slate-500'}`}>
                    {isOwnMessage ? 'Du' : senderName}
                  </p>
                  <div className={`rounded-3xl px-4 py-3 shadow ${isOwnMessage ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {message.body ? <p className="whitespace-pre-wrap text-sm">{message.body}</p> : null}
                    {(message.attachments || []).length ? (
                      <ul className="mt-2 space-y-1 text-xs underline">
                        {message.attachments.map((attachment) => (
                          <li key={`${message.id}-${attachment.key || attachment.url}`}>
                            <a href={assetUrl(attachment)} target="_blank" rel="noreferrer">
                              {attachment.fileName || 'Anhang öffnen'}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <p className={`mt-2 text-xs ${isOwnMessage ? 'text-white/80' : 'text-slate-500'}`}>{formatMessageTime(message.createdAt)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSendMessage} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!isCaregiver}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-brand-300 text-brand-700 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Datei anhängen"
          >
            <MdAttachFile className="text-2xl" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => setPendingFiles(Array.from(event.target.files || []))}
          />
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={isCaregiver ? 'Nachricht schreiben…' : 'Nachricht schreiben…'}
            className="w-full rounded-full border border-brand-200 px-5 py-3 text-sm focus:border-brand-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!draft.trim() && pendingFiles.length === 0}
            className="rounded-full bg-brand-500 px-8 py-3 text-base font-semibold text-white shadow hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
          >
            Senden
          </button>
        </form>
        {pendingFiles.length ? <p className="mt-2 text-xs text-slate-500">Anhänge: {pendingFiles.map((file) => file.name).join(', ')}</p> : null}
      </div>
    </section>
  );
}

export default BetreuungsgruppeChat;
