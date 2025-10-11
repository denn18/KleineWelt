import 'dotenv/config';
import mongoose from 'mongoose';

const uri = process.env.MONGO_DB_URL || process.env.MONGODB_URI;
if (!uri) { console.error('MONGO_DB_URL fehlt'); process.exit(1); }

try {
  await mongoose.connect(uri, {
    dbName: process.env.MONGO_DB_NAME || undefined,
    serverSelectionTimeoutMS: 8000,
  });
  const ping = await mongoose.connection.db.admin().ping();
  const colls = await mongoose.connection.db.listCollections().toArray();
  console.log('readyState:', mongoose.connection.readyState); // 1 = connected
  console.log('ping:', ping);                                 // { ok: 1 }
  console.log('collections:', colls.map(c => c.name));
  await mongoose.disconnect();
  process.exit(0);
} catch (e) {
  console.error('Fehler:', e?.message || e);
  process.exit(1);
}
