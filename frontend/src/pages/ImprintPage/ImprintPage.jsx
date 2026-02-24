function ImprintPage() {
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 rounded-3xl bg-white/85 p-10 shadow-lg">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-500">Impressum</p>
        <h1 className="text-3xl font-semibold text-brand-700">Angaben gemäß § 5 TMG</h1>
      </header>

      <div className="grid gap-5 text-sm leading-relaxed text-slate-700">
        <section className="rounded-2xl border border-brand-100 bg-white/90 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-700">Diensteanbieter</h2>
          <p className="mt-2">
            Dennie Scharton
            <br />
            Wimmel Welt
            <br />
            Falkenrecks Heide 6
            <br />
            33332
            <br />
            Deutschland
          </p>
        </section>

        <section className="rounded-2xl border border-brand-100 bg-white/90 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-700">Kontakt</h2>
          <p className="mt-2">
            E-Mail:{" "}
            <a className="text-brand-600 underline" href="mailto:info@wimmel-welt.de">
              info@wimmel-welt.de
            </a>
            <br />
            Web: www.wimmel-welt.de
          </p>
        </section>

        <section className="rounded-2xl border border-brand-100 bg-white/90 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-700">Vertretungsberechtigt</h2>
          <p className="mt-2">Dennie Scharton (Einzelunternehmer)</p>
        </section>

        <section className="rounded-2xl border border-brand-100 bg-white/90 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-700">Registereintrag</h2>
          <p className="mt-2">
            Eintrag im Handelsregister folgt.
          </p>
        </section>

        <section className="rounded-2xl border border-brand-100 bg-white/90 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-700">Umsatzsteuer</h2>
          <p className="mt-2">
            Gemäß § 19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).
          </p>
        </section>

        <section className="rounded-2xl border border-brand-100 bg-white/90 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-700">Verantwortlich für den Inhalt gemäß § 18 Abs. 2 MStV</h2>
          <p className="mt-2">
            Dennie Scharton
            <br />
            Falkenrecks Heide 6
            <br />
            33332 Gütersloh
          </p>
        </section>

        <section className="rounded-2xl border border-brand-100 bg-white/90 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-700">Haftungshinweise</h2>
          <p className="mt-2">
            Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links. 
            Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich. 
            Sollten rechtswidrige Inhalte auffallen, bitten wir um einen entsprechenden Hinweis.
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