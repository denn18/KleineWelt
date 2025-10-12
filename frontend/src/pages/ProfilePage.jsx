import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import { readFileAsDataUrl } from '../utils/file.js';

function useProfileData(user) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const endpoint = user.role === 'caregiver' ? `/api/caregivers/${user.id}` : `/api/parents/${user.id}`;
        const response = await axios.get(endpoint);
        setProfile(response.data);
      } catch (requestError) {
        console.error('Failed to load profile', requestError);
        setError('Profil konnte nicht geladen werden.');
      } finally {
        setLoading(false);
      }
    }

    loadProfile().catch((requestError) => {
      console.error(requestError);
      setError('Profil konnte nicht geladen werden.');
      setLoading(false);
    });
  }, [user]);

  return { profile, loading, error, setProfile };
}

function createChild(initial = {}) {
  return {
    name: initial.name || '',
    age: initial.age || '',
    notes: initial.notes || '',
  };
}

function ChildrenEditor({ childrenList, onChange }) {
  function updateChild(index, field, value) {
    const updated = childrenList.map((child, childIndex) =>
      childIndex === index ? { ...child, [field]: value } : child,
    );
    onChange(updated);
  }

  function addChild() {
    onChange([...childrenList, createChild()]);
  }

  function removeChild(index) {
    if (childrenList.length === 1) {
      onChange([createChild()]);
      return;
    }
    const updated = childrenList.filter((_, childIndex) => childIndex !== index);
    onChange(updated);
  }

  return (
    <div className="flex flex-col gap-4">
      {childrenList.map((child, index) => (
        <div key={index} className="grid gap-4 rounded-2xl border border-brand-100 bg-white/70 p-4 sm:grid-cols-3">
          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
            Name des Kindes
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
  );
}

function ParentProfileEditor({ profile, onSave, saving }) {
  const [formState, setFormState] = useState({
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    email: profile.email || '',
    phone: profile.phone || '',
    address: profile.address || '',
    postalCode: profile.postalCode || '',
    username: profile.username || '',
    childrenAges: profile.childrenAges || '',
    notes: profile.notes || '',
    newPassword: '',
  });
  const [children, setChildren] = useState(() =>
    profile.children?.length ? profile.children.map((child) => createChild(child)) : [createChild()],
  );
  const [imageState, setImageState] = useState({
    preview: profile.profileImageUrl || '',
    fileData: null,
    fileName: '',
    action: 'keep',
  });
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    setFormState({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      email: profile.email || '',
      phone: profile.phone || '',
      address: profile.address || '',
      postalCode: profile.postalCode || '',
      username: profile.username || '',
      childrenAges: profile.childrenAges || '',
      notes: profile.notes || '',
      newPassword: '',
    });
    setChildren(profile.children?.length ? profile.children.map((child) => createChild(child)) : [createChild()]);
    setImageState({
      preview: profile.profileImageUrl || '',
      fileData: null,
      fileName: '',
      action: 'keep',
    });
    setStatusMessage(null);
  }, [profile]);

  function updateField(field, value) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  async function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    setImageState({ preview: dataUrl, fileData: dataUrl, fileName: file.name, action: 'replace' });
  }

  function handleRemoveImage() {
    setImageState({ preview: '', fileData: null, fileName: '', action: 'remove' });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatusMessage(null);

    const payload = {
      firstName: formState.firstName,
      lastName: formState.lastName,
      email: formState.email,
      phone: formState.phone,
      address: formState.address,
      postalCode: formState.postalCode,
      username: formState.username,
      childrenAges: formState.childrenAges,
      notes: formState.notes,
      children,
      numberOfChildren: children.filter((child) => child.name.trim()).length,
    };

    if (formState.newPassword.trim()) {
      payload.password = formState.newPassword.trim();
    }

    if (imageState.action === 'replace') {
      payload.profileImage = imageState.fileData;
      payload.profileImageName = imageState.fileName;
    } else if (imageState.action === 'remove') {
      payload.profileImage = null;
    }

    try {
      await onSave(payload);
      setStatusMessage({ type: 'success', text: 'Profil erfolgreich aktualisiert.' });
      setFormState((current) => ({ ...current, newPassword: '' }));
    } catch (error) {
      const message = error.response?.data?.message || 'Aktualisierung fehlgeschlagen.';
      setStatusMessage({ type: 'error', text: message });
    }
  }

  return (
    <form className="grid gap-6" onSubmit={handleSubmit}>
      <section className="grid gap-4 rounded-3xl bg-white/80 p-6 shadow">
        <h2 className="text-lg font-semibold text-brand-700">Deine Kontaktdaten</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Vorname
            <input
              value={formState.firstName}
              onChange={(event) => updateField('firstName', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Nachname
            <input
              value={formState.lastName}
              onChange={(event) => updateField('lastName', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            E-Mail-Adresse
            <input
              type="email"
              value={formState.email}
              onChange={(event) => updateField('email', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Telefonnummer
            <input
              value={formState.phone}
              onChange={(event) => updateField('phone', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-[2fr,1fr]">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Adresse
            <input
              value={formState.address}
              onChange={(event) => updateField('address', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Postleitzahl
            <input
              value={formState.postalCode}
              onChange={(event) => updateField('postalCode', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
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
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Neues Passwort (optional)
            <input
              type="password"
              value={formState.newPassword}
              onChange={(event) => updateField('newPassword', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              placeholder="Sicheres Passwort wählen"
            />
          </label>
        </div>
      </section>

      <section className="grid gap-4 rounded-3xl bg-white/80 p-6 shadow">
        <h2 className="text-lg font-semibold text-brand-700">Profilbild</h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="h-24 w-24 overflow-hidden rounded-full border border-brand-200 bg-brand-50">
            {imageState.preview ? (
              <img src={imageState.preview} alt="Profilbild" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">Kein Bild</div>
            )}
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <input type="file" accept="image/*" onChange={handleImageChange} />
            {imageState.preview ? (
              <button type="button" onClick={handleRemoveImage} className="self-start text-xs font-semibold text-rose-600 hover:text-rose-700">
                Bild entfernen
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-3xl bg-white/80 p-6 shadow">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-brand-700">Kinder & Alltag</h2>
          <span className="text-xs text-slate-500">Aktuell {children.filter((child) => child.name.trim()).length} Kinder eingetragen</span>
        </div>
        <ChildrenEditor childrenList={children} onChange={setChildren} />
      </section>

      <section className="grid gap-4 rounded-3xl bg-white/80 p-6 shadow">
        <h2 className="text-lg font-semibold text-brand-700">Notizen für Tagespflegepersonen</h2>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Wunschliste & Besonderheiten
          <textarea
            value={formState.notes}
            onChange={(event) => updateField('notes', event.target.value)}
            rows={4}
            className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
            placeholder="Was sollten Tagespflegepersonen über euch wissen?"
          />
        </label>
      </section>

      <div className="flex flex-col gap-3">
        <button
          type="submit"
          className="self-start rounded-full bg-brand-600 px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
          disabled={saving}
        >
          {saving ? 'Speichern…' : 'Profil speichern'}
        </button>
        {statusMessage ? (
          <p
            className={`rounded-xl border px-4 py-3 text-sm ${
              statusMessage.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            {statusMessage.text}
          </p>
        ) : null}
      </div>
    </form>
  );
}

function CaregiverProfileEditor({ profile, onSave, saving }) {
  const [formState, setFormState] = useState({
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    email: profile.email || '',
    phone: profile.phone || '',
    address: profile.address || '',
    postalCode: profile.postalCode || '',
    username: profile.username || '',
    daycareName: profile.daycareName || '',
    availableSpots: profile.availableSpots ?? 0,
    hasAvailability: profile.hasAvailability ?? true,
    childrenCount: profile.childrenCount ?? 0,
    age: profile.age ?? '',
    shortDescription: profile.shortDescription || '',
    bio: profile.bio || '',
    newPassword: '',
  });
  const [imageState, setImageState] = useState({
    preview: profile.profileImageUrl || '',
    fileData: null,
    fileName: '',
    action: 'keep',
  });
  const [conceptState, setConceptState] = useState({
    fileName: '',
    fileData: null,
    action: 'keep',
  });
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    setFormState({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      email: profile.email || '',
      phone: profile.phone || '',
      address: profile.address || '',
      postalCode: profile.postalCode || '',
      username: profile.username || '',
      daycareName: profile.daycareName || '',
      availableSpots: profile.availableSpots ?? 0,
      hasAvailability: profile.hasAvailability ?? true,
      childrenCount: profile.childrenCount ?? 0,
      age: profile.age ?? '',
      shortDescription: profile.shortDescription || '',
      bio: profile.bio || '',
      newPassword: '',
    });
    setImageState({ preview: profile.profileImageUrl || '', fileData: null, fileName: '', action: 'keep' });
    setConceptState({ fileName: '', fileData: null, action: 'keep' });
    setStatusMessage(null);
  }, [profile]);

  function updateField(field, value) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  async function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    setImageState({ preview: dataUrl, fileData: dataUrl, fileName: file.name, action: 'replace' });
  }

  function handleRemoveImage() {
    setImageState({ preview: '', fileData: null, fileName: '', action: 'remove' });
  }

  async function handleConceptChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    setConceptState({ fileName: file.name, fileData: dataUrl, action: 'replace' });
  }

  function handleRemoveConcept() {
    setConceptState({ fileName: '', fileData: null, action: 'remove' });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatusMessage(null);

    const payload = {
      firstName: formState.firstName,
      lastName: formState.lastName,
      email: formState.email,
      phone: formState.phone,
      address: formState.address,
      postalCode: formState.postalCode,
      username: formState.username,
      daycareName: formState.daycareName,
      availableSpots: Number(formState.availableSpots),
      hasAvailability: formState.hasAvailability,
      childrenCount: Number(formState.childrenCount),
      age: formState.age ? Number(formState.age) : undefined,
      shortDescription: formState.shortDescription,
      bio: formState.bio,
    };

    if (formState.newPassword.trim()) {
      payload.password = formState.newPassword.trim();
    }

    if (imageState.action === 'replace') {
      payload.profileImage = imageState.fileData;
      payload.profileImageName = imageState.fileName;
    } else if (imageState.action === 'remove') {
      payload.profileImage = null;
    }

    if (conceptState.action === 'replace') {
      payload.conceptFile = conceptState.fileData;
      payload.conceptFileName = conceptState.fileName;
    } else if (conceptState.action === 'remove') {
      payload.conceptFile = null;
    }

    try {
      await onSave(payload);
      setStatusMessage({ type: 'success', text: 'Profil erfolgreich aktualisiert.' });
      setFormState((current) => ({ ...current, newPassword: '' }));
      setConceptState({ fileName: '', fileData: null, action: 'keep' });
    } catch (error) {
      const message = error.response?.data?.message || 'Aktualisierung fehlgeschlagen.';
      setStatusMessage({ type: 'error', text: message });
    }
  }

  return (
    <form className="grid gap-6" onSubmit={handleSubmit}>
      <section className="grid gap-4 rounded-3xl bg-white/80 p-6 shadow">
        <h2 className="text-lg font-semibold text-brand-700">Basisdaten deiner Kindertagespflege</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Vorname
            <input
              value={formState.firstName}
              onChange={(event) => updateField('firstName', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Nachname
            <input
              value={formState.lastName}
              onChange={(event) => updateField('lastName', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
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
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Name der Kindertagespflege
            <input
              value={formState.daycareName}
              onChange={(event) => updateField('daycareName', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Aktuell betreute Kinder
            <input
              type="number"
              min="0"
              value={formState.childrenCount}
              onChange={(event) => updateField('childrenCount', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Freie Plätze
            <input
              type="number"
              min="0"
              value={formState.availableSpots}
              onChange={(event) => updateField('availableSpots', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Verfügbarkeit
            <select
              value={formState.hasAvailability ? 'true' : 'false'}
              onChange={(event) => updateField('hasAvailability', event.target.value === 'true')}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
            >
              <option value="true">Es gibt freie Plätze</option>
              <option value="false">Aktuell keine freien Plätze</option>
            </select>
          </label>
        </div>
      </section>

      <section className="grid gap-4 rounded-3xl bg-white/80 p-6 shadow">
        <h2 className="text-lg font-semibold text-brand-700">Kontakt und Zugang</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            E-Mail-Adresse
            <input
              type="email"
              value={formState.email}
              onChange={(event) => updateField('email', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Telefonnummer
            <input
              value={formState.phone}
              onChange={(event) => updateField('phone', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-[2fr,1fr]">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Adresse
            <input
              value={formState.address}
              onChange={(event) => updateField('address', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Postleitzahl
            <input
              value={formState.postalCode}
              onChange={(event) => updateField('postalCode', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
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
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Neues Passwort (optional)
            <input
              type="password"
              value={formState.newPassword}
              onChange={(event) => updateField('newPassword', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              placeholder="Sicheres Passwort wählen"
            />
          </label>
        </div>
      </section>

      <section className="grid gap-4 rounded-3xl bg-white/80 p-6 shadow">
        <h2 className="text-lg font-semibold text-brand-700">Profilbild & Konzept</h2>
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex flex-1 flex-col gap-3">
            <p className="text-sm font-medium text-slate-700">Profilbild</p>
            <div className="flex items-center gap-4">
              <div className="h-28 w-28 overflow-hidden rounded-full border border-brand-200 bg-brand-50">
                {imageState.preview ? (
                  <img src={imageState.preview} alt="Profilbild" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">Kein Bild</div>
                )}
              </div>
              <div className="flex flex-col gap-2 text-sm">
                <input type="file" accept="image/*" onChange={handleImageChange} required={!imageState.preview} />
                {imageState.preview ? (
                  <button type="button" onClick={handleRemoveImage} className="self-start text-xs font-semibold text-rose-600 hover:text-rose-700">
                    Bild entfernen
                  </button>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-3">
            <p className="text-sm font-medium text-slate-700">Konzeption (PDF)</p>
            <div className="flex flex-col gap-2 text-sm">
              <input type="file" accept="application/pdf" onChange={handleConceptChange} />
              {profile.conceptUrl ? (
                <a
                  href={profile.conceptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  Aktuelle Konzeption ansehen
                </a>
              ) : (
                <p className="text-xs text-slate-500">Lade eine PDF mit deinem Konzept hoch.</p>
              )}
              {conceptState.action === 'remove' ? (
                <span className="text-xs text-rose-600">Die Konzeption wird nach dem Speichern entfernt.</span>
              ) : null}
              {profile.conceptUrl ? (
                <button type="button" onClick={handleRemoveConcept} className="self-start text-xs font-semibold text-rose-600 hover:text-rose-700">
                  Konzeption entfernen
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-3xl bg-white/80 p-6 shadow">
        <h2 className="text-lg font-semibold text-brand-700">Über dich</h2>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Kurzbeschreibung
          <input
            value={formState.shortDescription}
            onChange={(event) => updateField('shortDescription', event.target.value)}
            className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
            placeholder="Wofür steht deine Kindertagespflege?"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Ausführliche Vorstellung
          <textarea
            value={formState.bio}
            onChange={(event) => updateField('bio', event.target.value)}
            rows={6}
            className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
            placeholder="Erfahrungen, Schwerpunkte und Tagesablauf"
          />
        </label>
      </section>

      <div className="flex flex-col gap-3">
        <button
          type="submit"
          className="self-start rounded-full bg-brand-600 px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
          disabled={saving}
        >
          {saving ? 'Speichern…' : 'Profil speichern'}
        </button>
        {statusMessage ? (
          <p
            className={`rounded-xl border px-4 py-3 text-sm ${
              statusMessage.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            {statusMessage.text}
          </p>
        ) : null}
        <a
          href="/api/documents/membership-invoice"
          className="mt-2 inline-flex w-fit items-center gap-2 rounded-full border border-brand-200 px-4 py-2 text-xs font-semibold text-brand-600 transition hover:border-brand-400 hover:text-brand-700"
        >
          Jahresquittung (60 €) herunterladen
        </a>
      </div>
    </form>
  );
}

function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { profile, loading, error, setProfile } = useProfileData(user);
  const [saving, setSaving] = useState(false);

  const title = useMemo(() => {
    if (user?.role === 'caregiver') {
      return 'Profil für Tagespflegepersonen bearbeiten';
    }
    return 'Familienprofil bearbeiten';
  }, [user]);

  if (!user) {
    return null;
  }

  async function handleSave(payload) {
    setSaving(true);
    try {
      const endpoint = user.role === 'caregiver' ? `/api/caregivers/${user.id}` : `/api/parents/${user.id}`;
      const response = await axios.patch(endpoint, payload);
      setProfile(response.data);
      updateUser(response.data);
      return response.data;
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 rounded-3xl bg-white/85 p-10 shadow-lg">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-brand-700">{title}</h1>
        <p className="text-sm text-slate-600">
          Aktualisiere dein Profil, um Familien und Tagespflegepersonen stets mit den neuesten Informationen zu versorgen.
        </p>
      </header>
      {loading ? (
        <p className="text-sm text-slate-500">Profil wird geladen…</p>
      ) : null}
      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {!loading && profile ? (
        user.role === 'caregiver' ? (
          <CaregiverProfileEditor profile={profile} onSave={handleSave} saving={saving} />
        ) : (
          <ParentProfileEditor profile={profile} onSave={handleSave} saving={saving} />
        )
      ) : null}
    </section>
  );
}

export default ProfilePage;
