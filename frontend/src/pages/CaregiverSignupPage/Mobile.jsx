import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext.jsx';
import IconUploadButton from '../../components/IconUploadButton.jsx';
import { readFileAsDataUrl } from '../../utils/file.js';
import { AVAILABILITY_TIMING_OPTIONS } from '../../utils/availability.js';
import { WEEKDAY_SUGGESTIONS } from '../../utils/weekdays.js';
import { trackEvent } from '../utils/analytics.js';

const createScheduleEntry = (defaults = {}) => ({
  startTime: '',
  endTime: '',
  activity: '',
  ...defaults,
});

function calculateAgeFromDateString(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return null;
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const hasHadBirthday =
    now.getMonth() > date.getMonth() || (now.getMonth() === date.getMonth() && now.getDate() >= date.getDate());
  if (!hasHadBirthday) age -= 1;
  return age >= 0 ? age : null;
}

function calculateYearsSince(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return null;
  const now = new Date();
  let years = now.getFullYear() - date.getFullYear();
  const anniversaryReached =
    now.getMonth() > date.getMonth() || (now.getMonth() === date.getMonth() && now.getDate() >= date.getDate());
  if (!anniversaryReached) years -= 1;
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
    availabilityTiming: 'aktuell',
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

function generateTempId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function Mobile() {
  const [showWarning, setShowWarning] = useState(true);

  const [formState, setFormState] = useState(buildInitialState);
  const [profileImage, setProfileImage] = useState({ preview: '', dataUrl: null, fileName: '' });
  const [logoImage, setLogoImage] = useState({ preview: '', dataUrl: null, fileName: '' });
  const [conceptFile, setConceptFile] = useState({ dataUrl: null, fileName: '' });
  const [roomGallery, setRoomGallery] = useState([]);
  const [roomGalleryOffset, setRoomGalleryOffset] = useState(0);

  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [closedDayInput, setClosedDayInput] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
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
      if (current[listName].length <= 1) return current;
      return {
        ...current,
        [listName]: current[listName].filter((_, entryIndex) => entryIndex !== index),
      };
    });
  }

  function handleAddClosedDay(value = closedDayInput) {
    const trimmed = value.trim();
    if (!trimmed) return;

    setFormState((current) => {
      if (current.closedDays.includes(trimmed)) return current;
      return { ...current, closedDays: [...current.closedDays, trimmed] };
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
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setProfileImage({ preview: dataUrl, dataUrl, fileName: file.name });
  }

  async function handleLogoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setLogoImage({ preview: dataUrl, dataUrl, fileName: file.name });
  }

  async function handleConceptChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setConceptFile({ dataUrl, fileName: file.name });
  }

  async function handleRoomImagesChange(event) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    const additions = [];
    for (const file of files) {
      const dataUrl = await readFileAsDataUrl(file);
      additions.push({ id: generateTempId(), preview: dataUrl, dataUrl, fileName: file.name });
    }

    if (!additions.length) return;

    setRoomGallery((current) => {
      const next = [...current, ...additions];
      setRoomGalleryOffset(() => (next.length <= 3 ? 0 : Math.max(0, next.length - 3)));
      return next;
    });

    event.target.value = '';
  }

  function handleRemoveRoomImage(imageId) {
    setRoomGallery((current) => {
      const filtered = current.filter((img) => img.id !== imageId);
      setRoomGalleryOffset((offset) => {
        if (!filtered.length || filtered.length <= 3) return 0;
        return offset % filtered.length;
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

  async function handleSubmit(event) {
    event.preventDefault();
    const pagePath = location.pathname;
    trackEvent('register_click', {
      event_category: 'engagement',
      event_label: 'create_account',
      page_path: pagePath,
    });
    trackEvent('form_submit', { form_name: 'caregiver_signup' });
    setSubmitting(true);
    setStatus(null);

    try {
      const computedAgeLocal = calculateAgeFromDateString(formState.birthDate);

      const response = await axios.post('/api/caregivers', {
        ...formState,
        availableSpots: Number(formState.availableSpots),
        hasAvailability: Boolean(formState.hasAvailability),
        availabilityTiming: formState.availabilityTiming,
        childrenCount: Number(formState.childrenCount),
        age: computedAgeLocal ?? null,
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

        roomImages: roomGallery.map((img) => ({ dataUrl: img.dataUrl, fileName: img.fileName })),
        closedDays: formState.closedDays,
      });

      setStatus({ type: 'success', message: 'Vielen Dank! Dein Profil ist angelegt und wird Familien angezeigt.' });
      trackEvent('register_success', { page_path: pagePath });
      trackEvent('form_success', { form_name: 'caregiver_signup' });

      try {
        await login(formState.username, formState.password);
        setStatus({ type: 'success', message: 'Profil erstellt! Du wirst gleich zu deinem Dashboard weitergeleitet.' });
        setTimeout(() => {
          navigate('/profil', {
            replace: true,
            state: { fromRegistration: true, role: response.data?.role || 'caregiver' },
          });
        }, 1200);
      } catch (authError) {
        console.warn('Automatisches Login nach Registrierung nicht möglich', authError);
        setStatus({ type: 'success', message: 'Profil gespeichert! Bitte melde dich jetzt mit deinen Zugangsdaten an.' });
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
      const reason = error?.response?.data?.message || error?.message;
      trackEvent('register_error', reason ? { reason, page_path: pagePath } : { page_path: pagePath });
      trackEvent('form_error', reason ? { form_name: 'caregiver_signup', reason } : { form_name: 'caregiver_signup' });
      setStatus({
        type: 'error',
        message: error.response?.data?.message || 'Etwas ist schiefgelaufen. Bitte versuche es später erneut.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  // 1) Warnung zuerst
  if (showWarning) {
    return (
      <section className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-3xl bg-white/90 p-6 shadow-lg">
        <header className="text-center">
          <h1 className="text-2xl font-extrabold text-brand-700">Tagespflegeprofil</h1>
          <p className="mt-2 text-sm text-slate-600">
            Wir empfehlen die Profilerstellung auf einem Laptop oder Computer durchzuführen.
          </p>
        </header>

        <button
          type="button"
          onClick={() => setShowWarning(false)}
          className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand-700"
        >
          Trotzdem fortfahren
        </button>

        <Link to="/anmelden" className="text-center text-sm font-semibold text-brand-600 hover:text-brand-700">
          Zurück zur Rollenwahl
        </Link>
      </section>
    );
  }

  // 2) Dann Formular (mobil-friendly Layout, gleiche Logik wie Web-App)
  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-3xl bg-white/90 p-6 shadow-lg">
      <header className="text-center">
        <h1 className="text-2xl font-semibold text-brand-700">Profil für Kindertagespflegepersonen</h1>
        <p className="mt-2 text-sm text-slate-600">
          Erzähl Familien, welche Betreuung du anbietest und wo sie dich finden können.
        </p>
      </header>

      <form className="grid gap-5" onSubmit={handleSubmit}>
        {/* Basisdaten */}
        <section className="grid gap-4 rounded-2xl border border-brand-100 bg-white/80 p-4">
          <h2 className="text-base font-semibold text-brand-700">Basisdaten</h2>

          <Input label="Vorname" required value={formState.firstName} onChange={(v) => updateField('firstName', v)} />
          <Input label="Nachname" required value={formState.lastName} onChange={(v) => updateField('lastName', v)} />

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <span className="flex items-center gap-1">
              Geburtsdatum <span className="text-rose-500">*</span>
            </span>
            <input
              type="date"
              value={formState.birthDate}
              onChange={(e) => updateField('birthDate', e.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
              required
            />
            <span className="text-xs text-slate-500">
              {computedAge !== null ? `Aktuell ${computedAge} Jahre alt.` : 'So bleibt dein Alter automatisch aktuell.'}
            </span>
          </label>

          <Input
            label="Name deiner Kindertagespflege"
            required
            value={formState.daycareName}
            onChange={(v) => updateField('daycareName', v)}
          />

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Seit wann aktiv (optional)
            <input
              type="month"
              value={formState.caregiverSince}
              onChange={(e) => updateField('caregiverSince', e.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
            />
            <span className="text-xs text-slate-500">
              {experienceYears !== null ? `${experienceYears} Jahre Erfahrung` : 'Optional: sichtbar im Profil.'}
            </span>
          </label>
        </section>

        {/* Zugangsdaten */}
        <section className="grid gap-4 rounded-2xl border border-brand-100 bg-white/80 p-4">
          <h2 className="text-base font-semibold text-brand-700">Zugangsdaten</h2>
          <Input label="Benutzername" required value={formState.username} onChange={(v) => updateField('username', v)} />
          <Input
            label="Passwort"
            required
            type="password"
            value={formState.password}
            onChange={(v) => updateField('password', v)}
          />
        </section>

        {/* Kontakt & Standort */}
        <section className="grid gap-4 rounded-2xl border border-brand-100 bg-white/80 p-4">
          <h2 className="text-base font-semibold text-brand-700">Kontakt & Standort</h2>

          <Input
            label="E-Mail-Adresse"
            required
            type="email"
            value={formState.email}
            onChange={(v) => updateField('email', v)}
          />
          <Input label="Telefonnummer" required value={formState.phone} onChange={(v) => updateField('phone', v)} />
          <Input label="Adresse" required value={formState.address} onChange={(v) => updateField('address', v)} />

          <div className="grid grid-cols-2 gap-3">
            <Input label="Postleitzahl" required value={formState.postalCode} onChange={(v) => updateField('postalCode', v)} />
            <Input label="Ort" required value={formState.city} onChange={(v) => updateField('city', v)} />
          </div>
        </section>

        {/* Kapazitäten */}
        <section className="grid gap-4 rounded-2xl border border-brand-100 bg-white/80 p-4">
          <h2 className="text-base font-semibold text-brand-700">Betreuungskapazitäten</h2>

          <Input
            label="Aktuell betreute Kinder"
            required
            type="number"
            value={formState.childrenCount}
            onChange={(v) => updateField('childrenCount', v)}
          />

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Plätze verfügbar?
            <select
              value={formState.hasAvailability ? 'true' : 'false'}
              onChange={(e) => updateField('hasAvailability', e.target.value === 'true')}
              className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
            >
              <option value="true">Ja, es sind Plätze frei</option>
              <option value="false">Momentan ausgebucht</option>
            </select>
          </label>

          <Input
            label="Anzahl freier Plätze"
            required
            type="number"
            value={formState.availableSpots}
            onChange={(v) => updateField('availableSpots', v)}
          />

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Wann werden Plätze frei?
            <select
              value={formState.availabilityTiming}
              onChange={(e) => updateField('availabilityTiming', e.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
            >
              {AVAILABILITY_TIMING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <Input
            label="Maximales Alter der Kinder (optional)"
            type="number"
            value={formState.maxChildAge}
            onChange={(v) => updateField('maxChildAge', v)}
            placeholder="z. B. 6"
          />
        </section>

        {/* Uploads */}
        <section className="grid gap-4 rounded-2xl border border-brand-100 bg-white/80 p-4">
          <h2 className="text-base font-semibold text-brand-700">Profilbild, Logo & Konzeption</h2>

          <div className="grid gap-2 rounded-2xl border border-brand-100 bg-white p-4">
            <p className="text-sm font-semibold text-brand-700">Profilbild</p>
            <IconUploadButton label="Profilbild auswählen" accept="image/*" onChange={handleImageChange} />
            <span className="text-xs text-slate-500">
              {profileImage.fileName ? `Ausgewählt: ${profileImage.fileName}` : 'Optional'}
            </span>
          </div>

          <div className="grid gap-2 rounded-2xl border border-brand-100 bg-white p-4">
            <p className="text-sm font-semibold text-brand-700">Logo</p>
            <IconUploadButton label="Logo auswählen" accept="image/*" onChange={handleLogoChange} />
            <span className="text-xs text-slate-500">{logoImage.fileName ? `Ausgewählt: ${logoImage.fileName}` : 'Optional'}</span>
          </div>

          <div className="grid gap-2 rounded-2xl border border-dashed border-brand-200 bg-white p-4">
            <p className="text-sm font-semibold text-brand-700">Konzeption (PDF)</p>
            <IconUploadButton label="PDF hochladen" accept="application/pdf" onChange={handleConceptChange} />
            <span className="text-xs text-slate-500">
              {conceptFile.fileName
                ? `Ausgewählt: ${conceptFile.fileName}`
                : 'Optional, hilft Familien bei der Entscheidungsfindung.'}
            </span>
          </div>
        </section>

        {/* Räume */}
        <section className="grid gap-4 rounded-2xl border border-brand-100 bg-white/80 p-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-base font-semibold text-brand-700">Räumlichkeiten</h2>
            <p className="text-xs text-slate-500">Maximal drei Bilder werden gleichzeitig dargestellt.</p>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {showRoomNavigation ? (
                  <>
                    <button
                      type="button"
                      onClick={showPreviousRoomImages}
                      className="rounded-full border border-brand-200 px-3 py-1 text-xs font-semibold text-brand-600"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={showNextRoomImages}
                      className="rounded-full border border-brand-200 px-3 py-1 text-xs font-semibold text-brand-600"
                    >
                      →
                    </button>
                  </>
                ) : null}
              </div>

              <IconUploadButton label="Raumbilder hochladen" accept="image/*" multiple onChange={handleRoomImagesChange} />
            </div>
          </div>

          {roomGallery.length ? (
            <div className="grid gap-3">
              {visibleRoomImages.map((img) => (
                <div key={img.id} className="relative h-44 w-full overflow-hidden rounded-3xl border border-brand-100 bg-brand-50">
                  <img src={img.preview} alt="Räumlichkeit" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveRoomImage(img.id)}
                    className="absolute right-2 top-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-rose-600 shadow"
                  >
                    Entfernen
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-brand-200 bg-white/60 px-4 py-6 text-sm text-slate-500">
              Noch keine Bilder ausgewählt. Lade Fotos deiner Räume hoch.
            </p>
          )}
        </section>

        {/* Closed Days */}
        <section className="grid gap-3 rounded-2xl border border-brand-100 bg-white/80 p-4">
          <h2 className="text-base font-semibold text-brand-700">Betreuungsfreie Tage</h2>

          <div className="grid gap-2">
            <input
              value={closedDayInput}
              onChange={(e) => setClosedDayInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddClosedDay();
                }
              }}
              className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
              placeholder="z. B. Samstag oder Feiertage"
            />
            <button
              type="button"
              onClick={() => handleAddClosedDay()}
              className="rounded-full border border-brand-200 px-4 py-2 text-xs font-semibold text-brand-600"
            >
              Tag hinzufügen
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {WEEKDAY_SUGGESTIONS.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => handleAddClosedDay(day)}
                className="rounded-full border border-dashed border-brand-200 px-3 py-1 text-xs font-semibold text-brand-600"
              >
                {day}
              </button>
            ))}
          </div>

          {formState.closedDays.length ? (
            <div className="flex flex-wrap gap-2">
              {formState.closedDays.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleRemoveClosedDay(day)}
                  className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700"
                >
                  {day} · Entfernen
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">Noch keine betreuungsfreien Tage hinterlegt.</p>
          )}
        </section>

        {/* Zeiten */}
        <section className="grid gap-4 rounded-2xl border border-brand-100 bg-white/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-brand-700">Betreuungszeiten</h2>
              <p className="text-xs text-slate-500">Zeitfenster + Aktivität.</p>
            </div>
            <button
              type="button"
              onClick={() => addScheduleEntry('careTimes')}
              className="rounded-full border border-brand-200 px-3 py-2 text-xs font-semibold text-brand-600"
            >
              + hinzufügen
            </button>
          </div>

          <div className="grid gap-4">
            {formState.careTimes.map((entry, index) => (
              <div key={`care-${index}`} className="grid gap-3 rounded-2xl border border-brand-100 bg-white p-4">
                <Input
                  label="Von"
                  required
                  type="time"
                  value={entry.startTime}
                  onChange={(v) => updateScheduleEntry('careTimes', index, 'startTime', v)}
                />
                <Input
                  label="Bis"
                  required
                  type="time"
                  value={entry.endTime}
                  onChange={(v) => updateScheduleEntry('careTimes', index, 'endTime', v)}
                />
                <Input
                  label="Aktivität"
                  required
                  value={entry.activity}
                  onChange={(v) => updateScheduleEntry('careTimes', index, 'activity', v)}
                  placeholder="z. B. Bringzeit"
                />

                {formState.careTimes.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeScheduleEntry('careTimes', index)}
                    className="self-end text-xs font-semibold text-rose-600"
                  >
                    Eintrag entfernen
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 rounded-2xl border border-brand-100 bg-white/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-brand-700">Tagesablauf</h2>
              <p className="text-xs text-slate-500">Chronologisch beschreiben.</p>
            </div>
            <button
              type="button"
              onClick={() => addScheduleEntry('dailySchedule')}
              className="rounded-full border border-brand-200 px-3 py-2 text-xs font-semibold text-brand-600"
            >
              + hinzufügen
            </button>
          </div>

          <div className="grid gap-4">
            {formState.dailySchedule.map((entry, index) => (
              <div key={`daily-${index}`} className="grid gap-3 rounded-2xl border border-brand-100 bg-white p-4">
                <Input
                  label="Von"
                  type="time"
                  value={entry.startTime}
                  onChange={(v) => updateScheduleEntry('dailySchedule', index, 'startTime', v)}
                />
                <Input
                  label="Bis"
                  type="time"
                  value={entry.endTime}
                  onChange={(v) => updateScheduleEntry('dailySchedule', index, 'endTime', v)}
                />
                <Input
                  label="Aktivität"
                  value={entry.activity}
                  onChange={(v) => updateScheduleEntry('dailySchedule', index, 'activity', v)}
                  placeholder="z. B. Gemeinsames Frühstück"
                />

                {formState.dailySchedule.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeScheduleEntry('dailySchedule', index)}
                    className="self-end text-xs font-semibold text-rose-600"
                  >
                    Abschnitt entfernen
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        {/* Texte */}
        <Input
          label="Kurzbeschreibung"
          value={formState.shortDescription}
          onChange={(v) => updateField('shortDescription', v)}
          placeholder="Was macht deine Tagespflege besonders?"
        />
        <TextArea
          label="Über dich"
          value={formState.bio}
          onChange={(v) => updateField('bio', v)}
          rows={5}
          placeholder="Erzähle etwas über deine Erfahrung, Schwerpunkte und Tagesabläufe."
        />
        <TextArea
          label="Essensplan"
          value={formState.mealPlan}
          onChange={(v) => updateField('mealPlan', v)}
          rows={4}
          placeholder="Beschreibe, welche Mahlzeiten du anbietest."
        />

        <button
          type="submit"
          className="rounded-full bg-brand-600 px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
          disabled={submitting}
        >
          {submitting ? 'Wird gespeichert…' : 'Profil speichern'}
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

function Input({ label, required, type = 'text', value, onChange, placeholder }) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
      <span className="flex items-center gap-1">
        {label}
        {required ? <span className="text-rose-500">*</span> : null}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
        required={required}
      />
    </label>
  );
}

function TextArea({ label, required, value, onChange, placeholder, rows = 4 }) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
      <span className="flex items-center gap-1">
        {label}
        {required ? <span className="text-rose-500">*</span> : null}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
      />
    </label>
  );
}
