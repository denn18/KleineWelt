import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import ImageLightbox from '../components/ImageLightbox.jsx';
import { assetUrl } from '../utils/file.js';
import { formatAvailableSpotsLabel, isAvailabilityHighlighted } from '../utils/availability.js';
import { trackEvent } from '../utils/analytics.js';

function SectionHeading({ title, description }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-xl font-semibold text-brand-700">{title}</h2>
      {description ? <p className="text-xs text-slate-500">{description}</p> : null}
    </div>
  );
}

function ScheduleList({ entries, emptyLabel }) {
  if (!entries?.length) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>;
  }

  return (
    <ul className="grid gap-3">
      {entries.map((entry, index) => (
        <li
          key={`${entry.startTime}-${entry.endTime}-${entry.activity}-${index}`}
          className="flex flex-col gap-1 rounded-2xl border border-brand-100 bg-white/80 px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3 text-sm font-semibold text-brand-700">
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs text-brand-600">
              {entry.startTime || '—'} – {entry.endTime || '—'}
            </span>
            <span>{entry.activity || 'Keine Aktivität angegeben'}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function CaregiverDetailPage() {
  const { id } = useParams();
  const [caregiver, setCaregiver] = useState(null);
  const [status, setStatus] = useState({ loading: true, error: null });
  const [roomIndex, setRoomIndex] = useState(0);
  const [lightboxImage, setLightboxImage] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    let ignore = false;
    setStatus({ loading: true, error: null });

    axios
      .get(`/api/caregivers/${id}`)
      .then((response) => {
        if (!ignore) {
          setCaregiver(response.data);
          setStatus({ loading: false, error: null });
        }
      })
      .catch((error) => {
        console.error('Failed to load caregiver', error);
        if (!ignore) {
          setCaregiver(null);
          setStatus({ loading: false, error: 'Die Kindertagespflege konnte nicht geladen werden.' });
        }
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  const formattedAddress = useMemo(() => {
    if (!caregiver) {
      return '';
    }
    const parts = [caregiver.address, [caregiver.postalCode, caregiver.city].filter(Boolean).join(' ')].filter(Boolean);
    return parts.join(', ');
  }, [caregiver]);

  function handleStartConversation() {
    trackEvent('engagement_nachricht_schreiben', { page: 'caregiver_detail', platform: 'web' });

    if (!caregiver) {
      return;
    }
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    navigate(`/nachrichten/${caregiver.id}`, {
      state: { partner: { ...caregiver, role: 'caregiver' } },
    });
  }

  function handleLoginClick() {
    trackEvent('engagement_login_page', { page: 'caregiver_detail', platform: 'web', location: 'contact' });
    navigate('/login', { state: { from: location.pathname } });
  }

  useEffect(() => {
    if (caregiver?.id) {
      setRoomIndex(0);
      setLightboxImage(null);
    }
  }, [caregiver?.id]);

  const roomImages = useMemo(
    () => (caregiver?.roomImages ?? []).map((imageUrl) => assetUrl(imageUrl)),
    [caregiver],
  );

  const visibleRoomImages = useMemo(() => {
    if (!roomImages.length) {
      return [];
    }
    const count = Math.min(3, roomImages.length);
    const images = [];
    for (let offset = 0; offset < count; offset += 1) {
      images.push(roomImages[(roomIndex + offset) % roomImages.length]);
    }
    return images;
  }, [roomImages, roomIndex]);

  const hasMultipleRooms = roomImages.length > 1;

  function handleRoomPrev() {
    if (!roomImages.length) {
      return;
    }
    trackEvent('engagement_raeumlichkeiten_anschauen', { page: 'caregiver_detail', platform: 'web', direction: 'prev' });
    setRoomIndex((current) => (current - 1 + roomImages.length) % roomImages.length);
  }

  function handleRoomNext() {
    if (!roomImages.length) {
      return;
    }
    trackEvent('engagement_raeumlichkeiten_anschauen', { page: 'caregiver_detail', platform: 'web', direction: 'next' });
    setRoomIndex((current) => (current + 1) % roomImages.length);
  }

  function openLightbox(image, alt = 'Vergrößerte Ansicht') {
    if (!image) {
      return;
    }
    setLightboxImage({ url: image, alt });
  }

  function closeLightbox() {
    setLightboxImage(null);
  }

  if (status.loading) {
    return <div className="mx-auto mt-12 h-96 w-full max-w-5xl animate-pulse rounded-3xl bg-white/60" />;
  }

  if (status.error) {
    return (
      <section className="mx-auto mt-12 w-full max-w-3xl rounded-3xl bg-white/85 p-10 text-center shadow-lg">
        <h1 className="text-2xl font-semibold text-brand-700">Ups!</h1>
        <p className="mt-2 text-sm text-slate-600">{status.error}</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-6 rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-600 transition hover:border-brand-400 hover:text-brand-700"
        >
          Zurück
        </button>
      </section>
    );
  }

  if (!caregiver) {
    return null;
  }

  const closedDays = caregiver.closedDays ?? [];
  const profileImageUrl = caregiver.profileImageUrl ? assetUrl(caregiver.profileImageUrl) : '';
  const logoUrl = caregiver.logoImageUrl ? assetUrl(caregiver.logoImageUrl) : '';
  const conceptUrl = caregiver.conceptUrl ? assetUrl(caregiver.conceptUrl) : '';
  const contractDocuments = caregiver.contractDocuments ?? [];
  const sinceDate = caregiver.caregiverSince ? new Date(caregiver.caregiverSince) : null;
  const sinceYear = sinceDate && !Number.isNaN(sinceDate.valueOf()) ? sinceDate.getFullYear() : null;
  const experienceYears = sinceDate && !Number.isNaN(sinceDate.valueOf())
    ? (() => {
        const now = new Date();
        let years = now.getFullYear() - sinceDate.getFullYear();
        const anniversaryPassed =
          now.getMonth() > sinceDate.getMonth() ||
          (now.getMonth() === sinceDate.getMonth() && now.getDate() >= sinceDate.getDate());
        if (!anniversaryPassed) {
          years -= 1;
        }
        return years >= 0 ? years : null;
      })()
    : null;
  const availableSpotsLabel = formatAvailableSpotsLabel({
    availableSpots: caregiver.availableSpots ?? 0,
    hasAvailability: caregiver.hasAvailability,
    availabilityTiming: caregiver.availabilityTiming,
  });
  const availableSpotsStyles = isAvailabilityHighlighted({
    availableSpots: caregiver.availableSpots ?? 0,
    availabilityTiming: caregiver.availabilityTiming,
    hasAvailability: caregiver.hasAvailability,
  })
    ? 'bg-emerald-50 text-emerald-700'
    : 'bg-brand-50 text-slate-600';

  return (
    <section className="mx-auto mt-12 flex w-full max-w-5xl flex-col gap-10 rounded-3xl bg-white/85 p-10 shadow-xl">
      <header className="flex flex-col gap-6 md:flex-row md:justify-between">
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-fit text-xs font-semibold text-brand-600 transition hover:text-brand-700"
          >
            ← Zurück zur Übersicht
          </button>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold text-brand-700">{caregiver.daycareName || caregiver.name}</h1>
            {formattedAddress ? <p className="text-sm text-slate-600">{formattedAddress}</p> : null}
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-brand-700">
              <span className={`rounded-full px-3 py-1 ${availableSpotsStyles}`}>{availableSpotsLabel}</span>
              <span className="rounded-full bg-brand-50 px-3 py-1">
                {caregiver.childrenCount ?? 0} betreute Kinder
              </span>
              {caregiver.maxChildAge ? (
                <span className="rounded-full bg-brand-50 px-3 py-1">
                  Aufnahme bis {caregiver.maxChildAge} Jahre
                </span>
              ) : null}
              {experienceYears !== null ? (
                <span className="rounded-full bg-brand-50 px-3 py-1">{experienceYears} Jahre Erfahrung</span>
              ) : sinceYear ? (
                <span className="rounded-full bg-brand-50 px-3 py-1">Seit {sinceYear} aktiv</span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {conceptUrl ? (
              <a
                href={conceptUrl}
                onClick={() => trackEvent('engagement_konzeption_durchlesen', { page: 'caregiver_detail', platform: 'web' })}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-600 transition hover:border-brand-400 hover:text-brand-700"
              >
                Konzeption als PDF herunterladen
              </a>
            ) : null}
            <button
              type="button"
              onClick={handleStartConversation}
              className="rounded-full bg-brand-600 px-6 py-2 text-sm font-semibold text-white shadow transition hover:bg-brand-700"
            >
              Nachricht schreiben
            </button>
          </div>
        </div>
        <div className="flex flex-col items-center gap-4 md:flex-row md:items-start md:justify-end">
          {logoUrl ? (
            <button
              type="button"
              onClick={() => openLightbox(logoUrl, `Logo von ${caregiver.daycareName || caregiver.name}`)}
              className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-3xl border border-brand-100 bg-brand-50 transition hover:shadow-lg"
            >
              <img src={logoUrl} alt={`Logo von ${caregiver.daycareName || caregiver.name}`} className="h-full w-full object-contain" />
            </button>
          ) : null}
          {profileImageUrl ? (
            <button
              type="button"
              onClick={() => openLightbox(profileImageUrl, caregiver.daycareName || caregiver.name)}
              className="h-40 w-40 overflow-hidden rounded-3xl border border-brand-100 bg-brand-50 transition hover:shadow-lg"
            >
              <img
                src={profileImageUrl}
                alt={caregiver.daycareName || caregiver.name}
                className="h-full w-full object-cover"
              />
            </button>
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-dashed border-brand-200 bg-brand-50 text-sm text-slate-400">
              Kein Bild
            </div>
          )}
        </div>
      </header>

      <section className="grid gap-4">
        <SectionHeading title="Kurzbeschreibung" />
        <p className="text-sm text-slate-600">
          {caregiver.shortDescription || 'Diese Tagespflege hat noch keine Kurzbeschreibung hinterlegt.'}
        </p>
      </section>

      <section className="grid gap-4">
        <SectionHeading title="Über uns" />
        <p className="text-sm text-slate-600 leading-relaxed">
          {caregiver.bio || 'Hier erfährst du demnächst mehr über die Kindertagespflege.'}
        </p>
      </section>

      <section className="grid gap-4">
        <SectionHeading
          title="Betreuungszeiten"
          description="Alle Zeitfenster inklusive der zugehörigen Aktivitäten."
        />
        <ScheduleList
          entries={caregiver.careTimes}
          emptyLabel="Es wurden noch keine Betreuungszeiten hinterlegt."
        />
      </section>

      <section className="grid gap-4">
        <SectionHeading
          title="Betreuungsfreie Tage"
          description="An diesen Tagen findet regulär keine Betreuung statt."
        />
        {closedDays.length ? (
          <ul className="flex flex-wrap gap-2">
            {closedDays.map((day, index) => (
              <li
                key={`${day}-${index}`}
                className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700"
              >
                {day}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">Es wurden keine betreuungsfreien Tage angegeben.</p>
        )}
      </section>

      <section className="grid gap-4">
        <SectionHeading
          title="Tagesablauf"
          description="So gestaltet sich der Tag für die Kinder."
        />
        <ScheduleList
          entries={caregiver.dailySchedule}
          emptyLabel="Es liegt noch kein Tagesablauf vor."
        />
      </section>

      <section className="grid gap-3">
        <SectionHeading title="Essensplan" />
        <p className="text-sm text-slate-600">
          {caregiver.mealPlan || 'Die Kindertagespflege hat noch keine Informationen zum Essensplan ergänzt.'}
        </p>
      </section>

      <section className="grid gap-3">
        <SectionHeading title="Unterlagen" />
        {contractDocuments.length ? (
          <ul className="grid gap-3">
            {contractDocuments.map((document, index) => {
              const fileUrl = document?.file ? assetUrl(document.file) : '';
              const label = document?.name || `Dokument ${index + 1}`;
              return (
                <li
                  key={`${label}-${index}`}
                  className="flex flex-col gap-2 rounded-2xl border border-brand-100 bg-white/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="text-sm font-semibold text-brand-700">{label}</span>
                  {fileUrl ? (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-fit rounded-full border border-brand-200 px-4 py-2 text-xs font-semibold text-brand-600 transition hover:border-brand-400 hover:text-brand-700"
                    >
                      Dokument herunterladen
                    </a>
                  ) : (
                    <span className="text-xs text-slate-500">Kein Dokument hinterlegt.</span>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">Es wurden keine Unterlagen hinterlegt.</p>
        )}
      </section>

      <section className="grid gap-4">
        <SectionHeading title="Räumlichkeiten" description="Ein Blick in die Betreuungsräume." />
        {visibleRoomImages.length ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              {hasMultipleRooms ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRoomPrev}
                    className="rounded-full border border-brand-200 px-3 py-1 text-sm font-semibold text-brand-600 transition hover:border-brand-400 hover:text-brand-700"
                    aria-label="Vorherige Räumlichkeit anzeigen"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={handleRoomNext}
                    className="rounded-full border border-brand-200 px-3 py-1 text-sm font-semibold text-brand-600 transition hover:border-brand-400 hover:text-brand-700"
                    aria-label="Nächste Räumlichkeit anzeigen"
                  >
                    →
                  </button>
                </div>
              ) : <span />}
              <span className="text-xs text-slate-500">
                Bild {roomIndex + 1} von {roomImages.length}
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {visibleRoomImages.map((imageUrl, index) => {
                const imagePosition = roomImages.length
                  ? (roomIndex + index) % roomImages.length
                  : index;
                const roomAlt = `Räumlichkeit ${imagePosition + 1} von ${caregiver.daycareName || caregiver.name}`;
                return (
                  <button
                    key={`${imageUrl}-${index}`}
                    type="button"
                    onClick={() => openLightbox(imageUrl, roomAlt)}
                    className="group relative h-48 w-full overflow-hidden rounded-3xl border border-brand-100 bg-brand-50 shadow transition hover:shadow-lg"
                  >
                    <img
                      src={imageUrl}
                      alt={`Räumlichkeit ${imagePosition + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute inset-x-0 bottom-0 hidden bg-black/40 py-1 text-[10px] font-semibold text-white group-hover:block">
                      Zum Vergrößern klicken
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Es wurden noch keine Bilder der Räumlichkeiten hochgeladen.</p>
        )}
      </section>

      <section className="grid gap-4">
        <SectionHeading title="Kontakt" />
        {user ? (
          <div className="grid gap-2 text-sm text-slate-600">
            {caregiver.phone ? (
              <p>
                Telefon:{' '}
                <a className="text-brand-600 hover:text-brand-700" href={`tel:${caregiver.phone}`}>
                  {caregiver.phone}
                </a>
              </p>
            ) : null}
            {caregiver.email ? (
              <p>
                E-Mail:{' '}
                <a className="text-brand-600 hover:text-brand-700" href={`mailto:${caregiver.email}`}>
                  {caregiver.email}
                </a>
              </p>
            ) : null}
            {formattedAddress ? <p>Adresse: {formattedAddress}</p> : null}
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-slate-500">Kontaktdaten nach Anmeldung oder Registrierung sichtbar.</p>
            <button
              type="button"
              onClick={handleLoginClick}
              className="rounded-full bg-brand-600 px-6 py-3 text-center text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-md"
            >
              Anmelden
            </button>
          </div>
        )}
      </section>
      {lightboxImage ? <ImageLightbox image={lightboxImage} onClose={closeLightbox} /> : null}
    </section>
  );
}

export default CaregiverDetailPage;
