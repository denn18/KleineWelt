import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import IconUploadButton from '../components/IconUploadButton.jsx';
import { readFileAsDataUrl } from '../utils/file.js';

function createChild() {
  return { name: '', age: '', gender: '', notes: '' };
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
  const navigate = useNavigate();
  const { login } = useAuth();

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
        gender: child.gender || '',
        notes: child.notes.trim(),
      }));

      const response = await axios.post('/api/parents', {
        ...formState,
        children: cleanedChildren,
        profileImage: profileImage.dataUrl,
        profileImageName: profileImage.fileName,
        childrenAges: cleanedChildren.map((child) => child.age).filter(Boolean).join(', '),
        numberOfChildren: cleanedChildren.filter((child) => child.name).length,
      });

      const credentials = {
        identifier: formState.username || formState.email,
        password: formState.password,
      };

      setStatus({
        type: 'success',
        message: 'Registrierung erfolgreich! Wir melden uns mit passenden Tagespflegepersonen.',
      });

      try {
        await login(credentials.identifier, credentials.password);
        setStatus({
          type: 'success',
          message: 'Registrierung erfolgreich! Du wirst jetzt zum Familienzentrum weitergeleitet.',
        });
        setTimeout(() => {
          navigate('/familienzentrum', {
            replace: true,
            state: { fromRegistration: true, role: response.data?.role || 'parent' },
          });
        }, 1200);
      } catch (authError) {
        console.warn('Automatischer Login nach Registrierung nicht möglich', authError);
        setStatus({
          type: 'success',
          message: 'Registrierung erfolgreich! Bitte melde dich jetzt mit deinen Zugangsdaten an.',
        });
      }

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
            <span className="flex items-center gap-1">
              Vorname
              <span className="text-rose-500" aria-hidden="true">*</span>
              <span className="sr-only">Pflichtfeld</span>
            </span>
            <input
              value={formState.firstName}
              onChange={(event) => updateField('firstName', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
              required
              aria-required="true"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <span className="flex items-center gap-1">
              Nachname
              <span className="text-rose-500" aria-hidden="true">*</span>
              <span className="sr-only">Pflichtfeld</span>
            </span>
            <input
              value={formState.lastName}
              onChange={(event) => updateField('lastName', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
              required
              aria-required="true"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <span className="flex items-center gap-1">
              E-Mail-Adresse
              <span className="text-rose-500" aria-hidden="true">*</span>
              <span className="sr-only">Pflichtfeld</span>
            </span>
            <input
              type="email"
              value={formState.email}
              onChange={(event) => updateField('email', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
              required
              aria-required="true"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <span className="flex items-center gap-1">
              Telefonnummer
              <span className="text-rose-500" aria-hidden="true">*</span>
              <span className="sr-only">Pflichtfeld</span>
            </span>
            <input
              value={formState.phone}
              onChange={(event) => updateField('phone', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
              required
              aria-required="true"
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
            <span className="flex items-center gap-1">
              Postleitzahl
              <span className="text-rose-500" aria-hidden="true">*</span>
              <span className="sr-only">Pflichtfeld</span>
            </span>
            <input
              value={formState.postalCode}
              onChange={(event) => updateField('postalCode', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
              required
              aria-required="true"
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <span className="flex items-center gap-1">
              Benutzername
              <span className="text-rose-500" aria-hidden="true">*</span>
              <span className="sr-only">Pflichtfeld</span>
            </span>
            <input
              value={formState.username}
              onChange={(event) => updateField('username', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
              required
              aria-required="true"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <span className="flex items-center gap-1">
              Passwort
              <span className="text-rose-500" aria-hidden="true">*</span>
              <span className="sr-only">Pflichtfeld</span>
            </span>
            <input
              type="password"
              value={formState.password}
              onChange={(event) => updateField('password', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
              required
              aria-required="true"
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
              <div key={index} className="grid gap-4 rounded-2xl border border-brand-100 bg-white p-4 sm:grid-cols-4">
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
                <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Geschlecht
                  <select
                    value={child.gender}
                    onChange={(event) => updateChild(index, 'gender', event.target.value)}
                    className="rounded-xl border border-brand-200 px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
                  >
                    <option value="">Bitte auswählen</option>
                    <option value="female">Weiblich</option>
                    <option value="male">Männlich</option>
                    <option value="diverse">Divers</option>
                  </select>
                </label>
                <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600 sm:col-span-2">
                  Alltag & Besonderheiten
                  <textarea
                    value={child.notes}
                    onChange={(event) => updateChild(index, 'notes', event.target.value)}
                    rows={2}
                    className="rounded-xl border border-brand-200 px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
                    placeholder="z. B. schläft nach dem Mittag gern"
                  />
                </label>
                <div className="flex items-end justify-end sm:col-span-4">
                  <button
                    type="button"
                    onClick={() => removeChild(index)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                  >
                    Eintrag entfernen
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
          <h2 className="text-lg font-semibold text-brand-700">Foto von dir (optional)</h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <div className="h-24 w-24 overflow-hidden rounded-full border border-brand-200 bg-brand-50">
              {profileImage.preview ? (
                <img src={profileImage.preview} alt="Profilbild" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">Kein Bild</div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <IconUploadButton label="Bild auswählen" accept="image/*" onChange={handleImageChange} />
              <span className="text-xs text-slate-500">
                {profileImage.fileName ? `Ausgewählt: ${profileImage.fileName}` : 'Optional: Ein freundliches Foto hilft bei der Vermittlung.'}
              </span>
            </div>
          </div>
        </section>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Wünsche & Notizen
          <textarea
            value={formState.notes}
            onChange={(event) => updateField('notes', event.target.value)}
            rows={4}
            className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
            placeholder="Gibt es Besonderheiten oder Wünsche, die wir berücksichtigen sollten, zb. Allergene etc?"
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
