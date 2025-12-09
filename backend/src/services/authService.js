import bcrypt from 'bcrypt';
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

async function verifyPasswordAndUpgradeHash(userDocument, password, collection) {
  if (!userDocument?.password || !password) {
    return false;
  }

  // Already hashed with bcrypt
  if (userDocument.password.startsWith('$2')) {
    return bcrypt.compare(password, userDocument.password);
  }

  // Legacy plain-text password: upgrade to bcrypt on successful login
  if (userDocument.password === password) {
    const hashed = await bcrypt.hash(password, 10);
    try {
      await collection.updateOne({ _id: userDocument._id }, { $set: { password: hashed, passwordUpdatedAt: new Date() } });
      // eslint-disable-next-line no-param-reassign
      userDocument.password = hashed;
    } catch (error) {
      console.warn('Konnte Passwort nicht auf bcrypt upgraden', error);
    }
    return true;
  }

  return false;
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

  if (parent && (await verifyPasswordAndUpgradeHash(parent, password, getParentsCollection()))) {
    const serialized = serializeParent(parent);
    return { ...serialized, role: 'parent' };
  }

  const caregiver = await getCaregiversCollection().findOne({
    $or: [{ email: identifier }, { username: identifier }],
  });

  if (caregiver && (await verifyPasswordAndUpgradeHash(caregiver, password, getCaregiversCollection()))) {
    const serialized = serializeCaregiver(caregiver);
    return { ...serialized, role: 'caregiver' };
  }

  const error = new Error('Ungültige Zugangsdaten.');
  error.status = 401;
  throw error;
}
