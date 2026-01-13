// frontend/src/pages/PrivacyPolicyPage/Mobile.jsx
// Mobile-Ansicht: Layout/Anordnung mobilefreundlich, Inhalt/Funktionen 1:1 aus Web-App (nur statische Seite)

function PrivacyPolicyPage() {
  return (
    <section className="mx-auto mt-6 flex w-full max-w-md flex-col gap-4 rounded-3xl bg-white/85 p-5 shadow-lg">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Datenschutz</p>
        <h1 className="text-2xl font-semibold text-brand-700">Datenschutzerklärung</h1>
        <p className="text-sm text-slate-600">
          Der Schutz deiner personenbezogenen Daten hat für uns einen hohen Stellenwert. Nachfolgend informieren wir dich umfassend
          über Art, Umfang und Zweck der Verarbeitung personenbezogener Daten auf der Plattform „Wimmel Welt“ gemäß
          Datenschutz-Grundverordnung (DSGVO).
        </p>
      </header>

      <div className="grid gap-4 text-sm leading-relaxed text-slate-700">
        {/* 1 */}
        <section className="rounded-2xl border border-brand-100 bg-white/90 p-4 shadow-sm">
          <h2 className="text-base font-semibold text-brand-700">1. Verantwortlicher und Geltungsbereich</h2>

          <p className="mt-2">
            Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
          </p>

          <p className="mt-2">
            Wimmel Welt [Rechtsform, z.B. e.K. / UG (haftungsbeschränkt) / GmbH]
            <br />
            [Straße, Hausnummer]
            <br />
            [PLZ, Ort]
            <br />
            Telefon: [Telefonnummer]
            <br />
            E-Mail: [zentrale Kontaktadresse]
          </p>

          <p className="mt-4">Sofern ein Datenschutzbeauftragter bestellt ist:</p>

          <p className="mt-2">
            Datenschutzbeauftragter: [Name oder externer Dienstleister]
            <br />
            Anschrift: [Anschrift]
            <br />
            E-Mail: [DSB-E-Mail-Adresse]
          </p>

          <p className="mt-4">
            Diese Datenschutzerklärung gilt für die Nutzung der Online-Plattform „Wimmel Welt“ unter den Domains
            [z.B. wimmelwelt.de] einschließlich der API-Endpunkte https://api.wimmelwelt.de (Produktivsystem) und
            https://api-staging.wimmelwelt.de (Staging-Umgebung) sowie aller zugehörigen Weboberflächen und Funktionen
            (Registrierung, Login, Profile, Suche, Chat, Medien-Uploads, Rechnungsbereitstellung).
          </p>
        </section>

        {/* 2 */}
        <section className="rounded-2xl border border-brand-100 bg-white/90 p-4 shadow-sm">
          <h2 className="text-base font-semibold text-brand-700">
            2. Zwecke der Verarbeitung, Datenarten und Rechtsgrundlagen
          </h2>

          <h3 className="mt-4 font-semibold text-brand-600">2.1 Nutzung der Plattform durch Eltern</h3>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              <strong>Stammdaten:</strong> Vorname, Nachname, E-Mail-Adresse, Telefonnummer, Wohnanschrift, Postleitzahl,
              Benutzername, Passwort (bcrypt-Hash).
            </li>
            <li>
              <strong>Familiendaten:</strong> Angaben zu Kindern (Name, Alter bzw. Geburtsjahr, ggf. Geschlecht, Betreuungsbedarf,
              interne Notizen).
            </li>
            <li>
              <strong>Profildaten:</strong> Optionales Profilbild und freiwillige Zusatzangaben.
            </li>
          </ul>

          <p className="mt-2">
            Zweck der Verarbeitung ist die Einrichtung, Verwaltung und Nutzung des Elternkontos sowie die Anbahnung und Durchführung
            von Betreuungsverhältnissen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.
          </p>

          <p className="mt-2">
            Freiwillige Zusatzangaben erfolgen auf Grundlage einer Einwilligung gemäß Art. 6 Abs. 1 lit. a DSGVO, ggf. Art. 9 Abs. 2
            lit. a DSGVO.
          </p>

          <h3 className="mt-6 font-semibold text-brand-600">2.2 Nutzung durch Kindertagespflegepersonen</h3>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              <strong>Stammdaten:</strong> Name, E-Mail, Telefonnummer, Anschrift, Benutzername, Passwort (bcrypt-Hash).
            </li>
            <li>
              <strong>Angebots- und Profildaten:</strong> Qualifikationen, Verfügbarkeit, Öffnungszeiten, pädagogisches Konzept,
              Beschreibung.
            </li>
            <li>
              <strong>Medien &amp; Dokumente:</strong> Profilbilder, Logos, Fotos, Dokumente.
            </li>
          </ul>

          <p className="mt-2">
            Zweck ist die Darstellung des Betreuungsangebots und die Kontaktanbahnung. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b und
            lit. f DSGVO.
          </p>

          <h3 className="mt-6 font-semibold text-brand-600">2.3 Suche, Filterung und Matching</h3>
          <p className="mt-2">
            Verarbeitung von Suchparametern und Matchingdaten zur bedarfsgerechten Vermittlung. Rechtsgrundlage ist Art. 6 Abs. 1 lit.
            b DSGVO.
          </p>

          <h3 className="mt-6 font-semibold text-brand-600">2.4 Chat-Funktion und Kommunikation</h3>
          <p className="mt-2">
            Verarbeitung von Chatnachrichten, Metadaten und Zeitstempeln zur Bereitstellung der Kommunikationsfunktion.
            Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO. Freiwillige Angaben besonderer Kategorien erfolgen auf Grundlage von Art. 9
            Abs. 2 lit. a DSGVO.
          </p>

          <h3 className="mt-6 font-semibold text-brand-600">2.5 Medien-Uploads, insbesondere Kinderfotos</h3>
          <p className="mt-2">
            Das Hochladen identifizierbarer Kinderbilder ist nur mit ausdrücklicher Einwilligung der Sorgeberechtigten zulässig (Art.
            6 Abs. 1 lit. a i.V.m. Art. 8 DSGVO). Die Einwilligung ist jederzeit widerrufbar.
          </p>

          <h3 className="mt-6 font-semibold text-brand-600">2.6 Rechnungen und Vertragsdokumente</h3>
          <p className="mt-2">
            Verarbeitung von Abrechnungs- und Vertragsdaten zur Vertragserfüllung und Erfüllung gesetzlicher Pflichten gemäß Art. 6
            Abs. 1 lit. b und c DSGVO.
          </p>

          <h3 className="mt-6 font-semibold text-brand-600">2.7 Technische Zugriffsdaten und Logs</h3>
          <p className="mt-2">
            Verarbeitung technischer Logdaten zur Sicherstellung von Stabilität, Sicherheit und Fehleranalyse. Rechtsgrundlage ist Art.
            6 Abs. 1 lit. f DSGVO.
          </p>
        </section>

        {/* 3 */}
        <section className="rounded-2xl border border-brand-100 bg-white/90 p-4 shadow-sm">
          <h2 className="text-base font-semibold text-brand-700">3. Hosting, externe Dienstleister und Datenübermittlung</h2>

          <p className="mt-2">
            Die Plattform nutzt unter anderem AWS S3 für Cloud-Storage, MongoDB Atlas als Datenbankdienst, SMTP-Dienste für
            E-Mail-Versand sowie Monitoring- und Logging-Infrastrukturen (z.B. Grafana, PagerDuty).
          </p>

          <p className="mt-2">
            Alle Dienstleister werden auf Grundlage von Auftragsverarbeitungsverträgen gemäß Art. 28 DSGVO eingesetzt. Etwaige
            Drittlandübermittlungen erfolgen ausschließlich unter Einhaltung der Art. 44 ff. DSGVO.
          </p>
        </section>

        {/* 4 */}
        <section className="rounded-2xl border border-brand-100 bg-white/90 p-4 shadow-sm">
          <h2 className="text-base font-semibold text-brand-700">4. Authentifizierung, Cookies und Speicherdauer</h2>

          <p className="mt-2">
            Die Authentifizierung erfolgt über eine eigene Nutzerverwaltung. Passwörter werden ausschließlich als bcrypt-Hash
            gespeichert. Zur Sitzungsverwaltung wird ein technisch notwendiges HTTP-only Cookie verwendet.
          </p>

          <p className="mt-2">Tracking- oder Marketing-Cookies werden derzeit nicht eingesetzt.</p>

          <p className="mt-2">
            Personenbezogene Daten werden nur so lange gespeichert, wie dies für die jeweiligen Zwecke erforderlich ist oder
            gesetzliche Aufbewahrungsfristen bestehen.
          </p>
        </section>

        {/* 5 */}
        <section className="rounded-2xl border border-brand-100 bg-white/90 p-4 shadow-sm">
          <h2 className="text-base font-semibold text-brand-700">5. Rechte der betroffenen Personen und Datensicherheit</h2>

          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>Auskunft (Art. 15 DSGVO)</li>
            <li>Berichtigung (Art. 16 DSGVO)</li>
            <li>Löschung (Art. 17 DSGVO)</li>
            <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
            <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
            <li>Widerspruch (Art. 21 DSGVO)</li>
            <li>Widerruf von Einwilligungen (Art. 7 Abs. 3 DSGVO)</li>
          </ul>

          <p className="mt-4">
            Zudem besteht ein Beschwerderecht bei einer Datenschutzaufsichtsbehörde gemäß Art. 77 DSGVO.
          </p>

          <p className="mt-2">
            Wir setzen angemessene technische und organisatorische Maßnahmen ein, um ein hohes Schutzniveau für personenbezogene Daten
            sicherzustellen.
          </p>
        </section>
      </div>
    </section>
  );
}

export default PrivacyPolicyPage;
