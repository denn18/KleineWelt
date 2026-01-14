import { getDatabase } from '../config/database.js';

const COLLECTION_NAME = 'pushSubscriptions';

export function pushSubscriptionsCollection() {
  return getDatabase().collection(COLLECTION_NAME);
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
