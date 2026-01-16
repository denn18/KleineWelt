
// frontend/src/pages/MessengerPage/Mobile.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PaperClipIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext.jsx';
import ImageLightbox from '../../components/ImageLightbox.jsx';
import { assetUrl, readFileAsDataUrl } from '../../utils/file.js';

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
    if (!user) return '';
    return [user.id, targetId].sort().join('--');
  }, [user, targetId]);

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
        senderId: user.id,
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
    // ✅ Echter Fullscreen Overlay — bleibt stehen, keine Footer-Sprünge
    <div className="fixed inset-0 z-[90] bg-[#F3F7FF]">
      {/* Top: Brand Header */}
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between">
          <div className="text-[22px] font-extrabold tracking-[0.2px] text-brand-800">Wimmel Welt</div>
        </div>
      </div>

      {/* Messenger Shell */}
      <div className="mt-3 h-[calc(100%-64px)] px-3 pb-[calc(env(safe-area-inset-bottom)+8px)]">
        <div className="relative h-full rounded-[28px] bg-white/85 shadow-[0_18px_40px_rgba(155,185,255,0.25)]">
          {/* Messenger Topbar */}
          <div className="flex items-center gap-3 px-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-700"
            >
              ← Zurück
            </button>

            {/* ✅ NUR der Name, kein Plätze-Label */}
            <div className="min-w-0 flex-1 text-center">
              <div className="text-xs font-bold tracking-widest text-brand-500">MESSENGER</div>
              <div className="text-base font-semibold text-slate-800 break-words">{partnerName || 'Kontakt'}</div>
            </div>

            <div className="w-[88px]" aria-hidden="true" />
          </div>

          {/* Messages List (scrollt intern) */}
          <div
            ref={listRef}
            className="mt-4 h-[calc(100%-88px)] overflow-y-auto px-4"
            style={{
              WebkitOverflowScrolling: 'touch',
              // ✅ Platz schaffen, damit Composer nicht über Messages liegt
              paddingBottom: `${composerHeight + keyboardInset + 16}px`,
            }}
          >
            {loadingMessages ? (
              <p className="text-xs text-slate-500">Nachrichten werden geladen…</p>
            ) : messages.length ? (
              <div className="space-y-3 pb-3">
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
          </div>

          {/* ✅ Composer: wie WhatsApp "sticky" am Bottom und bewegt sich nur über Keyboard */}
          <div
            ref={composerRef}
            className="absolute left-0 right-0 rounded-b-[28px] border-t border-brand-100 bg-white/95 px-3 py-3"
            style={{
              bottom: `calc(env(safe-area-inset-bottom) + 0px)`,
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

                {/* ✅ text-base verhindert iOS Zoom + placeholder wird nicht abgeschnitten */}
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
      </div>

      {lightboxImage ? <ImageLightbox image={lightboxImage} onClose={closeLightbox} /> : null}
    </div>
  );
}

export default Mobile;
// // frontend/src/pages/MessengerPage/Mobile.jsx
// import { useEffect, useMemo, useRef, useState } from 'react';
// import { useLocation, useParams, useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import { PaperClipIcon, XMarkIcon } from '@heroicons/react/24/outline';
// import { useAuth } from '../../context/AuthContext.jsx';
// import ImageLightbox from '../../components/ImageLightbox.jsx';
// import { assetUrl, readFileAsDataUrl } from '../../utils/file.js';
// import { formatAvailableSpotsLabel } from '../../utils/availability.js';

// function formatTime(value) {
//   if (!value) return '';
//   const date = new Date(value);
//   return date.toLocaleString('de-DE', {
//     day: '2-digit',
//     month: '2-digit',
//     hour: '2-digit',
//     minute: '2-digit',
//   });
// }

// function formatPartnerName(profile) {
//   if (!profile) return 'Kontakt';

//   const baseName = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() || profile.name || '';
//   const daycareName = profile.daycareName || '';

//   if (profile.role === 'caregiver') {
//     if (baseName && daycareName) return `${baseName} : ${daycareName}`;
//     return baseName || daycareName || 'Kontakt';
//   }

//   return baseName || 'Kontakt';
// }

// function Mobile() {
//   const { user } = useAuth();
//   const { targetId } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();

//   const [partner, setPartner] = useState(location.state?.partner ?? null);
//   const [messages, setMessages] = useState([]);
//   const [messageBody, setMessageBody] = useState('');
//   const [loadingMessages, setLoadingMessages] = useState(true);
//   const [sending, setSending] = useState(false);
//   const [lightboxImage, setLightboxImage] = useState(null);
//   const [pendingAttachments, setPendingAttachments] = useState([]);
//   const fileInputRef = useRef(null);
//   const messagesRef = useRef(null);

//   const conversationId = useMemo(() => {
//     if (!user) return '';
//     return [user.id, targetId].sort().join('--');
//   }, [user, targetId]);

//   useEffect(() => {
//     async function loadPartner() {
//       if (!partner) {
//         try {
//           console.info('API Log: GET /api/users/:id', targetId);
//           const response = await axios.get(`/api/users/${targetId}`);
//           console.info('API Log: Partnerprofil geladen', targetId);
//           setPartner(response.data);
//         } catch (error) {
//           console.error('Failed to load conversation partner', error);
//         }
//       }
//     }

//     loadPartner().catch((error) => console.error(error));
//   }, [partner, targetId]);

//   useEffect(() => {
//     async function loadMessages() {
//       if (!conversationId) return;
//       setLoadingMessages(true);

//       try {
//         console.info('API Log: GET /api/messages/:conversationId', conversationId);
//         const response = await axios.get(`/api/messages/${conversationId}`);
//         console.info('API Log: Nachrichten geladen', response.data?.length ?? 0);
//         setMessages(response.data);
//       } catch (error) {
//         console.error('Failed to load messages', error);
//       } finally {
//         setLoadingMessages(false);
//       }
//     }

//     loadMessages().catch((error) => console.error(error));
//   }, [conversationId]);

//   useEffect(() => {
//     // Nach neuen Messages automatisch nach unten scrollen (Mobile UX)
//     const el = messagesRef.current;
//     if (!el) return;
//     requestAnimationFrame(() => {
//       el.scrollTop = el.scrollHeight;
//     });
//   }, [messages.length, loadingMessages]);

//   async function handleAttachmentChange(event) {
//     const files = Array.from(event.target.files || []);
//     if (!files.length) return;

//     try {
//       const prepared = await Promise.all(
//         files.map(async (file) => ({
//           name: file.name,
//           size: file.size,
//           mimeType: file.type,
//           data: await readFileAsDataUrl(file),
//         })),
//       );
//       setPendingAttachments((current) => [...current, ...prepared]);
//     } catch (error) {
//       console.error('Failed to prepare attachments', error);
//     } finally {
//       if (event.target) event.target.value = '';
//     }
//   }

//   function removePendingAttachment(index) {
//     setPendingAttachments((current) => current.filter((_, i) => i !== index));
//   }

//   async function handleSendMessage(event) {
//     event.preventDefault();

//     const trimmedBody = messageBody.trim();
//     const hasAttachments = pendingAttachments.length > 0;

//     if ((!trimmedBody && !hasAttachments) || sending) return;

//     setSending(true);
//     try {
//       console.info('API Log: POST /api/messages/:conversationId', conversationId);
//       const response = await axios.post(`/api/messages/${conversationId}`, {
//         senderId: user.id,
//         recipientId: targetId,
//         body: trimmedBody,
//         attachments: pendingAttachments.map((attachment) => ({
//           name: attachment.name,
//           data: attachment.data,
//           mimeType: attachment.mimeType,
//           size: attachment.size,
//         })),
//       });

//       console.info('Messenger Log: Nachricht gesendet', response.data?.id);
//       setMessages((current) => [...current, response.data]);
//       setMessageBody('');
//       setPendingAttachments([]);
//     } catch (error) {
//       console.error('Failed to send message', error);
//     } finally {
//       setSending(false);
//     }
//   }

//   function openLightbox(url, alt = 'Vergrößerte Ansicht') {
//     if (!url) return;
//     setLightboxImage({ url, alt });
//   }

//   function closeLightbox() {
//     setLightboxImage(null);
//   }

//   if (!user) {
//     return null;
//   }

//   const isPartnerCaregiver = partner?.role === 'caregiver';
//   const partnerName = formatPartnerName(partner);

//   const partnerLogoUrl = partner?.logoImageUrl ? assetUrl(partner.logoImageUrl) : '';
//   const partnerProfileUrl = partner?.profileImageUrl ? assetUrl(partner.profileImageUrl) : '';

//   const partnerAddress = partner
//     ? [partner.address, [partner.postalCode, partner.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')
//     : '';

//   const partnerSinceYear = partner?.caregiverSince
//     ? (() => {
//         const date = new Date(partner.caregiverSince);
//         return Number.isNaN(date.valueOf()) ? null : date.getFullYear();
//       })()
//     : null;

//   const partnerExperienceYears = typeof partner?.yearsOfExperience === 'number' ? partner.yearsOfExperience : null;

//   const experienceBadge =
//     partnerExperienceYears !== null
//       ? partnerExperienceYears === 0
//         ? 'Seit diesem Jahr aktiv'
//         : `${partnerExperienceYears} ${partnerExperienceYears === 1 ? 'Jahr' : 'Jahre'} Erfahrung`
//       : partnerSinceYear
//         ? `Seit ${partnerSinceYear} aktiv`
//         : null;

//   const childrenCount = partner ? partner.childrenCount ?? 0 : null;
//   const childrenBadge = childrenCount !== null ? `${childrenCount} betreute Kinder in Betreuung` : null;

//   const availableSpots = partner
//     ? typeof partner.availableSpots === 'number'
//       ? partner.availableSpots
//       : partner.availableSpots ?? 0
//     : null;

//   const availabilityBadge = partner
//     ? formatAvailableSpotsLabel({
//         availableSpots,
//         hasAvailability: partner.hasAvailability,
//         availabilityTiming: partner.availabilityTiming,
//       })
//     : null;

//   const ageBadge = typeof partner?.age === 'number' ? `Alter: ${partner.age} Jahre` : null;
//   const partnerConceptUrl = partner?.conceptUrl ? assetUrl(partner.conceptUrl) : '';

//   return (
//     <section className="mx-auto mt-6 flex w-full max-w-md flex-col gap-4 rounded-3xl bg-white/85 p-5 shadow-lg">
//       {/* Header / Back */}
//       <header className="flex items-center justify-between gap-3">
//         <button
//           type="button"
//           onClick={() => navigate(-1)}
//           className="text-xs font-semibold text-brand-600 transition hover:text-brand-700"
//         >
//           ← Zurück
//         </button>
//         <span className="text-xs text-slate-500 truncate">Gesprächspartner: {partnerName || 'Kontakt'}</span>
//       </header>

//       {erstmal auskommentiert sieht bei der Mobilen Ansicht
//       /* Partner Card
//       <aside className="rounded-3xl border border-brand-100 bg-white/90 p-4 shadow-sm">
//         <h1 className="text-lg font-semibold text-brand-700">{partnerName || 'Nachricht'}</h1>

//         {!partner ? (
//           <p className="mt-2 text-sm text-slate-500">Profilinformationen werden geladen…</p>
//         ) : isPartnerCaregiver ? (
//           <div className="mt-3 flex flex-col gap-3 text-sm text-slate-600">
//             <div className="grid grid-cols-2 gap-3">
//               {partnerLogoUrl ? (
//                 <button
//                   type="button"
//                   onClick={() => openLightbox(partnerLogoUrl, `Logo von ${partnerName}`)}
//                   className="flex h-28 w-full items-center justify-center overflow-hidden rounded-3xl border border-brand-100 bg-brand-50 transition hover:shadow"
//                 >
//                   <img src={partnerLogoUrl} alt={`Logo von ${partnerName}`} className="h-full w-full object-contain" />
//                 </button>
//               ) : (
//                 <div className="flex h-28 w-full items-center justify-center rounded-3xl border border-dashed border-brand-200 bg-brand-50 text-xs font-semibold text-slate-400">
//                   Logo folgt
//                 </div>
//               )}

//               {partnerProfileUrl ? (
//                 <button
//                   type="button"
//                   onClick={() => openLightbox(partnerProfileUrl, partnerName)}
//                   className="h-28 w-full overflow-hidden rounded-3xl border border-brand-100 bg-brand-50 transition hover:shadow"
//                 >
//                   <img src={partnerProfileUrl} alt={partnerName} className="h-full w-full object-cover" />
//                 </button>
//               ) : (
//                 <div className="flex h-28 w-full items-center justify-center rounded-3xl border border-dashed border-brand-200 bg-brand-50 text-xs font-semibold text-slate-400">
//                   Kein Bild
//                 </div>
//               )}
//             </div>

//             <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-brand-700">
//               {partnerAddress ? <span className="rounded-full bg-brand-50 px-3 py-1">Adresse: {partnerAddress}</span> : null}
//               {ageBadge ? <span className="rounded-full bg-brand-50 px-3 py-1">{ageBadge}</span> : null}
//               {childrenBadge ? <span className="rounded-full bg-brand-50 px-3 py-1">{childrenBadge}</span> : null}
//               {availabilityBadge ? (
//                 <span
//                   className={`rounded-full px-3 py-1 ${
//                     partner?.hasAvailability ? 'bg-emerald-50 text-emerald-700' : 'bg-brand-50 text-slate-600'
//                   }`}
//                 >
//                   {availabilityBadge}
//                 </span>
//               ) : null}
//               {experienceBadge ? <span className="rounded-full bg-brand-50 px-3 py-1">{experienceBadge}</span> : null}
//             </div>

//             {partner.shortDescription ? <p className="text-sm">{partner.shortDescription}</p> : null}
//             {partner.bio ? <p className="text-sm leading-relaxed">{partner.bio}</p> : null}

//             {partnerConceptUrl ? (
//               <a
//                 href={partnerConceptUrl}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-200 px-4 py-2 text-xs font-semibold text-brand-600 transition hover:border-brand-400 hover:text-brand-700"
//               >
//                 Konzeption als PDF herunterladen
//               </a>
//             ) : null}
//           </div>
//         ) : (
//           <div className="mt-3 flex flex-col gap-3 text-sm text-slate-600">
//             <div className="flex items-center gap-3">
//               {partnerProfileUrl ? (
//                 <button
//                   type="button"
//                   onClick={() => openLightbox(partnerProfileUrl, partnerName)}
//                   className="h-20 w-20 overflow-hidden rounded-2xl border border-brand-100 bg-brand-50 transition hover:shadow"
//                 >
//                   <img src={partnerProfileUrl} alt={partnerName} className="h-full w-full object-cover" />
//                 </button>
//               ) : (
//                 <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-dashed border-brand-200 bg-brand-50 text-xs font-semibold text-slate-400">
//                   Kein Bild
//                 </div>
//               )}
//               <div className="flex flex-col">
//                 {partner.city ? <p className="text-xs text-slate-500">{partner.city}</p> : null}
//               </div>
//             </div>

//             <p>
//               <span className="font-semibold text-brand-700">E-Mail:</span> {partner.email}
//             </p>
//             {partner.phone ? (
//               <p>
//                 <span className="font-semibold text-brand-700">Telefon:</span> {partner.phone}
//               </p>
//             ) : null}

//             {Array.isArray(partner.children) && partner.children.length ? (
//               <div className="flex flex-col gap-1">
//                 <span className="font-semibold text-brand-700">Kinder:</span>
//                 <ul className="list-disc pl-5">
//                   {partner.children.map((child) => (
//                     <li key={`${child.name}-${child.age}`} className="text-xs text-slate-600">
//                       {child.name} ({child.age})
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             ) : null}

