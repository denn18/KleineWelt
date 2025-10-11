import Caregiver from '../models/Caregiver.js';

export async function listCaregivers(filters = {}) {
  const query = {};
  if (filters.postalCode) {
    query.postalCode = filters.postalCode;
  }

  return Caregiver.find(query).sort({ createdAt: -1 });
}

export async function createCaregiver(data) {
  const caregiver = await Caregiver.create({
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
  });

  return caregiver;
}

export async function findCaregiverById(id) {
  return Caregiver.findById(id);
}
