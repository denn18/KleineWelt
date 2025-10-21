import { useRef, useState } from 'react';
import axios from 'axios';
import { readFileAsDataUrl } from '../utils/file.js';

const createScheduleEntry = (defaults = {}) => ({
  startTime: '',
  endTime: '',
  activity: '',
  ...defaults,
});

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
    age: '',
    bio: '',
    shortDescription: '',
    mealPlan: '',
    careTimes: [createScheduleEntry({ startTime: '07:30', endTime: '09:00', activity: 'Bringzeit' })],
    dailySchedule: [createScheduleEntry()],
    username: '',
    password: '',
  };
}

function CaregiverSignupPage() {
  const [formState, setFormState] = useState(buildInitialState);
  const [profileImage, setProfileImage] = useState({ preview: '', dataUrl: null, fileName: '' });
  const [conceptFile, setConceptFile] = useState({ dataUrl: null, fileName: '' });
  const [roomGallery, setRoomGallery] = useState([]);
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const roomGalleryRef = useRef(null);

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

    setRoomGallery((current) => [...current, ...additions]);
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
        careTimes: formState.careTimes,
        dailySchedule: formState.dailySchedule,
        mealPlan: formState.mealPlan,
        roomImages: roomGallery.map((image) => ({ dataUrl: image.dataUrl, fileName: image.fileName })),
      });

      setStatus({ type: 'success', message: 'Dein Profil wurde gespeichert. Wir melden uns bei dir!' });
      setFormState(buildInitialState());
      setProfileImage({ preview: '', dataUrl: null, fileName: '' });
      setConceptFile({ dataUrl: null, fileName: '' });
      setRoomGallery([]);
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
            Ort
            <input
              value={formState.city}
              onChange={(event) => updateField('city', event.target.value)}
              className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
              required
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
                <input type="file" accept="image/*" onChange={handleImageChange} required={!profileImage.dataUrl} />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-slate-700">Konzeption (PDF)</p>
              <input type="file" accept="application/pdf" onChange={handleConceptChange} required={!conceptFile.dataUrl} />
              {conceptFile.fileName ? (
                <span className="text-xs text-slate-500">Ausgewählt: {conceptFile.fileName}</span>
              ) : (
                <span className="text-xs text-slate-500">Bitte lade dein pädagogisches Konzept als PDF hoch.</span>
              )}
            </div>
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
        <section className="grid gap-4 rounded-2xl border border-brand-100 bg-white/80 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-brand-700">Räumlichkeiten</h2>
              <p className="text-xs text-slate-500">
                Lade Bilder hoch, um Familien einen Eindruck deiner Räume zu geben.
              </p>
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
            <p className="text-xs text-slate-500">Noch keine Bilder ausgewählt. Lade Fotos deiner Räume hoch, um Eltern einen Eindruck zu vermitteln.</p>
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
