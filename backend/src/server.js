import './config/load-env.js';
import http from 'http';
import dotenv from 'dotenv';
import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/database.js';

dotenv.config();

const PORT = process.env.PORT || 2000;

async function startServer() {
  await connectDatabase();

  const server = http.createServer(app);
  server.listen(PORT, () => {
    console.log(`API server listening on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
