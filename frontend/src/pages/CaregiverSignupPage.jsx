import { useState } from 'react';
import axios from 'axios';
import { readFileAsDataUrl } from '../utils/file.js';

const initialState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  postalCode: '',
  daycareName: '',
  availableSpots: 0,
  hasAvailability: true,
  childrenCount: 0,
  age: '',
  bio: '',
  shortDescription: '',
  username: '',
  password: '',
};

function CaregiverSignupPage() {
  const [formState, setFormState] = useState(initialState);
  const [profileImage, setProfileImage] = useState({ preview: '', dataUrl: null, fileName: '' });
  const [conceptFile, setConceptFile] = useState({ dataUrl: null, fileName: '' });
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function updateField(field, value) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  async function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    setProfileImage({ preview: dataUrl, dataUrl, fileName: file.name });
  }

  async function handleConceptChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    setConceptFile({ dataUrl, fileName: file.name });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);

    try {
      await axios.post('/api/caregivers', {
        ...formState,
        availableSpots: Number(formState.availableSpots),
        hasAvailability: Boolean(formState.hasAvailability),
        childrenCount: Number(formState.childrenCount),
        age: formState.age ? Number(formState.age) : null,
        profileImage: profileImage.dataUrl,
        profileImageName: profileImage.fileName,
        conceptFile: conceptFile.dataUrl,
        conceptFileName: conceptFile.fileName,
      });

      setStatus({ type: 'success', message: 'Dein Profil wurde gespeichert. Wir melden uns bei dir!' });
      setFormState(initialState);
      setProfileImage({   preview: '', dataUrl: null, fileName: '' });
      setConceptFile({ dataUrl: null, fileName: '' });
    } catch (error) {
      console.error(error);
      setStatus({
        type: 'error',
        message: error.response?.data?.message || 'Etwas ist schiefgelaufen. Bitte versuche es später erneut.',
      });
    } finally {
      setSubmitting(false);
    }
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
            Vorname
            <input
              value={formState.firstName}
              onChange={(event) => updateField('firstName', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Nachname
            <input
              value={formState.lastName}
              onChange={(event) => updateField('lastName', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Alter
            <input
              type="number"
              min="18"
              value={formState.age}
              onChange={(event) => updateField('age', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Benutzername
            <input
              value={formState.username}
              onChange={(event) => updateField('username', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Passwort
            <input
              type="password"
              value={formState.password}
              onChange={(event) => updateField('password', event.target.value)}
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
           <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Mobilnummer
            <input
              value={formState.phone}
              onChange={(event) => updateField('phone', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
              required
                 placeholder="z. B. 0151 23456789"
            />
          </label>
        </div>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Name deiner Kindertagespflege
          <input
            value={formState.daycareName}
            onChange={(event) => updateField('daycareName', event.target.value)}
            className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
            required
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Aktuell betreute Kinder
            <input
              type="number"
              min="0"
              value={formState.childrenCount}
              onChange={(event) => updateField('childrenCount', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Freie Plätze
            <input
              type="number"
              min="0"
              value={formState.availableSpots}
              onChange={(event) => updateField('availableSpots', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
              required
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
        <section className="grid gap-4 rounded-2xl border border-brand-100 bg-white/80 p-6">
          <h2 className="text-lg font-semibold text-brand-700">Profilbild und Konzept</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-slate-700">Profilbild (Pflicht)</p>
              <div className="flex items-center gap-4">
                <div className="h-24 w-24 overflow-hidden rounded-full border border-brand-200 bg-brand-50">
                  {profileImage.preview ? (
                    <img src={profileImage.preview} alt="Profilbild" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">Kein Bild</div>
                  )}
                </div>
                <input type="file" accept="image/*" onChange={handleImageChange} required={false} />
                {/* <input type="file" accept="image/*" onChange={handleImageChange} required={!profileImage.dataUrl} /> */}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-slate-700">Konzeption (PDF)</p>
              <input type="file" accept="application/pdf" onChange={handleConceptChange} required={false} />

              {/* <input type="file" accept="application/pdf" onChange={handleConceptChange} required={!conceptFile.dataUrl} /> */}
              {conceptFile.fileName ? (
                <span className="text-xs text-slate-500">Ausgewählt: {conceptFile.fileName}</span>
              ) : (
                <span className="text-xs text-slate-500">Bitte lade dein pädagogisches Konzept als PDF hoch.</span>
              )}
            </div>
          </div>
        </section>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Kurzbeschreibung
          <input
            value={formState.shortDescription}
            onChange={(event) => updateField('shortDescription', event.target.value)}
            className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
            placeholder="Was macht deine Tagespflege besonders?"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Über dich
          <textarea
            value={formState.bio}
            onChange={(event) => updateField('bio', event.target.value)}
            rows={5}
            className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
            placeholder="Erzähle etwas über deine Erfahrung, Schwerpunkte und Tagesabläufe."
          />
        </label>
        <button
          type="submit"
          className="rounded-full bg-brand-600 px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
          disabled={submitting}
        >
          {submitting ? 'Wird gespeichert…' : 'Profil speichern'}
        </button>
        {status ? (
          <p
            className={`rounded-xl border px-4 py-3 text-sm ${status.type === 'success'
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
