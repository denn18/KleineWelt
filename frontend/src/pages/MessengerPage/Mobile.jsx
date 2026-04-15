


// frontend/src/pages/MessengerPage/Mobile.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PaperClipIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext.jsx';
import ImageLightbox from '../../components/ImageLightbox.jsx';
import { assetUrl, readFileAsDataUrl } from '../../utils/file.js';
import { getOrCreateSocket } from '../../realtime/socketClient.js';

function formatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPartnerName(profile) {
  if (!profile) return 'Kontakt';

  const baseName = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() || profile.name || '';
  const daycareName = profile.daycareName || '';

  if (profile.role === 'caregiver') {
    if (baseName && daycareName) return `${baseName} : ${daycareName}`;
    return baseName || daycareName || 'Kontakt';
  }

  return baseName || 'Kontakt';
}

/**
 * ✅ Keyboard inset über visualViewport (iOS)
 * -> wir bewegen NUR den Composer nach oben (wie WhatsApp),
 *    die Seite selbst bleibt "stehen".
 */
function useKeyboardInset() {
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const vv = window.visualViewport;

    const update = () => {
      const innerH = window.innerHeight;
      const vvH = vv?.height ?? innerH;
      const vvOffsetTop = vv?.offsetTop ?? 0;
      const inset = Math.max(0, Math.round(innerH - vvH - vvOffsetTop));
      setKeyboardInset(inset);
    };

    update();

    if (vv) {
      vv.addEventListener('resize', update);
      vv.addEventListener('scroll', update);
      return () => {
        vv.removeEventListener('resize', update);
        vv.removeEventListener('scroll', update);
      };
    }

    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return keyboardInset;
}

/**
 * ✅ Verhindert Body-Scroll/Jump auf iOS, ohne "position:fixed" (das kann Layouts verschieben)
 * Wir sperren nur das Scrollen im Body – der Messenger scrollt intern.
 */
function useBodyOverflowHidden(enabled) {
  useEffect(() => {
    if (!enabled) return;

    const html = document.documentElement;
    const body = document.body;

    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevOverscroll = body.style.overscrollBehavior;

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.overscrollBehavior = prevOverscroll;
    };
  }, [enabled]);
}

