import { getDatabase } from '../config/database.js';

const COLLECTION_NAME = 'push_subscriptions';

export function pushSubscriptionsCollection() {
  return getDatabase().collection(COLLECTION_NAME);
}

export function buildPushSubscriptionDocument({ userId, endpoint, keys, userAgent }) {
  const now = new Date();
  return {
    userId,
    endpoint,
    keys: {
      p256dh: keys?.p256dh || null,
      auth: keys?.auth || null,
    },
    userAgent: userAgent || null,
    createdAt: now,
    updatedAt: now,
  };
}

export function serializePushSubscription(document) {
  if (!document) {
    return null;
  }

  const { _id, ...rest } = document;
  return {
    id: _id?.toString?.() ?? null,
    ...rest,
  };
}
