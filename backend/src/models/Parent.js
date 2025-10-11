import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/database.js';

const COLLECTION_NAME = 'parents';

export function parentsCollection() {
  return getDatabase().collection(COLLECTION_NAME);
}

export function serializeParent(document) {
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

export function buildParentDocument(data) {
  const now = new Date();

  return {
    name: data.name?.trim(),
    email: data.email?.trim(),
    phone: data.phone?.trim(),
    address: data.address?.trim() || null,
    postalCode: data.postalCode?.trim(),
    numberOfChildren:
      typeof data.numberOfChildren === 'number'
        ? data.numberOfChildren
        : Number.parseInt(data.numberOfChildren ?? '1', 10) || 1,
    childrenAges: data.childrenAges?.trim() || null,
    notes: data.notes?.trim() || null,
    createdAt: now,
    updatedAt: now,
  };
}
