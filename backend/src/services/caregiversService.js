import {
  buildCaregiverDocument,
  buildCaregiverUpdate,
  caregiversCollection,
  serializeCaregiver,
  toObjectId,
} from '../models/Caregiver.js';
import { escapeRegex } from '../utils/regex.js';

export async function listCaregivers(filters = {}) {
  const conditions = [];

  if (filters.postalCode) {
    conditions.push({ postalCode: filters.postalCode });
  }

  if (filters.city) {
    const regex = new RegExp(`^${escapeRegex(filters.city)}$`, 'i');
    conditions.push({ city: regex });
  }

  if (filters.search) {
    const regex = new RegExp(escapeRegex(filters.search), 'i');
    conditions.push({
      $or: [
        { postalCode: regex },
        { city: regex },
        { daycareName: regex },
        { name: regex },
      ],
    });
  }

  const query = conditions.length > 0 ? { $and: conditions } : {};

  const cursor = caregiversCollection().find(query).sort({ createdAt: -1 });
  const documents = await cursor.toArray();

  return documents.map(serializeCaregiver);
}

export async function listCaregiverLocations(searchTerm = '') {
  const conditions = [];

  if (searchTerm) {
    const regex = new RegExp(escapeRegex(searchTerm), 'i');
    conditions.push({
      $or: [
        { postalCode: regex },
        { city: regex },
        { daycareName: regex },
        { name: regex },
      ],
    });
  }

  const query = conditions.length ? { $and: conditions } : {};

  const documents = await caregiversCollection()
    .find(query, { projection: { postalCode: 1, city: 1, daycareName: 1, location: 1 } })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  const map = new Map();
  for (const doc of documents) {
    const key = `${doc.postalCode ?? ''}|${doc.city ?? ''}`;
    if (!map.has(key)) {
      map.set(key, {
        postalCode: doc.postalCode ?? '',
        city: doc.city ?? '',
        daycareName: doc.daycareName ?? null,
        location: doc.location ?? null,
      });
    }
  }

  return Array.from(map.values()).slice(0, 15);
}

export async function createCaregiver(data) {
  const requiredFields = [
    'email',
    'phone',
    'address',
    'postalCode',
    'username',
    'password'
    // 'profileImageUrl' = null,
    // 'conceptUrl' = null
  ];
  const missingFields = requiredFields.filter((field) => !data?.[field]);

  if (missingFields.length > 0) {
    const error = new Error(`Missing required fields: ${missingFields.join(', ')}`);
    error.status = 400;
    throw error;
  }

  const existing = await caregiversCollection().findOne({
    $or: [{ email: data.email }, { username: data.username }],
  });

  if (existing) {
    const error = new Error('Für diese Zugangsdaten existiert bereits eine Tagespflegeperson.');
    error.status = 409;
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

export async function updateCaregiver(id, data) {
  const objectId = toObjectId(id);
  if (!objectId) {
    return null;
  }

  const update = buildCaregiverUpdate(data);
  if (Object.keys(update).length <= 1) {
    return findCaregiverById(id);
  }

  await caregiversCollection().updateOne({ _id: objectId }, { $set: update });
  return findCaregiverById(id);
}
