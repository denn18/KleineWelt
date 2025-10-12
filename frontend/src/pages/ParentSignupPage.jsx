import { useState } from 'react';
import axios from 'axios';
import { readFileAsDataUrl } from '../utils/file.js';

function createChild() {
  return { name: '', age: '', notes: '' };
}

const initialState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  postalCode: '',
  username: '',
  password: '',
  notes: '',
};

function ParentSignupPage() {
  const [formState, setFormState] = useState(initialState);
  const [children, setChildren] = useState([createChild()]);
  const [profileImage, setProfileImage] = useState({ preview: '', dataUrl: null, fileName: '' });
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function updateField(field, value) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  function updateChild(index, field, value) {
    setChildren((current) => current.map((child, childIndex) => (childIndex === index ? { ...child, [field]: value } : child)));
  }

  function addChild() {
    setChildren((current) => [...current, createChild()]);
  }

  function removeChild(index) {
    setChildren((current) => {
      if (current.length === 1) {
        return [createChild()];
      }
      return current.filter((_, childIndex) => childIndex !== index);
    });
  }

  async function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    setProfileImage({ preview: dataUrl, dataUrl, fileName: file.name });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);
    try {
      const cleanedChildren = children.map((child) => ({
        name: child.name.trim(),
        age: child.age.trim(),
        notes: child.notes.trim(),
      }));

      await axios.post('/api/parents', {
        ...formState,
        children: cleanedChildren,
        profileImage: profileImage.dataUrl,
        profileImageName: profileImage.fileName,
        childrenAges: cleanedChildren.map((child) => child.age).filter(Boolean).join(', '),
        numberOfChildren: cleanedChildren.filter((child) => child.name).length,
      });

      setStatus({ type: 'success', message: 'Vielen Dank! Wir suchen passende Tagespflegepersonen für dich.' });
      setFormState(initialState);
      setChildren([createChild()]);
      setProfileImage({ preview: '', dataUrl: null, fileName: '' });
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
        <h1 className="text-3xl font-semibold text-brand-700">Familienkonto erstellen</h1>
        <p className="mt-2 text-sm text-slate-600">
          Teile uns mit, wie wir dich erreichen können und welche Betreuung dein Kind benötigt.
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
        <div className="grid gap-4 sm:grid-cols-[2fr,1fr]">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Adresse (optional)
            <input
              value={formState.address}
              onChange={(event) => updateField('address', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
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
        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>
        <section className="grid gap-4 rounded-2xl border border-brand-100 bg-white/80 p-6">
          <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-brand-700">Kinder & Alltag</h2>
              <p className="text-xs text-slate-500">Trage jedes Kind ein und beschreibe kurz den Alltag oder Besonderheiten.</p>
            </div>
            <span className="text-xs font-semibold text-brand-600">
              {children.filter((child) => child.name.trim()).length} Kinder eingetragen
            </span>
          </header>
          <div className="flex flex-col gap-4">
            {children.map((child, index) => (
              <div key={index} className="grid gap-4 rounded-2xl border border-brand-100 bg-white p-4 sm:grid-cols-3">
                <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Name
                  <input
                    value={child.name}
                    onChange={(event) => updateChild(index, 'name', event.target.value)}
                    className="rounded-xl border border-brand-200 px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
                    placeholder="z. B. Emma"
                  />
                </label>
                <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Alter
                  <input
                    value={child.age}
                    onChange={(event) => updateChild(index, 'age', event.target.value)}
                    className="rounded-xl border border-brand-200 px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
                    placeholder="z. B. 3 Jahre"
                  />
                </label>
                <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600 sm:col-span-1">
                  Alltag & Besonderheiten
                  <textarea
                    value={child.notes}
                    onChange={(event) => updateChild(index, 'notes', event.target.value)}
                    rows={2}
                    className="rounded-xl border border-brand-200 px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
                    placeholder="z. B. schläft nach dem Mittag gern"
                  />
                </label>
                <div className="flex items-end justify-end sm:col-span-3">
                  <button
                    type="button"
                    onClick={() => removeChild(index)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                  >
                    Kind entfernen
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addChild}
              className="self-start rounded-full border border-dashed border-brand-300 px-4 py-2 text-xs font-semibold text-brand-600 hover:border-brand-400 hover:text-brand-700"
            >
              Weiteres Kind hinzufügen
            </button>
          </div>
        </section>
        <section className="grid gap-4 rounded-2xl border border-brand-100 bg-white/80 p-6">
          <h2 className="text-lg font-semibold text-brand-700">Profilbild (optional)</h2>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="h-24 w-24 overflow-hidden rounded-full border border-brand-200 bg-brand-50">
              {profileImage.preview ? (
                <img src={profileImage.preview} alt="Profilbild" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">Kein Bild</div>
              )}
            </div>
            <input type="file" accept="image/*" onChange={handleImageChange} />
          </div>
        </section>
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
          className="rounded-full bg-brand-600 px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
          disabled={submitting}
        >
          {submitting ? 'Wird gesendet…' : 'Anfrage senden'}
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
