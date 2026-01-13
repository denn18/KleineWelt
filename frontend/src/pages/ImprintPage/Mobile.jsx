// frontend/src/pages/ImprintPage/Mobile.jsx

export default function Mobile() {
  const sections = [
    {
      title: 'Diensteanbieter',
      lines: ['Wimmel Welt Muster GmbH', 'Musterstraße 12', '12345 Beispielstadt'],
    },
    {
      title: 'Kontakt',
      lines: ['Telefon: +49 (0) 123 456789', 'E-Mail: wimmel-welt@info.de', 'Web: www.wimmel-welt.de'],
      email: 'wimmel-welt@info.de',
    },
    {
      title: 'Vertretungsberechtigt',
      lines: ['Max Beispiel (Geschäftsführung)'],
    },
    {
      title: 'Registereintrag',
      lines: ['Handelsregister: Amtsgericht Beispielstadt', 'Registernummer: HRB 012345'],
    },
    {
      title: 'Umsatzsteuer-ID',
      lines: ['USt-IdNr.: DE123456789'],
    },
    {
      title: 'Verantwortlich für den Inhalt',
      lines: ['Verantwortlich gemäß § 18 Abs. 2 MStV: Max Beispiel, Musterstraße 12, 12345 Beispielstadt.'],
    },
    {
      title: 'Haftungshinweise',
      lines: [
        'Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich. Sollten dir rechtswidrige Inhalte auffallen, freuen wir uns über einen Hinweis.',
      ],
    },
    {
      title: 'Streitbeilegung',
      lines: [
        'Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.',
      ],
    },
  ];

  return (
    <section className="mx-auto mt-6 flex w-full max-w-md flex-col gap-5 rounded-3xl bg-white/85 p-5 shadow-lg">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Impressum</p>
        <h1 className="text-2xl font-semibold text-brand-700">Angaben gemäß § 5 TMG</h1>
        <p className="text-sm text-slate-600">
          Dieses Impressum dient als Platzhalter und wird bei Bedarf durch die finalen Unternehmensdaten ersetzt.
        </p>
      </header>

      <div className="grid gap-4 text-sm leading-relaxed text-slate-700">
        {sections.map((section) => (
          <section
            key={section.title}
            className="rounded-2xl border border-brand-100 bg-white/90 p-4 shadow-sm"
          >
            <h2 className="text-base font-semibold text-brand-700">{section.title}</h2>

            <div className="mt-2 grid gap-1">
              {section.title === 'Kontakt' ? (
                <>
                  <p>{section.lines[0]}</p>
                  <p>
                    E-Mail:{' '}
                    <a className="text-brand-600 underline" href={`mailto:${section.email}`}>
                      {section.email}
                    </a>
                  </p>
                  <p>{section.lines[2]}</p>
                </>
              ) : (
                section.lines.map((line, index) => <p key={`${line}-${index}`}>{line}</p>)
              )}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
