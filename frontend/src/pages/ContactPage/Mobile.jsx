// frontend/src/pages/ContactPage/Mobile.jsx
import { useState } from 'react';
import { CheckCircleIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import IconUploadButton from '../../components/IconUploadButton.jsx';

const CONTACT_EMAIL = 'wimmel-welt@info.de';

export default function Mobile() {
  const [copied, setCopied] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [formState, setFormState] = useState({ firstName: '', lastName: '', feedback: '' });

  async function handleCopyEmail() {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Clipboard not available', error);
    }
  }

  function handleUploadChange(event) {
    const file = event.target.files?.[0];
    if (file) {
      setUploadMessage(`"${file.name}" wurde erfolgreich hochgeladen.`);
    } else {
      setUploadMessage('');
    }
  }

  function updateField(field, value) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setUploadMessage((current) => current || 'Vielen Dank! Wir haben deine Nachricht erhalten.');
  }

  return (
    <section className="mx-auto mt-6 flex w-full max-w-md flex-col gap-5 rounded-3xl bg-white/85 p-5 shadow-lg">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Kontakt</p>
        <h1 className="text-2xl font-semibold text-brand-700">Wir freuen uns auf deine Nachricht</h1>
        <p className="text-sm text-slate-600">
          Ob Lob, Ideen oder Verbesserungsvorschläge: Über das Formular erreichst du uns jederzeit. Für dringende Anliegen kannst
          du unsere Kontaktadresse direkt kopieren.
        </p>
      </header>

      <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">E-Mail</p>
            <p className="text-lg font-semibold text-brand-800">{CONTACT_EMAIL}</p>
            <p className="text-xs text-slate-500">Tippe auf den Button, um die Adresse zu kopieren.</p>
          </div>

          <button
            type="button"
            onClick={handleCopyEmail}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-brand-700"
          >
            <DocumentDuplicateIcon className="h-5 w-5" aria-hidden="true" />
            {copied ? 'Kopiert!' : 'E-Mail kopieren'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-3xl border border-brand-100 bg-white/80 p-4">
        <div className="grid gap-4">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Vorname
            <input
              value={formState.firstName}
              onChange={(event) => updateField('firstName', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              placeholder="Max"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Nachname
            <input
              value={formState.lastName}
              onChange={(event) => updateField('lastName', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              placeholder="Mustermann"
            />
          </label>
        </div>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Rezension / Verbesserungsvorschlag
          <textarea
            value={formState.feedback}
            onChange={(event) => updateField('feedback', event.target.value)}
            rows={5}
            className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
            placeholder="Was läuft gut? Wo können wir noch besser werden?"
          />
        </label>

        <div className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          <span>Dateien hochladen (optional)</span>
          <IconUploadButton label="Datei auswählen" onChange={handleUploadChange} />
          <p className="text-xs text-slate-500">Zum Beispiel Screenshots oder PDF-Dateien mit deinen Anmerkungen.</p>
        </div>

        {uploadMessage ? (
          <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircleIcon className="mt-0.5 h-5 w-5" aria-hidden="true" />
            <span>{uploadMessage}</span>
          </div>
        ) : null}

        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-brand-700"
        >
          Nachricht senden
        </button>
      </form>
    </section>
  );
}
