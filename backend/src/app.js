






// backend/src/app.js neuer App,js Code mit Anpassung für Render
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import caregiversRouter from './routes/caregivers.js';
import parentsRouter from './routes/parents.js';
import matchesRouter from './routes/matches.js';
import messagesRouter from './routes/messages.js';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import documentsRouter from './routes/documents.js';

const app = express();

app.use(cors());
// Limit für Daten, die hochgeladen werden können (muss mehr als 30Mb wegen Konzeption etc.)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Basis-Verzeichnisse
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(currentDir, '../uploads');
// vom backend/src-Verzeichnis zwei Ebenen hoch zur Repo-Root, dann frontend/dist
const frontendDistPath = path.resolve(currentDir, '../../frontend/dist');

// statische Uploads
app.use('/uploads', express.static(uploadsDir));

// Healthcheck für Render
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API-Routen
app.use('/api/auth', authRouter);
app.use('/api/caregivers', caregiversRouter);
app.use('/api/parents', parentsRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/users', usersRouter);
app.use('/api/documents', documentsRouter);

// statische Dateien des gebauten Frontends ausliefern
app.use(express.static(frontendDistPath));

// SPA-Fallback (damit React-Router funktioniert)
// muss NACH den API-Routen kommen, damit /api/* nicht überschrieben wird
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

export default app;














//Funktionierender App.js Code ohne Render für Lokal starten
// import express from 'express';
// import cors from 'cors';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import caregiversRouter from './routes/caregivers.js';
// import parentsRouter from './routes/parents.js';
// import matchesRouter from './routes/matches.js';
// import messagesRouter from './routes/messages.js';
// import authRouter from './routes/auth.js';
// import usersRouter from './routes/users.js';
// import documentsRouter from './routes/documents.js';

// const app = express();

// app.use(cors());
// //Limit für Daten die Hochgeladen werden können muss mehr als 30Mb wegen Konzeption etc.
// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// const currentDir = path.dirname(fileURLToPath(import.meta.url));
// const uploadsDir = path.resolve(currentDir, '../uploads');

// app.use('/uploads', express.static(uploadsDir));

// app.get('/health', (req, res) => {
//   res.json({ status: 'ok' });
// });

// app.use('/api/auth', authRouter);
// app.use('/api/caregivers', caregiversRouter);
// app.use('/api/parents', parentsRouter);
// app.use('/api/matches', matchesRouter);
// app.use('/api/messages', messagesRouter);
// app.use('/api/users', usersRouter);
// app.use('/api/documents', documentsRouter);

// export default app;
