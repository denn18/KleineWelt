// backend/src/config/connectToMongoDB.js
import { MongoClient } from 'mongodb';

let client = null;
let db = null;

function readMongoUrl() {
  return (
    process.env.MONGO_DB_URL ||   // wie früher
    process.env.MONGODB_URI ||
    process.env.MONGO_URL ||
    ''
  ).trim();
}

export async function connectToMongoDB() {
  if (db) return db; // Singleton

  const uri = readMongoUrl();
  if (!uri) {
    console.warn('No MongoDB URL found. Set MONGO_DB_URL (oder MONGODB_URI) in backend/.env');
    return null;
  }

  console.log('🔌 DB URL verwendet:', uri.startsWith('mongodb+srv://') ? 'mongodb+srv' : 'mongodb');

  client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10_000,
    connectTimeoutMS: 10_000,
  });

  await client.connect();

  const dbName = process.env.MONGO_DB_NAME || undefined;
  db = client.db(dbName);

  const ping = await db.admin().command({ ping: 1 });
  console.log(`✅ Connected to MongoDB (database: ${db.databaseName || '(in URI)'}), ping.ok=${ping?.ok}`);

  return db;
}

export function getDatabase() {
  if (!db) throw new Error('Database ist noch nicht verbunden. connectToMongoDB() zuerst aufrufen.');
  return db;
}

export function getClient() {
  return client;
}
