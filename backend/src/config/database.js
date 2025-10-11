import mongoose from 'mongoose';

const DEFAULT_URI = 'mongodb://localhost:27017/kleinewelt';

export async function connectDatabase() {
  const configuredUri = process.env.MONGODB_URI || DEFAULT_URI;
  const mongoUri = sanitizeMongoUri(configuredUri);

  if (!mongoUri) {
    console.warn('No MongoDB URI configured. Skipping database connection.');
    console.warn('Set MONGODB_URI in backend/.env or export it in your shell to enable database access.');
    return;
  }

  const connectionOptions = {
    serverSelectionTimeoutMS: 5000,
  };

  if (process.env.MONGODB_DB_NAME) {
    connectionOptions.dbName = process.env.MONGODB_DB_NAME;
  }

  try {
    await mongoose.connect(mongoUri, connectionOptions);
    if (connectionOptions.dbName) {
      console.log(`Connected to MongoDB (database: ${connectionOptions.dbName})`);
    } else {
      console.log('Connected to MongoDB');
    }
  } catch (error) {
    console.warn('MongoDB connection failed. The API will continue without database access.');
    console.warn(error.message);
  }
}

function sanitizeMongoUri(uri) {
  if (!uri) {
    return uri;
  }

  const trimmed = uri.trim();
  const withoutInlineComment = trimmed.replace(/\s+\/\/.*$/, '');

  if (trimmed !== withoutInlineComment) {
    console.warn('MONGODB_URI contains a trailing comment. The comment portion has been ignored.');
  }

  return withoutInlineComment;
}
