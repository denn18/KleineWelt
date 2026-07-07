import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const NEUTRAL_MESSAGE =
  'Wenn ein Konto mit dieser E-Mail-Adresse existiert, haben wir dir eine E-Mail zum Zurücksetzen deines Passworts gesendet.';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await axios.post('/api/auth/forgot-password', { email });
    } finally {
      setMessage(NEUTRAL_MESSAGE);
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-8 rounded-3xl bg-white/85 p-10 shadow-lg">
      <header className="text-center">
        <h1 className="text-3xl font-semibold text-brand-700">Passwort vergessen?</h1>
        <p className="mt-2 text-sm text-slate-600">Gib deine E-Mail-Adresse ein. Falls ein Konto existiert, senden wir dir einen Reset-Link.</p>
      </header>
      <form className="grid gap-6" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700" htmlFor="forgot-password-email">
          E-Mail-Adresse
          <input
            id="forgot-password-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-xl border border-brand-200 px-4 py-3 text-base shadow-sm focus:border-brand-400 focus:outline-none"
            required
            autoComplete="email"
          />
        </label>
        <button
          type="submit"
          className="rounded-full bg-brand-600 px-8 py-3 text-sm font-semibold text-white shadow-md transition duration-200 hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-brand-300"
          disabled={submitting}
        >
          {submitting ? 'Wird gesendet…' : 'Reset-Link anfordern'}
        </button>
        {message ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
      </form>
      <Link to="/login" className="text-center text-sm font-semibold text-brand-700 hover:text-brand-800">
        Zurück zum Login
      </Link>
    </section>
  );
}

export default ForgotPasswordPage;
