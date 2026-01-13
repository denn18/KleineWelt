// frontend/src/pages/LoginPage/LoginPageMobile.jsx
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function LoginPageMobile() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const { login, authError, setAuthError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) {
      return;
    }

    setSubmitting(true);
    try {
      const user = await login(identifier, password);
      const redirectTo = location.state?.from || '/familienzentrum';

      setSuccessMessage('Willkommen zurück! Du wirst zum Familienzentrum weitergeleitet.');

      timeoutRef.current = setTimeout(() => {
        navigate(redirectTo, { replace: true, state: { fromLogin: true, role: user.role } });
      }, 900);
    } catch (error) {
      // Fehler wird bereits im Context gesetzt
      setSuccessMessage(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6">
      {/* Brand Header (mobile like app) */}
      <div className="flex flex-col items-center gap-2 pt-2">
        <p className="text-xl font-extrabold text-brand-700">Wimmel Welt</p>
      </div>

      {/* Card */}
      <div className="rounded-3xl border border-brand-100 bg-white/90 p-6 shadow-lg">
        <header className="text-center">
          <h1 className="text-2xl font-semibold text-brand-700">Willkommen zurück</h1>
          <p className="mt-2 text-sm text-slate-600">
            Melde dich mit deiner E-Mail-Adresse oder deinem Benutzernamen an.
          </p>
        </header>

        <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <span className="flex items-center gap-1">
              Benutzername oder E-Mail
              <span className="text-rose-500" aria-hidden="true">
                *
              </span>
              <span className="sr-only">Pflichtfeld</span>
            </span>

            <div className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-white px-4 py-3 shadow-sm focus-within:border-brand-400">
              <span aria-hidden="true" className="text-slate-400">
                {/* simple icon without extra deps */}
                👤
              </span>
              <input
                value={identifier}
                onChange={(event) => {
                  setIdentifier(event.target.value);
                  setAuthError(null);
                }}
                className="w-full bg-transparent text-base text-slate-900 outline-none"
                required
                aria-required="true"
                inputMode="email"
                autoCapitalize="none"
                autoComplete="username"
                placeholder="Dein Nutzername oder E-Mail"
              />
            </div>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <span className="flex items-center gap-1">
              Passwort
              <span className="text-rose-500" aria-hidden="true">
                *
              </span>
              <span className="sr-only">Pflichtfeld</span>
            </span>

            <div className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-white px-4 py-3 shadow-sm focus-within:border-brand-400">
              <span aria-hidden="true" className="text-slate-400">
                🔒
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setAuthError(null);
                }}
                className="w-full bg-transparent text-base text-slate-900 outline-none"
                required
                aria-required="true"
                autoComplete="current-password"
                placeholder="Passwort eingeben"
              />
            </div>
          </label>

          <button
            type="submit"
            className="mt-1 w-full rounded-2xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
            disabled={submitting}
          >
            {submitting ? 'Wird geprüft…' : 'Einloggen'}
          </button>

          {/* Messages (same logic as web) */}
          {successMessage ? (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </p>
          ) : null}

          {authError ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {authError}
            </p>
          ) : null}
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Neu bei Kleine Welt?{' '}
          <Link to="/anmelden" className="font-semibold text-brand-600 hover:text-brand-700">
            Jetzt kostenlos registrieren
          </Link>
        </p>
      </div>

      {/* Small footer like app (optional, harmless) */}
      <div className="flex flex-col items-center gap-2 pb-2 text-xs text-slate-500">
        <span>© 2025 Wimmel Welt. Alle Rechte vorbehalten.</span>
        <div className="flex items-center gap-2">
          <Link to="/datenschutz" className="font-semibold text-brand-600 hover:text-brand-700">
            Datenschutz
          </Link>
          <span className="text-slate-300">·</span>
          <Link to="/impressum" className="font-semibold text-brand-600 hover:text-brand-700">
            Impressum
          </Link>
          <span className="text-slate-300">·</span>
          <Link to="/kontakt" className="font-semibold text-brand-600 hover:text-brand-700">
            Kontakt
          </Link>
        </div>
      </div>
    </section>
  );
}

export default LoginPageMobile;
