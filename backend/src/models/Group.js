import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/database.js';

const GROUPS_COLLECTION = 'groups';
const GROUP_MESSAGES_COLLECTION = 'groupMessages';
const CAREGIVER_CONTACTS_COLLECTION = 'caregiverContacts';

let indexesInitialized = false;

export function groupsCollection() {
  return getDatabase().collection(GROUPS_COLLECTION);
}

export function groupMessagesCollection() {
  return getDatabase().collection(GROUP_MESSAGES_COLLECTION);
}

export function caregiverContactsCollection() {
  return getDatabase().collection(CAREGIVER_CONTACTS_COLLECTION);
}

export async function ensureGroupIndexes() {
  if (indexesInitialized) {
    return;
  }

  await groupsCollection().createIndex({ allParticipantIds: 1, updatedAt: -1 });
  await groupMessagesCollection().createIndex({ groupId: 1, createdAt: 1 });
  await groupMessagesCollection().createIndex({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });
  await caregiverContactsCollection().createIndex({ caregiverId: 1, parentId: 1 }, { unique: true });
  indexesInitialized = true;
}

export function serializeGroup(document) {
  if (!document) {
    return null;
  }

  const { _id, ...rest } = document;
  return { id: _id.toString(), ...rest };
}

export function serializeGroupMessage(document) {
  if (!document) {
    return null;
  }

  const { _id, ...rest } = document;
  return { id: _id.toString(), ...rest };
}

export function toObjectId(id) {
  try {
    return new ObjectId(id);
  } catch (_error) {
    return null;
  }
}