//             {partner.notes ? <p className="text-sm leading-relaxed">{partner.notes}</p> : null}
//           </div>
//         )}
//       </aside> */}

//       {/* Messenger */}
//       <div className="rounded-3xl border border-brand-100 bg-white/90 p-4 shadow-sm">
//         <div className="flex items-center justify-between">
//           <h2 className="text-base font-semibold text-brand-700">Messenger</h2>
//           <span className="text-[11px] text-slate-500">{partnerName || 'Kontakt'}</span>
//         </div>

//         <div
//           ref={messagesRef}
//           className="mt-3 flex max-h-[52vh] flex-col gap-3 overflow-y-auto rounded-2xl border border-brand-100 bg-white p-3 text-sm"
//         >
//           {loadingMessages ? (
//             <p className="text-xs text-slate-500">Nachrichten werden geladen…</p>
//           ) : messages.length ? (
//             messages.map((message) => {
//               const isOwn = message.senderId === user.id;
//               const bubbleClasses = isOwn ? 'bg-brand-600 text-white' : 'bg-brand-50 text-slate-700';
//               const metaClasses = isOwn ? 'text-white/80' : 'text-slate-500';

//               return (
//                 <div key={message.id} className={`flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
//                   <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-500">
//                     {isOwn ? 'Du' : partnerName || message.senderId}
//                   </span>

