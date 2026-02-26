import { getDatabase } from '../config/database.js';
import { normalizeFileReference } from '../utils/fileStorage.js';

const COLLECTION_NAME = 'careGroups';

export function careGroupsCollection() {
  return getDatabase().collection(COLLECTION_NAME);
}

export function serializeCareGroup(document) {
  if (!document) {
    return null;
  }

  const { _id, ...rest } = document;
  return {
    id: _id.toString(),
    ...rest,
    logoImageUrl: normalizeFileReference(rest.logoImageUrl),
  };
}

export function buildCareGroupDocument({ caregiverId, participantIds = [], daycareName, logoImageUrl }) {
  const now = new Date();
  return {
    caregiverId,
    participantIds: Array.from(new Set(participantIds.filter(Boolean))),
    daycareName: daycareName?.trim() || 'Kindertagespflegegruppe',
    logoImageUrl: logoImageUrl || null,
    createdAt: now,
    updatedAt: now,
  };
}
