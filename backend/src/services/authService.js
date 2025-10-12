import { parentsCollection, serializeParent } from '../models/Parent.js';
import { caregiversCollection, serializeCaregiver } from '../models/Caregiver.js';

let parentCollectionOverride = null;
let caregiverCollectionOverride = null;

function getParentsCollection() {
  return parentCollectionOverride ?? parentsCollection();
}

function getCaregiversCollection() {
  return caregiverCollectionOverride ?? caregiversCollection();
}

export function __setAuthServiceCollectionsForTesting({ parents, caregivers } = {}) {
  parentCollectionOverride = parents ?? null;
  caregiverCollectionOverride = caregivers ?? null;
}

export function __resetAuthServiceCollectionsForTesting() {
  parentCollectionOverride = null;
  caregiverCollectionOverride = null;
}

export async function authenticateUser(identifier, password) {
  const parent = await getParentsCollection().findOne({
    $or: [{ email: identifier }, { username: identifier }],
  });

  if (parent && parent.password === password) {
    const serialized = serializeParent(parent);
    return { ...serialized, role: 'parent' };
  }

  const caregiver = await getCaregiversCollection().findOne({
    $or: [{ email: identifier }, { username: identifier }],
  });

  if (caregiver && caregiver.password === password) {
    const serialized = serializeCaregiver(caregiver);
    return { ...serialized, role: 'caregiver' };
  }

  const error = new Error('Ungültige Zugangsdaten.');
  error.status = 401;
  throw error;
}
