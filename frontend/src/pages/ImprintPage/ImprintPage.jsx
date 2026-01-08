function ImprintPage() {
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 rounded-3xl bg-white/85 p-10 shadow-lg">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-500">Impressum</p>
        <h1 className="text-3xl font-semibold text-brand-700">Angaben gemäß § 5 TMG</h1>
        <p className="text-sm text-slate-600">Dieses Impressum dient als Platzhalter und wird bei Bedarf durch die finalen Unternehmensdaten ersetzt.</p>
      </header>

      <div className="grid gap-5 text-sm leading-relaxed text-slate-700">
        <section className="rounded-2xl border border-brand-100 bg-white/90 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-700">Diensteanbieter</h2>
          <p className="mt-2">
            Wimmel Welt Muster GmbH
            <br />
            Musterstraße 12
            <br />
            12345 Beispielstadt
          </p>
        </section>

        <section className="rounded-2xl border border-brand-100 bg-white/90 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-700">Kontakt</h2>
          <p className="mt-2">
            Telefon: +49 (0) 123 456789
            <br />
            E-Mail: <a className="text-brand-600 underline" href="mailto:wimmel-welt@info.de">wimmel-welt@info.de</a>
            <br />
            Web: www.wimmel-welt.de
          </p>
        </section>

        <section className="rounded-2xl border border-brand-100 bg-white/90 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-700">Vertretungsberechtigt</h2>
          <p className="mt-2">Max Beispiel (Geschäftsführung)</p>
        </section>

        <section className="rounded-2xl border border-brand-100 bg-white/90 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-700">Registereintrag</h2>
          <p className="mt-2">
            Handelsregister: Amtsgericht Beispielstadt
            <br />
            Registernummer: HRB 012345
          </p>
        </section>

        <section className="rounded-2xl border border-brand-100 bg-white/90 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-700">Umsatzsteuer-ID</h2>
          <p className="mt-2">USt-IdNr.: DE123456789</p>
        </section>

        <section className="rounded-2xl border border-brand-100 bg-white/90 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-700">Verantwortlich für den Inhalt</h2>
          <p className="mt-2">
            Verantwortlich gemäß § 18 Abs. 2 MStV: Max Beispiel, Musterstraße 12, 12345 Beispielstadt.
          </p>
        </section>

        <section className="rounded-2xl border border-brand-100 bg-white/90 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-700">Haftungshinweise</h2>
          <p className="mt-2">
            Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links. Für den Inhalt der
            verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich. Sollten dir rechtswidrige Inhalte auffallen, freuen
            wir uns über einen Hinweis.
          </p>
        </section>

        <section className="rounded-2xl border border-brand-100 bg-white/90 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-700">Streitbeilegung</h2>
          <p className="mt-2">
            Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </section>
      </div>
    </section>
  );
}

export default ImprintPage;
