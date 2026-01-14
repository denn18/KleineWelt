import { pushSubscriptionsCollection, serializePushSubscription } from '../models/PushSubscription.js';

let indexesEnsured = false;

async function ensureIndexes() {
  if (indexesEnsured) {
    return;
  }

  const collection = pushSubscriptionsCollection();
  await collection.createIndex({ endpoint: 1 }, { unique: true });
  await collection.createIndex({ userId: 1 });
  indexesEnsured = true;
}

function normalizeSubscription(subscription) {
  if (!subscription || typeof subscription !== 'object') {
    return null;
  }

  const endpoint = subscription.endpoint;
  const keys = subscription.keys || {};
  const p256dh = keys.p256dh;
  const auth = keys.auth;

  if (!endpoint || !p256dh || !auth) {
    return null;
  }

  return { endpoint, p256dh, auth };
}

export async function upsertPushSubscription({ userId, subscription, userAgent }) {
  await ensureIndexes();

  const normalized = normalizeSubscription(subscription);
  if (!userId || !normalized) {
    const error = new Error('Missing subscription payload.');
    error.status = 400;
    throw error;
  }

  const now = new Date();
  const update = {
    $set: {
      userId,
      endpoint: normalized.endpoint,
      p256dh: normalized.p256dh,
      auth: normalized.auth,
      userAgent: userAgent || null,
      updatedAt: now,
    },
    $setOnInsert: {
      createdAt: now,
    },
  };

  const result = await pushSubscriptionsCollection().findOneAndUpdate(
    { endpoint: normalized.endpoint },
    update,
    { upsert: true, returnDocument: 'after' },
  );

  return serializePushSubscription(result.value);
}

export async function removePushSubscription({ userId, endpoint }) {
  await ensureIndexes();

  if (!endpoint) {
    const error = new Error('Missing subscription endpoint.');
    error.status = 400;
    throw error;
  }

  const query = { endpoint };
  if (userId) {
    query.userId = userId;
  }

  const result = await pushSubscriptionsCollection().deleteOne(query);
  return result.deletedCount > 0;
}

export async function listPushSubscriptionsForUser(userId) {
  await ensureIndexes();

  if (!userId) {
    return [];
  }

  const documents = await pushSubscriptionsCollection().find({ userId }).toArray();
  return documents.map(serializePushSubscription);
}
