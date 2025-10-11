import {
  caregiversCollection,
  serializeCaregiver,
} from '../models/Caregiver.js';
import {
  buildMatchDocument,
  matchesCollection,
  serializeMatch,
  touchUpdatedAt,
} from '../models/Match.js';

export async function findMatchesByPostalCode(postalCode) {
  const query = {};
  if (postalCode) {
    query.postalCode = postalCode;
  }

  const cursor = caregiversCollection()
    .find(query)
    .sort({ hasAvailability: -1, createdAt: -1 });
  const documents = await cursor.toArray();

  return documents.map(serializeCaregiver);
}

export async function recordMatch({ parentId, caregiverId }) {
  if (!parentId || !caregiverId) {
    const error = new Error('Both parentId and caregiverId are required to record a match.');
    error.status = 400;
    throw error;
  }

  const filter = { parentId, caregiverId };
  const update = {
    $setOnInsert: buildMatchDocument({ parentId, caregiverId }),
    $set: touchUpdatedAt({}),
  };

  const options = { upsert: true, returnDocument: 'after' };
  const result = await matchesCollection().findOneAndUpdate(filter, update, options);

  if (result.value) {
    return serializeMatch(result.value);
  }

  const upsertedId = result.lastErrorObject?.upsertedId;
  if (upsertedId) {
    const insertedDocument = await matchesCollection().findOne({ _id: upsertedId });
    if (insertedDocument) {
      return serializeMatch(insertedDocument);
    }

    return serializeMatch({
      _id: upsertedId,
      parentId,
      caregiverId,
      createdAt: update.$setOnInsert.createdAt,
      updatedAt: update.$set.updatedAt,
    });
  }

  return null;
}

export async function listMatches() {
  const cursor = matchesCollection().find().sort({ createdAt: -1 });
  const documents = await cursor.toArray();

  return documents.map(serializeMatch);
}
