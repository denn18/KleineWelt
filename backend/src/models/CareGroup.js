import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/database.js';

const COLLECTION_NAME = 'careGroups';

export function careGroupsCollection() {
  return getDatabase().collection(COLLECTION_NAME);
}

export function buildCareGroupDocument({ caregiverId, participantIds = [], daycareName, logoImageUrl = '', createdAt = null }) {
  const now = new Date();

  return {
    caregiverId,
    participantIds: Array.from(new Set((participantIds || []).filter(Boolean))),
    daycareName: daycareName || 'Kindertagespflegegruppe',
    logoImageUrl: logoImageUrl || '',
    createdAt: createdAt ? new Date(createdAt) : now,
    updatedAt: now,
  };
}

export function serializeCareGroup(document) {
  if (!document) {
    return null;
  }

  return {
    id: document._id instanceof ObjectId ? document._id.toHexString() : document._id,
    caregiverId: document.caregiverId,
    participantIds: Array.isArray(document.participantIds) ? document.participantIds : [],
    daycareName: document.daycareName || 'Kindertagespflegegruppe',
    logoImageUrl: document.logoImageUrl || '',
    createdAt: document.createdAt instanceof Date ? document.createdAt.toISOString() : document.createdAt || null,
    updatedAt: document.updatedAt instanceof Date ? document.updatedAt.toISOString() : document.updatedAt || null,
  };
}
