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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(currentDir, '../uploads');

app.use('/uploads', express.static(uploadsDir));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/caregivers', caregiversRouter);
app.use('/api/parents', parentsRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/users', usersRouter);
app.use('/api/documents', documentsRouter);

export default app;
