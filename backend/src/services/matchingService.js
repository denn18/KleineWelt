const matches = [];

export function findMatchesByPostalCode(postalCode, caregivers) {
  if (!postalCode) {
    return caregivers;
  }
  return caregivers.filter((caregiver) => caregiver.postalCode === postalCode);
}

export function recordMatch({ parentId, caregiverId }) {
  const match = {
    id: `${parentId}-${caregiverId}`,
    parentId,
    caregiverId,
    createdAt: new Date().toISOString(),
  };

  matches.push(match);
  return match;
}

export function listMatches() {
  return matches;
}
