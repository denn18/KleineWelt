import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import IconUploadButton from '../components/IconUploadButton.jsx';
import { readFileAsDataUrl } from '../utils/file.js';

const createScheduleEntry = (defaults = {}) => ({
  startTime: '',
  endTime: '',
  activity: '',
  ...defaults,
});

function calculateAgeFromDateString(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    return null;
  }
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const hasHadBirthday =
    now.getMonth() > date.getMonth() || (now.getMonth() === date.getMonth() && now.getDate() >= date.getDate());
  if (!hasHadBirthday) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

function calculateYearsSince(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    return null;
  }
  const now = new Date();
  let years = now.getFullYear() - date.getFullYear();
  const anniversaryReached =
    now.getMonth() > date.getMonth() || (now.getMonth() === date.getMonth() && now.getDate() >= date.getDate());
  if (!anniversaryReached) {
    years -= 1;
  }
  return years >= 0 ? years : null;
}

function buildInitialState() {
  return {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    postalCode: '',
    city: '',
    daycareName: '',
    availableSpots: 0,
    hasAvailability: true,
    childrenCount: 0,
    birthDate: '',
    caregiverSince: '',
    maxChildAge: '',
    bio: '',
    shortDescription: '',
    mealPlan: '',
    careTimes: [createScheduleEntry({ startTime: '07:30', endTime: '09:00', activity: 'Bringzeit' })],
    dailySchedule: [createScheduleEntry()],
    closedDays: [],
    username: '',
    password: '',
  };
}

