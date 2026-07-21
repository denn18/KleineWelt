import { Link } from 'react-router-dom';

export default function VerificationPendingPage() {
  return (
    <section className="mx-auto max-w-2xl rounded-3xl bg-white/90 p-10 text-center shadow-xl">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-500">Status: In Prüfung</p>
      <h1 className="mt-3 text-3xl font-semibold text-brand-700">Deine Pflegeerlaubnis wird geprüft</h1>
      <p className="mt-4 text-slate-600">
        Vielen Dank für deine Registrierung. Das Wimmel Welt Team prüft nun deine Pflegeerlaubnis. Nach erfolgreicher Verifizierung wird dein Profil freigegeben.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link className="rounded-full bg-brand-500 px-6 py-3 font-semibold text-white shadow hover:bg-brand-600" to="/profil">Zum Profil</Link>
        <Link className="rounded-full border border-brand-200 px-6 py-3 font-semibold text-brand-700 hover:bg-brand-50" to="/">Zur Startseite</Link>
      </div>
    </section>
  );
}
