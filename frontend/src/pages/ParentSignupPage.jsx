import { useState } from 'react';
import axios from 'axios';

const initialState = {
  name: '',
  email: '',
  phone: '',
  address: '',
  postalCode: '',
  numberOfChildren: 1,
  childrenAges: '',
  notes: '',
};

function ParentSignupPage() {
  const [formState, setFormState] = useState(initialState);
  const [status, setStatus] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await axios.post('/api/parents', {
        ...formState,
        numberOfChildren: Number(formState.numberOfChildren),
      });
      setStatus({ type: 'success', message: 'Vielen Dank! Wir suchen passende Tagespflegepersonen für dich.' });
      setFormState(initialState);
    } catch (error) {
      setStatus({ type: 'error', message: 'Etwas ist schiefgelaufen. Bitte versuche es später erneut.' });
      console.error(error);
    }
  }

  function updateField(field, value) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-8 rounded-3xl bg-white/85 p-10 shadow-lg">
      <header className="text-center">
        <h1 className="text-3xl font-semibold text-brand-700">Familienkonto erstellen</h1>
        <p className="mt-2 text-sm text-slate-600">
          Teile uns mit, wie wir dich erreichen können und welche Betreuung dein Kind benötigt.
        </p>
      </header>
      <form className="grid gap-6" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Vollständiger Name
            <input
              value={formState.name}
              onChange={(event) => updateField('name', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            E-Mail-Adresse
            <input
              type="email"
              value={formState.email}
              onChange={(event) => updateField('email', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Telefonnummer
            <input
              value={formState.phone}
              onChange={(event) => updateField('phone', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Postleitzahl
            <input
              value={formState.postalCode}
              onChange={(event) => updateField('postalCode', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>
        </div>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Adresse (optional)
          <input
            value={formState.address}
            onChange={(event) => updateField('address', event.target.value)}
            className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Anzahl der Kinder
            <input
              type="number"
              min="1"
              value={formState.numberOfChildren}
              onChange={(event) => updateField('numberOfChildren', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Alter der Kinder
            <input
              value={formState.childrenAges}
              onChange={(event) => updateField('childrenAges', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
              placeholder="z. B. 2 Jahre, 5 Jahre"
            />
          </label>
        </div>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Wünsche & Notizen
          <textarea
            value={formState.notes}
            onChange={(event) => updateField('notes', event.target.value)}
            rows={4}
            className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
            placeholder="Gibt es Besonderheiten oder Wünsche, die wir berücksichtigen sollten?"
          />
        </label>
        <button
          type="submit"
          className="rounded-full bg-brand-600 px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand-700"
        >
          Anfrage senden
        </button>
        {status ? (
          <p
            className={`rounded-xl border px-4 py-3 text-sm ${
              status.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            {status.message}
          </p>
        ) : null}
      </form>
    </section>
  );
}

export default ParentSignupPage;
