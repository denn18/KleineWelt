import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MdAttachFile } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext.jsx';
import { assetUrl, readFileAsDataUrl } from '../../utils/file.js';
import { isGroupMember, loadCareGroup, saveCareGroup } from '../../utils/careGroupStorage.js';

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

function useBodyOverflowHidden(enabled) {
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const html = document.documentElement;
    const body = document.body;

    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousOverscroll = body.style.overscrollBehavior;

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';

    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.overscrollBehavior = previousOverscroll;
    };
  }, [enabled]);
}

function useKeyboardInset() {
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;

    function updateInset() {
      const innerHeight = window.innerHeight;
      const viewportHeight = viewport?.height ?? innerHeight;
      const viewportOffsetTop = viewport?.offsetTop ?? 0;
      const nextInset = Math.max(0, Math.round(innerHeight - viewportHeight - viewportOffsetTop));
      setKeyboardInset(nextInset);
    }

    updateInset();

    if (viewport) {
      viewport.addEventListener('resize', updateInset);
      viewport.addEventListener('scroll', updateInset);
      return () => {
        viewport.removeEventListener('resize', updateInset);
        viewport.removeEventListener('scroll', updateInset);
      };
    }

    window.addEventListener('resize', updateInset);
    return () => window.removeEventListener('resize', updateInset);
  }, []);

  return keyboardInset;
}

function BetreuungsgruppeChat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [group, setGroup] = useState(null);
  const [profiles, setProfiles] = useState({});
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [composerHeight, setComposerHeight] = useState(90);

  const messageListRef = useRef(null);
  const messageBottomRef = useRef(null);
  const mobileComposerRef = useRef(null);

  useBodyOverflowHidden(isMobile);
  const keyboardInset = useKeyboardInset();

  const isCaregiver = user?.role === 'caregiver' && group?.caregiverId === user?.id;

  useEffect(() => {
    async function loadGroup() {
      if (!user?.id) {
        return;
      }

      const nextGroup = await loadCareGroup(user.id);
      setGroup(nextGroup);
    }

    loadGroup().catch((error) => console.error(error));
  }, [user?.id]);

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
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      return undefined;
    }

    const composerElement = mobileComposerRef.current;
    if (!composerElement) {
      return undefined;
    }

    const updateHeight = () => setComposerHeight(composerElement.getBoundingClientRect().height);
    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(composerElement);

    return () => resizeObserver.disconnect();
  }, [isMobile]);

  useEffect(() => {
    if (!group || !user || !isGroupMember(group, user.id)) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      messageBottomRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
    }, 30);

    return () => window.clearTimeout(timeoutId);
  }, [group, user, messages.length]);

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
        console.error('Gruppennachrichten konnten nicht geladen werden, fallback auf localStorage', error);
        setMessages(group.messages ?? []);
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

    if ((!trimmed && pendingFiles.length === 0) || !isCaregiver || !group) {
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
      saveCareGroup({ ...group, updatedAt: new Date().toISOString() });
      setDraft('');
      setPendingFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Gruppennachricht konnte nicht gesendet werden', error);
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

  if (isMobile) {
    return (
      <section className="fixed inset-0 z-[90] bg-[#F3F7FF]">
        <div className="flex h-full flex-col pb-[env(safe-area-inset-bottom)]">
          <header className="px-4 pt-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-700"
              >
                ← Zurück
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold tracking-widest text-brand-500">GRUPPENCHAT</p>
                <h1 className="truncate text-lg font-semibold text-slate-800">{daycareName}</h1>
              </div>
            </div>
          </header>

          <main
            ref={messageListRef}
            className="mt-3 flex-1 overflow-y-auto px-4"
            style={{
              WebkitOverflowScrolling: 'touch',
              paddingBottom: `${composerHeight + keyboardInset + 16}px`,
            }}
          >
            <div className="space-y-3 pb-4">
              {messages.map((message) => {
                const isOwnMessage = message.senderId === user.id;
                const senderName = profiles[message.senderId]
                  ? formatDisplayName(profiles[message.senderId])
                  : message.senderLabel || 'Kontakt';

                return (
                  <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[88%]">
                      <p
                        className={`mb-1 text-[10px] font-semibold uppercase tracking-wide ${
                          isOwnMessage ? 'text-right text-brand-600' : 'text-slate-500'
                        }`}
                      >
                        {isOwnMessage ? 'Du' : senderName}
                      </p>
                      <div
                        className={`rounded-2xl px-4 py-2 shadow ${
                          isOwnMessage ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {message.body ? <p className="whitespace-pre-wrap text-base leading-6">{message.body}</p> : null}
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
                        <p className={`mt-2 text-xs ${isOwnMessage ? 'text-white/80' : 'text-slate-500'}`}>
                          {formatMessageTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messageBottomRef} />
            </div>
          </main>

          <form
            ref={mobileComposerRef}
            onSubmit={handleSendMessage}
            className="fixed inset-x-0 bottom-0 z-10 border-t border-brand-100 bg-white px-3 py-2"
            style={{ transform: `translateY(-${keyboardInset}px)` }}
          >
            {pendingFiles.length ? (
              <p className="mb-2 text-xs text-slate-500">Anhänge: {pendingFiles.map((file) => file.name).join(', ')}</p>
            ) : null}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={!isCaregiver}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-brand-300 text-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
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
                placeholder={isCaregiver ? 'Nachricht schreiben…' : 'Nur Lesen'}
                disabled={!isCaregiver}
                className="h-11 min-w-0 flex-1 rounded-full border border-brand-200 px-4 text-base focus:border-brand-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
              />
              <button
                type="submit"
                disabled={!isCaregiver || (!draft.trim() && pendingFiles.length === 0)}
                className="h-11 rounded-full bg-brand-500 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-brand-300"
              >
                Senden
              </button>
            </div>
          </form>
        </div>
      </section>
    );
  }

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
          <div ref={messageBottomRef} />
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
            placeholder={isCaregiver ? 'Nachricht schreiben…' : 'Nur Lesen'}
            disabled={!isCaregiver}
            className="w-full rounded-full border border-brand-200 px-5 py-3 text-sm focus:border-brand-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
          />
          <button
            type="submit"
            disabled={!isCaregiver || (!draft.trim() && pendingFiles.length === 0)}
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
