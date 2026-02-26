import { careGroupsCollection, buildCareGroupDocument, serializeCareGroup } from '../models/CareGroup.js';
import { deleteConversation } from './messagesService.js';

export function buildGroupConversationId(caregiverId) {
  return `caregroup--${caregiverId}`;
}

function ensureCaregiver(role) {
  if (role !== 'caregiver') {
    const error = new Error('Nur Kindertagespflegepersonen können Betreuungsgruppen verwalten.');
    error.status = 403;
    throw error;
  }
}

export async function findCareGroupForUser(user) {
  if (!user?.id) {
    return null;
  }

  const query = user.role === 'caregiver' ? { caregiverId: user.id } : { participantIds: user.id };
  const group = await careGroupsCollection().findOne(query);
  return serializeCareGroup(group);
}

export async function upsertCareGroup({ user, participantIds, daycareName, logoImageUrl }) {
  ensureCaregiver(user?.role);

  const sanitizedParticipants = Array.from(new Set((participantIds || []).filter((id) => id && id !== user.id)));
  if (!sanitizedParticipants.length) {
    const error = new Error('Bitte mindestens einen Elternaccount auswählen.');
    error.status = 400;
    throw error;
  }

  const conflictingGroup = await careGroupsCollection().findOne({
    caregiverId: { $ne: user.id },
    participantIds: { $in: sanitizedParticipants },
  });

  if (conflictingGroup) {
    const error = new Error('Mindestens ein Elternaccount ist bereits in einer anderen Betreuungsgruppe.');
    error.status = 409;
    throw error;
  }

  const existing = await careGroupsCollection().findOne({ caregiverId: user.id });

  if (!existing) {
    const document = buildCareGroupDocument({
      caregiverId: user.id,
      participantIds: sanitizedParticipants,
      daycareName,
      logoImageUrl,
    });
    const result = await careGroupsCollection().insertOne(document);
    return serializeCareGroup({ _id: result.insertedId, ...document });
  }

  await careGroupsCollection().updateOne(
    { caregiverId: user.id },
    {
      $set: {
        participantIds: sanitizedParticipants,
        daycareName: daycareName?.trim() || existing.daycareName || 'Kindertagespflegegruppe',
        logoImageUrl: logoImageUrl ?? existing.logoImageUrl ?? null,
        updatedAt: new Date(),
      },
    },
  );

  return findCareGroupForUser(user);
}

export async function deleteCareGroupForCaregiver(user) {
  ensureCaregiver(user?.role);
  const existing = await careGroupsCollection().findOne({ caregiverId: user.id });
  if (!existing) {
    return false;
  }

  await careGroupsCollection().deleteOne({ caregiverId: user.id });

  await deleteConversation({
    conversationId: buildGroupConversationId(user.id),
    userId: user.id,
  }).catch(() => true);

  return true;
}

export async function leaveCareGroup(user) {
  if (!user?.id || user.role !== 'parent') {
    const error = new Error('Nur Elternaccounts können eine Betreuungsgruppe verlassen.');
    error.status = 403;
    throw error;
  }

  const existing = await careGroupsCollection().findOne({ participantIds: user.id });
  if (!existing) {
    return null;
  }

  const nextParticipantIds = (existing.participantIds || []).filter((id) => id !== user.id);

  await careGroupsCollection().updateOne(
    { caregiverId: existing.caregiverId },
    { $set: { participantIds: nextParticipantIds, updatedAt: new Date() } },
  );

  return true;
}
