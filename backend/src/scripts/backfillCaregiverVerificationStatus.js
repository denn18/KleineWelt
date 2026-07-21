import '../config/load-env.js';
import { connectToMongoDB } from '../config/connectToMongoDB.js';
import { caregiversCollection } from '../models/Caregiver.js';

async function main() {
  await connectToMongoDB();
  const result = await caregiversCollection().updateMany(
    { verificationStatus: { $exists: false } },
    { $set: { verificationStatus: 'missing', isPublished: true, publishedAt: new Date() } },
  );
  console.log(`Backfill abgeschlossen: ${result.modifiedCount} Caregiver aktualisiert.`);
  process.exit(0);
}
main().catch((error) => { console.error(error); process.exit(1); });
