import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { trackEvent } from '../utils/analytics.js';

function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const { login, authError, setAuthError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(event) {
    event.preventDefault();
    const pagePath = location.pathname;
    trackEvent('login_click', { page_path: pagePath });
    setSubmitting(true);
    try {
      const user = await login(identifier, password);
      const redirectTo = location.state?.from || '/familienzentrum';
      trackEvent('login_success', { page_path: pagePath });
      setSuccessMessage('Willkommen zurück! Du wirst zum Familienzentrum weitergeleitet.');
      setTimeout(() => {
        navigate(redirectTo, { replace: true, state: { fromLogin: true, role: user.role } });
      }, 900);
    } catch (error) {
      // Fehler wird bereits im Context gesetzt
      const reason = error?.response?.data?.message || error?.message;
      trackEvent('login_error', reason ? { reason, page_path: pagePath } : { page_path: pagePath });
      setSuccessMessage(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-8 rounded-3xl bg-white/85 p-10 shadow-lg">
      <header className="text-center">
        <h1 className="text-3xl font-semibold text-brand-700">Willkommen zurück</h1>
        <p className="mt-2 text-sm text-slate-600">Melde dich mit deiner E-Mail-Adresse oder deinem Benutzernamen an.</p>
      </header>
      <form className="grid gap-6" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          <span className="flex items-center gap-1">
            Benutzername oder E-Mail
            <span className="text-rose-500" aria-hidden="true">
              *
            </span>
            <span className="sr-only">Pflichtfeld</span>
          </span>
          <input
            value={identifier}
            onChange={(event) => {
              setIdentifier(event.target.value);
              setAuthError(null);
            }}
            className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
            required
            aria-required="true"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          <span className="flex items-center gap-1">
            Passwort
            <span className="text-rose-500" aria-hidden="true">
              *
            </span>
            <span className="sr-only">Pflichtfeld</span>
          </span>
          <input
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setAuthError(null);
            }}
            className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
            required
            aria-required="true"
          />
        </label>
        <button
          type="submit"
          className="rounded-full bg-brand-600 px-8 py-3 text-sm font-semibold text-white shadow-md transition duration-200 hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-brand-300"
          disabled={submitting}
        >
          {submitting ? 'Wird geprüft…' : 'Einloggen'}
        </button>
        {successMessage ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </p>
        ) : null}
        {authError ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{authError}</p>
        ) : null}
      </form>
      <p className="text-center text-sm text-slate-600">
        Neu bei Kleine Welt?{' '}
        <Link to="/anmelden" className="font-semibold text-brand-600 transition duration-200 hover:text-brand-700 hover:underline">
          Jetzt kostenlos registrieren
        </Link>
      </p>
    </section>
  );
}

export default LoginPage;
