import {
  buildPushSubscriptionDocument,
  pushSubscriptionsCollection,
  serializePushSubscription,
} from '../models/PushSubscription.js';

let pushSubscriptionsCollectionOverride = null;
let indexesEnsured = false;

function getPushSubscriptionsCollection() {
  return pushSubscriptionsCollectionOverride ?? pushSubscriptionsCollection();
}

async function ensureIndexes() {
  if (indexesEnsured) {
    return;
  }

  const collection = getPushSubscriptionsCollection();
  await collection.createIndex({ endpoint: 1 }, { unique: true });
  await collection.createIndex({ userId: 1 });
  indexesEnsured = true;
}

export function __setPushSubscriptionsCollectionForTesting(collection) {
  pushSubscriptionsCollectionOverride = collection ?? null;
  indexesEnsured = false;
}

export function __resetPushSubscriptionsCollectionForTesting() {
  pushSubscriptionsCollectionOverride = null;
  indexesEnsured = false;
}

export async function savePushSubscription({ userId, subscription, userAgent }) {
  const endpoint = subscription?.endpoint;
  const keys = subscription?.keys;

  if (!userId || !endpoint || !keys?.p256dh || !keys?.auth) {
    const error = new Error('Missing required push subscription data.');
    error.status = 400;
    throw error;
  }

  await ensureIndexes();
  const collection = getPushSubscriptionsCollection();

  const existing = await collection.findOne({ endpoint });
  const now = new Date();

  if (existing) {
    await collection.updateOne(
      { endpoint },
      {
        $set: {
          userId,
          keys,
          userAgent: userAgent || existing.userAgent || null,
          updatedAt: now,
        },
      },
    );
    return serializePushSubscription({ ...existing, userId, keys, userAgent, updatedAt: now });
  }

  const document = buildPushSubscriptionDocument({ userId, endpoint, keys, userAgent });
  const result = await collection.insertOne(document);

  return serializePushSubscription({ _id: result.insertedId, ...document });
}

export async function removePushSubscription({ userId, endpoint }) {
  if (!userId || !endpoint) {
    const error = new Error('Missing required push subscription data.');
    error.status = 400;
    throw error;
  }

  const result = await getPushSubscriptionsCollection().deleteOne({ userId, endpoint });
  return result.deletedCount > 0;
}

export async function removePushSubscriptionByEndpoint(endpoint) {
  if (!endpoint) {
    return false;
  }

  const result = await getPushSubscriptionsCollection().deleteOne({ endpoint });
  return result.deletedCount > 0;
}

export async function listPushSubscriptionsForUser(userId) {
  if (!userId) {
    return [];
  }

  const documents = await getPushSubscriptionsCollection().find({ userId }).toArray();
  return documents.map(serializePushSubscription);
}
