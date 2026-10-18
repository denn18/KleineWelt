export default function ImprintPage() {
  const sections = [
    {
      title: 'Diensteanbieter',
      lines: [
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
      title: 'Verantwortlich für den Inhalt gemäß § 18 Abs. 2 MStV',
      lines: ['Wimmel Welt', 'Falkenrecks Heide 6', '33332 Gütersloh'],
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
    <section className="mx-auto mt-6 flex w-full max-w-md flex-col gap-5 rounded-3xl bg-white/85 p-5 shadow-lg md:mt-0 md:max-w-4xl md:gap-6 md:p-10">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-500 md:text-sm">Impressum</p>
        <h1 className="text-2xl font-semibold text-brand-700 md:text-3xl">Angaben gemäß § 5 TMG</h1>
      </header>

      <div className="grid gap-4 text-sm leading-relaxed text-slate-700 md:gap-5">
        {sections.map((section) => (
          <section key={section.title} className="rounded-2xl border border-brand-100 bg-white/90 p-4 shadow-sm md:p-5">
            <h2 className="text-base font-semibold text-brand-700 md:text-lg">{section.title}</h2>

            <div className="mt-2 grid gap-1 md:gap-0">
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
                    <span className="hidden md:inline">{section.web}</span>
                    <a
                      className="text-brand-600 underline md:hidden"
                      href={`https://${section.web}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {section.web}
                    </a>
                  </p>
                </>
              ) : (
                section.lines.map((line, index) => (
                  <p key={`${line}-${index}`}>
                    {section.title === 'Diensteanbieter' && line === '33332 Gütersloh' ? (
                      <>
                        33332<span className="md:hidden"> </span>
                        <br className="hidden md:block" />
                        Gütersloh
                      </>
                    ) : line}
                  </p>
                ))
              )}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
