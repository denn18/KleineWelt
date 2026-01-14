# Kleine Welt Plattform

Dieses Repository enthält den Grundstein für die Plattform "Kleine Welt" mit getrennten Ordnern für Backend (Node.js/Express) und Frontend (React/Vite). Die Implementierung folgt dem in der Aufgabenstellung beschriebenen Ablauf und kann als Ausgangspunkt für weitere Funktionen dienen.

## Projektstruktur

```
.
├── backend        # Express-API mit vorbereiteten Endpunkten für Eltern, Tagespflegepersonen, Matching und Messenger
├── frontend       # React-Frontend mit TailwindCSS, React Router und Leaflet-Karte
└── Bilder         # Referenzmaterial für das visuelle Design
```

## Backend

- Node.js + Express mit modularer Struktur (Controller, Services, Routes).
- MongoDB-Anbindung vorbereitet (`src/config/database.js`). Die tatsächliche Verbindung kann über die Umgebungsvariablen hergestellt werden (siehe `backend/.env.example`).
  - Variante 1: komplette Verbindungs-URI über `MONGODB_URI`.
  - Variante 2: einzelne Komponenten wie `MONGODB_HOST`, `MONGODB_USERNAME`, `MONGODB_PASSWORD`, `MONGODB_DB_NAME` usw. – praktisch für Plattformen, die Credentials getrennt bereitstellen.
- Die `.env`-Datei kann entweder im Projekt-Root oder in `backend/.env` liegen. Beim Start des Servers werden beide Pfade automatisch berücksichtigt, sodass bestehende Deployments unverändert bleiben.
- In-Memory-Speicher ersetzt die Datenbank, bis die Persistenz fertiggestellt ist.
- REST-Endpunkte für Tagespflegepersonen, Eltern, Matches und Nachrichten.
- Datei-Uploads landen standardmäßig in Amazon S3. Setze `FILE_STORAGE_MODE=local`, wenn du für lokale Entwicklung das Dateisystem verwenden möchtest. Die dafür nötigen Umgebungsvariablen sind:
  - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`
  - `AWS_S3_BUCKET` (Ziel-Bucket, erforderlich im S3-Modus)
  - `MEMBERSHIP_INVOICE_S3_KEY` (S3-Key der Quittungs-PDF für `/api/documents/membership-invoice`)
  - `FILE_UPLOAD_MAX_BYTES` (optional, Standard 25 MB)
  Die API generiert abrufbare URLs unter `/api/files/<S3-Key>` und speichert nur Metadaten/Referenzen in MongoDB.
- Skripte
  - `npm run dev`: Entwicklungsmodus mit Nodemon
  - `npm run server`: Alias für den Entwicklungsmodus – praktisch, falls bestehende Dokumentationen diesen Befehl verwenden
  - `npm run start`: Produktionsstart
  - `npm run lint`: ESLint-Prüfung

## Frontend

- React (Vite) mit React Router für die verschiedenen Seiten (Startseite, Rollenwahl, Anmeldung Eltern/Tagespflege, Dashboard).
- TailwindCSS für schnelles Styling entsprechend der bereitgestellten Mockups.
- Leaflet-Karte (OpenStreetMap Tiles) als Live-Vorschau der Tagespflegepersonen.
- Axios zur Kommunikation mit dem Backend; Endpunkte sind bereits verdrahtet.
- Der Entwicklungsserver leitet `/api`- und `/health`-Anfragen automatisch an das Backend weiter. Standardmäßig wird dafür `http://localhost:5000`
  verwendet. Über die Variable `VITE_BACKEND_URL` (z. B. in `frontend/.env.local`) kann ein anderes Backend konfiguriert werden.
- Skripte
  - `npm install`: Abhängigkeiten installieren (muss vor dem ersten Start ausgeführt werden). Falls ein System standardmäßig im Produktionsmodus installiert (z. B. durch gesetztes `NODE_ENV=production`) stellt die Datei `frontend/.npmrc` sicher, dass auch die für den Entwicklungsserver notwendigen devDependencies wie `vite` installiert werden. Erscheint trotzdem `sh: vite: command not found`, erneut `npm install` im Ordner `frontend` ausführen.
  - `npm run dev`: Entwicklungsserver (http://localhost:5173)
  - `npm run build`: Produktionsbuild
  - `npm run preview`: Vorschau des Builds
  - `npm run lint`: ESLint-Prüfung

## Web Push (PWA)

### VAPID Keys generieren

```bash
cd backend
npm run generate:vapid
```

Die Ausgabe enthält `VAPID_PUBLIC_KEY` und `VAPID_PRIVATE_KEY`. Diese Werte gehören in `backend/.env`:

```
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=https://www.wimmel-welt.de
```

Zusätzlich muss der öffentliche Schlüssel im Frontend verfügbar sein (z. B. `frontend/.env.local`):

```
VITE_VAPID_PUBLIC_KEY=...
```

### iPhone Test (PWA)

1. Seite in Safari öffnen und über „Teilen → Zum Home-Bildschirm“ installieren.
2. Die installierte App öffnen, im Profil (Mobile) „Push aktivieren“ drücken.
3. Erst dann wird die Berechtigung abgefragt – keine automatische Abfrage beim Laden.

Hinweis: Push-Benachrichtigungen funktionieren nur in der installierten PWA und auf HTTPS/localhost.

## Nächste Schritte

1. MongoDB-Verbindung implementieren und Models/Schemas anlegen.
2. Persistente Datenspeicherung anstelle des In-Memory-Speichers nutzen.
3. Authentifizierung und Autorisierung nachrüsten.
4. Messenger-Echtzeit-Funktionalität (z. B. über WebSockets) ergänzen.
5. Design weiter an die finalen Mockups anpassen und Responsiveness testen.

Viel Erfolg beim weiteren Ausbau der Plattform!
