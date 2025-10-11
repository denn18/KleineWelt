import express from 'express';
import cors from 'cors';
import caregiversRouter from './routes/caregivers.js';
import parentsRouter from './routes/parents.js';
import matchesRouter from './routes/matches.js';
import messagesRouter from './routes/messages.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/caregivers', caregiversRouter);
app.use('/api/parents', parentsRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/messages', messagesRouter);

export default app;
