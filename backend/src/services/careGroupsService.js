import { careGroupsCollection, buildCareGroupDocument, serializeCareGroup } from '../models/CareGroup.js';
import { buildGroupConversationId, __setMessagesCollectionForTesting } from './messagesService.js';
import { messagesCollection } from '../models/Message.js';

let careGroupsCollectionOverride = null;
let messagesCollectionOverride = null;

function getCareGroupsCollection() {
  return careGroupsCollectionOverride ?? careGroupsCollection();
}

function getMessagesCollection() {
  return messagesCollectionOverride ?? messagesCollection();
}

export function __setCareGroupsCollectionForTesting(collection) {
  careGroupsCollectionOverride = collection ?? null;
}

export function __setCareGroupMessagesCollectionForTesting(collection) {
  messagesCollectionOverride = collection ?? null;
  __setMessagesCollectionForTesting(collection);
}

export function __resetCareGroupsCollectionsForTesting() {
  careGroupsCollectionOverride = null;
  messagesCollectionOverride = null;
  __setMessagesCollectionForTesting(null);
}

export async function findCareGroupForUser(userId) {
  if (!userId) {
    const error = new Error('Missing required user field.');
    error.status = 400;
    throw error;
  }

  const group = await getCareGroupsCollection().findOne({
    $or: [{ caregiverId: userId }, { participantIds: userId }],
  });

  return serializeCareGroup(group);
}

export async function upsertCareGroup({ caregiverId, participantIds = [], daycareName, logoImageUrl = '', createdAt = null }) {
  if (!caregiverId) {
    const error = new Error('Missing required caregiver field.');
    error.status = 400;
    throw error;
  }

  const nextGroup = buildCareGroupDocument({
    caregiverId,
    participantIds,
    daycareName,
    logoImageUrl,
    createdAt,
  });

  await getCareGroupsCollection().updateOne(
    { caregiverId },
    {
      $set: {
        participantIds: nextGroup.participantIds,
        daycareName: nextGroup.daycareName,
        logoImageUrl: nextGroup.logoImageUrl,
        updatedAt: nextGroup.updatedAt,
      },
      $setOnInsert: {
        caregiverId,
        createdAt: nextGroup.createdAt,
      },
    },
    { upsert: true },
  );

  const updated = await getCareGroupsCollection().findOne({ caregiverId });
  return serializeCareGroup(updated);
}

export async function deleteCareGroup({ caregiverId }) {
  if (!caregiverId) {
    const error = new Error('Missing required caregiver field.');
    error.status = 400;
    throw error;
  }

  const deleted = await getCareGroupsCollection().findOneAndDelete({ caregiverId });

  if (!deleted) {
    return false;
  }

  await getMessagesCollection().deleteMany({
    conversationId: buildGroupConversationId(caregiverId),
    isGroupMessage: true,
  });

  return true;
}
