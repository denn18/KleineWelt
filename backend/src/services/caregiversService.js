import crypto from 'node:crypto';

const caregivers = [];

export function listCaregivers(filters = {}) {
  const { postalCode } = filters;
  if (!postalCode) {
    return caregivers;
  }
  return caregivers.filter((caregiver) => caregiver.postalCode === postalCode);
}

export function createCaregiver(data) {
  const caregiver = {
    id: crypto.randomUUID(),
    name: data.name,
    email: data.email,
    phone: data.phone,
    address: data.address,
    postalCode: data.postalCode,
    daycareName: data.daycareName,
    availableSpots: data.availableSpots,
    hasAvailability: data.hasAvailability,
    bio: data.bio,
    location: data.location,
    createdAt: new Date().toISOString(),
  };

  caregivers.push(caregiver);
  return caregiver;
}

export function findCaregiverById(id) {
  return caregivers.find((caregiver) => caregiver.id === id);
}
