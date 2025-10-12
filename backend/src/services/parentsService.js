import {
  buildParentDocument,
  buildParentUpdate,
  parentsCollection,
  serializeParent,
  toObjectId,
} from '../models/Parent.js';

let parentsCollectionOverride = null;

function getParentsCollection() {
  return parentsCollectionOverride ?? parentsCollection();
}

export function __setParentsCollectionForTesting(collection) {
  parentsCollectionOverride = collection ?? null;
}

export function __resetParentsCollectionForTesting() {
  parentsCollectionOverride = null;
}

export async function listParents() {
  const cursor = getParentsCollection().find().sort({ createdAt: -1 });
  const documents = await cursor.toArray();

  return documents.map(serializeParent);
}

export async function createParent(data) {
  const requiredFields = ['email', 'phone', 'postalCode', 'username', 'password'];
  const missingFields = requiredFields.filter((field) => !data?.[field]);

  if (missingFields.length > 0) {
    const error = new Error(`Missing required fields: ${missingFields.join(', ')}`);
    error.status = 400;
    throw error;
  }

  const existing = await getParentsCollection().findOne({
    $or: [{ email: data.email }, { username: data.username }],
  });

  if (existing) {
    const error = new Error('Für diese Zugangsdaten existiert bereits ein Elternprofil.');
    error.status = 409;
    throw error;
  }

  const document = buildParentDocument(data);
  const result = await getParentsCollection().insertOne(document);

  return serializeParent({ _id: result.insertedId, ...document });
}

export async function findParentById(id) {
  const objectId = toObjectId(id);
  if (!objectId) {
    return null;
  }

  const document = await getParentsCollection().findOne({ _id: objectId });
  return serializeParent(document);
}

export async function updateParent(id, data) {
  const objectId = toObjectId(id);
  if (!objectId) {
    return null;
  }

  const update = buildParentUpdate(data);
  if (Object.keys(update).length <= 1) {
    return findParentById(id);
  }

  await getParentsCollection().updateOne({ _id: objectId }, { $set: update });
  return findParentById(id);
}
