import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import { assetUrl, readFileAsDataUrl } from '../utils/file.js';

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

function createScheduleEntry(initial = {}) {
  return {
    startTime: initial.startTime || '',
    endTime: initial.endTime || '',
    activity: initial.activity || '',
  };
}

const WEEKDAY_SUGGESTIONS = [
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
  'Sonntag',
];

function generateTempId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
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
    mealPlan: profile.mealPlan || '',
    newPassword: '',
  });
  const [careTimes, setCareTimes] = useState(() =>
    profile.careTimes?.length ? profile.careTimes.map((entry) => createScheduleEntry(entry)) : [createScheduleEntry()]
  );
  const [dailySchedule, setDailySchedule] = useState(() =>
    profile.dailySchedule?.length
      ? profile.dailySchedule.map((entry) => createScheduleEntry(entry))
      : [createScheduleEntry()]
  );
  const [closedDays, setClosedDays] = useState(() =>
    Array.isArray(profile.closedDays) ? [...profile.closedDays] : []
  );
  const [closedDayInput, setClosedDayInput] = useState('');
  const [roomGallery, setRoomGallery] = useState(() =>
    (profile.roomImages ?? []).map((url) => ({
      id: url,
      source: url,
      preview: assetUrl(url),
      fileData: null,
      fileName: '',
    }))
  );
  const roomGalleryRef = useRef(null);
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
      mealPlan: profile.mealPlan || '',
      newPassword: '',
    });
    setCareTimes(
      profile.careTimes?.length ? profile.careTimes.map((entry) => createScheduleEntry(entry)) : [createScheduleEntry()]
    );
    setDailySchedule(
      profile.dailySchedule?.length
        ? profile.dailySchedule.map((entry) => createScheduleEntry(entry))
        : [createScheduleEntry()]
    );
    setClosedDays(Array.isArray(profile.closedDays) ? [...profile.closedDays] : []);
    setClosedDayInput('');
    setImageState({ preview: profile.profileImageUrl || '', fileData: null, fileName: '', action: 'keep' });
    setConceptState({ fileName: '', fileData: null, action: 'keep' });
    setRoomGallery(
      (profile.roomImages ?? []).map((url) => ({
        id: url,
        source: url,
        preview: assetUrl(url),
        fileData: null,
        fileName: '',
      }))
    );
    setStatusMessage(null);
  }, [profile]);

  function updateField(field, value) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  function updateScheduleEntry(setter, index, field, value) {
    setter((current) =>
      current.map((entry, entryIndex) => (entryIndex === index ? { ...entry, [field]: value } : entry))
    );
  }

  function addScheduleEntry(setter, defaults = {}) {
    setter((current) => [...current, createScheduleEntry(defaults)]);
  }

  function removeScheduleEntry(setter, index) {
    setter((current) => {
      if (current.length <= 1) {
        return current;
      }
      return current.filter((_, entryIndex) => entryIndex !== index);
    });
  }

  function handleAddCareTime() {
    addScheduleEntry(setCareTimes);
  }

  function handleRemoveCareTime(index) {
    removeScheduleEntry(setCareTimes, index);
  }

  function handleAddDailySchedule() {
    addScheduleEntry(setDailySchedule);
  }

  function handleRemoveDailySchedule(index) {
    removeScheduleEntry(setDailySchedule, index);
  }

  function appendClosedDay(label) {
    const trimmed = label.trim();
    if (!trimmed) {
      return false;
    }
    setClosedDays((current) => {
      if (current.includes(trimmed)) {
        return current;
      }
      return [...current, trimmed];
    });
    return true;
  }

  function handleAddClosedDay() {
    if (appendClosedDay(closedDayInput)) {
      setClosedDayInput('');
    }
  }

  function handleSuggestionClick(day) {
    appendClosedDay(day);
  }

  function handleRemoveClosedDay(day) {
    setClosedDays((current) => current.filter((entry) => entry !== day));
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

  async function handleRoomImagesChange(event) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) {
      return;
    }

    const additions = [];
    for (const file of files) {
      const dataUrl = await readFileAsDataUrl(file);
      if (dataUrl) {
        additions.push({
          id: generateTempId(),
          source: null,
          preview: dataUrl,
          fileData: dataUrl,
          fileName: file.name,
        });
      }
    }

    if (additions.length) {
      setRoomGallery((current) => [...current, ...additions]);
    }
    event.target.value = '';
  }

  function handleRemoveRoomImage(imageId) {
    setRoomGallery((current) => current.filter((image) => image.id !== imageId));
  }

  function scrollRoomGallery(offset) {
    if (!roomGalleryRef.current) {
      return;
    }
    roomGalleryRef.current.scrollBy({ left: offset, behavior: 'smooth' });
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
      mealPlan: formState.mealPlan,
      careTimes,
      dailySchedule,
      closedDays,
      roomImages: roomGallery
        .map((image) =>
          image.fileData ? { dataUrl: image.fileData, fileName: image.fileName } : image.source
        )
        .filter(Boolean),
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
            Plätze verfügbar?
            <select
              value={formState.hasAvailability ? 'yes' : 'no'}
              onChange={(event) => updateField('hasAvailability', event.target.value === 'yes')}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
            >
              <option value="yes">Ja, es sind Plätze frei</option>
              <option value="no">Momentan ausgebucht</option>
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-brand-700">Betreuungszeiten</h2>
            <p className="text-xs text-slate-500">
              Aktualisiere deine Bring- und Abholzeiten inklusive kurzer Aktivitätsbeschreibung.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddCareTime}
            className="rounded-full border border-brand-200 px-4 py-2 text-xs font-semibold text-brand-600 transition hover:border-brand-400 hover:text-brand-700"
          >
            Weiteren Zeitplan hinzufügen
          </button>
        </div>
        <div className="flex flex-col gap-4">
          {careTimes.map((entry, index) => (
            <div key={`care-${index}`} className="grid gap-3 sm:grid-cols-3 sm:items-end">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Von
                <input
                  type="time"
                  value={entry.startTime}
                  onChange={(event) => updateScheduleEntry(setCareTimes, index, 'startTime', event.target.value)}
                  className="rounded-xl border border-brand-200 px-4 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Bis
                <input
                  type="time"
                  value={entry.endTime}
                  onChange={(event) => updateScheduleEntry(setCareTimes, index, 'endTime', event.target.value)}
                  className="rounded-xl border border-brand-200 px-4 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Aktivität
                <input
                  value={entry.activity}
                  onChange={(event) => updateScheduleEntry(setCareTimes, index, 'activity', event.target.value)}
                  className="rounded-xl border border-brand-200 px-4 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
                  placeholder="z. B. Bringzeit"
                />
              </label>
              {careTimes.length > 1 ? (
                <button
                  type="button"
                  onClick={() => handleRemoveCareTime(index)}
                  className="justify-self-start text-xs font-semibold text-rose-600 hover:text-rose-700 sm:col-span-3 sm:justify-self-end"
                >
                  Eintrag entfernen
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 rounded-3xl bg-white/80 p-6 shadow">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-brand-700">Betreuungsfreie Tage</h2>
          <p className="text-xs text-slate-500">
            Hinterlege regelmäßige Wochentage oder besondere Anmerkungen, an denen keine Betreuung stattfindet.
          </p>
        </div>
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              value={closedDayInput}
              onChange={(event) => setClosedDayInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleAddClosedDay();
                }
              }}
              className="flex-1 rounded-xl border border-brand-200 px-4 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              placeholder="z. B. Samstag oder Feiertage"
            />
            <button
              type="button"
              onClick={handleAddClosedDay}
              className="rounded-full border border-brand-200 px-4 py-2 text-xs font-semibold text-brand-600 transition hover:border-brand-400 hover:text-brand-700"
            >
              Tag hinzufügen
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {WEEKDAY_SUGGESTIONS.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => handleSuggestionClick(day)}
                className="rounded-full border border-dashed border-brand-200 px-3 py-1 text-xs font-semibold text-brand-600 transition hover:border-brand-400 hover:text-brand-700"
              >
                {day}
              </button>
            ))}
          </div>
          {closedDays.length ? (
            <ul className="flex flex-wrap gap-2">
              {closedDays.map((day) => (
                <li
                  key={day}
                  className="flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700"
                >
                  <span>{day}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveClosedDay(day)}
                    className="text-[10px] font-semibold text-rose-600 hover:text-rose-700"
                  >
                    Entfernen
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500">Noch keine betreuungsfreien Tage hinterlegt.</p>
          )}
        </div>
      </section>

      <section className="grid gap-4 rounded-3xl bg-white/80 p-6 shadow">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-brand-700">Tagesablauf</h2>
            <p className="text-xs text-slate-500">Beschreibe chronologisch, was die Kinder im Laufe des Tages erwartet.</p>
          </div>
          <button
            type="button"
            onClick={handleAddDailySchedule}
            className="rounded-full border border-brand-200 px-4 py-2 text-xs font-semibold text-brand-600 transition hover:border-brand-400 hover:text-brand-700"
          >
            Weiteren Abschnitt hinzufügen
          </button>
        </div>
        <div className="flex flex-col gap-4">
          {dailySchedule.map((entry, index) => (
            <div key={`daily-${index}`} className="grid gap-3 sm:grid-cols-3 sm:items-end">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Von
                <input
                  type="time"
                  value={entry.startTime}
                  onChange={(event) => updateScheduleEntry(setDailySchedule, index, 'startTime', event.target.value)}
                  className="rounded-xl border border-brand-200 px-4 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Bis
                <input
                  type="time"
                  value={entry.endTime}
                  onChange={(event) => updateScheduleEntry(setDailySchedule, index, 'endTime', event.target.value)}
                  className="rounded-xl border border-brand-200 px-4 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Aktivität
                <input
                  value={entry.activity}
                  onChange={(event) => updateScheduleEntry(setDailySchedule, index, 'activity', event.target.value)}
                  className="rounded-xl border border-brand-200 px-4 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
                  placeholder="z. B. Gemeinsames Frühstück"
                />
              </label>
              {dailySchedule.length > 1 ? (
                <button
                  type="button"
                  onClick={() => handleRemoveDailySchedule(index)}
                  className="justify-self-start text-xs font-semibold text-rose-600 hover:text-rose-700 sm:col-span-3 sm:justify-self-end"
                >
                  Abschnitt entfernen
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-3 rounded-3xl bg-white/80 p-6 shadow">
        <h2 className="text-lg font-semibold text-brand-700">Essensplan</h2>
        <p className="text-xs text-slate-500">Gib Familien einen Überblick darüber, welche Mahlzeiten du anbietest.</p>
        <textarea
          value={formState.mealPlan}
          onChange={(event) => updateField('mealPlan', event.target.value)}
          rows={4}
          className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
          placeholder="Beschreibe Frühstück, Mittagessen und Snacks."
        />
      </section>

      <section className="grid gap-4 rounded-3xl bg-white/80 p-6 shadow">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-brand-700">Räumlichkeiten</h2>
            <p className="text-xs text-slate-500">Lade Bilder hoch, um Familien einen Eindruck deiner Räume zu geben.</p>
          </div>
          {roomGallery.length ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollRoomGallery(-240)}
                className="rounded-full border border-brand-200 px-2 py-1 text-xs font-semibold text-brand-600 transition hover:border-brand-400 hover:text-brand-700"
                aria-label="Räumlichkeiten nach links scrollen"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => scrollRoomGallery(240)}
                className="rounded-full border border-brand-200 px-2 py-1 text-xs font-semibold text-brand-600 transition hover:border-brand-400 hover:text-brand-700"
                aria-label="Räumlichkeiten nach rechts scrollen"
              >
                →
              </button>
            </div>
          ) : null}
        </div>
        <input type="file" accept="image/*" multiple onChange={handleRoomImagesChange} />
        {roomGallery.length ? (
          <div className="relative">
            <div ref={roomGalleryRef} className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
              {roomGallery.map((image) => (
                <div
                  key={image.id}
                  className="relative h-32 w-48 flex-shrink-0 overflow-hidden rounded-2xl border border-brand-100 bg-brand-50"
                >
                  <img src={image.preview} alt="Räumlichkeit" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveRoomImage(image.id)}
                    className="absolute right-2 top-2 rounded-full bg-white/80 px-2 py-1 text-[10px] font-semibold text-rose-600 shadow hover:bg-white"
                  >
                    Entfernen
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500">Noch keine Bilder ausgewählt. Lade Fotos deiner Räume hoch.</p>
        )}
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
            placeholder="Erfahrungen, Schwerpunkte und besondere Momente"
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
