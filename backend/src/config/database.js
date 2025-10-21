// backend/src/config/database.js
import { connectToMongoDB, getDatabase as _getDb, getClient } from './connectToMongoDB.js';

export async function connectDatabase() {
  return connectToMongoDB();
}

export function getDatabase() {
  return _getDb();
}

export { getClient };
