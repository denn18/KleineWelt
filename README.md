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
- Skripte
  - `npm run dev`: Entwicklungsmodus mit Nodemon
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

## Nächste Schritte

1. MongoDB-Verbindung implementieren und Models/Schemas anlegen.
2. Persistente Datenspeicherung anstelle des In-Memory-Speichers nutzen.
3. Authentifizierung und Autorisierung nachrüsten.
4. Messenger-Echtzeit-Funktionalität (z. B. über WebSockets) ergänzen.
5. Design weiter an die finalen Mockups anpassen und Responsiveness testen.

Viel Erfolg beim weiteren Ausbau der Plattform!
