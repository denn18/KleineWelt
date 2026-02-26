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
import filesRouter from './routes/files.js';
import pushSubscriptionsRouter from './routes/pushSubscriptions.js';

// ✅ NEU: DB Zugriff für /readiness
import { getDatabase } from './config/database.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const frontendDistPath = path.resolve(currentDir, '../../frontend/dist');
const uploadsDir = path.resolve(currentDir, '../backend/uploads');

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ✅ NEU: /readiness (Mobile braucht JSON; DB wird hier geprüft)
app.get('/readiness', async (_req, res) => {
  try {
    const db = getDatabase(); // wirft Fehler, wenn DB nicht verbunden
    const ping = await db.admin().command({ ping: 1 });

    const ok = ping?.ok === 1;

    return res.status(ok ? 200 : 503).json({
      status: ok ? 'ok' : 'error',
      checks: { database: ok ? 'ok' : 'error' },
    });
  } catch (err) {
    return res.status(503).json({
      status: 'error',
      checks: { database: 'error' },
      error: err instanceof Error ? err.message : 'unknown error',
    });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/caregivers', caregiversRouter);
app.use('/api/parents', parentsRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/users', usersRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/files', filesRouter);
app.use('/api/push-subscriptions', pushSubscriptionsRouter);
app.use('/uploads', express.static(uploadsDir));

app.use(express.static(frontendDistPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

export default app;



















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
// import filesRouter from './routes/files.js';

// const app = express();

// app.use(cors());
// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// const currentDir = path.dirname(fileURLToPath(import.meta.url));
// const frontendDistPath = path.resolve(currentDir, '../../frontend/dist');
// const uploadsDir = path.resolve(currentDir, '../backend/uploads');

// app.get('/health', (_req, res) => {
//   res.json({ status: 'ok' });
// });

// app.use('/api/auth', authRouter);
// app.use('/api/caregivers', caregiversRouter);
// app.use('/api/parents', parentsRouter);
// app.use('/api/matches', matchesRouter);
// app.use('/api/messages', messagesRouter);
// app.use('/api/users', usersRouter);
// app.use('/api/documents', documentsRouter);
// app.use('/api/files', filesRouter);
// app.use('/uploads', express.static(uploadsDir));

// app.use(express.static(frontendDistPath));
// app.get('*', (_req, res) => {
//   res.sendFile(path.join(frontendDistPath, 'index.html'));
// });

// export default app;
