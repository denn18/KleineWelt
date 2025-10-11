import { useEffect, useState } from 'react';
import axios from 'axios';
import MapView from '../components/MapView.jsx';

function DashboardPage() {
  const [postalCode, setPostalCode] = useState('');
  const [caregivers, setCaregivers] = useState([]);
  const [selectedCaregiver, setSelectedCaregiver] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageBody, setMessageBody] = useState('');

  useEffect(() => {
    async function fetchCaregivers() {
      const response = await axios.get('/api/caregivers', {
        params: postalCode ? { postalCode } : undefined,
      });
      setCaregivers(response.data);
      if (response.data.length) {
        setSelectedCaregiver(response.data[0]);
      }
    }

    fetchCaregivers().catch((error) => {
      console.error(error);
    });
  }, [postalCode]);

  useEffect(() => {
    if (!selectedCaregiver) {
      return;
    }

    async function fetchMessages() {
      const response = await axios.get(`/api/messages/${selectedCaregiver.id}`);
      setMessages(response.data);
    }

    fetchMessages().catch((error) => {
      console.error(error);
    });
  }, [selectedCaregiver]);

  async function handleSendMessage(event) {
    event.preventDefault();
    if (!selectedCaregiver || !messageBody.trim()) {
      return;
    }

    const response = await axios.post(`/api/messages/${selectedCaregiver.id}`, {
      senderId: 'parent-demo',
      body: messageBody,
    });

    setMessages((current) => [...current, response.data]);
    setMessageBody('');
  }

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-brand-700">Familienzentrum</h1>
        <p className="text-sm text-slate-600">
          Verwende die Postleitzahlsuche, um Tagespflegepersonen zu entdecken und direkt mit ihnen zu chatten.
        </p>
      </header>

      <form className="flex flex-col gap-4 rounded-3xl bg-white/80 p-6 shadow md:flex-row md:items-center" onSubmit={(event) => event.preventDefault()}>
        <label className="flex flex-1 flex-col gap-2 text-sm font-medium text-slate-700">
          Postleitzahl suchen
          <input
            value={postalCode}
            onChange={(event) => setPostalCode(event.target.value)}
            placeholder="z. B. 10115"
            className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
          />
        </label>
        <p className="text-xs text-slate-500">Die Liste aktualisiert sich automatisch, sobald du die Postleitzahl eingibst.</p>
      </form>

      <div className="grid gap-6 lg:grid-cols-[2fr,3fr]">
        <div className="flex flex-col gap-4">
          <div className="rounded-3xl bg-white/80 p-6 shadow">
            <h2 className="text-xl font-semibold text-brand-700">Gefundene Tagespflegepersonen</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {caregivers.map((caregiver) => (
                <li key={caregiver.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedCaregiver(caregiver)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition hover:border-brand-300 hover:bg-brand-50 ${
                      selectedCaregiver?.id === caregiver.id
                        ? 'border-brand-400 bg-brand-100/70 text-brand-800'
                        : 'border-brand-100 bg-white text-slate-700'
                    }`}
                  >
                    <p className="font-semibold">{caregiver.daycareName ?? caregiver.name}</p>
                    <p className="text-xs text-slate-500">
                      {caregiver.postalCode} · {caregiver.hasAvailability ? 'Freie Plätze verfügbar' : 'Zurzeit ausgebucht'}
                    </p>
                  </button>
                </li>
              ))}
              {!caregivers.length ? (
                <li className="rounded-2xl border border-dashed border-brand-200 bg-white px-4 py-6 text-sm text-slate-500">
                  Keine Tagespflegepersonen gefunden. Versuche eine andere Postleitzahl oder erstelle ein Profil.
                </li>
              ) : null}
            </ul>
          </div>
          <div className="rounded-3xl bg-white/80 p-6 shadow">
            <h2 className="text-xl font-semibold text-brand-700">Live-Karte</h2>
            <p className="mb-4 text-xs text-slate-500">
              Die Karte zeigt dir eine Vorschau der Tagespflegepersonen in deiner Nähe. Für eine genaue Positionierung kannst du
              später API-Schlüssel für deinen Lieblingskartenanbieter hinterlegen.
            </p>
            <MapView caregivers={caregivers} />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-3xl bg-white/80 p-6 shadow">
            <h2 className="text-xl font-semibold text-brand-700">Messenger</h2>
            <p className="text-xs text-slate-500">
              Schreibe eine Nachricht an {selectedCaregiver?.daycareName ?? 'eine ausgewählte Tagespflegeperson'}.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex max-h-72 flex-col gap-2 overflow-y-auto rounded-2xl border border-brand-100 bg-white p-4 text-sm">
                {messages.length ? (
                  messages.map((message) => (
                    <div key={message.id} className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-brand-500">{message.senderId}</span>
                      <p className="rounded-xl bg-brand-50 px-4 py-2 text-slate-700">{message.body}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">
                    Noch keine Nachrichten. Stelle dich kurz vor und frage nach einem Kennenlerntermin.
                  </p>
                )}
              </div>
              <form className="flex gap-2" onSubmit={handleSendMessage}>
                <input
                  value={messageBody}
                  onChange={(event) => setMessageBody(event.target.value)}
                  placeholder="Nachricht schreiben..."
                  className="flex-1 rounded-full border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-full bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand-700"
                >
                  Senden
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DashboardPage;
