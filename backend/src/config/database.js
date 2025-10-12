import { MongoClient } from 'mongodb';

let mongoClient;
let database;

export async function connectDatabase() {
  const mongoUri = buildMongoUri();

  if (!mongoUri) {
    console.warn('No MongoDB configuration found. Skipping database connection.');
    console.warn('Provide MONGODB_URI or the new granular variables in backend/.env to enable MongoDB.');
    return;
  }

  const clientOptions = {
    serverSelectionTimeoutMS: 5000,
  };

  const dbName = process.env.MONGODB_DB_NAME || extractDbNameFromUri(mongoUri);

  try {
    if (mongoClient) {
      await closeDatabase();
    }

    mongoClient = new MongoClient(mongoUri, clientOptions);
    await mongoClient.connect();

    database = dbName ? mongoClient.db(dbName) : mongoClient.db();
    const targetDb = database.databaseName;
    console.log(`Connected to MongoDB (database: ${targetDb})`);
  } catch (error) {
    await closeDatabase();
    console.warn('MongoDB connection failed. The API will continue without database access.');
    console.warn(error.message);
  }
}

export function getDatabase() {
  if (!database) {
    throw new Error('Database connection has not been established.');
  }

  return database;
}

export async function closeDatabase() {
  if (mongoClient) {
    await mongoClient.close();
  }

  mongoClient = undefined;
  database = undefined;
}

function buildMongoUri() {
  const configuredUri = sanitizeMongoUri(process.env.MONGODB_URI);
  if (configuredUri) {
    return configuredUri;
  }

  const host = process.env.MONGODB_HOST;
  if (!host) {
    return undefined;
  }

  const protocol = process.env.MONGODB_PROTOCOL || 'mongodb+srv';
  const username = process.env.MONGODB_USERNAME;
  const password = process.env.MONGODB_PASSWORD;
  const authSource = process.env.MONGODB_AUTH_SOURCE;
  const port = process.env.MONGODB_PORT;
  const databaseName = process.env.MONGODB_DB_NAME;
  const extraOptions = sanitizeQueryString(process.env.MONGODB_OPTIONS);

  let credentials = '';
  if (username && password) {
    const encodedUser = encodeURIComponent(username);
    const encodedPassword = encodeURIComponent(password);
    credentials = `${encodedUser}:${encodedPassword}@`;
  } else if (username || password) {
    console.warn('Both MONGODB_USERNAME and MONGODB_PASSWORD must be provided to use credentials.');
  }

  const isSrvProtocol = protocol.endsWith('+srv');
  const portSegment = !isSrvProtocol && port ? `:${port}` : '';
  const dbSegment = databaseName ? `/${databaseName}` : '';

  const queryParameters = [];
  if (authSource) {
    queryParameters.push(`authSource=${encodeURIComponent(authSource)}`);
  }
  if (extraOptions) {
    queryParameters.push(extraOptions);
  }

  const querySegment = queryParameters.length > 0 ? `?${queryParameters.join('&')}` : '';

  return `${protocol}://${credentials}${host}${portSegment}${dbSegment}${querySegment}`;
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

function sanitizeQueryString(value) {
  if (!value) {
    return '';
  }

  return value
    .trim()
    .replace(/^\?/, '')
    .replace(/\s+\/\/.*$/, '');
}

function extractDbNameFromUri(uri) {
  const matches = uri.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([A-Za-z0-9._-]+)/i);
  if (matches && matches[1]) {
    return matches[1];
  }
  return undefined;
}
