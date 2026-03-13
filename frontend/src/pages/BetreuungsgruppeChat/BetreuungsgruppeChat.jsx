 import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PaperClipIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext.jsx';
import { assetUrl, readFileAsDataUrl } from '../../utils/file.js';
import { isGroupMember, loadCareGroup, saveCareGroup } from '../../utils/careGroupStorage.js';

function formatDisplayName(profile) {
  if (!profile) return 'Unbekannter Kontakt';
  return [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() || profile.name || 'Kontakt';
}

function formatMessageTime(timestamp) {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function useBodyOverflowHidden(enabled) {
  useEffect(() => {
    if (!enabled) return;

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
    if (typeof window === 'undefined') return;

    const viewport = window.visualViewport;

    const updateInset = () => {
      const innerHeight = window.innerHeight;
      const viewportHeight = viewport?.height ?? innerHeight;
      const viewportOffsetTop = viewport?.offsetTop ?? 0;
      const nextInset = Math.max(0, Math.round(innerHeight - viewportHeight - viewportOffsetTop));
      setKeyboardInset(nextInset);
    };

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
  const messageListRef = useRef(null);
  const messageBottomRef = useRef(null);
  const mobileComposerRef = useRef(null);
  const forceScrollTimerRef = useRef(null);

  const [group, setGroup] = useState(null);
  const [profiles, setProfiles] = useState({});
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sending, setSending] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [composerHeight, setComposerHeight] = useState(84);

  useBodyOverflowHidden(isMobile);
  const keyboardInset = useKeyboardInset();

  const isCaregiver = user?.role === 'caregiver' && group?.caregiverId === user?.id;

  const scrollToLatestMessage = useCallback((behavior = 'auto') => {
    const list = messageListRef.current;
    if (!list) return;

    list.scrollTop = list.scrollHeight;

    if (typeof list.scrollTo === 'function') {
      list.scrollTo({
        top: list.scrollHeight,
        behavior,
      });
    }

    messageBottomRef.current?.scrollIntoView({
      behavior,
      block: 'end',
    });
  }, []);

  const stopForceScroll = useCallback(() => {
    if (forceScrollTimerRef.current) {
      window.clearInterval(forceScrollTimerRef.current);
      forceScrollTimerRef.current = null;
    }
  }, []);

  const forceScrollToBottom = useCallback(() => {
    stopForceScroll();

    let runs = 0;

    const doScroll = () => {
      const list = messageListRef.current;
      if (!list) return;

      list.scrollTop = list.scrollHeight;
      messageBottomRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
      runs += 1;

      if (runs >= 12) {
        stopForceScroll();
      }
    };

    doScroll();
    window.requestAnimationFrame(doScroll);

    forceScrollTimerRef.current = window.setInterval(doScroll, 80);
  }, [stopForceScroll]);

  const scheduleScrollToLatestMessage = useCallback(
    (behavior = 'auto') => {
      scrollToLatestMessage(behavior);

      window.requestAnimationFrame(() => {
        scrollToLatestMessage(behavior);
      });

      window.setTimeout(() => {
        scrollToLatestMessage(behavior);
      }, 120);

      window.setTimeout(() => {
        scrollToLatestMessage(behavior);
      }, 260);
    },
    [scrollToLatestMessage],
  );

  useEffect(() => {
    async function loadGroup() {
      if (!user?.id) return;
      const nextGroup = await loadCareGroup(user.id);
      setGroup(nextGroup);
    }

    loadGroup().catch((error) => console.error(error));
  }, [user?.id]);

  useEffect(() => {
    async function loadProfiles() {
      if (!group) return;

      const ids = [group.caregiverId, ...(group.participantIds ?? [])].filter(Boolean);
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
    if (!isMobile) return;

    const el = mobileComposerRef.current;
    if (!el) return;

    const updateHeight = () => setComposerHeight(el.getBoundingClientRect().height);

    updateHeight();
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(el);

    return () => resizeObserver.disconnect();
  }, [isMobile, pendingFiles.length]);

  useEffect(() => {
    async function loadMessages() {
      if (!group || !user || !isGroupMember(group, user.id)) {
        setLoadingMessages(false);
        return;
      }

      setLoadingMessages(true);
      const conversationId = `caregroup--${group.caregiverId}`;

      try {
        const response = await axios.get(`/api/messages/group/${conversationId}`);
        setMessages(response.data ?? []);
      } catch (error) {
        console.error('Gruppennachrichten konnten nicht geladen werden, fallback auf localStorage', error);
        setMessages(group.messages ?? []);
      } finally {
        setLoadingMessages(false);
      }
    }

    loadMessages().catch((error) => console.error(error));
  }, [group, user]);

  useEffect(() => {
    if (loadingMessages) return;

    const timeoutId = window.setTimeout(() => {
      scheduleScrollToLatestMessage('auto');
      if (isMobile) forceScrollToBottom();
    }, 30);

    return () => window.clearTimeout(timeoutId);
  }, [messages.length, loadingMessages, scheduleScrollToLatestMessage, forceScrollToBottom, isMobile]);

  useEffect(() => {
    if (!isMobile) return;

    const timeoutId = window.setTimeout(() => {
      scheduleScrollToLatestMessage('auto');
      forceScrollToBottom();
    }, 80);

    return () => window.clearTimeout(timeoutId);
  }, [isMobile, keyboardInset, composerHeight, scheduleScrollToLatestMessage, forceScrollToBottom]);

  useEffect(() => {
    return () => {
      stopForceScroll();
    };
  }, [stopForceScroll]);

  const selectedProfiles = useMemo(
    () => (group?.participantIds ?? []).map((id) => profiles[id]).filter(Boolean),
    [group?.participantIds, profiles],
  );

  async function handleAttachmentChange(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    try {
      const prepared = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          size: file.size,
          mimeType: file.type,
          data: await readFileAsDataUrl(file),
        })),
      );

      setPendingFiles((current) => [...current, ...prepared]);
    } catch (error) {
      console.error('Anhänge konnten nicht vorbereitet werden', error);
    } finally {
      if (event.target) event.target.value = '';
    }
  }

  function removePendingFile(index) {
    setPendingFiles((current) => current.filter((_, i) => i !== index));
  }

  async function handleSendMessage(event) {
    event.preventDefault();

    const trimmed = draft.trim();
    const hasAttachments = pendingFiles.length > 0;

    if ((!trimmed && !hasAttachments) || !isCaregiver || !group || sending) {
      return;
    }

    setSending(true);

    try {
      const response = await axios.post(`/api/messages/group/${group.caregiverId}`, {
        participantIds: group.participantIds,
        body: trimmed,
        attachments: pendingFiles.map((file) => ({
          data: file.data,
          name: file.name,
          mimeType: file.mimeType,
          size: file.size,
        })),
      });

      setMessages((current) => [...current, response.data]);
      saveCareGroup({ ...group, updatedAt: new Date().toISOString() });
      setDraft('');
      setPendingFiles([]);

      window.setTimeout(() => {
        scheduleScrollToLatestMessage('smooth');
        if (isMobile) forceScrollToBottom();
      }, 30);
    } catch (error) {
      console.error('Gruppennachricht konnte nicht gesendet werden', error);
    } finally {
      setSending(false);
    }
  }

  if (!user) return null;

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
                onClick={() => navigate('/')}
                className="rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-700"
              >
                ← Zurück
              </button>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold tracking-widest text-brand-500">GRUPPENCHAT</p>
                <h1 className="truncate text-lg font-semibold text-slate-800">{daycareName}</h1>
              </div>

              {isCaregiver ? (
                <button
                  type="button"
                  onClick={() => navigate('/betreuungsgruppe/erstellen')}
                  className="rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-700"
                >
                  Bearbeiten
                </button>
              ) : null}
            </div>
          </header>

          <main
            ref={messageListRef}
            className="mt-3 flex-1 overflow-y-auto px-4"
            style={{
              WebkitOverflowScrolling: 'touch',
              paddingBottom: `${composerHeight + keyboardInset + 8}px`,
            }}
          >
            {loadingMessages ? (
              <p className="text-xs text-slate-500">Nachrichten werden geladen…</p>
            ) : messages.length ? (
              <div className="space-y-3 pb-2">
                {messages.map((message) => {
                  const isOwnMessage = message.senderId === user.id;
                  const senderName = profiles[message.senderId]
                    ? formatDisplayName(profiles[message.senderId])
                    : message.senderLabel || 'Kontakt';

                  return (
                    <div
                      key={message.id}
                      className={`flex flex-col gap-1 ${isOwnMessage ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-500">
                        {isOwnMessage ? 'Du' : senderName}
                      </span>

                      <div
                        className={`max-w-[88%] rounded-2xl px-4 py-2 shadow ${
                          isOwnMessage ? 'bg-brand-600 text-white' : 'bg-brand-100 text-slate-700'
                        }`}
                      >
                        {message.body ? (
                          <p className="whitespace-pre-wrap text-base leading-5">{message.body}</p>
                        ) : null}

                        {Array.isArray(message.attachments) && message.attachments.length ? (
                          <div className="mt-2 flex flex-col gap-2">
                            {message.attachments.map((attachment) => {
                              const url = assetUrl(attachment);
                              const label = attachment.fileName || attachment.name || 'Anhang';
                              const key = attachment.key || attachment.url || `${message.id}-${label}`;

                              return (
                                <div
                                  key={key}
                                  className={`rounded-xl border px-3 py-2 ${
                                    isOwnMessage ? 'border-white/30 bg-white/10' : 'border-brand-100 bg-white'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                                        isOwnMessage ? 'bg-white/10' : 'bg-brand-50'
                                      }`}
                                    >
                                      <PaperClipIcon className="h-5 w-5" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-semibold">{label}</p>
                                      {attachment.size ? (
                                        <p className="text-xs opacity-80">{Math.round(attachment.size / 1024)} KB</p>
                                      ) : null}
                                      {url ? (
                                        <a
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          download
                                          className={`text-xs font-semibold hover:underline ${
                                            isOwnMessage ? 'text-white' : 'text-brand-600'
                                          }`}
                                        >
                                          Herunterladen
                                        </a>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : null}

                        <span
                          className={`mt-1 block text-[10px] ${isOwnMessage ? 'text-white/80' : 'text-slate-500'}`}
                        >
                          {formatMessageTime(message.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messageBottomRef} />
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Noch keine Nachrichten vorhanden. Schreibe die erste Nachricht.
              </p>
            )}
          </main>

          <div
            ref={mobileComposerRef}
            className="fixed inset-x-0 bottom-0 z-10 border-t border-brand-100 bg-white/95 px-3 py-3"
            style={{
              transform: `translateY(-${keyboardInset}px)`,
              willChange: 'transform',
            }}
          >
            <form onSubmit={handleSendMessage}>
              {pendingFiles.length ? (
                <div className="mb-2 flex flex-wrap gap-2">
                  {pendingFiles.map((file, index) => (
                    <span
                      key={`${file.name}-${index}`}
                      className="flex items-center gap-2 rounded-full bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700"
                    >
                      <PaperClipIcon className="h-4 w-4" />
                      <span className="max-w-[180px] truncate">{file.name || 'Anhang'}</span>
                      <button
                        type="button"
                        className="text-slate-400 transition hover:text-rose-600"
                        onClick={() => removePendingFile(index)}
                        aria-label={`${file.name} entfernen`}
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleAttachmentChange}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!isCaregiver || sending}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-brand-200 bg-white text-brand-600 shadow-sm transition hover:border-brand-400 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Anhänge"
                >
                  <PaperClipIcon className="h-6 w-6" />
                </button>

                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onFocus={() => {
                    forceScrollToBottom();
                  }}
                  onClick={() => {
                    forceScrollToBottom();
                  }}
                  onTouchStart={() => {
                    forceScrollToBottom();
                  }}
                  placeholder={isCaregiver ? 'Nachricht schreiben' : 'Nur Lesen'}
                  disabled={!isCaregiver}
                  className="h-12 min-w-0 flex-1 rounded-2xl border border-brand-200 bg-white px-4 text-base leading-5 shadow-sm placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:cursor-not-allowed disabled:bg-slate-100"
                  autoComplete="off"
                  inputMode="text"
                />

                <button
                  type="submit"
                  disabled={sending || !isCaregiver || (!draft.trim() && pendingFiles.length === 0)}
                  className="h-12 rounded-full bg-brand-600 px-5 text-base font-bold text-white shadow-md transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
                >
                  {sending ? 'Senden…' : 'Senden'}
                </button>
              </div>
            </form>
          </div>
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
            {bannerLogoUrl ? (
              <img src={bannerLogoUrl} alt={`${daycareName} Logo`} className="h-full w-full object-cover" />
            ) : (
              <span>Logo</span>
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{daycareName}</p>
            <p className="text-xs text-white/90">
              Teilnehmer: {selectedProfiles.map(formatDisplayName).join(', ') || 'Keine'}
            </p>
          </div>
        </header>

        <div
          ref={messageListRef}
          className="flex min-h-[420px] max-h-[520px] flex-col gap-3 overflow-y-auto rounded-2xl border border-brand-100 bg-slate-50 p-4"
        >
          {messages.map((message) => {
            const isOwnMessage = message.senderId === user.id;
            const senderName = profiles[message.senderId]
              ? formatDisplayName(profiles[message.senderId])
              : message.senderLabel || 'Kontakt';

            return (
              <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[82%]">
                  <p
                    className={`mb-1 text-xs font-semibold uppercase tracking-wide ${
                      isOwnMessage ? 'text-right text-brand-600' : 'text-slate-500'
                    }`}
                  >
                    {isOwnMessage ? 'Du' : senderName}
                  </p>

                  <div
                    className={`rounded-3xl px-4 py-3 shadow ${
                      isOwnMessage ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {message.body ? <p className="whitespace-pre-wrap text-sm">{message.body}</p> : null}

                    {(message.attachments || []).length ? (
                      <ul className="mt-2 space-y-1 text-xs underline">
                        {message.attachments.map((attachment) => (
                          <li key={`${message.id}-${attachment.key || attachment.url}`}>
                            <a href={assetUrl(attachment)} target="_blank" rel="noreferrer">
                              {attachment.fileName || attachment.name || 'Anhang öffnen'}
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

        <form onSubmit={handleSendMessage} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleAttachmentChange}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!isCaregiver || sending}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-brand-300 text-brand-700 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Datei anhängen"
          >
            <PaperClipIcon className="h-6 w-6" />
          </button>

          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={isCaregiver ? 'Nachricht schreiben…' : 'Nur Lesen'}
            disabled={!isCaregiver}
            className="w-full rounded-full border border-brand-200 px-5 py-3 text-sm focus:border-brand-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
          />

          <button
            type="submit"
            disabled={sending || !isCaregiver || (!draft.trim() && pendingFiles.length === 0)}
            className="rounded-full bg-brand-500 px-8 py-3 text-base font-semibold text-white shadow hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
          >
            {sending ? 'Senden…' : 'Senden'}
          </button>
        </form>

        {pendingFiles.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {pendingFiles.map((file, index) => (
              <span
                key={`${file.name}-${index}`}
                className="flex items-center gap-2 rounded-full bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700"
              >
                <PaperClipIcon className="h-4 w-4" />
                <span className="max-w-[180px] truncate">{file.name || 'Anhang'}</span>
                <button
                  type="button"
                  className="text-slate-400 transition hover:text-rose-600"
                  onClick={() => removePendingFile(index)}
                  aria-label={`${file.name} entfernen`}
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default BetreuungsgruppeChat;