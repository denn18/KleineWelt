import { caregiversCollection, toObjectId as caregiverToObjectId } from '../models/Caregiver.js';
import { careGroupsCollection } from '../models/CareGroup.js';
import { matchesCollection } from '../models/Match.js';
import { messagesCollection } from '../models/Message.js';
import { parentsCollection, toObjectId as parentToObjectId } from '../models/Parent.js';
import { pushSubscriptionsCollection } from '../models/PushSubscription.js';
import { removeStoredFile } from '../utils/fileStorage.js';
import { buildGroupConversationId } from './messagesService.js';

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

async function removeMessageAttachmentsForUser(userId) {
  const messages = await messagesCollection()
    .find({ participants: userId }, { projection: { attachments: 1 } })
    .toArray();

  const fileReferences = messages.flatMap((message) => toArray(message.attachments));
  await Promise.all(fileReferences.map((fileRef) => removeStoredFile(fileRef)));
}

async function deleteParentAccountData(userId) {
  const objectId = parentToObjectId(userId);
  if (!objectId) {
    return false;
  }

  const parent = await parentsCollection().findOne({ _id: objectId });
  if (!parent) {
    return false;
  }

  await removeStoredFile(parent.profileImageUrl);
  await removeMessageAttachmentsForUser(parent._id.toString());

  await Promise.all([
    messagesCollection().deleteMany({ participants: parent._id.toString() }),
    matchesCollection().deleteMany({ parentId: parent._id.toString() }),
    careGroupsCollection().updateMany(
      { participantIds: parent._id.toString() },
      { $pull: { participantIds: parent._id.toString() }, $set: { updatedAt: new Date() } },
    ),
    pushSubscriptionsCollection().deleteMany({ userId: parent._id.toString() }),
  ]);

  const result = await parentsCollection().deleteOne({ _id: parent._id });
  return result.deletedCount > 0;
}

async function deleteCaregiverAccountData(userId) {
  const objectId = caregiverToObjectId(userId);
  if (!objectId) {
    return false;
  }

  const caregiver = await caregiversCollection().findOne({ _id: objectId });
  if (!caregiver) {
    return false;
  }

  const ownGroup = await careGroupsCollection().findOne({ caregiverId: caregiver._id.toString() });
  const roomImages = toArray(caregiver.roomImages);
  const caregiverImages = toArray(caregiver.caregiverImages);
  const contractFiles = toArray(caregiver.contractDocuments).map((document) => document?.file).filter(Boolean);

  const filesToRemove = [
    caregiver.profileImageUrl,
    caregiver.logoImageUrl,
    caregiver.conceptUrl,
    ownGroup?.logoImageUrl,
    ...roomImages,
    ...caregiverImages,
    ...contractFiles,
  ].filter(Boolean);

  await Promise.all(filesToRemove.map((fileRef) => removeStoredFile(fileRef)));
  await removeMessageAttachmentsForUser(caregiver._id.toString());

  await Promise.all([
    messagesCollection().deleteMany({ participants: caregiver._id.toString() }),
    messagesCollection().deleteMany({ conversationId: buildGroupConversationId(caregiver._id.toString()) }),
    matchesCollection().deleteMany({ caregiverId: caregiver._id.toString() }),
    careGroupsCollection().deleteOne({ caregiverId: caregiver._id.toString() }),
    pushSubscriptionsCollection().deleteMany({ userId: caregiver._id.toString() }),
  ]);

  const result = await caregiversCollection().deleteOne({ _id: caregiver._id });
  return result.deletedCount > 0;
}

export async function deleteAccountData({ userId, role }) {
  if (!userId || !role) {
    return false;
  }

  if (role === 'parent') {
    return deleteParentAccountData(userId);
  }

  if (role === 'caregiver') {
    return deleteCaregiverAccountData(userId);
  }

  return false;
}
