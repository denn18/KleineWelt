import { buildParentDocument, parentsCollection, serializeParent, toObjectId } from '../models/Parent.js';

export async function listParents() {
  const cursor = parentsCollection().find().sort({ createdAt: -1 });
  const documents = await cursor.toArray();

  return documents.map(serializeParent);
}

export async function createParent(data) {
  const requiredFields = ['name', 'email', 'phone', 'postalCode'];
  const missingFields = requiredFields.filter((field) => !data?.[field]);

  if (missingFields.length > 0) {
    const error = new Error(`Missing required fields: ${missingFields.join(', ')}`);
    error.status = 400;
    throw error;
  }

  const document = buildParentDocument(data);
  const result = await parentsCollection().insertOne(document);

  return serializeParent({ _id: result.insertedId, ...document });
}

export async function findParentById(id) {
  const objectId = toObjectId(id);
  if (!objectId) {
    return null;
  }

  const document = await parentsCollection().findOne({ _id: objectId });
  return serializeParent(document);
}
