# UX-Notizen & Flow-Übersicht

## Navigationskonzept
- **Öffentliche Seiten:** Landing Page, Funktionsübersicht, Preise, FAQ, Datenschutz, Impressum.
- **Eltern-Dashboard:** Suche, Merklisten, Nachrichten, Verträge, Einstellungen.
- **Tagespflege-Dashboard:** Profil, Platzverwaltung (Kalender), Nachrichten, Analysen, Abrechnung.
- **Admin-Panel:** Moderation, Support-Tickets, Reporting.

## Onboarding-Flow
1. Auswahl der Rolle (Eltern / Tagespflegeperson).
2. E-Mail-Bestätigung.
3. Schrittweises Formular mit Fortschrittsanzeige.
   - Für Tagespflegepersonen: Stammdaten → Adresse → Qualifikationen → Dokumente → Platzverwaltung → Vorschau.
   - Für Eltern: Stammdaten → Kinder → Betreuungsbedarf → Benachrichtigungseinstellungen.
4. Abschließende Checkliste & CTA zur Profilerstellung bzw. Suche.

## Suche & Filter UX
- Kartenansicht rechts, Ergebnisliste links.
- Filterbar unten/oben (Datum, Alter, Entfernung, Preis, Sprachen, Bewertungen, Öffnungszeiten).
- "Freie Plätze" Badge in Kartenpins und Karten.
- Möglichkeit, Suchanfragen zu speichern.

## Messenger UX
- Layout wie moderne Chat-Apps (z. B. WhatsApp Web).
- Vordefinierte Buttons für häufige Antworten ("Kannst du telefonieren?", "Welche Zeiten brauchst du?").
- Kennzeichnung ungelesener Nachrichten.
- Übergabe an Telefonanruf per Klick (Rufnummer sichtbar nach Match).

## Benachrichtigungen & Follows
- Eltern können Tagespflegepersonen folgen (Profil-CTA "Folgen").
- Tagespflegepersonen können interessierte Eltern anpinnen ("Merken").
- Push-Benachrichtigungen (PWA) sobald Platzstatus auf "frei" gesetzt wird.
- Digest-E-Mails (z. B. wöchentlich) mit neuen Angeboten.

## Verträge & Zahlungen
- Schrittweiser Vertragsabschluss im Messenger ("Match bestätigt" → Vertragsdetails → digitale Signatur).
- Provision: Eltern und Tagespflegepersonen bestätigen Zahlungsmodalität.
- Übersicht über offene/abgeschlossene Zahlungen im Dashboard.

## Barrierefreiheit
- WCAG 2.1 AA: Hoher Farbkontrast, Screenreader-Labelling, Tastaturnavigation.
- Mehrsprachige Inhalte, einfache Sprache.

## Vertrauens-Elemente
- Zertifikats-Badges (z. B. "Geprüfte Tagespflegeperson").
- Bewertungen mit Verifizierungsstatus.
- Transparente Gebührenaufstellung.

## Mobile First
- Responsive Layouts mit Fokus auf Smartphones.
- Sticky Action Buttons (Anrufen, Nachricht senden).
- Offline-Modus für Messenger (Service Worker + IndexedDB).
