import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import IconUploadButton from '../components/IconUploadButton.jsx';
import { assetUrl, readFileAsDataUrl } from '../utils/file.js';
import { AVAILABILITY_TIMING_OPTIONS } from '../utils/availability.js';
import { WEEKDAY_SUGGESTIONS } from '../utils/weekdays.js';
import {
  fetchVapidPublicKey,
  getActivePushSubscription,
  getNotificationPermission,
  isPushSupported,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
} from '../utils/pushNotifications.js';

function useProfileData(user) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userId = user?.id;
  const userRole = user?.role;

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      if (!userId) {
        setProfile(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const endpoint = userRole === 'caregiver' ? `/api/caregivers/${userId}` : `/api/parents/${userId}`;
        const response = await axios.get(endpoint);
        if (active) setProfile(response.data);
      } catch (requestError) {
        if (active) {
          console.error('Failed to load profile', requestError);
          setError('Profil konnte nicht geladen werden.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadProfile();
    return () => { active = false; };
  }, [userId, userRole]);

  return { profile, loading, error, setProfile };
}

function createChild(initial = {}) {
  return {
    name: initial.name || '',
    age: initial.age || '',
    gender: initial.gender || '',
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

function generateTempId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isEmailNotificationsEnabled(profile) {
  return profile?.emailNotificationsEnabled !== false;
}

function buildRoomGalleryItem(imageRef) {
  if (!imageRef) return null;

  const preview = assetUrl(imageRef);
  const idSource = typeof imageRef === 'string' ? imageRef : imageRef.key || imageRef.url;
  return {
    id: idSource || generateTempId(),
    source: imageRef,
    preview,
    fileData: null,
    fileName: '',
  };
}

function buildContractDocumentItem(document) {
  if (!document) return null;

  const fileRef = document.file ?? document.fileRef ?? document.document ?? null;
  const idSource = fileRef?.key || fileRef?.url || document.id;
  return {
    id: idSource || generateTempId(),
    name: document.name || '',
    file: fileRef || null,
    fileData: null,
    fileName: fileRef?.fileName || '',
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
    <div className="flex flex-col gap-3 md:gap-4">
      {childrenList.map((child, index) => (
        <div key={index} className="grid gap-3 rounded-2xl border border-brand-100 bg-white/80 p-4 shadow-sm md:grid-cols-4 md:gap-4 md:bg-white/70 md:shadow-none">
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
          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
            Geschlecht
            <select
              value={child.gender}
              onChange={(event) => updateChild(index, 'gender', event.target.value)}
              className="rounded-xl border border-brand-200 px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
            >
              <option value="">Nicht angegeben</option>
              <option value="female">Weiblich</option>
              <option value="male">Männlich</option>
              <option value="diverse">Divers</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600 md:col-span-1">
            Alltag & Besonderheiten
            <textarea
              value={child.notes}
              onChange={(event) => updateChild(index, 'notes', event.target.value)}
              rows={3}
              className="rounded-xl border border-brand-200 px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none md:h-[58px]"
              placeholder="z. B. schläft nach dem Mittag gern"
            />
          </label>
          <div className="contents md:flex md:items-end md:justify-end md:col-span-4">
            <button
              type="button"
              onClick={() => removeChild(index)}
              className="self-start text-xs font-semibold text-rose-600 hover:text-rose-700"
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
  );
}

function ScheduleEditor({ title, mobileDescription, desktopDescription, addLabel, removeLabel, placeholder, entries, onChange }) {
  function updateEntry(index, field, value) {
    onChange(entries.map((entry, entryIndex) => entryIndex === index ? { ...entry, [field]: value } : entry));
  }
  function addEntry() { onChange([...entries, createScheduleEntry()]); }
  function removeEntry(index) { if (entries.length > 1) onChange(entries.filter((_, entryIndex) => entryIndex !== index)); }
  return (
    <section className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-3xl bg-white/85 p-5 shadow md:grid-cols-none md:bg-white/80 md:p-6">
      <div className="contents md:flex md:items-center md:justify-between md:gap-2">
        <div className="contents md:block">
          <h2 className="text-base font-semibold text-brand-700 md:text-lg">{title}</h2>
          <p className="hidden text-xs text-slate-500 md:block">{desktopDescription}</p>
        </div>
        <button type="button" onClick={addEntry} className="order-3 -mt-1 justify-self-start self-start rounded-full border border-brand-200 px-4 py-2 text-xs font-semibold text-brand-600 hover:border-brand-400 hover:text-brand-700 md:order-none md:mt-0 md:justify-self-auto md:self-auto md:transition">
          <span className="md:hidden">Weiteren Eintrag hinzufügen</span><span className="hidden md:inline">{addLabel}</span>
        </button>
      </div>
      <div className="flex flex-col gap-3 md:gap-4">
        <p className="text-xs text-slate-500 md:hidden">{mobileDescription}</p>
        <div className="flex flex-col gap-3 md:contents">
          {entries.map((entry, index) => (
            <div key={index} className="grid gap-3 rounded-2xl border border-brand-100 bg-white/70 p-4 md:grid-cols-3 md:items-end md:rounded-none md:border-0 md:bg-transparent md:p-0">
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600 md:text-sm md:font-medium md:normal-case md:tracking-normal md:text-slate-700">
                Von
                <input type="time" value={entry.startTime} onChange={(event) => updateEntry(index, 'startTime', event.target.value)} className="rounded-xl border border-brand-200 px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none md:px-4" />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600 md:text-sm md:font-medium md:normal-case md:tracking-normal md:text-slate-700">
                Bis
                <input type="time" value={entry.endTime} onChange={(event) => updateEntry(index, 'endTime', event.target.value)} className="rounded-xl border border-brand-200 px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none md:px-4" />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600 md:text-sm md:font-medium md:normal-case md:tracking-normal md:text-slate-700">
                Aktivität
                <input value={entry.activity} onChange={(event) => updateEntry(index, 'activity', event.target.value)} className="rounded-xl border border-brand-200 px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none md:px-4" placeholder={placeholder} />
              </label>
              {entries.length > 1 ? <button type="button" onClick={() => removeEntry(index)} className="justify-self-start self-start text-xs font-semibold text-rose-600 hover:text-rose-700 md:col-span-3 md:justify-self-end md:self-auto"><span className="md:hidden">Eintrag entfernen</span><span className="hidden md:inline">{removeLabel}</span></button> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ParentProfileEditor({ profile, onSave, saving, onDeleteProfile, deleting }) {
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
    emailNotificationsEnabled: isEmailNotificationsEnabled(profile),
    newPassword: '',
  });
  const [children, setChildren] = useState(() =>
    profile.children?.length ? profile.children.map((child) => createChild(child)) : [createChild()],
  );
  const [imageState, setImageState] = useState({
    preview: profile.profileImageUrl ? assetUrl(profile.profileImageUrl) : '',
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
      emailNotificationsEnabled: isEmailNotificationsEnabled(profile),
      newPassword: '',
    });
    setChildren(profile.children?.length ? profile.children.map((child) => createChild(child)) : [createChild()]);
    setImageState({
      preview: profile.profileImageUrl ? assetUrl(profile.profileImageUrl) : '',
      fileData: null,
      fileName: '',
      action: 'keep',
    });
    setStatusMessage((current) => (current?.type === 'success' ? current : null));
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
    event.target.value = '';
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
      emailNotificationsEnabled: formState.emailNotificationsEnabled,
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
    <form className="flex flex-col gap-4 md:grid md:gap-6" onSubmit={handleSubmit}>
      <section className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-3xl bg-white/85 p-5 shadow md:grid-cols-none md:gap-4 md:bg-white/80 md:p-6">
        <h2 className="text-base font-semibold text-brand-700 md:text-lg">Deine Kontaktdaten</h2>
        <div className="grid gap-3 md:contents">
        <div className="contents md:grid md:gap-4 md:grid-cols-2">
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
        <div className="contents md:grid md:gap-4 md:grid-cols-[2fr,1fr]">
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
        <div className="contents md:grid md:gap-4 md:grid-cols-2">
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
        </div>
      </section>

      <section className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-3xl bg-white/85 p-5 shadow md:grid-cols-none md:gap-4 md:bg-white/80 md:p-6">
        <h2 className="text-base font-semibold text-brand-700 md:text-lg">Profilbild</h2>
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 md:h-24 md:w-24 overflow-hidden rounded-full border border-brand-200 bg-brand-50">
            {imageState.preview ? (
              <img src={imageState.preview} alt="Profilbild" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">Kein Bild</div>
            )}
          </div>
          <div className="flex flex-col gap-1 text-sm">
            <IconUploadButton label="Foto auswählen" accept="image/*" onChange={handleImageChange} />
            <span className="text-xs text-slate-500">
              {imageState.fileName
                ? `Ausgewählt: ${imageState.fileName}`
                : (<><span className="md:hidden">Optional: Hilft bei der Wiedererkennung.</span><span className="hidden md:inline">Optional: Hilf Betreuungspersonen, dich schneller zu erkennen.</span></>)}
            </span>
            {imageState.preview ? (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="self-start text-xs font-semibold text-rose-600 hover:text-rose-700"
              >
                Bild entfernen
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-3xl bg-white/85 p-5 shadow md:grid-cols-none md:gap-4 md:bg-white/80 md:p-6">
        <div className="flex items-center justify-between gap-3 md:gap-0">
          <h2 className="text-base font-semibold text-brand-700 md:text-lg">Kinder & Alltag</h2>
          <span className="text-xs text-slate-500"><span className="md:hidden">{children.filter((child) => child.name.trim()).length} eingetragen</span><span className="hidden md:inline">Aktuell {children.filter((child) => child.name.trim()).length} Kinder eingetragen</span></span>
        </div>
        <ChildrenEditor childrenList={children} onChange={setChildren} />
      </section>

      <section className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-3xl bg-white/85 p-5 shadow md:grid-cols-none md:gap-4 md:bg-white/80 md:p-6">
        <h2 className="text-base font-semibold text-brand-700 md:text-lg">Notizen für Tagespflegepersonen</h2>
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
        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
          <button
            type="submit"
            className="w-full rounded-2xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300 md:w-auto md:self-start md:rounded-full md:px-8 md:duration-200 md:hover:-translate-y-0.5 md:hover:shadow-lg"
            disabled={saving || deleting}
          >
            {saving ? 'Speichern…' : 'Profil speichern'}
          </button>
          <button
            type="button"
            onClick={onDeleteProfile}
            className="w-full rounded-2xl border border-rose-300 px-6 py-3 text-sm font-semibold text-rose-700 transition hover:border-rose-500 hover:text-rose-800 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto md:self-start md:rounded-full md:px-8"
            disabled={saving || deleting}
          >
            {deleting ? 'Profil wird gelöscht…' : 'Profil löschen'}
          </button>
        </div>
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

function CaregiverProfileEditor({ profile, onSave, saving, onDeleteProfile, deleting }) {
  const [formState, setFormState] = useState({
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    email: profile.email || '',
    phone: profile.phone || '',
    address: profile.address || '',
    postalCode: profile.postalCode || '',
    city: profile.city || '',
    username: profile.username || '',
    daycareName: profile.daycareName || '',
    availableSpots: profile.availableSpots ?? 0,
    hasAvailability: profile.hasAvailability ?? true,
    availabilityTiming: profile.availabilityTiming ?? 'aktuell',
    childrenCount: profile.childrenCount ?? 0,
    maxChildAge: profile.maxChildAge ?? '',
    birthDate: profile.birthDate ? profile.birthDate.slice(0, 10) : '',
    caregiverSince: profile.caregiverSince ? profile.caregiverSince.slice(0, 7) : '',
    shortDescription: profile.shortDescription || '',
    bio: profile.bio || '',
    mealPlan: profile.mealPlan || '',
    emailNotificationsEnabled: isEmailNotificationsEnabled(profile),
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
    (profile.roomImages ?? [])
      .map((imageRef) => buildRoomGalleryItem(imageRef))
      .filter(Boolean)
  );
  const [roomGalleryOffset, setRoomGalleryOffset] = useState(0);
  const [imageState, setImageState] = useState({
    preview: profile.profileImageUrl ? assetUrl(profile.profileImageUrl) : '',
    fileData: null,
    fileName: '',
    action: 'keep',
  });
  const [logoState, setLogoState] = useState({
    preview: profile.logoImageUrl ? assetUrl(profile.logoImageUrl) : '',
    fileData: null,
    fileName: '',
    action: 'keep',
  });
  const [conceptState, setConceptState] = useState({
    fileName: '',
    fileData: null,
    action: 'keep',
  });
  const [contractDocuments, setContractDocuments] = useState(() =>
    (profile.contractDocuments ?? []).map((document) => buildContractDocumentItem(document)).filter(Boolean)
  );
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    setFormState({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      email: profile.email || '',
      phone: profile.phone || '',
      address: profile.address || '',
      postalCode: profile.postalCode || '',
      city: profile.city || '',
      username: profile.username || '',
      daycareName: profile.daycareName || '',
      availableSpots: profile.availableSpots ?? 0,
      hasAvailability: profile.hasAvailability ?? true,
      availabilityTiming: profile.availabilityTiming ?? 'aktuell',
      childrenCount: profile.childrenCount ?? 0,
      maxChildAge: profile.maxChildAge ?? '',
      birthDate: profile.birthDate ? profile.birthDate.slice(0, 10) : '',
      caregiverSince: profile.caregiverSince ? profile.caregiverSince.slice(0, 7) : '',
      shortDescription: profile.shortDescription || '',
      bio: profile.bio || '',
      mealPlan: profile.mealPlan || '',
      emailNotificationsEnabled: isEmailNotificationsEnabled(profile),
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
    setImageState({
      preview: profile.profileImageUrl ? assetUrl(profile.profileImageUrl) : '',
      fileData: null,
      fileName: '',
      action: 'keep',
    });
    setLogoState({
      preview: profile.logoImageUrl ? assetUrl(profile.logoImageUrl) : '',
      fileData: null,
      fileName: '',
      action: 'keep',
    });
    setConceptState({ fileName: '', fileData: null, action: 'keep' });
    setContractDocuments(
      (profile.contractDocuments ?? []).map((document) => buildContractDocumentItem(document)).filter(Boolean)
    );
    setRoomGallery(
      (profile.roomImages ?? [])
        .map((imageRef) => buildRoomGalleryItem(imageRef))
        .filter(Boolean)
    );
    setRoomGalleryOffset(0);
    setStatusMessage((current) => (current?.type === 'success' ? current : null));
  }, [profile]);

  function updateField(field, value) {
    setFormState((current) => ({ ...current, [field]: value }));
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
    event.target.value = '';
  }

  function handleRemoveImage() {
    setImageState({ preview: '', fileData: null, fileName: '', action: 'remove' });
  }

  async function handleLogoChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    setLogoState({ preview: dataUrl, fileData: dataUrl, fileName: file.name, action: 'replace' });
    event.target.value = '';
  }

  function handleRemoveLogo() {
    setLogoState({
      preview: '',
      fileData: null,
      fileName: '',
      action: profile.logoImageUrl ? 'remove' : 'keep',
    });
  }

  async function handleConceptChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    setConceptState({ fileName: file.name, fileData: dataUrl, action: 'replace' });
    event.target.value = '';
  }

  function handleRemoveConcept() {
    setConceptState({ fileName: '', fileData: null, action: 'remove' });
  }

  function handleAddContractDocument() {
    setContractDocuments((current) => [
      ...current,
      { id: generateTempId(), name: '', file: null, fileData: null, fileName: '' },
    ]);
  }

  function handleRemoveContractDocument(id) {
    setContractDocuments((current) => current.filter((doc) => doc.id !== id));
  }

  function updateContractDocument(id, field, value) {
    setContractDocuments((current) =>
      current.map((doc) => (doc.id === id ? { ...doc, [field]: value } : doc))
    );
  }

  async function handleContractDocumentFileChange(id, event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    updateContractDocument(id, 'fileData', dataUrl);
    updateContractDocument(id, 'fileName', file.name);
    updateContractDocument(id, 'file', null);
    event.target.value = '';
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

    if (!additions.length) {
      return;
    }

    setRoomGallery((current) => {
      const next = [...current, ...additions];
      setRoomGalleryOffset(() => (next.length <= 3 ? 0 : Math.max(0, next.length - 3)));
      return next;
    });
    event.target.value = '';
  }

  function handleRemoveRoomImage(imageId) {
    setRoomGallery((current) => {
      const filtered = current.filter((image) => image.id !== imageId);
      setRoomGalleryOffset((offset) => {
        if (!filtered.length || filtered.length <= 3) {
          return 0;
        }
        const normalized = offset % filtered.length;
        return normalized;
      });
      return filtered;
    });
  }

  function showPreviousRoomImages() {
    if (roomGallery.length <= 3) {
      return;
    }
    setRoomGalleryOffset((current) => {
      const total = roomGallery.length;
      return (current - 1 + total) % total;
    });
  }

  function showNextRoomImages() {
    if (roomGallery.length <= 3) {
      return;
    }
    setRoomGalleryOffset((current) => {
      const total = roomGallery.length;
      return (current + 1) % total;
    });
  }

  function deriveAge(value) {
    if (!value) {
      return null;
    }
    const date = new Date(value);
    if (Number.isNaN(date.valueOf())) {
      return null;
    }
    const now = new Date();
    let age = now.getFullYear() - date.getFullYear();
    const hasBirthdayPassed =
      now.getMonth() > date.getMonth() || (now.getMonth() === date.getMonth() && now.getDate() >= date.getDate());
    if (!hasBirthdayPassed) {
      age -= 1;
    }
    return age >= 0 ? age : null;
  }

  function deriveYears(value) {
    if (!value) {
      return null;
    }
    const date = new Date(`${value}-01`);
    if (Number.isNaN(date.valueOf())) {
      return null;
    }
    const now = new Date();
    let years = now.getFullYear() - date.getFullYear();
    const hasAnniversaryPassed =
      now.getMonth() > date.getMonth() || (now.getMonth() === date.getMonth() && now.getDate() >= date.getDate());
    if (!hasAnniversaryPassed) {
      years -= 1;
    }
    return years >= 0 ? years : null;
  }

  const computedAge = deriveAge(formState.birthDate);
  const experienceYears = deriveYears(formState.caregiverSince);
  const visibleRoomImages =
    roomGallery.length <= 3
      ? roomGallery
      : Array.from({ length: 3 }, (_, index) => roomGallery[(roomGalleryOffset + index) % roomGallery.length]);
  const showRoomNavigation = roomGallery.length > 3;

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
      city: formState.city,
      username: formState.username,
      daycareName: formState.daycareName,
      availableSpots: Number(formState.availableSpots),
      hasAvailability: formState.hasAvailability,
      availabilityTiming: formState.availabilityTiming,
      childrenCount: Number(formState.childrenCount),
      maxChildAge: formState.maxChildAge ? Number(formState.maxChildAge) : null,
      birthDate: formState.birthDate || null,
      caregiverSince: formState.caregiverSince || null,
      shortDescription: formState.shortDescription,
      bio: formState.bio,
      mealPlan: formState.mealPlan,
      emailNotificationsEnabled: formState.emailNotificationsEnabled,
      careTimes,
      dailySchedule,
      closedDays,
      roomImages: roomGallery
        .map((image) =>
          image.fileData ? { dataUrl: image.fileData, fileName: image.fileName } : image.source
        )
        .filter(Boolean),
      contractDocuments: contractDocuments
        .map((document) => ({
          name: document.name?.trim(),
          file: document.fileData
            ? { dataUrl: document.fileData, fileName: document.fileName }
            : document.file,
        }))
        .filter((document) => document.name && document.file),
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

    if (logoState.action === 'replace') {
      payload.logoImage = logoState.fileData;
      payload.logoImageName = logoState.fileName;
    } else if (logoState.action === 'remove') {
      payload.logoImage = null;
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
    <form className="flex flex-col gap-4 md:grid md:gap-6" onSubmit={handleSubmit}>
      <section className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-3xl bg-white/85 p-5 shadow md:grid-cols-none md:gap-4 md:bg-white/80 md:p-6">
        <h2 className="text-base font-semibold text-brand-700 md:text-lg">Basisdaten deiner Kindertagespflege</h2>
        <div className="grid gap-3 md:contents">
        <div className="contents md:grid md:gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <span className="md:hidden">Vorname *</span><span className="hidden md:inline"><span className="flex items-center gap-1">Vorname<span className="text-rose-500" aria-hidden="true">*</span><span className="sr-only">Pflichtfeld</span></span></span>
            <input
              value={formState.firstName}
              onChange={(event) => updateField('firstName', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <span className="md:hidden">Nachname *</span><span className="hidden md:inline"><span className="flex items-center gap-1">Nachname<span className="text-rose-500" aria-hidden="true">*</span><span className="sr-only">Pflichtfeld</span></span></span>
            <input
              value={formState.lastName}
              onChange={(event) => updateField('lastName', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <span className="md:hidden">Geburtsdatum *</span><span className="hidden md:inline"><span className="flex items-center gap-1">Geburtsdatum<span className="text-rose-500" aria-hidden="true">*</span><span className="sr-only">Pflichtfeld</span></span></span>
            <input
              type="date"
              value={formState.birthDate}
              onChange={(event) => updateField('birthDate', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
            <span className="text-xs text-slate-500">
              {computedAge !== null ? `Aktuell ${computedAge} Jahre alt.` : 'Geburtsdatum für automatische Altersaktualisierung.'}
            </span>
          </label>
        </div>
        <div className="contents md:grid md:gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <span className="md:hidden">Name der Kindertagespflege *</span><span className="hidden md:inline"><span className="flex items-center gap-1">Name der Kindertagespflege<span className="text-rose-500" aria-hidden="true">*</span><span className="sr-only">Pflichtfeld</span></span></span>
            <input
              value={formState.daycareName}
              onChange={(event) => updateField('daycareName', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Seit wann aktiv
            <input
              type="month"
              value={formState.caregiverSince}
              onChange={(event) => updateField('caregiverSince', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
            />
            <span className="text-xs text-slate-500">
              {experienceYears !== null ? `${experienceYears} Jahre Erfahrung` : 'Optional: Zeigt deine Erfahrung.'}
            </span>
          </label>
        </div>
        </div>
      </section>

      <section className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-3xl bg-white/85 p-5 shadow md:grid-cols-none md:gap-4 md:bg-white/80 md:p-6">
        <h2 className="text-base font-semibold text-brand-700 md:text-lg">Betreuungskapazitäten</h2>
        <div className="grid gap-3 md:contents">
        <div className="contents md:grid md:gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Maximales Alter der Kinder
            <input
              type="number"
              min="0"
              value={formState.maxChildAge}
              onChange={(event) => updateField('maxChildAge', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              placeholder="z. B. 6"
            />
          </label>
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
        </div>
        <div className="contents md:grid md:gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Anzahl freier Plätze
            <input
              type="number"
              min="0"
              value={formState.availableSpots}
              onChange={(event) => updateField('availableSpots', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Wann werden Plätze frei?
            <select
              value={formState.availabilityTiming}
              onChange={(event) => updateField('availabilityTiming', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
            >
              {AVAILABILITY_TIMING_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        </div>
      </section>

      <section className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-3xl bg-white/85 p-5 shadow md:grid-cols-none md:gap-4 md:bg-white/80 md:p-6">
        <h2 className="text-base font-semibold text-brand-700 md:text-lg">Kontakt und Zugang</h2>
        <div className="grid gap-3 md:contents">
        <div className="contents md:grid md:gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <span className="md:hidden">E-Mail-Adresse *</span><span className="hidden md:inline"><span className="flex items-center gap-1">E-Mail-Adresse<span className="text-rose-500" aria-hidden="true">*</span><span className="sr-only">Pflichtfeld</span></span></span>
            <input
              type="email"
              value={formState.email}
              onChange={(event) => updateField('email', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <span className="md:hidden">Telefonnummer *</span><span className="hidden md:inline"><span className="flex items-center gap-1">Telefonnummer<span className="text-rose-500" aria-hidden="true">*</span><span className="sr-only">Pflichtfeld</span></span></span>
            <input
              value={formState.phone}
              onChange={(event) => updateField('phone', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>
        </div>
        <div className="contents md:grid md:gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 md:col-span-2">
            <span className="md:hidden">Adresse *</span><span className="hidden md:inline"><span className="flex items-center gap-1">Adresse<span className="text-rose-500" aria-hidden="true">*</span><span className="sr-only">Pflichtfeld</span></span></span>
            <input
              value={formState.address}
              onChange={(event) => updateField('address', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <span className="md:hidden">Postleitzahl *</span><span className="hidden md:inline"><span className="flex items-center gap-1">Postleitzahl<span className="text-rose-500" aria-hidden="true">*</span><span className="sr-only">Pflichtfeld</span></span></span>
            <input
              value={formState.postalCode}
              onChange={(event) => updateField('postalCode', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <span className="md:hidden">Ort *</span><span className="hidden md:inline"><span className="flex items-center gap-1">Ort<span className="text-rose-500" aria-hidden="true">*</span><span className="sr-only">Pflichtfeld</span></span></span>
            <input
              value={formState.city}
              onChange={(event) => updateField('city', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>
        </div>
        <div className="contents md:grid md:gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <span className="md:hidden">Benutzername *</span><span className="hidden md:inline">Benutzername</span>
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
        </div>
      </section>

      <ScheduleEditor title="Betreuungszeiten" mobileDescription="Bring- und Abholzeiten inkl. Aktivität." desktopDescription="Aktualisiere deine Bring- und Abholzeiten inklusive kurzer Aktivitätsbeschreibung." addLabel="Weiteren Zeitplan hinzufügen" removeLabel="Eintrag entfernen" placeholder="z. B. Bringzeit" entries={careTimes} onChange={setCareTimes} />

      <section className="flex flex-col gap-0 rounded-3xl bg-white/85 p-5 shadow md:grid-cols-none md:grid md:gap-4 md:bg-white/80 md:p-6">
        <div className="contents md:flex md:flex-col md:gap-2">
          <h2 className="text-base font-semibold text-brand-700 md:text-lg">Betreuungsfreie Tage</h2>
          <p className="mt-1 text-xs text-slate-500 md:mt-0">
            <span className="md:hidden">Wochentage oder Hinweise, an denen keine Betreuung stattfindet.</span><span className="hidden md:inline">Hinterlege regelmäßige Wochentage oder besondere Anmerkungen, an denen keine Betreuung stattfindet.</span>
          </p>
        </div>
        <div className="mt-4 flex flex-col gap-3 md:mt-0 md:text-sm">
          <div className="flex gap-2 md:items-center">
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
              className="rounded-xl border border-brand-200 px-4 py-2 text-xs font-semibold text-brand-600 hover:border-brand-400 hover:text-brand-700 md:rounded-full md:transition"
            >
              <span className="md:hidden">Hinzufügen</span><span className="hidden md:inline">Tag hinzufügen</span>
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

      <ScheduleEditor title="Tagesablauf" mobileDescription="Chronologischer Tagesablauf inkl. Zeiten & Aktivität." desktopDescription="Beschreibe chronologisch, was die Kinder im Laufe des Tages erwartet." addLabel="Weiteren Abschnitt hinzufügen" removeLabel="Abschnitt entfernen" placeholder="z. B. Gemeinsames Frühstück" entries={dailySchedule} onChange={setDailySchedule} />

      <section className="block rounded-3xl bg-white/85 p-5 shadow md:grid-cols-none md:grid md:gap-3 md:bg-white/80 md:p-6">
        <h2 className="text-base font-semibold text-brand-700 md:text-lg">Essensplan</h2>
        <p className="mt-1 text-xs text-slate-500 md:mt-0"><span className="md:hidden">Überblick zu Frühstück, Mittagessen, Snacks etc.</span><span className="hidden md:inline">Gib Familien einen Überblick darüber, welche Mahlzeiten du anbietest.</span></p>
        <textarea
          value={formState.mealPlan}
          onChange={(event) => updateField('mealPlan', event.target.value)}
          rows={4}
          className="mt-4 w-full rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none md:mt-0"
          placeholder="Beschreibe Frühstück, Mittagessen und Snacks."
        />
      </section>

      <section className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-3xl bg-white/85 p-5 shadow md:grid-cols-none md:gap-4 md:bg-white/80 md:p-6">
        <div className="flex items-start justify-between gap-3 md:items-center md:gap-2">
          <div>
            <h2 className="text-base font-semibold text-brand-700 md:text-lg">Vertragsunterlagen</h2>
            <p className="mt-1 text-xs text-slate-500 md:mt-0">
              <span className="md:hidden">Optional – nur PDF hochladen.</span><span className="hidden md:inline">Füge optionale Vertragsunterlagen hinzu. Dokumente nur im PDF-Format hochladen.</span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddContractDocument}
            className="shrink-0 rounded-xl border border-brand-200 px-3 py-2 text-xs font-semibold text-brand-600 hover:border-brand-400 hover:text-brand-700 md:shrink md:rounded-full md:px-4 md:transition"
          >
            <span className="md:hidden">+ Dokument</span><span className="hidden md:inline">1 Dokument hinzufügen</span>
          </button>
        </div>
        {contractDocuments.length ? (
          <div className="flex flex-col gap-3 md:gap-4">
            {contractDocuments.map((document) => (
              <div key={document.id} className="grid grid-cols-[minmax(0,1fr)] gap-3 rounded-2xl border border-brand-100 bg-white/70 p-4 md:gap-4 md:grid-cols-[2fr,1fr] md:items-center">
                <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Name des Dokuments
                  <input
                    value={document.name}
                    onChange={(event) => updateContractDocument(document.id, 'name', event.target.value)}
                    className="rounded-xl border border-brand-200 px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
                    placeholder="z. B. Betreuungsvertrag"
                  />
                </label>
                <div className="flex flex-col gap-2 text-sm">
                  <IconUploadButton
                    label="PDF hochladen"
                    accept="application/pdf"
                    onChange={(event) => handleContractDocumentFileChange(document.id, event)}
                  />
                  <span className="text-xs text-slate-500">
                    {document.fileName
                      ? `Ausgewählt: ${document.fileName}`
                      : document.file
                        ? 'Ein Dokument ist bereits hinterlegt.'
                        : 'Noch kein Dokument ausgewählt.'}
                  </span>
                  {document.file ? (
                    <a
                      href={assetUrl(document.file)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                    >
                      Dokument ansehen
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleRemoveContractDocument(document.id)}
                    className="self-start text-xs font-semibold text-rose-600 hover:text-rose-700"
                  >
                    Dokument entfernen
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-brand-200 bg-white/60 px-4 py-6 text-sm text-slate-500">
            <span className="md:hidden">Noch keine Vertragsunterlagen hinzugefügt.</span><span className="hidden md:inline">Noch keine Vertragsunterlagen hinzugefügt. Nutze den Button, um ein Dokument hochzuladen.</span>
          </p>
        )}
      </section>

      <section className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-3xl bg-white/85 p-5 shadow md:grid-cols-none md:gap-5 md:bg-white/80 md:p-6">
        <h2 className="text-base font-semibold text-brand-700 md:text-lg">Profil, Logo & Team</h2>
        <div className="flex flex-col gap-5 md:grid md:gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-slate-700">Profilbild</p>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 md:h-28 md:w-28 overflow-hidden rounded-full border border-brand-200 bg-brand-50">
                {imageState.preview ? (
                  <img src={imageState.preview} alt="Profilbild" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">Kein Bild</div>
                )}
              </div>
              <div className="flex flex-col gap-1 text-sm">
                <IconUploadButton label="Profilbild wählen" accept="image/*" onChange={handleImageChange} />
                <span className="text-xs text-slate-500">
                  {imageState.fileName
                    ? `Ausgewählt: ${imageState.fileName}`
                    : 'Dieses Bild erscheint in deinem öffentlichen Profil.'}
                </span>
                {imageState.action === 'remove' && profile.profileImageUrl ? (
                  <span className="text-xs text-rose-600">Das bisherige Profilbild wird entfernt.</span>
                ) : null}
                {imageState.preview || (profile.profileImageUrl && imageState.action !== 'remove') ? (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="self-start text-xs font-semibold text-rose-600 hover:text-rose-700"
                  >
                    Bild entfernen
                  </button>
                ) : null}
                {imageState.action === 'remove' && profile.profileImageUrl ? (
                  <button
                    type="button"
                    onClick={() =>
                      setImageState({
                        preview: profile.profileImageUrl ? assetUrl(profile.profileImageUrl) : '',
                        fileData: null,
                        fileName: '',
                        action: 'keep',
                      })
                    }
                    className="self-start text-xs font-semibold text-brand-600 hover:text-brand-700"
                  >
                    Entfernung rückgängig machen
                  </button>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-slate-700"><span className="md:hidden">Logo</span><span className="hidden md:inline">Logo deiner Kindertagespflege</span></p>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 md:h-28 md:w-28 items-center justify-center overflow-hidden rounded-2xl border border-brand-200 bg-brand-50">
                {logoState.preview ? (
                  <img src={logoState.preview} alt="Logo" className="h-full w-full object-contain" />
                ) : (
                  <span className="text-xs text-slate-400">Kein Logo</span>
                )}
              </div>
              <div className="flex flex-col gap-1 text-sm">
                <IconUploadButton label="Logo hochladen" accept="image/*" onChange={handleLogoChange} />
                <span className="text-xs text-slate-500">
                  {logoState.fileName ? `Ausgewählt: ${logoState.fileName}` : (<><span className="md:hidden">Optional, sorgt für Wiedererkennung.</span><span className="hidden md:inline">Optional, sorgt für Wiedererkennung in der Übersicht.</span></>)}
                </span>
                {logoState.action === 'remove' && profile.logoImageUrl ? (
                  <span className="text-xs text-rose-600">Das Logo wird nach dem Speichern entfernt.</span>
                ) : null}
                {logoState.preview && logoState.action !== 'remove' ? (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="self-start text-xs font-semibold text-rose-600 hover:text-rose-700"
                  >
                    Logo entfernen
                  </button>
                ) : null}
                {logoState.action === 'remove' && profile.logoImageUrl ? (
                  <button
                    type="button"
                    onClick={() =>
                      setLogoState({
                        preview: assetUrl(profile.logoImageUrl),
                        fileData: null,
                        fileName: '',
                        action: 'keep',
                      })
                    }
                    className="self-start text-xs font-semibold text-brand-600 hover:text-brand-700"
                  >
                    Entfernung rückgängig machen
                  </button>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-slate-700">Konzeption (PDF)</p>
            <div className="flex flex-col gap-1 text-sm">
              <IconUploadButton label="PDF auswählen" accept="application/pdf" onChange={handleConceptChange} />
              <span className="text-xs text-slate-500">
                {conceptState.fileName
                  ? `Ausgewählt: ${conceptState.fileName}`
                  : profile.conceptUrl
                    ? 'Es ist bereits eine Konzeption hinterlegt.'
                    : 'Lade deine pädagogische Konzeption hoch.'}
              </span>
              {profile.conceptUrl ? (
                <a
                  href={assetUrl(profile.conceptUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  Aktuelle Konzeption ansehen
                </a>
              ) : null}
              {conceptState.action === 'remove' && profile.conceptUrl ? (
                <span className="text-xs text-rose-600">Die Konzeption wird nach dem Speichern entfernt.</span>
              ) : null}
              {profile.conceptUrl && conceptState.action !== 'remove' ? (
                <button
                  type="button"
                  onClick={handleRemoveConcept}
                  className="self-start text-xs font-semibold text-rose-600 hover:text-rose-700"
                >
                  Konzeption entfernen
                </button>
              ) : null}
              {conceptState.action === 'remove' && profile.conceptUrl ? (
                <button
                  type="button"
                  onClick={() => setConceptState({ fileName: '', fileData: null, action: 'keep' })}
                  className="self-start text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  Entfernung rückgängig machen
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-3xl bg-white/85 p-5 shadow md:grid-cols-none md:gap-5 md:bg-white/80 md:p-6">
        <div className="flex items-start justify-between gap-3 md:items-center md:gap-2">
          <div>
            <h2 className="text-base font-semibold text-brand-700 md:text-lg">Räumlichkeiten</h2>
            <p className="mt-1 text-xs text-slate-500 md:mt-0">
              <span className="md:hidden">Maximal 3 Bilder sichtbar. Weitere per Pfeile.</span><span className="hidden md:inline">Zeige Familien bis zu drei Räume gleichzeitig. Weitere Bilder kannst du über die Pfeile anzeigen lassen.</span>
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            {showRoomNavigation ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={showPreviousRoomImages}
                  className="rounded-xl border border-brand-200 px-3 py-2 text-xs font-semibold text-brand-600 hover:border-brand-400 hover:text-brand-700 md:rounded-full md:py-1 md:transition"
                  aria-label="Vorherige Raumbilder anzeigen"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={showNextRoomImages}
                  className="rounded-xl border border-brand-200 px-3 py-2 text-xs font-semibold text-brand-600 hover:border-brand-400 hover:text-brand-700 md:rounded-full md:py-1 md:transition"
                  aria-label="Nächste Raumbilder anzeigen"
                >
                  →
                </button>
              </div>
            ) : null}
            <IconUploadButton
              label={<><span className="md:hidden">Bilder</span><span className="hidden md:inline">Raumbilder hochladen</span></>}
              accept="image/*"
              multiple
              onChange={handleRoomImagesChange}
            />
          </div>
        </div>
        {roomGallery.length ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
              {visibleRoomImages.map((image) => (
                <div
                  key={image.id}
                  className="relative h-44 w-full md:h-40 overflow-hidden rounded-3xl border border-brand-100 bg-brand-50"
                >
                  <img src={image.preview} alt="Räumlichkeit" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveRoomImage(image.id)}
                    className="absolute right-2 top-2 rounded-full bg-white/85 px-3 py-1 text-xs md:px-2 md:text-[10px] md:leading-normal font-semibold text-rose-600 shadow hover:bg-white"
                  >
                    Entfernen
                  </button>
                </div>
              ))}
            </div>

          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-brand-200 bg-white/60 px-4 py-6 text-sm text-slate-500">
            <span className="md:hidden">Noch keine Bilder ausgewählt.</span><span className="hidden md:inline">Noch keine Bilder ausgewählt. Lade Fotos deiner Räume hoch.</span>
          </p>
        )}
      </section>

      <section className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-3xl bg-white/85 p-5 shadow md:grid-cols-none md:gap-4 md:bg-white/80 md:p-6">
        <h2 className="text-base font-semibold text-brand-700 md:text-lg">Über dich</h2>
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
        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
          <button
            type="submit"
            className="w-full rounded-2xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300 md:w-auto md:self-start md:rounded-full md:px-8 md:duration-200 md:hover:-translate-y-0.5 md:hover:shadow-lg"
            disabled={saving || deleting}
          >
            {saving ? 'Speichern…' : 'Profil speichern'}
          </button>
          <button
            type="button"
            onClick={onDeleteProfile}
            className="w-full rounded-2xl border border-rose-300 px-6 py-3 text-sm font-semibold text-rose-700 transition hover:border-rose-500 hover:text-rose-800 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto md:self-start md:rounded-full md:px-8"
            disabled={saving || deleting}
          >
            {deleting ? 'Profil wird gelöscht…' : 'Profil löschen'}
          </button>
        </div>
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
function PushNotificationSettings({ userId }) {
  const [isSupported] = useState(() => isPushSupported());
  const [permission, setPermission] = useState(() => (isPushSupported() ? getNotificationPermission() : 'default'));
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isSupported) return;
    let isActive = true;

    async function loadSubscription() {
      try {
        const subscription = await getActivePushSubscription();
        if (isActive) setIsSubscribed(Boolean(subscription));
      } catch (error) {
        console.error('Failed to read push subscription', error);
      }
    }

    loadSubscription();
    return () => {
      isActive = false;
    };
  }, [isSupported]);

  async function handleEnablePush() {
    if (!userId || isLoading) return;
    setIsLoading(true);
    setStatusMessage(null);

    try {
      if (!isSupported) {
        setStatusMessage({ type: 'error', text: 'Push-Benachrichtigungen werden in diesem Browser nicht unterstützt.' });
        return;
      }

      let permissionState = getNotificationPermission();
      if (permissionState !== 'granted') permissionState = await requestNotificationPermission();
      setPermission(permissionState);

      if (permissionState !== 'granted') {
        setStatusMessage({ type: 'error', text: 'Bitte erlaube Benachrichtigungen in den Browser-Einstellungen.' });
        return;
      }

      const vapidPublicKey = await fetchVapidPublicKey();
      const subscription = await subscribeToPush(vapidPublicKey);
      await axios.post('/api/push-subscriptions', {
        userId,
        subscription: subscription.toJSON(),
        userAgent: navigator.userAgent,
      });

      setIsSubscribed(true);
      setStatusMessage({ type: 'success', text: 'Push-Benachrichtigungen aktiviert.' });
    } catch (error) {
      console.error('Failed to enable push notifications', error);
      setStatusMessage({ type: 'error', text: 'Push konnte nicht aktiviert werden.' });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDisablePush() {
    if (!userId || isLoading) return;
    setIsLoading(true);
    setStatusMessage(null);

    try {
      const subscription = await getActivePushSubscription();
      if (subscription) {
        await axios.delete('/api/push-subscriptions', { data: { userId, endpoint: subscription.endpoint } });
      }

      await unsubscribeFromPush();
      setIsSubscribed(false);
      setStatusMessage({ type: 'success', text: 'Push-Benachrichtigungen deaktiviert.' });
    } catch (error) {
      console.error('Failed to disable push notifications', error);
      setStatusMessage({ type: 'error', text: 'Push konnte nicht deaktiviert werden.' });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-brand-100 bg-white/80 p-4 shadow-sm md:rounded-3xl md:border-0 md:p-6 md:shadow">
      <div className="flex flex-col gap-2 md:contents">
      <h2 className="text-base font-semibold text-brand-700 md:text-lg">Push-Benachrichtigungen</h2>
      <p className="text-sm text-slate-600 md:mt-1">Aktiviere Push, um neue Nachrichten direkt auf dem Homescreen zu sehen.</p>
      {!isSupported ? (
        <p className="rounded-xl md:mt-3 border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <span className="md:hidden">Push ist hier nicht verfügbar. Bitte installiere die App über „Zum Home-Bildschirm“ und erlaube Benachrichtigungen in Safari.</span><span className="hidden md:inline">Push ist hier nicht verfügbar. Bitte installiere die App über „Zum Home-Bildschirm“ und erlaube Benachrichtigungen.</span>
        </p>
      ) : (
        <div className="flex flex-col gap-3 md:mt-3">
          <div className="text-xs text-slate-500">
            <span className="hidden md:inline">Permission: {permission} • Status: {isSubscribed ? 'aktiv' : 'inaktiv'}</span>
            <div className="flex flex-wrap items-center gap-2 md:hidden">
              <span>Permission: {permission}</span>
              <span>•</span>
              <span>Status: {isSubscribed ? 'aktiv' : 'inaktiv'}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleEnablePush}
              className="rounded-full border border-brand-200 px-4 py-2 text-xs font-semibold text-brand-600 transition hover:border-brand-400 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading || permission === 'denied' || isSubscribed}
            >
              Push aktivieren
            </button>
            <button
              type="button"
              onClick={handleDisablePush}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading || !isSubscribed}
            >
              Push deaktivieren
            </button>
          </div>
        </div>
      )}
      {statusMessage ? (
        <p
          className={`rounded-xl md:mt-3 border px-3 py-2 text-xs ${
            statusMessage.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {statusMessage.text}
        </p>
      ) : null}
      </div>
    </section>
  );
}

function EmailNotificationSettings({ user, profile, onProfileUpdated }) {
  const [enabled, setEnabled] = useState(() => isEmailNotificationsEnabled(profile));
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    setEnabled(isEmailNotificationsEnabled(profile));
  }, [profile]);

  async function handleToggle(event) {
    const nextValue = event.target.checked;
    const endpoint = user.role === 'caregiver' ? `/api/caregivers/${user.id}` : `/api/parents/${user.id}`;
    setSaving(true);
    setStatusMessage(null);
    try {
      const response = await axios.patch(endpoint, { emailNotificationsEnabled: nextValue });
      setEnabled(isEmailNotificationsEnabled(response.data));
      onProfileUpdated(response.data);
      setStatusMessage({
        type: 'success',
        text: nextValue ? 'E-Mail-Benachrichtigungen sind aktiviert.' : 'E-Mail-Benachrichtigungen sind deaktiviert.',
      });
    } catch (error) {
      setEnabled(isEmailNotificationsEnabled(profile));
      setStatusMessage({ type: 'error', text: error.response?.data?.message || 'Einstellung konnte nicht gespeichert werden.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-brand-100 bg-white/80 p-4 shadow-sm md:rounded-3xl md:border-0 md:p-6 md:shadow">
      <div className="flex flex-col gap-2 md:contents">
      <h2 className="text-base font-semibold text-brand-700 md:text-lg">Email benachrichtigungen</h2>
      <p className="text-sm text-slate-600 md:mt-1"><span className="md:hidden">Dieser Schalter steuert nur E-Mail-Benachrichtigungen (nicht Push).</span><span className="hidden md:inline">Hier steuerst du nur normale E-Mail-Benachrichtigungen – unabhängig von Push.</span></p>
      <label className="mt-2 flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50/40 px-4 py-3 text-sm font-medium text-slate-700 md:mt-4">
        <span>Email benachrichtigungen</span>
        <input
          type="checkbox"
          checked={enabled}
          onChange={handleToggle}
          disabled={saving}
          className="h-5 w-5 rounded border-brand-300 text-brand-600 focus:ring-brand-400"
        />
      </label>
      {statusMessage ? (
        <p
          className={`rounded-xl md:mt-3 border px-3 py-2 text-xs ${
            statusMessage.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {statusMessage.text}
        </p>
      ) : null}
      </div>
    </section>
  );
}

function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const { profile, loading, error, setProfile } = useProfileData(user);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const title = useMemo(() => {
    if (user?.role === 'caregiver') {
      return 'Profil für Kindertagespflegepersonen bearbeiten';
    }
    return 'Profil für Eltern bearbeiten';
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

  async function handleDeleteProfile() {
    setDeleting(true);
    setDeleteError('');
    try {
      const endpoint = user.role === 'caregiver' ? `/api/caregivers/${user.id}` : `/api/parents/${user.id}`;
      await axios.delete(endpoint);
      logout();
    } catch (requestError) {
      console.error('Failed to delete profile', requestError);
      setDeleteError(requestError.response?.data?.message || 'Profil konnte nicht gelöscht werden.');
    } finally {
      setDeleting(false);
      setShowDeleteConfirmation(false);
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-4 rounded-3xl bg-white/85 p-5 shadow-lg md:max-w-5xl md:gap-8 md:p-10">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-500 md:hidden">Profil</p>
        <h1 className="text-2xl font-semibold text-brand-700 md:text-3xl">{title}</h1>
        <p className="text-sm text-slate-600">
          Aktualisiere dein Profil, um Familien und Tagespflegepersonen stets mit den neuesten Informationen zu versorgen.
        </p>
      </header>
      <PushNotificationSettings userId={user.id} />
      {!loading && profile ? (
        <EmailNotificationSettings
          user={user}
          profile={profile}
          onProfileUpdated={(nextProfile) => {
            setProfile(nextProfile);
            updateUser(nextProfile);
          }}
        />
      ) : null}
      {loading ? (
        <p className="text-sm text-slate-500">Profil wird geladen…</p>
      ) : null}
      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {deleteError ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{deleteError}</p>
      ) : null}
      {!loading && profile ? (
        user.role === 'caregiver' ? (
          <CaregiverProfileEditor
            profile={profile}
            onSave={handleSave}
            saving={saving}
            onDeleteProfile={() => setShowDeleteConfirmation(true)}
            deleting={deleting}
          />
        ) : (
          <ParentProfileEditor
            profile={profile}
            onSave={handleSave}
            saving={saving}
            onDeleteProfile={() => setShowDeleteConfirmation(true)}
            deleting={deleting}
          />
        )
      ) : null}
      {showDeleteConfirmation ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 md:p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl md:max-w-lg md:p-6">
            <h2 className="text-lg font-semibold text-rose-700 md:text-xl">Profil wirklich löschen?</h2>
            <p className="mt-3 text-sm text-slate-700">
              <span className="md:hidden">Diese Aktion ist endgültig. Dein Profil und alle verbundenen Daten (Nachrichten, Logos, Bilder, Konzepte und weitere Inhalte) werden dauerhaft gelöscht.</span><span className="hidden md:inline">Diese Aktion kann nicht rückgängig gemacht werden. Dein Profil und alle verbundenen Daten (Nachrichten, Logos, Bilder, Konzepte und weitere Inhalte) werden dauerhaft gelöscht.</span>
            </p>
            <div className="mt-5 flex flex-col gap-2 md:mt-6 md:flex-row md:flex-wrap md:justify-end md:gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmation(false)}
                className="order-2 w-full rounded-2xl border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400 md:order-none md:w-auto md:rounded-full"
                disabled={deleting}
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleDeleteProfile}
                className="w-full rounded-2xl bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300 md:w-auto md:rounded-full"
                disabled={deleting}
              >
                {deleting ? 'Profil wird gelöscht…' : 'Profil löschen'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default ProfilePage;
