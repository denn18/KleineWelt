import {
  buildCaregiverDocument,
  caregiversCollection,
  serializeCaregiver,
  toObjectId,
} from '../models/Caregiver.js';

export async function listCaregivers(filters = {}) {
  const query = {};
  if (filters.postalCode) {
    query.postalCode = filters.postalCode;
  }

  const cursor = caregiversCollection().find(query).sort({ createdAt: -1 });
  const documents = await cursor.toArray();

  return documents.map(serializeCaregiver);
}

export async function createCaregiver(data) {
  const requiredFields = ['name', 'email', 'phone', 'address', 'postalCode'];
  const missingFields = requiredFields.filter((field) => !data?.[field]);

  if (missingFields.length > 0) {
    const error = new Error(`Missing required fields: ${missingFields.join(', ')}`);
    error.status = 400;
    throw error;
  }

  const document = buildCaregiverDocument(data);
  const result = await caregiversCollection().insertOne(document);

  return serializeCaregiver({ _id: result.insertedId, ...document });
}

export async function findCaregiverById(id) {
  const objectId = toObjectId(id);
  if (!objectId) {
    return null;
  }

  const document = await caregiversCollection().findOne({ _id: objectId });
  return serializeCaregiver(document);
}
