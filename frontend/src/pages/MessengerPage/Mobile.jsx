import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { PaperClipIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext.jsx';
import ImageLightbox from '../../components/ImageLightbox.jsx';
import { assetUrl, readFileAsDataUrl } from '../../utils/file.js';

function formatTime(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  return date.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPartnerName(profile) {
  if (!profile) {
    return 'Kontakt';
  }

  const baseName = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() || profile.name || '';
  const daycareName = profile.daycareName || '';

  if (profile.role === 'caregiver') {
    if (baseName && daycareName) {
      return `${baseName} : ${daycareName}`;
    }
    return baseName || daycareName || 'Kontakt';
  }

  return baseName || 'Kontakt';
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

function Mobile() {
  const { user } = useAuth();
  const { targetId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [partner, setPartner] = useState(location.state?.partner ?? null);
  const [messages, setMessages] = useState([]);
  const [messageBody, setMessageBody] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sending, setSending] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [composerHeight, setComposerHeight] = useState(92);

  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);
  const composerRef = useRef(null);

  useBodyOverflowHidden(true);
  const keyboardInset = useKeyboardInset();

  useEffect(() => {
    const composerElement = composerRef.current;
    if (!composerElement) {
      return undefined;
    }

    const updateHeight = () => setComposerHeight(composerElement.getBoundingClientRect().height);
    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(composerElement);

    return () => resizeObserver.disconnect();
  }, []);

  const conversationId = useMemo(() => {
    if (location.state?.conversationId) {
      return location.state.conversationId;
    }

    if (!user) {
      return '';
    }

    return [user.id, targetId].sort().join('--');
  }, [location.state, user, targetId]);

  useEffect(() => {
    async function loadPartner() {
      if (!partner) {
        try {
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
    if (!conversationId) {
      return;
    }

    setLoadingMessages(true);
    try {
      const response = await axios.get(`/api/messages/${conversationId}`);
      setMessages(response.data ?? []);
    } catch (error) {
      console.error('Failed to load messages', error);
    } finally {
      setLoadingMessages(false);
    }
  }, [conversationId]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (loadingMessages) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
    }, 30);

    return () => window.clearTimeout(timeoutId);
  }, [loadingMessages, messages.length]);

  async function handleAttachmentChange(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      return;
    }

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
      if (event.target) {
        event.target.value = '';
      }
    }
  }

  function removePendingAttachment(index) {
    setPendingAttachments((current) => current.filter((_, i) => i !== index));
  }

  async function handleSendMessage(event) {
    event.preventDefault();

    const trimmedBody = messageBody.trim();
    const hasAttachments = pendingAttachments.length > 0;

    if ((!trimmedBody && !hasAttachments) || sending) {
      return;
    }

    setSending(true);
    try {
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
    } catch (error) {
      console.error('Failed to send message', error);
    } finally {
      setSending(false);
    }
  }

  function openLightbox(url, alt = 'Vergrößerte Ansicht') {
    if (!url) {
      return;
    }
    setLightboxImage({ url, alt });
  }

  function closeLightbox() {
    setLightboxImage(null);
  }

  if (!user) {
    return null;
  }

  const partnerName = formatPartnerName(partner);

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
              <p className="text-xs font-bold tracking-widest text-brand-500">MESSENGER</p>
              <h1 className="truncate text-lg font-semibold text-slate-800">{partnerName || 'Kontakt'}</h1>
            </div>
          </div>
        </header>

        <main
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
                const bubbleClasses = isOwn ? 'bg-brand-600 text-white' : 'bg-brand-50 text-slate-700';
                const metaClasses = isOwn ? 'text-white/80' : 'text-slate-500';

                return (
                  <div key={message.id} className={`flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-500">
                      {isOwn ? 'Du' : partnerName || message.senderId}
                    </span>

                    <div className={`max-w-[88%] rounded-2xl px-4 py-2 ${bubbleClasses}`}>
                      {message.body ? <p className="whitespace-pre-wrap text-base leading-6">{message.body}</p> : null}

                      {Array.isArray(message.attachments) && message.attachments.length ? (
                        <div className="mt-2 flex flex-col gap-2">
                          {message.attachments.map((attachment) => {
                            const url = assetUrl(attachment);
                            const isImage = attachment.mimeType?.startsWith('image/');
                            const label = attachment.fileName || attachment.name || 'Anhang';
                            const key = attachment.key || attachment.url || label;
                            const attachmentClasses = isOwn ? 'border-white/30 bg-white/10' : 'border-brand-100 bg-white';

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

                                <div className="flex flex-1 flex-col text-sm">
                                  <span className="font-semibold">{label}</span>
                                  {attachment.size ? (
                                    <span className="text-xs text-slate-500">{Math.round(attachment.size / 1024)} KB</span>
                                  ) : null}
                                  {url ? (
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      download
                                      className={`text-xs font-semibold ${isOwn ? 'text-white' : 'text-brand-600'} hover:underline`}
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

        <form
          ref={composerRef}
          onSubmit={handleSendMessage}
          className="fixed inset-x-0 bottom-0 z-10 border-t border-brand-100 bg-white px-3 py-2"
          style={{ transform: `translateY(-${keyboardInset}px)` }}
        >
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
              className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-200 bg-white text-brand-600 shadow-sm transition hover:border-brand-400 hover:text-brand-700 disabled:cursor-not-allowed"
              disabled={sending}
              aria-label="Anhänge"
            >
              <PaperClipIcon className="h-6 w-6" />
            </button>
            <input
              value={messageBody}
              onChange={(event) => setMessageBody(event.target.value)}
              placeholder="Nachricht schreiben…"
              className="h-11 min-w-0 flex-1 rounded-full border border-brand-200 px-4 text-base focus:border-brand-400 focus:outline-none"
            />
            <button
              type="submit"
              className="h-11 rounded-full bg-brand-600 px-5 text-sm font-semibold text-white shadow-md transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
              disabled={sending || (!messageBody.trim() && pendingAttachments.length === 0)}
            >
              {sending ? 'Senden…' : 'Senden'}
            </button>
          </div>
        </form>
      </div>

      {lightboxImage ? <ImageLightbox image={lightboxImage} onClose={closeLightbox} /> : null}
    </section>
  );
}

export default Mobile;
