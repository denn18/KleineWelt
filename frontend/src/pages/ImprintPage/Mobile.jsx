// frontend/src/pages/ImprintPage/Mobile.jsx

export default function Mobile() {
  const sections = [
    {
      title: 'Diensteanbieter',
      lines: [
        'Dennie Scharton',
        'Wimmel Welt',
        'Falkenrecks Heide 6',
        '33332 Gütersloh',
        'Deutschland',
      ],
    },
    {
      title: 'Kontakt',
      lines: ['E-Mail: info@wimmel-welt.de', 'Web: www.wimmel-welt.de'],
      email: 'info@wimmel-welt.de',
      web: 'www.wimmel-welt.de',
    },
    {
      title: 'Vertretungsberechtigt',
      lines: ['Dennie Scharton (Einzelunternehmer)'],
    },
    {
      title: 'Registereintrag',
      lines: ['Eintrag im Handelsregister folgt.'],
    },
    {
      title: 'Umsatzsteuer',
      lines: ['Gemäß § 19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung).'],
    },
    {
      title: 'Verantwortlich für den Inhalt gemäß § 18 Abs. 2 MStV',
      lines: ['Dennie Scharton', 'Falkenrecks Heide 6', '33332 Gütersloh'],
    },
    {
      title: 'Haftungshinweise',
      lines: [
        'Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich. Sollten rechtswidrige Inhalte auffallen, bitten wir um einen entsprechenden Hinweis.',
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
      </header>

      <div className="grid gap-4 text-sm leading-relaxed text-slate-700">
        {sections.map((section) => (
          <section key={section.title} className="rounded-2xl border border-brand-100 bg-white/90 p-4 shadow-sm">
            <h2 className="text-base font-semibold text-brand-700">{section.title}</h2>

            <div className="mt-2 grid gap-1">
              {section.title === 'Kontakt' ? (
                <>
                  <p>
                    E-Mail:{' '}
                    <a className="text-brand-600 underline" href={`mailto:${section.email}`}>
                      {section.email}
                    </a>
                  </p>
                  <p>
                    Web:{' '}
                    <a
                      className="text-brand-600 underline"
                      href={`https://${section.web}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {section.web}
                    </a>
                  </p>
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