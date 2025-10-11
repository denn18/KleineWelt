import mongoose from 'mongoose';

const DEFAULT_URI = 'mongodb://localhost:27017/kleinewelt';

export async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI || DEFAULT_URI;

  if (!mongoUri) {
    console.warn('No MongoDB URI configured. Skipping database connection.');
    return;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.warn('MongoDB connection failed. The API will continue without database access.');
    console.warn(error.message);
  }
}
