import './config/load-env.js';
import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { connectDatabase } from './config/database.js';
import { startMessageImageCleanupScheduler } from './services/messageCleanupService.js';
import { registerSocketHandlers, setSocketServer } from './realtime/socketServer.js';

const PORT = process.env.PORT || 2000;

async function startServer() {
  await connectDatabase();
  const server = http.createServer(app);

  const io = new Server(server, {
    path: '/socket.io',
    cors: {
      origin: true,
      credentials: true,
    },
  });

  registerSocketHandlers(io);
  setSocketServer(io);

  startMessageImageCleanupScheduler();
  server.listen(PORT, () => {
    console.log(`API server listening on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
