import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/database.js';

const COLLECTION_NAME = 'caregivers';

export function caregiversCollection() {
  return getDatabase().collection(COLLECTION_NAME);
}

export function serializeCaregiver(document) {
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

export function buildCaregiverDocument(data) {
  const now = new Date();

  return {
    name: data.name?.trim(),
    email: data.email?.trim(),
    phone: data.phone?.trim(),
    address: data.address?.trim(),
    postalCode: data.postalCode?.trim(),
    daycareName: data.daycareName?.trim() || null,
    availableSpots:
      typeof data.availableSpots === 'number'
        ? data.availableSpots
        : Number.parseInt(data.availableSpots ?? '0', 10) || 0,
    hasAvailability:
      typeof data.hasAvailability === 'string'
        ? data.hasAvailability.toLowerCase() === 'true'
        : Boolean(data.hasAvailability),
    bio: data.bio?.trim() || null,
    location: data.location ?? null,
    createdAt: now,
    updatedAt: now,
  };
}
