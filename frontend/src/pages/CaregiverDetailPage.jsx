import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';

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
  const galleryRef = useRef(null);
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

  function scrollGallery(offset) {
    if (!galleryRef.current) {
      return;
    }
    galleryRef.current.scrollBy({ left: offset, behavior: 'smooth' });
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

  const roomImages = caregiver.roomImages ?? [];
  const closedDays = caregiver.closedDays ?? [];

  return (
    <section className="mx-auto mt-12 flex w-full max-w-5xl flex-col gap-10 rounded-3xl bg-white/85 p-10 shadow-xl">
      <header className="flex flex-col gap-6 md:flex-row md:justify-between">
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-fit text-xs font-semibold text-brand-600 transition hover:text-brand-700"
          >
            ← Zurück zur Übersicht
          </button>
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold text-brand-700">{caregiver.daycareName || caregiver.name}</h1>
            {formattedAddress ? <p className="text-sm text-slate-600">{formattedAddress}</p> : null}
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-brand-50 px-3 py-1">
                {caregiver.availableSpots ?? 0} freie Plätze
              </span>
              <span className="rounded-full bg-brand-50 px-3 py-1">
                {caregiver.childrenCount ?? 0} Kinder in Betreuung
              </span>
              {caregiver.hasAvailability ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-600">Plätze verfügbar</span>
              ) : (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-600">Derzeit ausgebucht</span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {caregiver.conceptUrl ? (
              <a
                href={caregiver.conceptUrl}
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
        <div className="flex justify-center md:justify-end">
          {caregiver.profileImageUrl ? (
            <img
              src={caregiver.profileImageUrl}
              alt={caregiver.daycareName || caregiver.name}
              className="h-40 w-40 rounded-3xl bg-brand-50 object-contain"
            />
          ) : (
            <div className="flex h-40 w-40 items-center justify-center rounded-3xl border border-dashed border-brand-200 bg-brand-50 text-sm text-slate-400">
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

      <section className="grid gap-4">
        <SectionHeading title="Räumlichkeiten" description="Ein Blick in die Betreuungsräume." />
        {roomImages.length ? (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2 self-end">
              <button
                type="button"
                onClick={() => scrollGallery(-240)}
                className="rounded-full border border-brand-200 px-3 py-1 text-sm font-semibold text-brand-600 transition hover:border-brand-400 hover:text-brand-700"
                aria-label="Räumlichkeiten nach links scrollen"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => scrollGallery(240)}
                className="rounded-full border border-brand-200 px-3 py-1 text-sm font-semibold text-brand-600 transition hover:border-brand-400 hover:text-brand-700"
                aria-label="Räumlichkeiten nach rechts scrollen"
              >
                →
              </button>
            </div>
            <div ref={galleryRef} className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
              {roomImages.map((imageUrl, index) => (
                <img
                  key={`${imageUrl}-${index}`}
                  src={imageUrl}
                  alt={`Räumlichkeit ${index + 1}`}
                  className="h-40 w-64 flex-shrink-0 rounded-3xl object-cover shadow"
                />
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Es wurden noch keine Bilder der Räumlichkeiten hochgeladen.</p>
        )}
      </section>

      <section className="grid gap-4">
        <SectionHeading title="Kontakt" />
        <div className="grid gap-2 text-sm text-slate-600">
          {caregiver.phone ? <p>Telefon: <a className="text-brand-600 hover:text-brand-700" href={`tel:${caregiver.phone}`}>{caregiver.phone}</a></p> : null}
          {caregiver.email ? <p>E-Mail: <a className="text-brand-600 hover:text-brand-700" href={`mailto:${caregiver.email}`}>{caregiver.email}</a></p> : null}
          {formattedAddress ? <p>Adresse: {formattedAddress}</p> : null}
        </div>
      </section>
    </section>
  );
}

export default CaregiverDetailPage;
