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
} from '../../utils/pushNotifications.js';

function useProfileData(user) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;

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
    <div className="flex flex-col gap-3">
      {childrenList.map((child, index) => (
        <div key={index} className="rounded-2xl border border-brand-100 bg-white/80 p-4 shadow-sm">
          <div className="grid gap-3">
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

            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
              Alltag & Besonderheiten
              <textarea
                value={child.notes}
                onChange={(event) => updateChild(index, 'notes', event.target.value)}
                rows={3}
                className="rounded-xl border border-brand-200 px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
                placeholder="z. B. schläft nach dem Mittag gern"
              />
            </label>

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

function ScheduleEditor({ title, entries, onChange }) {
  function updateEntry(index, field, value) {
    onChange(entries.map((e, i) => (i === index ? { ...e, [field]: value } : e)));
  }

  function addEntry() {
    onChange([...entries, createScheduleEntry()]);
  }

  function removeEntry(index) {
    if (entries.length <= 1) return;
    onChange(entries.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-slate-500">{title}</p>

      <div className="flex flex-col gap-3">
        {entries.map((entry, index) => (
          <div key={index} className="rounded-2xl border border-brand-100 bg-white/70 p-4">
            <div className="grid gap-3">
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Von
                <input
                  type="time"
                  value={entry.startTime}
                  onChange={(e) => updateEntry(index, 'startTime', e.target.value)}
                  className="rounded-xl border border-brand-200 px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Bis
                <input
                  type="time"
                  value={entry.endTime}
                  onChange={(e) => updateEntry(index, 'endTime', e.target.value)}
                  className="rounded-xl border border-brand-200 px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Aktivität
                <input
                  value={entry.activity}
                  onChange={(e) => updateEntry(index, 'activity', e.target.value)}
                  className="rounded-xl border border-brand-200 px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
                  placeholder="z. B. Bringzeit"
                />
              </label>

              {entries.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeEntry(index)}
                  className="self-start text-xs font-semibold text-rose-600 hover:text-rose-700"
                >
                  Eintrag entfernen
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addEntry}
        className="self-start rounded-full border border-brand-200 px-4 py-2 text-xs font-semibold text-brand-600 hover:border-brand-400 hover:text-brand-700"
      >
        Weiteren Eintrag hinzufügen
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
    profile.children?.length ? profile.children.map((c) => createChild(c)) : [createChild()],
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
      newPassword: '',
    });
    setChildren(profile.children?.length ? profile.children.map((c) => createChild(c)) : [createChild()]);
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
    if (!file) return;
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
      children,
      numberOfChildren: children.filter((c) => c.name.trim()).length,
    };

    if (formState.newPassword.trim()) payload.password = formState.newPassword.trim();

    if (imageState.action === 'replace') {
      payload.profileImage = imageState.fileData;
      payload.profileImageName = imageState.fileName;
    } else if (imageState.action === 'remove') {
      payload.profileImage = null;
    }

    try {
      await onSave(payload);
      setStatusMessage({ type: 'success', text: 'Profil erfolgreich aktualisiert.' });
      setFormState((cur) => ({ ...cur, newPassword: '' }));
    } catch (error) {
      const message = error?.response?.data?.message || 'Aktualisierung fehlgeschlagen.';
      setStatusMessage({ type: 'error', text: message });
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <section className="rounded-3xl bg-white/85 p-5 shadow">
        <h2 className="text-base font-semibold text-brand-700">Deine Kontaktdaten</h2>
        <div className="mt-4 grid gap-3">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Vorname
            <input
              value={formState.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Nachname
            <input
              value={formState.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            E-Mail-Adresse
            <input
              type="email"
              value={formState.email}
              onChange={(e) => updateField('email', e.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Telefonnummer
            <input
              value={formState.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Adresse
            <input
              value={formState.address}
              onChange={(e) => updateField('address', e.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Postleitzahl
            <input
              value={formState.postalCode}
              onChange={(e) => updateField('postalCode', e.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Benutzername
            <input
              value={formState.username}
              onChange={(e) => updateField('username', e.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Neues Passwort (optional)
            <input
              type="password"
              value={formState.newPassword}
              onChange={(e) => updateField('newPassword', e.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              placeholder="Sicheres Passwort wählen"
            />
          </label>
        </div>
      </section>

      <section className="rounded-3xl bg-white/85 p-5 shadow">
        <h2 className="text-base font-semibold text-brand-700">Profilbild</h2>
        <div className="mt-4 flex items-center gap-4">
          <div className="h-20 w-20 overflow-hidden rounded-full border border-brand-200 bg-brand-50">
            {imageState.preview ? (
              <img src={imageState.preview} alt="Profilbild" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">Kein Bild</div>
            )}
          </div>

          <div className="flex flex-col gap-1 text-sm">
            <IconUploadButton label="Foto auswählen" accept="image/*" onChange={handleImageChange} />
            <span className="text-xs text-slate-500">
              {imageState.fileName ? `Ausgewählt: ${imageState.fileName}` : 'Optional: Hilft bei der Wiedererkennung.'}
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

      <section className="rounded-3xl bg-white/85 p-5 shadow">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-brand-700">Kinder & Alltag</h2>
          <span className="text-xs text-slate-500">
            {children.filter((c) => c.name.trim()).length} eingetragen
          </span>
        </div>
        <div className="mt-4">
          <ChildrenEditor childrenList={children} onChange={setChildren} />
        </div>
      </section>

      <section className="rounded-3xl bg-white/85 p-5 shadow">
        <h2 className="text-base font-semibold text-brand-700">Notizen für Tagespflegepersonen</h2>
        <label className="mt-4 flex flex-col gap-2 text-sm font-medium text-slate-700">
          Wunschliste & Besonderheiten
          <textarea
            value={formState.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            rows={4}
            className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
            placeholder="Was sollten Tagespflegepersonen über euch wissen?"
          />
        </label>
      </section>

      <div className="flex flex-col gap-3">
        <button
          type="submit"
          className="w-full rounded-2xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
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
    newPassword: '',
  });

  const [careTimes, setCareTimes] = useState(() =>
    profile.careTimes?.length ? profile.careTimes.map((e) => createScheduleEntry(e)) : [createScheduleEntry()],
  );
  const [dailySchedule, setDailySchedule] = useState(() =>
    profile.dailySchedule?.length ? profile.dailySchedule.map((e) => createScheduleEntry(e)) : [createScheduleEntry()],
  );

  const [closedDays, setClosedDays] = useState(() => (Array.isArray(profile.closedDays) ? [...profile.closedDays] : []));
  const [closedDayInput, setClosedDayInput] = useState('');

  const [roomGallery, setRoomGallery] = useState(() =>
    (profile.roomImages ?? []).map((r) => buildRoomGalleryItem(r)).filter(Boolean),
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
    (profile.contractDocuments ?? []).map((d) => buildContractDocumentItem(d)).filter(Boolean),
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
      newPassword: '',
    });

    setCareTimes(profile.careTimes?.length ? profile.careTimes.map((e) => createScheduleEntry(e)) : [createScheduleEntry()]);
    setDailySchedule(
      profile.dailySchedule?.length ? profile.dailySchedule.map((e) => createScheduleEntry(e)) : [createScheduleEntry()],
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

    setContractDocuments((profile.contractDocuments ?? []).map((d) => buildContractDocumentItem(d)).filter(Boolean));

    setRoomGallery((profile.roomImages ?? []).map((r) => buildRoomGalleryItem(r)).filter(Boolean));
    setRoomGalleryOffset(0);

    setStatusMessage((current) => (current?.type === 'success' ? current : null));
  }, [profile]);

  function updateField(field, value) {
    setFormState((cur) => ({ ...cur, [field]: value }));
  }

  function appendClosedDay(label) {
    const trimmed = label.trim();
    if (!trimmed) return false;
    setClosedDays((cur) => (cur.includes(trimmed) ? cur : [...cur, trimmed]));
    return true;
  }

  function handleAddClosedDay() {
    if (appendClosedDay(closedDayInput)) setClosedDayInput('');
  }

  function handleSuggestionClick(day) {
    appendClosedDay(day);
  }

  function handleRemoveClosedDay(day) {
    setClosedDays((cur) => cur.filter((d) => d !== day));
  }

  async function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setImageState({ preview: dataUrl, fileData: dataUrl, fileName: file.name, action: 'replace' });
    event.target.value = '';
  }

  function handleRemoveImage() {
    setImageState({ preview: '', fileData: null, fileName: '', action: 'remove' });
  }

  async function handleLogoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
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
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setConceptState({ fileName: file.name, fileData: dataUrl, action: 'replace' });
    event.target.value = '';
  }

  function handleRemoveConcept() {
    setConceptState({ fileName: '', fileData: null, action: 'remove' });
  }

  function handleAddContractDocument() {
    setContractDocuments((cur) => [...cur, { id: generateTempId(), name: '', file: null, fileData: null, fileName: '' }]);
  }

  function handleRemoveContractDocument(id) {
    setContractDocuments((cur) => cur.filter((d) => d.id !== id));
  }

  function updateContractDocument(id, field, value) {
    setContractDocuments((cur) => cur.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  }

  async function handleContractDocumentFileChange(id, event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    updateContractDocument(id, 'fileData', dataUrl);
    updateContractDocument(id, 'fileName', file.name);
    updateContractDocument(id, 'file', null);
    event.target.value = '';
  }

  async function handleRoomImagesChange(event) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

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
    if (!additions.length) return;

    setRoomGallery((cur) => {
      const next = [...cur, ...additions];
      setRoomGalleryOffset(() => (next.length <= 3 ? 0 : Math.max(0, next.length - 3)));
      return next;
    });

    event.target.value = '';
  }

  function handleRemoveRoomImage(imageId) {
    setRoomGallery((cur) => {
      const filtered = cur.filter((img) => img.id !== imageId);
      setRoomGalleryOffset((offset) => {
        if (!filtered.length || filtered.length <= 3) return 0;
        const normalized = offset % filtered.length;
        return normalized;
      });
      return filtered;
    });
  }

  function showPreviousRoomImages() {
    if (roomGallery.length <= 3) return;
    setRoomGalleryOffset((current) => {
      const total = roomGallery.length;
      return (current - 1 + total) % total;
    });
  }

  function showNextRoomImages() {
    if (roomGallery.length <= 3) return;
    setRoomGalleryOffset((current) => {
      const total = roomGallery.length;
      return (current + 1) % total;
    });
  }

  function deriveAge(value) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.valueOf())) return null;

    const now = new Date();
    let age = now.getFullYear() - date.getFullYear();
    const hasBirthdayPassed =
      now.getMonth() > date.getMonth() || (now.getMonth() === date.getMonth() && now.getDate() >= date.getDate());
    if (!hasBirthdayPassed) age -= 1;

    return age >= 0 ? age : null;
  }

  function deriveYears(value) {
    if (!value) return null;
    const date = new Date(`${value}-01`);
    if (Number.isNaN(date.valueOf())) return null;

    const now = new Date();
    let years = now.getFullYear() - date.getFullYear();
    const hasAnniversaryPassed =
      now.getMonth() > date.getMonth() || (now.getMonth() === date.getMonth() && now.getDate() >= date.getDate());
    if (!hasAnniversaryPassed) years -= 1;

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
      careTimes,
      dailySchedule,
      closedDays,
      roomImages: roomGallery
        .map((img) => (img.fileData ? { dataUrl: img.fileData, fileName: img.fileName } : img.source))
        .filter(Boolean),
      contractDocuments: contractDocuments
        .map((doc) => ({
          name: doc.name?.trim(),
          file: doc.fileData ? { dataUrl: doc.fileData, fileName: doc.fileName } : doc.file,
        }))
        .filter((doc) => doc.name && doc.file),
    };

    if (formState.newPassword.trim()) payload.password = formState.newPassword.trim();

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
      setFormState((cur) => ({ ...cur, newPassword: '' }));
      setConceptState({ fileName: '', fileData: null, action: 'keep' });
    } catch (error) {
      const message = error?.response?.data?.message || 'Aktualisierung fehlgeschlagen.';
      setStatusMessage({ type: 'error', text: message });
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <section className="rounded-3xl bg-white/85 p-5 shadow">
        <h2 className="text-base font-semibold text-brand-700">Basisdaten deiner Kindertagespflege</h2>

        <div className="mt-4 grid gap-3">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Vorname *
            <input
              value={formState.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Nachname *
            <input
              value={formState.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Geburtsdatum *
            <input
              type="date"
              value={formState.birthDate}
              onChange={(e) => updateField('birthDate', e.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
            <span className="text-xs text-slate-500">
              {computedAge !== null ? `Aktuell ${computedAge} Jahre alt.` : 'Geburtsdatum für automatische Altersaktualisierung.'}
            </span>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Name der Kindertagespflege *
            <input
              value={formState.daycareName}
              onChange={(e) => updateField('daycareName', e.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Seit wann aktiv
            <input
              type="month"
              value={formState.caregiverSince}
              onChange={(e) => updateField('caregiverSince', e.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
            />
            <span className="text-xs text-slate-500">
              {experienceYears !== null ? `${experienceYears} Jahre Erfahrung` : 'Optional: Zeigt deine Erfahrung.'}
            </span>
          </label>
        </div>
      </section>

      <section className="rounded-3xl bg-white/85 p-5 shadow">
        <h2 className="text-base font-semibold text-brand-700">Betreuungskapazitäten</h2>

        <div className="mt-4 grid gap-3">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Maximales Alter der Kinder
            <input
              type="number"
              min="0"
              value={formState.maxChildAge}
              onChange={(e) => updateField('maxChildAge', e.target.value)}
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
              onChange={(e) => updateField('childrenCount', e.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Anzahl freier Plätze
            <input
              type="number"
              min="0"
              value={formState.availableSpots}
              onChange={(e) => updateField('availableSpots', e.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Wann werden Plätze frei?
            <select
              value={formState.availabilityTiming}
              onChange={(e) => updateField('availabilityTiming', e.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
            >
              {AVAILABILITY_TIMING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-3xl bg-white/85 p-5 shadow">
        <h2 className="text-base font-semibold text-brand-700">Kontakt und Zugang</h2>

        <div className="mt-4 grid gap-3">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            E-Mail-Adresse *
            <input
              type="email"
              value={formState.email}
              onChange={(e) => updateField('email', e.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Telefonnummer *
            <input
              value={formState.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Adresse *
            <input
              value={formState.address}
              onChange={(e) => updateField('address', e.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Postleitzahl *
            <input
              value={formState.postalCode}
              onChange={(e) => updateField('postalCode', e.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Ort *
            <input
              value={formState.city}
              onChange={(e) => updateField('city', e.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Benutzername *
            <input
              value={formState.username}
              onChange={(e) => updateField('username', e.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Neues Passwort (optional)
            <input
              type="password"
              value={formState.newPassword}
              onChange={(e) => updateField('newPassword', e.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              placeholder="Sicheres Passwort wählen"
            />
          </label>
        </div>
      </section>

      <section className="rounded-3xl bg-white/85 p-5 shadow">
        <h2 className="text-base font-semibold text-brand-700">Betreuungszeiten</h2>
        <div className="mt-4">
          <ScheduleEditor title="Bring- und Abholzeiten inkl. Aktivität." entries={careTimes} onChange={setCareTimes} />
        </div>
      </section>

      <section className="rounded-3xl bg-white/85 p-5 shadow">
        <h2 className="text-base font-semibold text-brand-700">Betreuungsfreie Tage</h2>
        <p className="mt-1 text-xs text-slate-500">Wochentage oder Hinweise, an denen keine Betreuung stattfindet.</p>

        <div className="mt-4 flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              value={closedDayInput}
              onChange={(e) => setClosedDayInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddClosedDay();
                }
              }}
              className="flex-1 rounded-xl border border-brand-200 px-4 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
              placeholder="z. B. Samstag oder Feiertage"
            />
            <button
              type="button"
              onClick={handleAddClosedDay}
              className="rounded-xl border border-brand-200 px-4 py-2 text-xs font-semibold text-brand-600 hover:border-brand-400 hover:text-brand-700"
            >
              Hinzufügen
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {WEEKDAY_SUGGESTIONS.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => handleSuggestionClick(day)}
                className="rounded-full border border-dashed border-brand-200 px-3 py-1 text-xs font-semibold text-brand-600 hover:border-brand-400 hover:text-brand-700"
              >
                {day}
              </button>
            ))}
          </div>

          {closedDays.length ? (
            <ul className="flex flex-wrap gap-2">
              {closedDays.map((day) => (
                <li key={day} className="flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
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

      <section className="rounded-3xl bg-white/85 p-5 shadow">
        <h2 className="text-base font-semibold text-brand-700">Tagesablauf</h2>
        <div className="mt-4">
          <ScheduleEditor title="Chronologischer Tagesablauf inkl. Zeiten & Aktivität." entries={dailySchedule} onChange={setDailySchedule} />
        </div>
      </section>

      <section className="rounded-3xl bg-white/85 p-5 shadow">
        <h2 className="text-base font-semibold text-brand-700">Essensplan</h2>
        <p className="mt-1 text-xs text-slate-500">Überblick zu Frühstück, Mittagessen, Snacks etc.</p>
        <textarea
          value={formState.mealPlan}
          onChange={(e) => updateField('mealPlan', e.target.value)}
          rows={4}
          className="mt-4 w-full rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
          placeholder="Beschreibe Frühstück, Mittagessen und Snacks."
        />
      </section>

      <section className="rounded-3xl bg-white/85 p-5 shadow">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-brand-700">Vertragsunterlagen</h2>
            <p className="mt-1 text-xs text-slate-500">Optional – nur PDF hochladen.</p>
          </div>

          <button
            type="button"
            onClick={handleAddContractDocument}
            className="shrink-0 rounded-xl border border-brand-200 px-3 py-2 text-xs font-semibold text-brand-600 hover:border-brand-400 hover:text-brand-700"
          >
            + Dokument
          </button>
        </div>

        <div className="mt-4">
          {contractDocuments.length ? (
            <div className="flex flex-col gap-3">
              {contractDocuments.map((document) => (
                <div key={document.id} className="rounded-2xl border border-brand-100 bg-white/70 p-4">
                  <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Name des Dokuments
                    <input
                      value={document.name}
                      onChange={(e) => updateContractDocument(document.id, 'name', e.target.value)}
                      className="rounded-xl border border-brand-200 px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
                      placeholder="z. B. Betreuungsvertrag"
                    />
                  </label>

                  <div className="mt-3 flex flex-col gap-2 text-sm">
                    <IconUploadButton
                      label="PDF hochladen"
                      accept="application/pdf"
                      onChange={(e) => handleContractDocumentFileChange(document.id, e)}
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
              Noch keine Vertragsunterlagen hinzugefügt.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-3xl bg-white/85 p-5 shadow">
        <h2 className="text-base font-semibold text-brand-700">Profil, Logo & Team</h2>

        <div className="mt-4 flex flex-col gap-5">
          <div>
            <p className="text-sm font-medium text-slate-700">Profilbild</p>
            <div className="mt-3 flex items-center gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-full border border-brand-200 bg-brand-50">
                {imageState.preview ? (
                  <img src={imageState.preview} alt="Profilbild" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">Kein Bild</div>
                )}
              </div>
              <div className="flex flex-col gap-1 text-sm">
                <IconUploadButton label="Profilbild wählen" accept="image/*" onChange={handleImageChange} />
                <span className="text-xs text-slate-500">
                  {imageState.fileName ? `Ausgewählt: ${imageState.fileName}` : 'Dieses Bild erscheint in deinem öffentlichen Profil.'}
                </span>
                {imageState.preview || (profile.profileImageUrl && imageState.action !== 'remove') ? (
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
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700">Logo</p>
            <div className="mt-3 flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-brand-200 bg-brand-50">
                {logoState.preview ? (
                  <img src={logoState.preview} alt="Logo" className="h-full w-full object-contain" />
                ) : (
                  <span className="text-xs text-slate-400">Kein Logo</span>
                )}
              </div>
              <div className="flex flex-col gap-1 text-sm">
                <IconUploadButton label="Logo hochladen" accept="image/*" onChange={handleLogoChange} />
                <span className="text-xs text-slate-500">
                  {logoState.fileName ? `Ausgewählt: ${logoState.fileName}` : 'Optional, sorgt für Wiedererkennung.'}
                </span>
                {logoState.preview && logoState.action !== 'remove' ? (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="self-start text-xs font-semibold text-rose-600 hover:text-rose-700"
                  >
                    Logo entfernen
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700">Konzeption (PDF)</p>
            <div className="mt-3 flex flex-col gap-1 text-sm">
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
              {profile.conceptUrl && conceptState.action !== 'remove' ? (
                <button
                  type="button"
                  onClick={handleRemoveConcept}
                  className="self-start text-xs font-semibold text-rose-600 hover:text-rose-700"
                >
                  Konzeption entfernen
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white/85 p-5 shadow">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-brand-700">Räumlichkeiten</h2>
            <p className="mt-1 text-xs text-slate-500">Maximal 3 Bilder sichtbar. Weitere per Pfeile.</p>
          </div>

          <div className="flex items-center gap-2">
            {showRoomNavigation ? (
              <>
                <button
                  type="button"
                  onClick={showPreviousRoomImages}
                  className="rounded-xl border border-brand-200 px-3 py-2 text-xs font-semibold text-brand-600 hover:border-brand-400 hover:text-brand-700"
                  aria-label="Vorherige Raumbilder anzeigen"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={showNextRoomImages}
                  className="rounded-xl border border-brand-200 px-3 py-2 text-xs font-semibold text-brand-600 hover:border-brand-400 hover:text-brand-700"
                  aria-label="Nächste Raumbilder anzeigen"
                >
                  →
                </button>
              </>
            ) : null}

            <IconUploadButton label="Bilder" accept="image/*" multiple onChange={handleRoomImagesChange} />
          </div>
        </div>

        <div className="mt-4">
          {roomGallery.length ? (
            <div className="grid grid-cols-1 gap-3">
              {visibleRoomImages.map((image) => (
                <div key={image.id} className="relative h-44 w-full overflow-hidden rounded-3xl border border-brand-100 bg-brand-50">
                  <img src={image.preview} alt="Räumlichkeit" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveRoomImage(image.id)}
                    className="absolute right-2 top-2 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-rose-600 shadow hover:bg-white"
                  >
                    Entfernen
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-brand-200 bg-white/60 px-4 py-6 text-sm text-slate-500">
              Noch keine Bilder ausgewählt.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-3xl bg-white/85 p-5 shadow">
        <h2 className="text-base font-semibold text-brand-700">Über dich</h2>

        <label className="mt-4 flex flex-col gap-2 text-sm font-medium text-slate-700">
          Kurzbeschreibung
          <input
            value={formState.shortDescription}
            onChange={(e) => updateField('shortDescription', e.target.value)}
            className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
            placeholder="Wofür steht deine Kindertagespflege?"
          />
        </label>

        <label className="mt-4 flex flex-col gap-2 text-sm font-medium text-slate-700">
          Ausführliche Vorstellung
          <textarea
            value={formState.bio}
            onChange={(e) => updateField('bio', e.target.value)}
            rows={6}
            className="rounded-xl border border-brand-200 px-4 py-3 text-sm shadow-sm focus:border-brand-400 focus:outline-none"
            placeholder="Erfahrungen, Schwerpunkte und besondere Momente"
          />
        </label>
      </section>

      <div className="flex flex-col gap-3">
        <button
          type="submit"
          className="w-full rounded-2xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
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
          className="mt-1 inline-flex w-fit items-center gap-2 rounded-full border border-brand-200 px-4 py-2 text-xs font-semibold text-brand-600 transition hover:border-brand-400 hover:text-brand-700"
        >
          Jahresquittung (60 €) herunterladen
        </a>
      </div>
    </form>
  );
}

function PushNotificationSettings({ userId }) {
  const [isSupported] = useState(() => isPushSupported());
  const [permission, setPermission] = useState(() =>
    isPushSupported() ? getNotificationPermission() : 'default',
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isSupported) return;

    let isActive = true;

    async function loadSubscription() {
      try {
        const subscription = await getActivePushSubscription();
        if (isActive) {
          setIsSubscribed(Boolean(subscription));
        }
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
        setStatusMessage({
          type: 'error',
          text: 'Push-Benachrichtigungen werden in diesem Browser nicht unterstützt.',
        });
        return;
      }

      let permissionState = getNotificationPermission();
      if (permissionState !== 'granted') {
        permissionState = await requestNotificationPermission();
      }

      setPermission(permissionState);

      if (permissionState !== 'granted') {
        setStatusMessage({
          type: 'error',
          text: 'Bitte erlaube Benachrichtigungen in den Browser-Einstellungen.',
        });
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
        await axios.delete('/api/push-subscriptions', {
          data: { userId, endpoint: subscription.endpoint },
        });
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
    <section className="rounded-2xl border border-brand-100 bg-white/80 p-4 shadow-sm">
      <div className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-brand-700">Push-Benachrichtigungen</h2>
        <p className="text-sm text-slate-600">
          Aktiviere Push, um neue Nachrichten direkt auf dem Homescreen zu sehen.
        </p>

        {!isSupported ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Push ist hier nicht verfügbar. Bitte installiere die App über „Zum Home-Bildschirm“
            und erlaube Benachrichtigungen in Safari.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>Permission: {permission}</span>
              <span>•</span>
              <span>Status: {isSubscribed ? 'aktiv' : 'inaktiv'}</span>
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
            className={`rounded-xl border px-3 py-2 text-xs ${
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

export default function ProfilePageMobile() {
  const { user, updateUser } = useAuth();
  const { profile, loading, error, setProfile } = useProfileData(user);
  const [saving, setSaving] = useState(false);

  const title = useMemo(() => {
    if (user?.role === 'caregiver') return 'Profil für Kindertagespflegepersonen bearbeiten';
    return 'Profil für Eltern bearbeiten';
  }, [user]);

  if (!user) return null;

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
    <section className="mx-auto flex w-full max-w-xl flex-col gap-4 rounded-3xl bg-white/85 p-5 shadow-lg">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Profil</p>
        <h1 className="text-2xl font-semibold text-brand-700">{title}</h1>
        <p className="text-sm text-slate-600">
          Aktualisiere dein Profil, um Familien und Tagespflegepersonen stets mit den neuesten Informationen zu versorgen.
        </p>
      </header>

      <PushNotificationSettings userId={user.id} />

      {loading ? <p className="text-sm text-slate-500">Profil wird geladen…</p> : null}
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      ) : null}

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