//                   <div className={`max-w-[88%] rounded-2xl px-4 py-2 ${bubbleClasses}`}>
//                     {message.body ? <p className="whitespace-pre-wrap">{message.body}</p> : null}

//                     {Array.isArray(message.attachments) && message.attachments.length ? (
//                       <div className="mt-2 flex flex-col gap-2">
//                         {message.attachments.map((attachment) => {
//                           const url = assetUrl(attachment);
//                           const isImage = attachment.mimeType?.startsWith('image/');
//                           const label = attachment.fileName || attachment.name || 'Anhang';
//                           const key = attachment.key || attachment.url || label;

//                           const attachmentClasses = isOwn
//                             ? 'border-white/30 bg-white/10'
//                             : 'border-brand-100 bg-white';

//                           return (
//                             <div
//                               key={key}
//                               className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-left ${attachmentClasses}`}
//                             >
//                               {isImage ? (
//                                 <button
//                                   type="button"
//                                   onClick={() => openLightbox(url, label)}
//                                   className="h-14 w-14 overflow-hidden rounded-lg border border-brand-100 bg-brand-50"
//                                 >
//                                   <img src={url} alt={label} className="h-full w-full object-cover" />
//                                 </button>
//                               ) : (
//                                 <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
//                                   <PaperClipIcon className="h-6 w-6" />
//                                 </div>
//                               )}