function CaregiverSignupPage() {
  const [formState, setFormState] = useState(buildInitialState);
  const [profileImage, setProfileImage] = useState({ preview: '', dataUrl: null, fileName: '' });
  const [logoImage, setLogoImage] = useState({ preview: '', dataUrl: null, fileName: '' });
  const [conceptFile, setConceptFile] = useState({ dataUrl: null, fileName: '' });
  const [roomGallery, setRoomGallery] = useState([]);
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [roomGalleryOffset, setRoomGalleryOffset] = useState(0);
  const [closedDayInput, setClosedDayInput] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const computedAge = calculateAgeFromDateString(formState.birthDate);
  const experienceYears = calculateYearsSince(formState.caregiverSince);
  const visibleRoomImages =
    roomGallery.length <= 3
      ? roomGallery
      : Array.from({ length: 3 }, (_, index) => roomGallery[(roomGalleryOffset + index) % roomGallery.length]);
  const showRoomNavigation = roomGallery.length > 3;

  function updateField(field, value) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  function updateScheduleEntry(listName, index, field, value) {
    setFormState((current) => {
      const entries = current[listName].map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry
      );
      return { ...current, [listName]: entries };
    });
  }

  function addScheduleEntry(listName, defaults = {}) {
    setFormState((current) => ({
      ...current,
      [listName]: [...current[listName], createScheduleEntry(defaults)],
    }));
  }

  function removeScheduleEntry(listName, index) {
    setFormState((current) => {
      if (current[listName].length <= 1) {
        return current;
      }
      return {
        ...current,
        [listName]: current[listName].filter((_, entryIndex) => entryIndex !== index),
      };
    });
  }

  function handleAddCareTime() {
    addScheduleEntry('careTimes');
  }

  function handleRemoveCareTime(index) {
    removeScheduleEntry('careTimes', index);
  }

  function handleAddDailySchedule() {
    addScheduleEntry('dailySchedule');
  }

  function handleRemoveDailySchedule(index) {
    removeScheduleEntry('dailySchedule', index);
  }

  function handleAddClosedDay() {
    const trimmed = closedDayInput.trim();
    if (!trimmed) {
      return;
    }
    setFormState((current) => {
      if (current.closedDays.includes(trimmed)) {
        return current;
      }
      return {
        ...current,
        closedDays: [...current.closedDays, trimmed],
      };
    });
    setClosedDayInput('');
  }

  function handleRemoveClosedDay(day) {
    setFormState((current) => ({
      ...current,
      closedDays: current.closedDays.filter((entry) => entry !== day),
    }));
  }

  async function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    setProfileImage({ preview: dataUrl, dataUrl, fileName: file.name });
  }

  async function handleLogoChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    setLogoImage({ preview: dataUrl, dataUrl, fileName: file.name });
  }

  async function handleConceptChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    setConceptFile({ dataUrl, fileName: file.name });
  }

  function generateTempId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  async function handleRoomImagesChange(event) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) {
      return;
    }

    const additions = [];
    for (const file of files) {
      const dataUrl = await readFileAsDataUrl(file);
      additions.push({ id: generateTempId(), preview: dataUrl, dataUrl, fileName: file.name });
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

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);

    try {
      const computedAge = calculateAgeFromDateString(formState.birthDate);

      const response = await axios.post('/api/caregivers', {
        ...formState,
        availableSpots: Number(formState.availableSpots),
        hasAvailability: Boolean(formState.hasAvailability),
        childrenCount: Number(formState.childrenCount),
        age: computedAge ?? null,
        maxChildAge: formState.maxChildAge ? Number(formState.maxChildAge) : null,
        profileImage: profileImage.dataUrl,
        profileImageName: profileImage.fileName,
        logoImage: logoImage.dataUrl,
        logoImageName: logoImage.fileName,
        conceptFile: conceptFile.dataUrl,
        conceptFileName: conceptFile.fileName,
        caregiverSince: formState.caregiverSince,
        birthDate: formState.birthDate,
        careTimes: formState.careTimes,
        dailySchedule: formState.dailySchedule,
        mealPlan: formState.mealPlan,
        roomImages: roomGallery.map((image) => ({ dataUrl: image.dataUrl, fileName: image.fileName })),
        closedDays: formState.closedDays,
      });

      setStatus({
        type: 'success',
        message: 'Vielen Dank! Dein Profil ist angelegt und wird Familien angezeigt.',
      });

      try {
        await login(formState.username, formState.password);
        setStatus({
          type: 'success',
          message: 'Profil erstellt! Du wirst gleich zu deinem Dashboard weitergeleitet.',
        });
        setTimeout(() => {
          navigate('/profil', {
            replace: true,
            state: { fromRegistration: true, role: response.data?.role || 'caregiver' },
          });
        }, 1200);
      } catch (authError) {
        console.warn('Automatisches Login nach Registrierung nicht möglich', authError);
        setStatus({
          type: 'success',
          message: 'Profil gespeichert! Bitte melde dich jetzt mit deinen Zugangsdaten an.',
        });
      }

      setFormState(buildInitialState());
      setProfileImage({ preview: '', dataUrl: null, fileName: '' });
      setLogoImage({ preview: '', dataUrl: null, fileName: '' });
      setConceptFile({ dataUrl: null, fileName: '' });
      setRoomGallery([]);
      setRoomGalleryOffset(0);
      setClosedDayInput('');
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
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 rounded-3xl bg-white/90 p-12 shadow-xl">
      <header className="text-center">
        <h1 className="text-3xl font-semibold text-brand-700">Profil für Tagespflegepersonen</h1>
        <p className="mt-2 text-sm text-slate-600">
          Erzähl Familien, welche Betreuung du anbietest und wo sie dich finden können.
        </p>
      </header>
      <form className="grid gap-6" onSubmit={handleSubmit}>
        <section className="grid gap-4 rounded-3xl bg-white/80 p-6 shadow">
          <h2 className="text-lg font-semibold text-brand-700">Basisdaten deiner Kindertagespflege</h2>
          <div className="grid gap-4 sm:grid-cols-3">
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
              Geburtsdatum
              <span className="text-rose-500" aria-hidden="true">*</span>
              <span className="sr-only">Pflichtfeld</span>
            </span>
            <input
              type="date"
              value={formState.birthDate}
              onChange={(event) => updateField('birthDate', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
              required
              aria-required="true"
            />
            <span className="text-xs text-slate-500">
              {computedAge !== null ? `Aktuell ${computedAge} Jahre alt.` : 'So bleibt dein Alter automatisch aktuell.'}
            </span>
          </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
              <span className="flex items-center gap-1">
                Name deiner Kindertagespflege
                <span className="text-rose-500" aria-hidden="true">*</span>
                <span className="sr-only">Pflichtfeld</span>
            </span>
            <input
              value={formState.daycareName}
              onChange={(event) => updateField('daycareName', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
              required
              aria-required="true"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Seit wann aktiv
            <input
              type="month"
              value={formState.caregiverSince}
              onChange={(event) => updateField('caregiverSince', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
            />
            <span className="text-xs text-slate-500">
              {experienceYears !== null ? `${experienceYears} Jahre Erfahrung` : 'Optional: Sichtbar im Profil.'}
            </span>
          </label>
<<<<<<< Updated upstream
=======
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
>>>>>>> Stashed changes
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
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
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Maximales Alter der Kinder
            <input
              type="number"
              min="0"
              value={formState.maxChildAge}
              onChange={(event) => updateField('maxChildAge', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
              placeholder="z. B. 6"
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
        </section>
        <section className="grid gap-4 rounded-3xl bg-white/80 p-6 shadow">
          <h2 className="text-lg font-semibold text-brand-700">Kontakt & Standort</h2>
          <div className="grid gap-4 sm:grid-cols-2">
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
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
              <span className="flex items-center gap-1">
                Adresse
                <span className="text-rose-500" aria-hidden="true">*</span>
                <span className="sr-only">Pflichtfeld</span>
              </span>
              <input
                value={formState.address}
                onChange={(event) => updateField('address', event.target.value)}
                className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
                required
                aria-required="true"
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
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              <span className="flex items-center gap-1">
                Ort
                <span className="text-rose-500" aria-hidden="true">*</span>
                <span className="sr-only">Pflichtfeld</span>
              </span>
              <input
                value={formState.city}
                onChange={(event) => updateField('city', event.target.value)}
                className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
                required
                aria-required="true"
              />
            </label>
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl bg-white/80 p-6 shadow">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-brand-700">Profil, Logo & Unterlagen</h2>
            <p className="text-xs text-slate-500">
              Lade ein freundliches Profilfoto, dein Logo und deine pädagogische Konzeption hoch.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex items-center gap-4 rounded-2xl border border-brand-100 bg-white/70 p-4">
              <div className="h-28 w-28 overflow-hidden rounded-full border border-brand-200 bg-brand-50">
                {profileImage.preview ? (
                  <img src={profileImage.preview} alt="Profilbild" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">Kein Bild</div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <p className="text-sm font-semibold text-brand-700">Profilbild</p>
                <IconUploadButton label="Profilbild wählen" accept="image/*" onChange={handleImageChange} />
                <span className="text-xs text-slate-500">
                  {profileImage.fileName
                    ? `Ausgewählt: ${profileImage.fileName}`
                    : 'Pflichtfeld für die Profilansicht deiner Tagespflege.'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-brand-100 bg-white/70 p-4">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-brand-200 bg-brand-50">
                {logoImage.preview ? (
                  <img src={logoImage.preview} alt="Logo" className="h-full w-full object-contain" />
                ) : (
                  <span className="text-xs text-slate-400">Kein Logo</span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <p className="text-sm font-semibold text-brand-700">Logo deiner Kindertagespflege</p>
                <IconUploadButton label="Logo hochladen" accept="image/*" onChange={handleLogoChange} />
                <span className="text-xs text-slate-500">
                  {logoImage.fileName
                    ? `Ausgewählt: ${logoImage.fileName}`
                    : 'Optional, sorgt für Wiedererkennung bei Familien.'}
                </span>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-dashed border-brand-200 bg-white/70 p-4">
            <p className="text-sm font-semibold text-brand-700">Konzeption (PDF)</p>
            <p className="mt-1 text-xs text-slate-500">
              Teile Familien deine pädagogische Ausrichtung und Schwerpunkte mit.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <IconUploadButton label="PDF auswählen" accept="application/pdf" onChange={handleConceptChange} />
              <span className="text-xs text-slate-500 sm:ml-3">
                {conceptFile.fileName
                  ? `Ausgewählt: ${conceptFile.fileName}`
                  : 'Optional, hilft Familien bei der Entscheidungsfindung.'}
              </span>
            </div>
          </div>
        </section>
        <section className="grid gap-3 rounded-2xl border border-brand-100 bg-white/80 p-6">
          <div>
            <h2 className="text-lg font-semibold text-brand-700">Betreuungsfreie Tage</h2>
            <p className="text-xs text-slate-500">Lege fest, an welchen Tagen regulär keine Betreuung stattfindet.</p>
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
            {formState.closedDays.length ? (
              <ul className="flex flex-wrap gap-2">
                {formState.closedDays.map((day) => (
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
        <section className="grid gap-4 rounded-2xl border border-brand-100 bg-white/80 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-brand-700">Betreuungszeiten</h2>
              <p className="text-xs text-slate-500">
                Starte mit der Bringzeit und ergänze weitere Zeitfenster inklusive Aktivität.
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
            {formState.careTimes.map((entry, index) => (
              <div key={`care-${index}`} className="grid gap-3 sm:grid-cols-3 sm:items-end">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Von
                  <input
                    type="time"
                    value={entry.startTime}
                    onChange={(event) => updateScheduleEntry('careTimes', index, 'startTime', event.target.value)}
                    className="rounded-xl border border-brand-200 px-4 py-2 text-base shadow-sm focus:border-brand-400 focus:outline-none"
                    required
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Bis
                  <input
                    type="time"
                    value={entry.endTime}
                    onChange={(event) => updateScheduleEntry('careTimes', index, 'endTime', event.target.value)}
                    className="rounded-xl border border-brand-200 px-4 py-2 text-base shadow-sm focus:border-brand-400 focus:outline-none"
                    required
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Aktivität
                  <input
                    value={entry.activity}
                    onChange={(event) => updateScheduleEntry('careTimes', index, 'activity', event.target.value)}
                    className="rounded-xl border border-brand-200 px-4 py-2 text-base shadow-sm focus:border-brand-400 focus:outline-none"
                    placeholder="z. B. Bringzeit"
                    required
                  />
                </label>
                {formState.careTimes.length > 1 ? (
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
        <section className="grid gap-4 rounded-2xl border border-brand-100 bg-white/80 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-brand-700">Tagesablauf</h2>
              <p className="text-xs text-slate-500">
                Beschreibe chronologisch, was die Kinder im Laufe des Tages erwartet.
              </p>
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
            {formState.dailySchedule.map((entry, index) => (
              <div key={`daily-${index}`} className="grid gap-3 sm:grid-cols-3 sm:items-end">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Von
                  <input
                    type="time"
                    value={entry.startTime}
                    onChange={(event) => updateScheduleEntry('dailySchedule', index, 'startTime', event.target.value)}
                    className="rounded-xl border border-brand-200 px-4 py-2 text-base shadow-sm focus:border-brand-400 focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Bis
                  <input
                    type="time"
                    value={entry.endTime}
                    onChange={(event) => updateScheduleEntry('dailySchedule', index, 'endTime', event.target.value)}
                    className="rounded-xl border border-brand-200 px-4 py-2 text-base shadow-sm focus:border-brand-400 focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  Aktivität
                  <input
                    value={entry.activity}
                    onChange={(event) => updateScheduleEntry('dailySchedule', index, 'activity', event.target.value)}
                    className="rounded-xl border border-brand-200 px-4 py-2 text-base shadow-sm focus:border-brand-400 focus:outline-none"
                    placeholder="z. B. Gemeinsames Frühstück"
                  />
                </label>
                {formState.dailySchedule.length > 1 ? (
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
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Essensplan
          <textarea
            value={formState.mealPlan}
            onChange={(event) => updateField('mealPlan', event.target.value)}
            rows={4}
            className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
            placeholder="Beschreibe, welche Mahlzeiten du anbietest."
          />
        </label>
        <section className="grid gap-5 rounded-2xl border border-brand-100 bg-white/80 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-brand-700">Räumlichkeiten</h2>
              <p className="text-xs text-slate-500">
                Zeige Familien, wie deine Räume aussehen. Maximal drei Bilder werden gleichzeitig dargestellt.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {showRoomNavigation ? (
                <div className="hidden items-center gap-2 sm:flex">
                  <button
                    type="button"
                    onClick={showPreviousRoomImages}
                    className="rounded-full border border-brand-200 px-3 py-1 text-xs font-semibold text-brand-600 transition hover:border-brand-400 hover:text-brand-700"
                    aria-label="Vorherige Raumbilder anzeigen"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={showNextRoomImages}
                    className="rounded-full border border-brand-200 px-3 py-1 text-xs font-semibold text-brand-600 transition hover:border-brand-400 hover:text-brand-700"
                    aria-label="Nächste Raumbilder anzeigen"
                  >
                    →
                  </button>
                </div>
              ) : null}
              <IconUploadButton
                label="Raumbilder hochladen"
                accept="image/*"
                multiple
                onChange={handleRoomImagesChange}
              />
            </div>
          </div>
          {roomGallery.length ? (
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-3">
                {visibleRoomImages.map((image) => (
                  <div
                    key={image.id}
                    className="relative h-40 w-full overflow-hidden rounded-3xl border border-brand-100 bg-brand-50"
                  >
                    <img src={image.preview} alt="Räumlichkeit" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveRoomImage(image.id)}
                      className="absolute right-2 top-2 rounded-full bg-white/85 px-2 py-1 text-[10px] font-semibold text-rose-600 shadow hover:bg-white"
                    >
                      Entfernen
                    </button>
                  </div>
                ))}
              </div>
              {showRoomNavigation ? (
                <div className="flex items-center justify-center gap-3 sm:hidden">
                  <button
                    type="button"
                    onClick={showPreviousRoomImages}
                    className="rounded-full border border-brand-200 px-3 py-1 text-xs font-semibold text-brand-600 transition hover:border-brand-400 hover:text-brand-700"
                    aria-label="Vorherige Raumbilder anzeigen"
                  >
                    ←
                  </button>
                  <span className="text-xs text-slate-500">Weitere Bilder mit den Pfeilen ansehen.</span>
                  <button
                    type="button"
                    onClick={showNextRoomImages}
                    className="rounded-full border border-brand-200 px-3 py-1 text-xs font-semibold text-brand-600 transition hover:border-brand-400 hover:text-brand-700"
                    aria-label="Nächste Raumbilder anzeigen"
                  >
                    →
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-brand-200 bg-white/60 px-4 py-6 text-sm text-slate-500">
              Noch keine Bilder ausgewählt. Lade Fotos deiner Räume hoch, um Eltern einen Eindruck zu vermitteln.
            </p>
          )}
        </section>
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
