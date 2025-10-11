import { useState } from 'react';
import axios from 'axios';

const initialState = {
  name: '',
  email: '',
  phone: '',
  address: '',
  postalCode: '',
  daycareName: '',
  availableSpots: 0,
  hasAvailability: true,
  bio: '',
};

function CaregiverSignupPage() {
  const [formState, setFormState] = useState(initialState);
  const [status, setStatus] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await axios.post('/api/caregivers', {
        ...formState,
        availableSpots: Number(formState.availableSpots),
        hasAvailability: Boolean(formState.hasAvailability),
      });
      setStatus({ type: 'success', message: 'Dein Profil wurde gespeichert. Wir melden uns bei dir!' });
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
        <h1 className="text-3xl font-semibold text-brand-700">Profil für Tagespflegepersonen</h1>
        <p className="mt-2 text-sm text-slate-600">
          Erzähl Familien, welche Betreuung du anbietest und wo sie dich finden können.
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
            Name deiner Kindertagespflege
            <input
              value={formState.daycareName}
              onChange={(event) => updateField('daycareName', event.target.value)}
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
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
            Adresse
            <input
              value={formState.address}
              onChange={(event) => updateField('address', event.target.value)}
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
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Freie Plätze
            <input
              type="number"
              min="0"
              value={formState.availableSpots}
              onChange={(event) => updateField('availableSpots', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Verfügbarkeit
            <select
              value={formState.hasAvailability ? 'true' : 'false'}
              onChange={(event) => updateField('hasAvailability', event.target.value === 'true')}
              className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
            >
              <option value="true">Es gibt freie Plätze</option>
              <option value="false">Aktuell keine freien Plätze</option>
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Über dich
          <textarea
            value={formState.bio}
            onChange={(event) => updateField('bio', event.target.value)}
            rows={4}
            className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
            placeholder="Erzähle etwas über deine Erfahrung, Schwerpunkte und Tagesabläufe."
          />
        </label>
        <button
          type="submit"
          className="rounded-full bg-brand-600 px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand-700"
        >
          Profil speichern
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

export default CaregiverSignupPage;
