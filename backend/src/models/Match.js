import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/database.js';

const COLLECTION_NAME = 'matches';

export function matchesCollection() {
  return getDatabase().collection(COLLECTION_NAME);
}

export function serializeMatch(document) {
  if (!document) {
    return null;
  }

  const { _id, ...rest } = document;
  return {
    id: _id.toString(),
    ...rest,
  };
}

export function toObjectId(id) {
  if (!id) {
    return null;
  }

  try {
    return new ObjectId(id);
  } catch (_error) {
    return null;
  }
}

export function buildMatchDocument({ parentId, caregiverId }) {
  const now = new Date();

  return {
    parentId,
    caregiverId,
    createdAt: now,
    updatedAt: now,
  };
}

export function touchUpdatedAt(document) {
  return { ...document, updatedAt: new Date() };
}
