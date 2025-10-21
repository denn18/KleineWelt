// backend/src/server.js
import './config/load-env.js'; // .env früh & einmal laden
import http from 'http';
import app from './app.js';
import { connectDatabase } from './config/database.js';

const PORT = process.env.PORT || 2000;

async function startServer() {
  await connectDatabase(); // genau 1× verbinden
  const server = http.createServer(app);
  server.listen(PORT, () => {
    console.log(`API server listening on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
