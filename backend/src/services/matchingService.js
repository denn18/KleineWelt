import Caregiver from '../models/Caregiver.js';
import Match from '../models/Match.js';

export async function findMatchesByPostalCode(postalCode) {
  const query = {};
  if (postalCode) {
    query.postalCode = postalCode;
  }

  return Caregiver.find(query).sort({ hasAvailability: -1, createdAt: -1 });
}

export async function recordMatch({ parentId, caregiverId }) {
  const match = await Match.findOneAndUpdate(
    { parentId, caregiverId },
    { parentId, caregiverId },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return match;
}

export async function listMatches() {
  return Match.find().sort({ createdAt: -1 });
}
