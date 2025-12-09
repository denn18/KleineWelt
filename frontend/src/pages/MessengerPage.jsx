import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import { PaperClipIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext.jsx';
import ImageLightbox from '../components/ImageLightbox.jsx';
import { assetUrl, readFileAsDataUrl } from '../utils/file.js';
import { formatAvailableSpotsLabel } from '../utils/availability.js';

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

function MessengerPage() {
  const { user } = useAuth();
  const { targetId } = useParams();
  const location = useLocation();
  const [partner, setPartner] = useState(location.state?.partner ?? null);
  const [messages, setMessages] = useState([]);
  const [messageBody, setMessageBody] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sending, setSending] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const fileInputRef = useRef(null);

  const conversationId = useMemo(() => {
    if (!user) {
      return '';
    }
    return [user.id, targetId].sort().join('--');
  }, [user, targetId]);

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

  useEffect(() => {
    async function loadMessages() {
      if (!conversationId) {
        return;
      }
      setLoadingMessages(true);
      try {
        const response = await axios.get(`/api/messages/${conversationId}`);
        setMessages(response.data);
      } catch (error) {
        console.error('Failed to load messages', error);
      } finally {
        setLoadingMessages(false);
      }
    }

    loadMessages().catch((error) => console.error(error));
  }, [conversationId]);

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

  const isPartnerCaregiver = partner?.role === 'caregiver';
  const partnerName = isPartnerCaregiver
    ? partner.daycareName || `${partner.firstName ?? ''} ${partner.lastName ?? ''}`.trim()
    : partner?.name || `${partner?.firstName ?? ''} ${partner?.lastName ?? ''}`.trim() || 'Kontakt';
  const partnerLogoUrl = partner?.logoImageUrl ? assetUrl(partner.logoImageUrl) : '';
  const partnerProfileUrl = partner?.profileImageUrl ? assetUrl(partner.profileImageUrl) : '';
  const partnerAddress = partner
    ? [partner.address, [partner.postalCode, partner.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')
    : '';
  const partnerSinceYear = partner?.caregiverSince
    ? (() => {
        const date = new Date(partner.caregiverSince);
        return Number.isNaN(date.valueOf()) ? null : date.getFullYear();
      })()
    : null;
  const partnerExperienceYears = typeof partner?.yearsOfExperience === 'number' ? partner.yearsOfExperience : null;
  const experienceBadge = partnerExperienceYears !== null
    ? partnerExperienceYears === 0
      ? 'Seit diesem Jahr aktiv'
      : `${partnerExperienceYears} ${partnerExperienceYears === 1 ? 'Jahr' : 'Jahre'} Erfahrung`
    : partnerSinceYear
      ? `Seit ${partnerSinceYear} aktiv`
      : null;
  const childrenCount = partner ? partner.childrenCount ?? 0 : null;
  const childrenBadge = childrenCount !== null ? `${childrenCount} betreute Kinder in Betreuung` : null;
  const availableSpots = partner
    ? typeof partner.availableSpots === 'number'
      ? partner.availableSpots
      : partner.availableSpots ?? 0
    : null;
  const availabilityBadge = availableSpots !== null ? formatAvailableSpotsLabel(availableSpots) : null;
  const ageBadge = typeof partner?.age === 'number' ? `Alter: ${partner.age} Jahre` : null;
  const partnerConceptUrl = partner?.conceptUrl ? assetUrl(partner.conceptUrl) : '';

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-8 rounded-3xl bg-white/85 p-10 shadow-lg lg:grid-cols-[2fr,3fr]">
      <aside className="flex flex-col gap-4 rounded-3xl border border-brand-100 bg-white/80 p-6 shadow">
        <h1 className="text-2xl font-semibold text-brand-700">{partnerName || 'Nachricht'}</h1>
        {isPartnerCaregiver ? (
          <div className="flex flex-col gap-4 text-sm text-slate-600">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
              {partnerLogoUrl ? (
                <button
                  type="button"
                  onClick={() => openLightbox(partnerLogoUrl, `Logo von ${partnerName}`)}
                  className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-3xl border border-brand-100 bg-brand-50 transition hover:shadow-lg"
                >
                  <img src={partnerLogoUrl} alt={`Logo von ${partnerName}`} className="h-full w-full object-contain" />
                </button>
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-3xl border border-dashed border-brand-200 bg-brand-50 text-xs font-semibold text-slate-400">
                  Logo folgt
                </div>
              )}  
              {partnerProfileUrl ? (
                <button
                  type="button"
                  onClick={() => openLightbox(partnerProfileUrl, partnerName)}
                  className="h-32 w-32 overflow-hidden rounded-3xl border border-brand-100 bg-brand-50 transition hover:shadow-lg"
                >
                  <img src={partnerProfileUrl} alt={partnerName} className="h-full w-full object-cover" />
                </button>
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-3xl border border-dashed border-brand-200 bg-brand-50 text-xs font-semibold text-slate-400">
                  Kein Bild
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-brand-700">
              {partnerAddress ? (
                <span className="rounded-full bg-brand-50 px-3 py-1">Adresse: {partnerAddress}</span>
              ) : null}
              {ageBadge ? <span className="rounded-full bg-brand-50 px-3 py-1">{ageBadge}</span> : null}
              {childrenBadge ? <span className="rounded-full bg-brand-50 px-3 py-1">{childrenBadge}</span> : null}
              {availabilityBadge ? (
                <span
                  className={`rounded-full px-3 py-1 ${availableSpots > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-brand-50'}`}
                >
                  {availabilityBadge}
                </span>
              ) : null}
              {experienceBadge ? (
                <span className="rounded-full bg-brand-50 px-3 py-1">{experienceBadge}</span>
              ) : null}
            </div>
            {partner.shortDescription ? <p>{partner.shortDescription}</p> : null}
            {partner.bio ? <p className="text-sm leading-relaxed">{partner.bio}</p> : null}
            {partnerConceptUrl ? (
              <a
                href={partnerConceptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-200 px-4 py-2 text-xs font-semibold text-brand-600 transition hover:border-brand-400 hover:text-brand-700"
              >
                Konzeption als PDF herunterladen
              </a>
            ) : null}
          </div>
        ) : partner ? (
          <div className="flex flex-col gap-3 text-sm text-slate-600">
            <div className="flex items-center gap-3">
              {partnerProfileUrl ? (
                <button
                  type="button"
                  onClick={() => openLightbox(partnerProfileUrl, partnerName)}
                  className="h-24 w-24 overflow-hidden rounded-2xl border border-brand-100 bg-brand-50 transition hover:shadow-lg"
                >
                  <img src={partnerProfileUrl} alt={partnerName} className="h-full w-full object-cover" />
                </button>
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-dashed border-brand-200 bg-brand-50 text-xs font-semibold text-slate-400">
                  Kein Bild
                </div>
              )}
              <div className="flex flex-col">
                {/* doppelter Name sieht nicht so gut aus
                <p className="text-base font-semibold text-brand-700">{partnerName}</p> */}
                {partner.city ? <p className="text-xs text-slate-500">{partner.city}</p> : null}
              </div>
            </div>
            <p>
              <span className="font-semibold text-brand-700">E-Mail:</span> {partner.email}
            </p>
            {partner.phone ? (
              <p>
                <span className="font-semibold text-brand-700">Telefon:</span> {partner.phone}
              </p>
            ) : null}
            {Array.isArray(partner.children) && partner.children.length ? (
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-brand-700">Kinder:</span>
                <ul className="list-disc pl-5">
                  {partner.children.map((child) => (
                    <li key={`${child.name}-${child.age}`} className="text-xs text-slate-600">
                      {child.name} ({child.age})
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {partner.notes ? <p className="text-sm leading-relaxed">{partner.notes}</p> : null}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Profilinformationen werden geladen…</p>
        )}
      </aside>

      <div className="flex flex-col gap-4 rounded-3xl border border-brand-100 bg-white/80 p-6 shadow">
        <header className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-brand-700">Messenger</h2>
          <span className="text-xs text-slate-500">Gesprächspartner: {partnerName || 'Kontakt'}</span>
        </header>
        <div className="flex max-h-[480px] flex-col gap-3 overflow-y-auto rounded-2xl border border-brand-100 bg-white p-4 text-sm">
          {loadingMessages ? (
            <p className="text-xs text-slate-500">Nachrichten werden geladen…</p>
          ) : messages.length ? (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col gap-1 ${message.senderId === user.id ? 'items-end' : 'items-start'}`}
              >
                {(() => {
                  const isOwn = message.senderId === user.id;
                  const bubbleClasses = isOwn
                    ? 'bg-brand-600 text-white'
                    : 'bg-brand-50 text-slate-700';
                  const metaClasses = isOwn ? 'text-white/80' : 'text-slate-500';
                  return (
                    <>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-500">
                        {isOwn ? 'Du' : partnerName || message.senderId}
                      </span>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${bubbleClasses}`}>
                        {message.body ? <p className="whitespace-pre-wrap">{message.body}</p> : null}
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
                                  <div className="flex flex-1 flex-col text-sm">
                                    <span className="font-semibold">{label}</span>
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
                        <span className={`mt-1 block text-[10px] ${metaClasses}`}>
                          {formatTime(message.createdAt)}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500">Noch keine Nachrichten vorhanden. Schreibe die erste Nachricht.</p>
          )}
        </div>
        <form className="flex flex-col gap-3" onSubmit={handleSendMessage}>
          {pendingAttachments.length ? (
            <div className="flex flex-wrap gap-2">
              {pendingAttachments.map((attachment, index) => (
                <span
                  key={`${attachment.name}-${index}`}
                  className="flex items-center gap-2 rounded-full bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700"
                >
                  <PaperClipIcon className="h-4 w-4" />
                  <span className="max-w-[160px] truncate">{attachment.name || 'Anhang'}</span>
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
          <div className="flex gap-3">
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleAttachmentChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-full border border-brand-200 px-4 py-3 text-sm font-semibold text-brand-600 transition hover:border-brand-400 hover:text-brand-700 disabled:cursor-not-allowed"
              disabled={sending}
            >
              <PaperClipIcon className="h-5 w-5" /> Anhänge
            </button>
            <input
              value={messageBody}
              onChange={(event) => setMessageBody(event.target.value)}
              placeholder="Nachricht schreiben..."
              className="flex-1 rounded-full border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
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

export default MessengerPage;
