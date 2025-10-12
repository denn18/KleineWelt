import { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';

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

  async function handleSendMessage(event) {
    event.preventDefault();
    if (!messageBody.trim() || sending) {
      return;
    }
    setSending(true);
    try {
      const response = await axios.post(`/api/messages/${conversationId}`, {
        senderId: user.id,
        recipientId: targetId,
        body: messageBody,
      });
      setMessages((current) => [...current, response.data]);
      setMessageBody('');
    } catch (error) {
      console.error('Failed to send message', error);
    } finally {
      setSending(false);
    }
  }

  if (!user) {
    return null;
  }

  const isPartnerCaregiver = partner?.role === 'caregiver';
  const partnerName = isPartnerCaregiver
    ? partner.daycareName || `${partner.firstName ?? ''} ${partner.lastName ?? ''}`.trim()
    : partner?.name || `${partner?.firstName ?? ''} ${partner?.lastName ?? ''}`.trim() || 'Kontakt';

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-8 rounded-3xl bg-white/85 p-10 shadow-lg lg:grid-cols-[2fr,3fr]">
      <aside className="flex flex-col gap-4 rounded-3xl border border-brand-100 bg-white/80 p-6 shadow">
        <h1 className="text-2xl font-semibold text-brand-700">{partnerName || 'Nachricht'}</h1>
        {isPartnerCaregiver ? (
          <div className="flex flex-col gap-3 text-sm text-slate-600">
            {partner.profileImageUrl ? (
              <img
                src={partner.profileImageUrl}
                alt={partnerName}
                className="h-32 w-32 rounded-2xl object-cover"
              />
            ) : null}
            <p>
              <span className="font-semibold text-brand-700">Adresse:</span> {partner.address}, {partner.postalCode}
            </p>
            {partner.age ? (
              <p>
                <span className="font-semibold text-brand-700">Alter:</span> {partner.age} Jahre
              </p>
            ) : null}
            <p>
              <span className="font-semibold text-brand-700">Betreute Kinder:</span> {partner.childrenCount ?? 0}
            </p>
            {typeof partner.availableSpots === 'number' ? (
              <p>
                <span className="font-semibold text-brand-700">Freie Plätze:</span> {partner.availableSpots}
              </p>
            ) : null}
            {partner.shortDescription ? <p>{partner.shortDescription}</p> : null}
            {partner.bio ? <p className="text-sm leading-relaxed">{partner.bio}</p> : null}
            {partner.conceptUrl ? (
              <a
                href={partner.conceptUrl}
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
                <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-500">
                  {message.senderId === user.id ? 'Du' : partnerName || message.senderId}
                </span>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.senderId === user.id
                      ? 'bg-brand-600 text-white'
                      : 'bg-brand-50 text-slate-700'
                  }`}
                >
                  <p>{message.body}</p>
                  <span
                    className={`mt-1 block text-[10px] ${
                      message.senderId === user.id ? 'text-white/80' : 'text-slate-500'
                    }`}
                  >
                    {formatTime(message.createdAt)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500">Noch keine Nachrichten vorhanden. Schreibe die erste Nachricht.</p>
          )}
        </div>
        <form className="flex gap-3" onSubmit={handleSendMessage}>
          <input
            value={messageBody}
            onChange={(event) => setMessageBody(event.target.value)}
            placeholder="Nachricht schreiben..."
            className="flex-1 rounded-full border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
            disabled={sending}
          >
            {sending ? 'Senden…' : 'Senden'}
          </button>
        </form>
      </div>
    </section>
  );
}

export default MessengerPage;
