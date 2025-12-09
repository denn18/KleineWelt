function PrivacyPolicyPage() {
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 rounded-3xl bg-white/85 p-10 shadow-lg">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-500">Datenschutz</p>
        <h1 className="text-3xl font-semibold text-brand-700">Hinweise zum Schutz deiner Daten</h1>
        <p className="text-sm text-slate-600">
          Wir behandeln personenbezogene Daten verantwortungsvoll, transparent und entsprechend der Vorgaben der
          Datenschutz-Grundverordnung (DSGVO) sowie des Bundesdatenschutzgesetzes (BDSG).
        </p>
      </header>

      <div className="grid gap-6 text-sm leading-relaxed text-slate-700">
        <section className="rounded-2xl border border-brand-100 bg-white/90 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-700">1. Verantwortliche Stelle & Datenschutzkontakt</h2>
          <p className="mt-2">
            Verantwortlich für die Datenverarbeitung ist die Wimmel Welt Plattform. Für Datenschutzanfragen erreichst du uns
            per E-Mail unter <a className="text-brand-600 underline" href="mailto:wimmel-welt@info.de">wimmel-welt@info.de</a>.
          </p>
        </section>

        <section className="rounded-2xl border border-brand-100 bg-white/90 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-700">2. Welche Daten wir verarbeiten</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>Stammdaten wie Name, Kontaktdaten, Adressen sowie Profilangaben von Eltern und Kindertagespflegepersonen.</li>
            <li>Anmelde- und Nutzungsdaten (z. B. Logins, Nachrichtenverläufe, hochgeladene Dokumente oder Bilder).</li>
            <li>Technische Daten wie IP-Adresse, Browserinformationen sowie Protokolle zu Sicherheit und Stabilität.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-brand-100 bg-white/90 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-700">3. Zwecke und Rechtsgrundlagen</h2>
          <p className="mt-2">Wir verarbeiten Daten für folgende Zwecke auf Basis von Art. 6 Abs. 1 DSGVO:</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>Bereitstellung unserer Plattform, Vermittlung von Betreuungsplätzen und Kommunikation zwischen Nutzenden.</li>
            <li>Erfüllung vertraglicher Pflichten und Durchführung vorvertraglicher Maßnahmen.</li>
            <li>Wahrung berechtigter Interessen wie IT-Sicherheit, Missbrauchserkennung und Optimierung der Angebote.</li>
            <li>Einwilligungen, z. B. für optionale Uploads, Newsletter oder die Veröffentlichung von Profilbildern.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-brand-100 bg-white/90 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-700">4. Speicherdauer</h2>
          <p className="mt-2">
            Wir speichern personenbezogene Daten nur solange, wie es für die oben genannten Zwecke erforderlich ist oder gesetzliche
            Aufbewahrungsfristen bestehen. Nach Wegfall der Zwecke oder Ablauf der Fristen werden Daten gelöscht oder anonymisiert.
          </p>
        </section>

        <section className="rounded-2xl border border-brand-100 bg-white/90 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-700">5. Weitergabe an Dritte & Auftragsverarbeitung</h2>
          <p className="mt-2">
            Eine Weitergabe erfolgt nur, wenn sie zur Vertragserfüllung nötig ist, du eingewilligt hast oder eine rechtliche Pflicht
            besteht. Dienstleister erhalten Daten ausschließlich auf Basis von Auftragsverarbeitungsverträgen gemäß Art. 28 DSGVO und
            werden sorgfältig ausgewählt.
          </p>
        </section>

        <section className="rounded-2xl border border-brand-100 bg-white/90 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-700">6. Deine Rechte</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung (Art. 15–18 DSGVO).</li>
            <li>Datenübertragbarkeit (Art. 20 DSGVO) und Widerspruch gegen Verarbeitung auf Basis berechtigter Interessen (Art. 21 DSGVO).</li>
            <li>Widerruf erteilter Einwilligungen mit Wirkung für die Zukunft.</li>
            <li>Beschwerderecht bei einer Datenschutzaufsichtsbehörde.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-brand-100 bg-white/90 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-700">7. Sicherheit, Hosting & Protokollierung</h2>
          <p className="mt-2">
            Wir schützen Daten durch aktuelle technische und organisatorische Maßnahmen, verschlüsselte Verbindungen und rollenbasierte
            Zugriffskonzepte. Server-Logs nutzen wir zur Störungsbehebung und Sicherheit und löschen sie regelmäßig.
          </p>
        </section>

        <section className="rounded-2xl border border-brand-100 bg-white/90 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-700">8. Cookies & Analysen</h2>
          <p className="mt-2">
            Funktionale Cookies sind notwendig, um Anmeldungen und Einstellungen bereitzustellen. Optionale Statistik- oder Komfort-
            Cookies setzen wir nur nach vorheriger Einwilligung. Du kannst diese jederzeit in den Browser-Einstellungen löschen.
          </p>
        </section>

        <section className="rounded-2xl border border-brand-100 bg-white/90 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-700">9. Besondere Hinweise für Kinder & Jugendliche</h2>
          <p className="mt-2">
            Unsere Plattform richtet sich an Erziehungsberechtigte und Betreuungspersonen. Minderjährige dürfen ohne Zustimmung der
            Sorgeberechtigten keine eigenen Accounts anlegen oder Daten übermitteln.
          </p>
        </section>

        <section className="rounded-2xl border border-brand-100 bg-white/90 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-700">10. Änderungen dieser Hinweise</h2>
          <p className="mt-2">
            Wir passen die Datenschutzhinweise an, wenn neue gesetzliche Anforderungen, technische Entwicklungen oder Angebote dies
            erfordern. Die jeweils aktuelle Fassung findest du jederzeit auf dieser Seite.
          </p>
        </section>
      </div>
    </section>
  );
}

export default PrivacyPolicyPage;