function Mobile() {
  const { user } = useAuth();
  const { targetId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Body nicht scrollen lassen (Footer etc. bleibt unsichtbar)
  useBodyOverflowHidden(true);

  const keyboardInset = useKeyboardInset();

  const [partner, setPartner] = useState(location.state?.partner ?? null);
  const [messages, setMessages] = useState([]);
  const [messageBody, setMessageBody] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sending, setSending] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [pendingAttachments, setPendingAttachments] = useState([]);

  const fileInputRef = useRef(null);
  const listRef = useRef(null);
  const bottomRef = useRef(null);
  const composerRef = useRef(null);
  const [composerHeight, setComposerHeight] = useState(84);

  // ✅ Messe Composer-Höhe (damit Messages unten nicht verdeckt werden)
  useEffect(() => {
    const el = composerRef.current;
    if (!el) return;

    const update = () => setComposerHeight(el.getBoundingClientRect().height);

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  const conversationId = useMemo(() => {
    if (location.state?.conversationId) return location.state.conversationId;
    if (!user) return '';
    return [user.id, targetId].sort().join('--');
  }, [location.state, user, targetId]);

  useEffect(() => {
    async function loadPartner() {
      if (!partner) {
        try {
          console.info('API Log: GET /api/users/:id', targetId);
          const response = await axios.get(`/api/users/${targetId}`);
          setPartner(response.data);
        } catch (error) {
          console.error('Failed to load conversation partner', error);
        }
      }
    }
    loadPartner().catch((error) => console.error(error));
  }, [partner, targetId]);

  const loadMessages = useCallback(async () => {
    if (!conversationId) return;
    setLoadingMessages(true);

    try {
      console.info('API Log: GET /api/messages/:conversationId', conversationId);
      const response = await axios.get(`/api/messages/${conversationId}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to load messages', error);
    } finally {
      setLoadingMessages(false);
    }
  }, [conversationId]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  // ✅ Nach Laden/Update immer nach unten (wie vorher)
  useEffect(() => {
    if (loadingMessages) return;
    const t = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
    }, 30);
    return () => clearTimeout(t);
  }, [messages.length, loadingMessages]);


  useEffect(() => {
    if (!user?.token || !conversationId) {
      return undefined;
    }

    const socket = getOrCreateSocket(user.token);
    if (!socket) {
      return undefined;
    }

    const handleNewMessage = (incomingMessage) => {
      if (incomingMessage?.conversationId !== conversationId) {
        return;
      }

      setMessages((current) =>
        current.some((message) => message.id === incomingMessage.id)
          ? current
          : [...current, incomingMessage],
      );
    };

    socket.emit('messenger:join-conversation', { conversationId });
    socket.on('messenger:new-message', handleNewMessage);

    return () => {
      socket.emit('messenger:leave-conversation', { conversationId });
      socket.off('messenger:new-message', handleNewMessage);
    };
  }, [conversationId, user?.token]);

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
      setPendingAttachments((current) => [...current, ...prepared]);
    } catch (error) {
      console.error('Failed to prepare attachments', error);
    } finally {
      if (event.target) event.target.value = '';
    }
  }

  function removePendingAttachment(index) {
    setPendingAttachments((current) => current.filter((_, i) => i !== index));
  }

  async function handleSendMessage(event) {
    event.preventDefault();

    const trimmedBody = messageBody.trim();
    const hasAttachments = pendingAttachments.length > 0;

    if ((!trimmedBody && !hasAttachments) || sending) return;

    setSending(true);
    try {
      console.info('API Log: POST /api/messages/:conversationId', conversationId);
      const response = await axios.post(`/api/messages/${conversationId}`, {
        recipientId: targetId,
        body: trimmedBody,
        attachments: pendingAttachments.map((attachment) => ({
          name: attachment.name,
          data: attachment.data,
          mimeType: attachment.mimeType,
          size: attachment.size,
        })),
      });

      setMessages((current) => [...current, response.data]);
      setMessageBody('');
      setPendingAttachments([]);

      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 30);
    } catch (error) {
      console.error('Failed to send message', error);
    } finally {
      setSending(false);
    }
  }

  function openLightbox(url, alt = 'Vergrößerte Ansicht') {
    if (!url) return;
    setLightboxImage({ url, alt });
  }

  function closeLightbox() {
    setLightboxImage(null);
  }

  if (!user) return null;

  const partnerName = formatPartnerName(partner);

  return (
    <div className="fixed inset-0 z-[90] bg-[#F3F7FF]">
      <div className="flex h-full flex-col pb-[env(safe-area-inset-bottom)]">
        {/* Messenger Topbar */}
        <header className="px-4 pt-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-700"
            >
              ← Zurück
            </button>

            <div className="min-w-0 flex-1 text-center">
              <div className="text-xs font-bold tracking-widest text-brand-500">MESSENGER</div>
              <div className="truncate text-base font-semibold text-slate-800">{partnerName || 'Kontakt'}</div>
            </div>

            <div className="w-[88px]" aria-hidden="true" />
          </div>
        </header>

        {/* Messages List (vollflächig, scrollt intern) */}
        <main
          ref={listRef}
          className="mt-3 flex-1 overflow-y-auto px-4"
          style={{
            WebkitOverflowScrolling: 'touch',
            paddingBottom: `${composerHeight + keyboardInset + 16}px`,
          }}
        >
          {loadingMessages ? (
            <p className="text-xs text-slate-500">Nachrichten werden geladen…</p>
          ) : messages.length ? (
            <div className="space-y-3 pb-4">
              {messages.map((message) => {
                const isOwn = message.senderId === user.id;
                const bubbleClasses = isOwn
                  ? 'bg-brand-600 text-white'
                  : 'bg-brand-100 text-slate-700';
                const metaClasses = isOwn ? 'text-white/80' : 'text-slate-500';

                return (
                  <div key={message.id} className={`flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-500">
                      {isOwn ? 'Du' : partnerName || message.senderId}
                    </span>

                    <div className={`max-w-[88%] rounded-2xl px-4 py-2 shadow ${bubbleClasses}`}>
                      {message.body ? <p className="whitespace-pre-wrap text-base leading-5">{message.body}</p> : null}

                      {Array.isArray(message.attachments) && message.attachments.length ? (
                        <div className="mt-2 flex flex-col gap-2">
                          {message.attachments.map((attachment) => {
                            const url = assetUrl(attachment);
                            const isImage = attachment.mimeType?.startsWith('image/');
                            const label = attachment.fileName || attachment.name || 'Anhang';
                            const key = attachment.key || attachment.url || label;

                            const attachmentClasses = isOwn
                              ? 'border-white/30 bg-white/10'
                              : 'border-brand-100 bg-white';

                            return (
                              <div
                                key={key}
                                className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-left ${attachmentClasses}`}
                              >
                                {isImage ? (
                                  <button
                                    type="button"
                                    onClick={() => openLightbox(url, label)}
                                    className="h-14 w-14 overflow-hidden rounded-lg border border-brand-100 bg-brand-50"
                                  >
                                    <img src={url} alt={label} className="h-full w-full object-cover" />
                                  </button>
                                ) : (
                                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                                    <PaperClipIcon className="h-6 w-6" />
                                  </div>
                                )}

                                <div className="flex flex-1 flex-col">
                                  <span className="text-sm font-semibold">{label}</span>
                                  {attachment.size ? (
                                    <span className="text-xs text-slate-500">
                                      {Math.round(attachment.size / 1024)} KB
                                    </span>
                                  ) : null}
                                  {url ? (
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      download
                                      className={`text-xs font-semibold ${
                                        isOwn ? 'text-white' : 'text-brand-600'
                                      } hover:underline`}
                                    >
                                      Herunterladen
                                    </a>
                                  ) : null}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}

                      <span className={`mt-1 block text-[10px] ${metaClasses}`}>{formatTime(message.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          ) : (
            <p className="text-xs text-slate-500">Noch keine Nachrichten vorhanden. Schreibe die erste Nachricht.</p>
          )}
        </main>

        {/* Composer vollflächig unten */}
        <div
          ref={composerRef}
          className="fixed inset-x-0 bottom-0 z-10 border-t border-brand-100 bg-white/95 px-3 py-3"
          style={{
            transform: `translateY(-${keyboardInset}px)`,
            willChange: 'transform',
          }}
        >
          <form onSubmit={handleSendMessage}>
            {pendingAttachments.length ? (
              <div className="mb-2 flex flex-wrap gap-2">
                {pendingAttachments.map((attachment, index) => (
                  <span
                    key={`${attachment.name}-${index}`}
                    className="flex items-center gap-2 rounded-full bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700"
                  >
                    <PaperClipIcon className="h-4 w-4" />
                    <span className="max-w-[180px] truncate">{attachment.name || 'Anhang'}</span>
                    <button
                      type="button"
                      className="text-slate-400 transition hover:text-rose-600"
                      onClick={() => removePendingAttachment(index)}
                      aria-label={`${attachment.name} entfernen`}
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              <input type="file" multiple ref={fileInputRef} onChange={handleAttachmentChange} className="hidden" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-brand-200 bg-white text-brand-600 shadow-sm transition hover:border-brand-400 hover:text-brand-700 disabled:cursor-not-allowed"
                disabled={sending}
                aria-label="Anhänge"
              >
                <PaperClipIcon className="h-6 w-6" />
              </button>

              <input
                value={messageBody}
                onChange={(event) => setMessageBody(event.target.value)}
                placeholder="Nachricht schreiben"
                className="h-12 min-w-0 flex-1 rounded-2xl border border-brand-200 bg-white px-4 text-base leading-5 shadow-sm placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
                autoComplete="off"
                inputMode="text"
              />

              <button
                type="submit"
                className="h-12 rounded-full bg-brand-600 px-5 text-base font-bold text-white shadow-md transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
                disabled={sending || (!messageBody.trim() && pendingAttachments.length === 0)}
              >
                {sending ? 'Senden…' : 'Senden'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {lightboxImage ? <ImageLightbox image={lightboxImage} onClose={closeLightbox} /> : null}
    </div>
  );
}

export default Mobile;
