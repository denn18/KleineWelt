// frontend/src/pages/PrivacyPolicyPage/Mobile.jsx

function PrivacyPolicyPage() {
  return (
    <section className="mx-auto mt-6 flex w-full max-w-md flex-col gap-4 rounded-3xl bg-white/85 p-5 shadow-lg">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Datenschutz</p>
        <h1 className="text-2xl font-semibold text-brand-700">Datenschutzerklärung für die Plattform „Wimmel Welt“</h1>
        <p className="text-sm text-slate-600">Stand: 28. April 2026</p>
        <p className="text-sm text-slate-600">
          Der Schutz deiner personenbezogenen Daten hat für uns einen hohen Stellenwert. Mit diesen Hinweisen informieren wir dich
          insbesondere gemäß Art. 13 Datenschutz-Grundverordnung (DSGVO) darüber, welche Daten wir auf der Plattform „Wimmel Welt"
          verarbeiten, zu welchen Zwecken dies geschieht und welche Rechte du hast.
        </p>
      </header>

      <div className="grid gap-4 text-sm leading-relaxed text-slate-700">
        <section className="rounded-2xl border border-brand-100 bg-white/90 p-4 shadow-sm">
          <h2 className="text-base font-semibold text-brand-700">1. Verantwortlicher</h2>
          <p className="mt-2">Verantwortlicher im Sinne der DSGVO</p>
          <p className="mt-2">
            Wimmel Welt
            <br />
            Falkenrecks Heide 6
            <br />
            33332 Gütersloh
            <br />
            Deutschland
            <br />
            E-Mail: info@wimmel-welt.de
          </p>
          <p className="mt-4">
            Zuständige Aufsichtsbehörde für den Datenschutz ist der Landesbeauftragte für Datenschutz und Informationsfreiheit
            Nordrhein-Westfalen (LDI NRW).
          </p>
        </section>

        <section className="rounded-2xl border border-brand-100 bg-white/90 p-4 shadow-sm">
          <h2 className="text-base font-semibold text-brand-700">2. Art der Daten, Zwecke und Rechtsgrundlagen</h2>

          <h3 className="mt-4 font-semibold text-brand-600">2.1 Nutzung der Plattform durch Eltern</h3>
          <p className="mt-2 font-semibold">Verarbeitete Datenarten</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              <strong>Stammdaten:</strong> Vorname, Nachname, E-Mail-Adresse, Telefonnummer, Wohnanschrift, Postleitzahl,
              Benutzername, Passwort (gespeichert als bcrypt-Hash).
            </li>
            <li>
              <strong>Familiendaten:</strong> Angaben zu Kindern (Name, Geburtsjahr bzw. Alter, ggf. Geschlecht, Betreuungsbedarf,
              interne Notizen).
            </li>
            <li>
              <strong>Profildaten:</strong> Optionales Profilbild sowie weitere freiwillige Zusatzangaben.
            </li>
          </ul>
          <p className="mt-2 font-semibold">Zwecke der Verarbeitung</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>Einrichtung, Verwaltung und Nutzung des Elternkontos.</li>
            <li>Erstellung und Darstellung des Elternprofils innerhalb der Plattform.</li>
            <li>Anbahnung und Durchführung von Betreuungsverhältnissen mit Kindertagespflegepersonen.</li>
          </ul>
          <p className="mt-2 font-semibold">Rechtsgrundlagen</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              Vertragserfüllung bzw. Durchführung vorvertraglicher Maßnahmen gemäß Art. 6 Abs. 1 lit. b DSGVO (Nutzung der
              Plattform, Matching, Kontaktaufnahme).
            </li>
            <li>
              Freiwillige Zusatzangaben und besondere Kategorien personenbezogener Daten (z. B. Gesundheitsangaben in Notizen)
              werden auf Grundlage einer Einwilligung gemäß Art. 6 Abs. 1 lit. a i. V. m. Art. 9 Abs. 2 lit. a DSGVO verarbeitet.
            </li>
          </ul>
          <p className="mt-2">
            Die Angabe der zur Registrierung technisch notwendigen Daten (insbesondere E-Mail, Passwort, Basis-Profilinformationen)
            ist für die Nutzung der Plattform erforderlich; darüber hinausgehende Angaben sind freiwillig.
          </p>

          <h3 className="mt-6 font-semibold text-brand-600">2.2 Nutzung durch Kindertagespflegepersonen</h3>
          <p className="mt-2 font-semibold">Verarbeitete Datenarten</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              <strong>Stammdaten:</strong> Name, E-Mail-Adresse, Telefonnummer, Anschrift, Benutzername, Passwort (bcrypt-Hash).
            </li>
            <li>
              <strong>Angebots- und Profildaten:</strong> Qualifikationen, Verfügbarkeit, Öffnungszeiten, pädagogisches Konzept,
              Beschreibung des Betreuungsangebots.
            </li>
            <li>
              <strong>Medien &amp; Dokumente:</strong> Profilbilder, Logos, ggf. zusätzliche Fotos und Dokumente, die freiwillig
              hochgeladen werden (z. B. Zertifikate).
            </li>
          </ul>
          <p className="mt-2 font-semibold">Zwecke der Verarbeitung</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>Erstellung und Verwaltung eines Profils als Kindertagespflegeperson.</li>
            <li>Digitale Darstellung freier Betreuungsplätze und des Betreuungsangebots.</li>
            <li>Ermöglichung der Kontaktaufnahme durch interessierte Eltern (Vermittlungsfunktion).</li>
          </ul>
          <p className="mt-2 font-semibold">Rechtsgrundlagen</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              Vertragserfüllung bzw. Durchführung vorvertraglicher Maßnahmen gemäß Art. 6 Abs. 1 lit. b DSGVO (Bereitstellung und
              Nutzung des Profils, Matching, Kommunikation).
            </li>
            <li>
              Berechtigte Interessen gemäß Art. 6 Abs. 1 lit. f DSGVO, insbesondere eine effiziente, digitale Vermittlung von
              Betreuungsangeboten an suchende Eltern sowie der wirtschaftliche Betrieb und die Weiterentwicklung der Plattform.
            </li>
          </ul>
          <p className="mt-2">
            Alle Daten, einschließlich Nachrichten und Mediendateien, werden gelöscht, sobald die Kindertagespflegeperson ihren
            Account endgültig löscht, vorbehaltlich gesetzlicher Aufbewahrungspflichten (siehe Abschnitt 5).
          </p>

          <h3 className="mt-6 font-semibold text-brand-600">2.3 Suche, Filterung und Matching</h3>
          <p className="mt-2">Aktuell verarbeiten wir für die Suche und das Matching insbesondere folgende Daten:</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>Postleitzahl der Eltern und der Kindertagespflegepersonen.</li>
          </ul>
          <p className="mt-2 font-semibold">Zweck</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>Eltern können auf Basis der Postleitzahl geeignete Kindertagespflegepersonen in ihrer Stadt bzw. Umgebung finden.</li>
            <li>Matching-Funktion zur bedarfsgerechten Vermittlung von Betreuungsangeboten.</li>
          </ul>
          <p className="mt-2 font-semibold">Rechtsgrundlage</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              Durchführung vorvertraglicher Maßnahmen und Vertragserfüllung gemäß Art. 6 Abs. 1 lit. b DSGVO (Bereitstellung der
              Matching-Funktion im Rahmen deines Nutzerkontos).
            </li>
          </ul>
          <p className="mt-2">
            Elternprofile sind für Kindertagespflegepersonen sichtbar, und Profile von Kindertagespflegepersonen sind für Eltern
            sichtbar, soweit dies für die Vermittlung erforderlich ist.
          </p>

          <h3 className="mt-6 font-semibold text-brand-600">2.4 Chat-Funktion und Kommunikation</h3>
          <p className="mt-2">
            Die Plattform stellt eine optionale Messaging-Funktion (Messenger/Chat) für die direkte Kommunikation zwischen Eltern und
            Kindertagespflegepersonen bereit.
          </p>
          <p className="mt-2 font-semibold">Verarbeitete Datenarten</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>Chatnachrichten (Inhalte der Kommunikation).</li>
            <li>Metadaten und Zeitstempel (z. B. Absender, Empfänger, Sendezeit).</li>
          </ul>
          <p className="mt-2 font-semibold">Zweck</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              Bereitstellung einer sicheren Kommunikationsmöglichkeit zur Anbahnung und Abstimmung von Betreuungsverhältnissen.
            </li>
            <li>Gewährleistung der technischen Funktionsfähigkeit des Messengers (z. B. Zuordnung von Nachrichten zu Accounts).</li>
          </ul>
          <p className="mt-2 font-semibold">Rechtsgrundlagen</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              Vertragserfüllung gemäß Art. 6 Abs. 1 lit. b DSGVO (Bereitstellung des Messenger-Dienstes im Rahmen des Nutzerkontos).
            </li>
            <li>
              Soweit Nutzer in Chatnachrichten freiwillig besondere Kategorien personenbezogener Daten (z. B. Gesundheitsdaten zu
              Kindern) mitteilen, erfolgt die Verarbeitung auf Grundlage einer ausdrücklichen Einwilligung nach Art. 9 Abs. 2 lit. a
              DSGVO.
            </li>
          </ul>
          <p className="mt-2">
            Die Nutzung des Messengers ist freiwillig, aber für bestimmte Kommunikationsprozesse praktisch erforderlich.
            Chatnachrichten werden spätestens mit Löschung des jeweiligen Nutzerkontos gelöscht (siehe Abschnitt 5).
          </p>

          <h3 className="mt-6 font-semibold text-brand-600">2.5 Medien-Uploads, insbesondere Kinderfotos</h3>
          <p className="mt-2">
            Eltern und Kindertagespflegepersonen können Profilbilder und weitere Mediendateien hochladen. Hierbei kann es sich auch
            um Fotos handeln, auf denen Kinder erkennbar sind.
          </p>
          <p className="mt-2 font-semibold">Grundsatz</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>Wir empfehlen ausdrücklich, keine identifizierbaren Fotos von Kindern auf der Plattform oder allgemein im Internet hochzuladen.</li>
          </ul>

          <h3 className="mt-6 font-semibold text-brand-600">2.6 Rechnungen und Vertragsdokumente</h3>
          <p className="mt-2">Über die Plattform „Wimmel Welt“ werden aktuell keine Vertrags- oder Abrechnungsdaten verarbeitet.</p>
          <p className="mt-2">
            Betreuungsverträge und sonstige vertragliche Unterlagen werden ausschließlich zwischen den Kindertagespflegepersonen und
            den zuständigen Jugendämtern bzw. Eltern abgeschlossen und verwaltet. Wimmel Welt nimmt keinen Einfluss auf die Gestaltung
            dieser Verträge und speichert diesbezügliche Dokumente nicht.
          </p>

          <h3 className="mt-6 font-semibold text-brand-600">2.7 Technische Zugriffsdaten und Logs</h3>
          <p className="mt-2">
            Wir verzichten nach aktuellem Stand auf eigene dauerhafte Server-Logfiles, die IP-Adressen oder Nutzungsverläufe
            speichern.
          </p>
          <p className="mt-2">
            Soweit technische Protokollierungen beim Hoster für den kurzfristigen Betrieb der Plattform unumgänglich sein sollten
            (z. B. zur Abwehr akuter Angriffe oder zur Stabilitätssicherung), werden diese nur im unbedingt erforderlichen Umfang
            genutzt und innerhalb der dort vorgesehenen kurzen Fristen gelöscht.
          </p>
          <p className="mt-2">Es erfolgt keine Auswertung von IP-Adressen zu Marketing- oder Trackingzwecken.</p>
        </section>

        <section className="rounded-2xl border border-brand-100 bg-white/90 p-4 shadow-sm">
          <h2 className="text-base font-semibold text-brand-700">3. Empfänger, Hosting und externe Dienstleister</h2>
          <h3 className="mt-4 font-semibold text-brand-600">3.1 Interne Empfänger</h3>
          <p className="mt-2">
            Innerhalb von Wimmel Welt haben nur diejenigen Personen Zugriff auf personenbezogene Daten, die diese zur Erfüllung der
            genannten Zwecke benötigen (z. B. technische Administration, Support). Der Zugriff ist rollenbasiert und auf das
            notwendige Maß beschränkt.
          </p>

          <h3 className="mt-6 font-semibold text-brand-600">3.2 Sichtbarkeit innerhalb der Plattform</h3>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              Eltern können die Profile der Kindertagespflegepersonen einschließlich der freiwilligen Angaben sehen, soweit dies zur
              Vermittlung eines Betreuungsplatzes erforderlich ist.
            </li>
            <li>
              Kindertagespflegepersonen können die Profile der Eltern einsehen, mit denen ein Kontakt über die Plattform hergestellt
              wird.
            </li>
          </ul>
          <p className="mt-2">
            Diese gegenseitige Sichtbarkeit ist wesentlicher Bestandteil der Vermittlungsfunktion (Rechtsgrundlage: Art. 6 Abs. 1 lit.
            b DSGVO).
          </p>

          <h3 className="mt-6 font-semibold text-brand-600">3.3 Externe Dienstleister (Auftragsverarbeiter)</h3>
          <p className="mt-2">Für den Betrieb der Plattform setzen wir externe Dienstleister ein, insbesondere:</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>Cloud-Speicher (z. B. AWS S3) für die Speicherung von Bildern und Dokumenten.</li>
            <li>Datenbankdienst (z. B. MongoDB Atlas) für die Speicherung von Profil- und Kommunikationsdaten.</li>
            <li>
              Versand von System- und Benachrichtigungs-E-Mails (z. B. über NodeMailer unter Nutzung unserer eigenen
              E-Mail-Infrastruktur).
            </li>
          </ul>
          <p className="mt-2">
            Mit diesen Dienstleistern werden Auftragsverarbeitungsverträge gemäß Art. 28 DSGVO abgeschlossen, die ein angemessenes
            Datenschutzniveau sicherstellen.
          </p>

          <h3 className="mt-6 font-semibold text-brand-600">3.4 Drittlandübermittlungen</h3>
          <p className="mt-2">
            Wir wählen Rechenzentrumsstandorte innerhalb der Europäischen Union bzw. des Europäischen Wirtschaftsraums, soweit dies
            technisch möglich ist.
          </p>
          <p className="mt-2">
            Soweit im Einzelfall eine Übermittlung personenbezogener Daten an Anbieter mit Sitz in einem Drittland (z. B. USA) nicht
            ausgeschlossen werden kann, erfolgt diese nur unter Einhaltung der Art. 44 ff. DSGVO, insbesondere auf Grundlage von
            Standardvertragsklauseln der EU-Kommission sowie ggf. ergänzender Schutzmaßnahmen.
          </p>
        </section>

        <section className="rounded-2xl border border-brand-100 bg-white/90 p-4 shadow-sm">
          <h2 className="text-base font-semibold text-brand-700">4. Cookies, Token und lokale Speicherung</h2>
          <p className="mt-2">Wir setzen derzeit keine Tracking- oder Marketing-Cookies ein.</p>
          <p className="mt-2">
            Zur Authentifizierung und Sitzungsverwaltung verwenden wir einen technischen Sitzungs-Token (z. B. in Form eines JSON Web
            Token, „JWT“), der im Browser des Nutzers gespeichert wird. Dieser Token dient ausschließlich dazu, dich für die Dauer der
            Sitzung bzw. bis zum Logout gegenüber der Plattform zu erkennen und deine Zugriffsrechte zu prüfen.
          </p>
          <p className="mt-2">
            Es werden keine Analyse- oder Tracking-Tools (wie z. B. Google Analytics) eingesetzt, und es findet kein
            geräteübergreifendes Tracking statt.
          </p>
        </section>

        <section className="rounded-2xl border border-brand-100 bg-white/90 p-4 shadow-sm">
          <h2 className="text-base font-semibold text-brand-700">5. Speicherdauer und Löschung</h2>
          <p className="mt-2">
            Wir speichern personenbezogene Daten grundsätzlich nur so lange, wie dies für die jeweiligen Zwecke erforderlich ist oder
            wir gesetzlich dazu verpflichtet sind.
          </p>
          <p className="mt-2 font-semibold">Konkrete Fristen</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              <strong>Aktive Nutzerkonten:</strong> Daten werden für die Dauer der aktiven Nutzung des Kontos gespeichert.
            </li>
            <li>
              <strong>Inaktive Konten:</strong> Konten, die länger als 12 Monate nicht genutzt wurden, werden einschließlich aller
              damit verbundenen Daten (Profile, Chatnachrichten, Mediendateien) automatisiert gelöscht, sofern keine gesetzlichen
              Aufbewahrungspflichten entgegenstehen.
            </li>
            <li>
              <strong>Nutzerinitiierte Löschung:</strong> Wenn du dein Konto selbst löschst oder die Löschung verlangst, werden deine
              personenbezogenen Daten und alle damit verknüpften Inhalte (Profile, Nachrichten, Bilder, Dokumente) grundsätzlich
              unverzüglich gelöscht, soweit dem keine gesetzlichen Pflichten entgegenstehen.
            </li>
            <li>
              <strong>Sicherungsdaten:</strong> Soweit personenbezogene Daten in Sicherungskopien (Backups) enthalten sind, werden
              diese mit Ablauf des jeweiligen Lösch- bzw. Überschreibzyklus entfernt.
            </li>
          </ul>
          <p className="mt-2">
            Gesetzliche Aufbewahrungspflichten (z. B. handels- oder steuerrechtliche Pflichten) bestehen derzeit nicht, da über die
            Plattform keine Abrechnungs- oder Vertragsdaten verarbeitet werden.
          </p>
        </section>

        <section className="rounded-2xl border border-brand-100 bg-white/90 p-4 shadow-sm">
          <h2 className="text-base font-semibold text-brand-700">6. Pflicht zur Bereitstellung von Daten</h2>
          <p className="mt-2">
            Die Bereitstellung der in den Registrierungsformularen als erforderlich gekennzeichneten Daten ist für die Nutzung der
            Plattform und die Vermittlung von Betreuungsverhältnissen notwendig. Ohne diese Angaben kann kein Nutzerkonto angelegt und
            kein Matching durchgeführt werden (Art. 13 Abs. 2 lit. e DSGVO).
          </p>
          <p className="mt-2">
            Die Angabe weiterer Daten, insbesondere freiwilliger Profil- und Familiendaten, ist freiwillig. Werden diese nicht
            bereitgestellt, kann dies die Nutzbarkeit einzelner Funktionen (z. B. detailliertere Suche) einschränken, führt aber nicht
            zum Ausschluss von der Plattform.
          </p>
        </section>

        <section className="rounded-2xl border border-brand-100 bg-white/90 p-4 shadow-sm">
          <h2 className="text-base font-semibold text-brand-700">7. Rechte der betroffenen Personen</h2>
          <p className="mt-2">Dir stehen im Hinblick auf die Verarbeitung deiner personenbezogenen Daten folgende Rechte zu:</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>Auskunft über die bei uns gespeicherten Daten (Art. 15 DSGVO).</li>
            <li>Berichtigung unrichtiger oder unvollständiger Daten (Art. 16 DSGVO).</li>
            <li>Löschung („Recht auf Vergessenwerden") gemäß Art. 17 DSGVO, soweit keine gesetzlichen Aufbewahrungspflichten entgegenstehen.</li>
            <li>Einschränkung der Verarbeitung nach Art. 18 DSGVO.</li>
            <li>
              Datenübertragbarkeit nach Art. 20 DSGVO, sofern die Verarbeitung auf Einwilligung oder Vertrag beruht und mithilfe
              automatisierter Verfahren erfolgt.
            </li>
            <li>
              Widerspruch gegen die Verarbeitung personenbezogener Daten, soweit diese auf Art. 6 Abs. 1 lit. f DSGVO (berechtigte
              Interessen) gestützt wird (Art. 21 DSGVO).
            </li>
            <li>Widerruf von Einwilligungen jederzeit mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO).</li>
          </ul>
          <p className="mt-2">
            Zur Wahrnehmung deiner Rechte kannst du dich jederzeit über die oben angegebenen Kontaktdaten an uns wenden.
          </p>
          <p className="mt-2">
            Außerdem hast du das Recht auf Beschwerde bei einer Datenschutzaufsichtsbehörde, insbesondere in dem Mitgliedstaat deines
            gewöhnlichen Aufenthaltsorts, deines Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes (Art. 77 DSGVO).
          </p>
        </section>

        <section className="rounded-2xl border border-brand-100 bg-white/90 p-4 shadow-sm">
          <h2 className="text-base font-semibold text-brand-700">8. Datensicherheit</h2>
          <p className="mt-2">
            Wir treffen angemessene technische und organisatorische Maßnahmen, um ein dem Risiko angemessenes Schutzniveau für
            personenbezogene Daten zu gewährleisten (Art. 32 DSGVO).
          </p>
          <p className="mt-2">Dazu gehören insbesondere:</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>Speicherung von Passwörtern ausschließlich als sichere Hash-Werte (bcrypt).</li>
            <li>Zugriffsbeschränkungen auf Datenbanken und Cloud-Speicher, nur für berechtigte Personen und Systeme.</li>
            <li>Verschlüsselung der Datenübertragung (TLS/HTTPS) zwischen deinem Endgerät und unseren Servern.</li>
            <li>Regelmäßige Aktualisierung der Systeme und Sicherheitsmaßnahmen.</li>
          </ul>
        </section>

        <section className="rounded-2xl border border-brand-100 bg-white/90 p-4 shadow-sm">
          <h2 className="text-base font-semibold text-brand-700">9. Keine automatisierte Entscheidungsfindung / Profiling</h2>
          <p className="mt-2">
            Es findet keine automatisierte Entscheidungsfindung einschließlich Profiling im Sinne von Art. 22 DSGVO statt, die
            rechtliche Wirkungen gegenüber Nutzern entfaltet oder sie in ähnlicher Weise erheblich beeinträchtigt.
          </p>
        </section>

        <section className="rounded-2xl border border-brand-100 bg-white/90 p-4 shadow-sm">
          <h2 className="text-base font-semibold text-brand-700">10. Änderungen dieser Datenschutzerklärung</h2>
          <p className="mt-2">
            Wir entwickeln die Plattform und unsere Prozesse laufend weiter. Daher kann es notwendig werden, diese
            Datenschutzerklärung zu ändern. Die jeweils aktuelle Fassung ist jederzeit auf www.wimmel-welt.de abrufbar.
          </p>
        </section>
      </div>
    </section>
  );
}

export default PrivacyPolicyPage;
