import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const SUCCESS_MESSAGE = 'Dein Passwort wurde geändert. Du kannst dich jetzt einloggen.';
const INVALID_MESSAGE = 'Der Link ist ungültig oder abgelaufen. Bitte fordere einen neuen Link an.';

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [passwordRepeat, setPasswordRepeat] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(token ? null : INVALID_MESSAGE);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!token) {
      setMessage(INVALID_MESSAGE);
      return;
    }
    if (password.length < 8) {
      setMessage('Das Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }
    if (password !== passwordRepeat) {
      setMessage('Die Passwörter stimmen nicht überein.');
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      await axios.post('/api/auth/reset-password', { token, password });
      setSuccess(true);
      setMessage(SUCCESS_MESSAGE);
      setPassword('');
      setPasswordRepeat('');
    } catch (_error) {
      setSuccess(false);
      setMessage(INVALID_MESSAGE);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-8 rounded-3xl bg-white/85 p-10 shadow-lg">
      <header className="text-center">
        <h1 className="text-3xl font-semibold text-brand-700">Passwort zurücksetzen</h1>
        <p className="mt-2 text-sm text-slate-600">Vergib ein neues Passwort für dein Wimmel Welt Konto.</p>
      </header>
      <form className="grid gap-6" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700" htmlFor="new-password">
          Neues Passwort
          <input
            id="new-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
            required
            minLength={8}
            autoComplete="new-password"
            disabled={success || !token}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700" htmlFor="repeat-password">
          Passwort wiederholen
          <input
            id="repeat-password"
            type="password"
            value={passwordRepeat}
            onChange={(event) => setPasswordRepeat(event.target.value)}
            className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
            required
            minLength={8}
            autoComplete="new-password"
            disabled={success || !token}
          />
        </label>
        {!success ? (
          <button
            type="submit"
            className="rounded-full bg-brand-600 px-8 py-3 text-sm font-semibold text-white shadow-md transition duration-200 hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-brand-300"
            disabled={submitting || !token}
          >
            {submitting ? 'Wird gespeichert…' : 'Passwort speichern'}
          </button>
        ) : null}
        {message ? (
          <p className={`rounded-xl border px-4 py-3 text-sm ${success ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>{message}</p>
        ) : null}
      </form>
      <Link to="/login" className="text-center text-sm font-semibold text-brand-700 hover:text-brand-800">
        Zum Login
      </Link>
    </section>
  );
}

export default ResetPasswordPage;