//                               <div className="flex flex-1 flex-col">
//                                 <span className="text-sm font-semibold">{label}</span>
//                                 {attachment.size ? (
//                                   <span className="text-xs text-slate-500">{Math.round(attachment.size / 1024)} KB</span>
//                                 ) : null}
//                                 {url ? (
//                                   <a
//                                     href={url}
//                                     target="_blank"
//                                     rel="noopener noreferrer"
//                                     download
//                                     className={`text-xs font-semibold ${isOwn ? 'text-white' : 'text-brand-600'} hover:underline`}
//                                   >
//                                     Herunterladen
//                                   </a>
//                                 ) : null}
//                               </div>
//                             </div>
//                           );
//                         })}
//                       </div>
//                     ) : null}

//                     <span className={`mt-1 block text-[10px] ${metaClasses}`}>{formatTime(message.createdAt)}</span>
//                   </div>
//                 </div>
//               );
//             })
//           ) : (
//             <p className="text-xs text-slate-500">Noch keine Nachrichten vorhanden. Schreibe die erste Nachricht.</p>
//           )}
//         </div>

//         {/* Composer */}
//         <form className="mt-3 flex flex-col gap-3" onSubmit={handleSendMessage}>
//           {pendingAttachments.length ? (
//             <div className="flex flex-wrap gap-2">
//               {pendingAttachments.map((attachment, index) => (
//                 <span
//                   key={`${attachment.name}-${index}`}
//                   className="flex items-center gap-2 rounded-full bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700"
//                 >
//                   <PaperClipIcon className="h-4 w-4" />
//                   <span className="max-w-[180px] truncate">{attachment.name || 'Anhang'}</span>
//                   <button
//                     type="button"
//                     className="text-slate-400 transition hover:text-rose-600"
//                     onClick={() => removePendingAttachment(index)}
//                     aria-label={`${attachment.name} entfernen`}
//                   >
//                     <XMarkIcon className="h-4 w-4" />
//                   </button>
//                 </span>
//               ))}
//             </div>
//           ) : null}

//           <div className="flex gap-2">
//             <input type="file" multiple ref={fileInputRef} onChange={handleAttachmentChange} className="hidden" />
//             <button
//               type="button"
//               onClick={() => fileInputRef.current?.click()}
//               className="flex items-center gap-2 rounded-full border border-brand-200 px-4 py-3 text-sm font-semibold text-brand-600 transition hover:border-brand-400 hover:text-brand-700 disabled:cursor-not-allowed"
//               disabled={sending}
//             >
//               <PaperClipIcon className="h-5 w-5" />
//               <span className="hidden xs:inline">Anhänge</span>
//             </button>

//             <input
//               value={messageBody}
//               onChange={(event) => setMessageBody(event.target.value)}
//               placeholder="Nachricht schreiben..."
//               className="flex-1 rounded-full border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
//             />

//             <button
//               type="submit"
//               className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
//               disabled={sending || (!messageBody.trim() && pendingAttachments.length === 0)}
//             >
//               {sending ? 'Senden…' : 'Senden'}
//             </button>
//           </div>
//         </form>
//       </div>

//       {lightboxImage ? <ImageLightbox image={lightboxImage} onClose={closeLightbox} /> : null}
//     </section>
//   );
// }

// export default Mobile;
