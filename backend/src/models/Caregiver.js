import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/database.js';

const COLLECTION_NAME = 'caregivers';

export function caregiversCollection() {
  return getDatabase().collection(COLLECTION_NAME);
}

function normalizeScheduleEntries(entries) {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map((entry) => ({
      startTime: entry?.startTime?.trim() || '',
      endTime: entry?.endTime?.trim() || '',
      activity: entry?.activity?.trim() || '',
    }))
    .filter((entry) => entry.startTime && entry.endTime && entry.activity);
}

export function serializeCaregiver(document) {
  if (!document) {
    return null;
  }

  const { _id, ...rest } = document;
  if (Object.prototype.hasOwnProperty.call(rest, 'password')) {
    delete rest.password;
  }
  return {
    id: _id.toString(),
    ...rest,
  };
}

export function toObjectId(id) {
  if (!id) {
    return null;
  }

  try {
    return new ObjectId(id);
  } catch (_error) {
    return null;
  }
}

export function buildCaregiverDocument(data) {
  const now = new Date();
  const fullName = [data.firstName?.trim(), data.lastName?.trim()].filter(Boolean).join(' ').trim();
  const availableSpots =
    typeof data.availableSpots === 'number'
      ? data.availableSpots
      : Number.parseInt(data.availableSpots ?? '0', 10) || 0;
  const childrenCount =
    typeof data.childrenCount === 'number'
      ? data.childrenCount
      : Number.parseInt(data.childrenCount ?? '0', 10) || 0;
  const age =
    typeof data.age === 'number' ? data.age : Number.parseInt(data.age ?? '0', 10) || null;
  const careTimes = normalizeScheduleEntries(data.careTimes);
  const dailySchedule = normalizeScheduleEntries(data.dailySchedule);
  const mealPlan = data.mealPlan?.trim() || null;
  const roomImages = Array.isArray(data.roomImages) ? data.roomImages.filter(Boolean) : [];

  return {
    name: fullName || data.name?.trim(),
    firstName: data.firstName?.trim() || null,
    lastName: data.lastName?.trim() || null,
    email: data.email?.trim(),
    phone: data.phone?.trim(),
    address: data.address?.trim(),
    postalCode: data.postalCode?.trim(),
    city: data.city?.trim() || null,
    daycareName: data.daycareName?.trim() || null,
    availableSpots,
    childrenCount,
    age,
    hasAvailability:
      typeof data.hasAvailability === 'string'
        ? data.hasAvailability.toLowerCase() === 'true'
        : Boolean(data.hasAvailability),
    bio: data.bio?.trim() || null,
    shortDescription: data.shortDescription?.trim() || null,
    location: data.location ?? null,
    careTimes,
    dailySchedule,
    mealPlan,
    roomImages,
    username: data.username?.trim() || data.email?.trim(),
    password: data.password,
    profileImageUrl: data.profileImageUrl || null,
    conceptUrl: data.conceptUrl || null,
    role: 'caregiver',
    createdAt: now,
    updatedAt: now,
  };
}

export function buildCaregiverUpdate(data) {
  const update = { updatedAt: new Date() };

  if (data.firstName !== undefined) {
    update.firstName = data.firstName?.trim() || null;
  }
  if (data.lastName !== undefined) {
    update.lastName = data.lastName?.trim() || null;
  }
  if (data.name !== undefined) {
    update.name = data.name?.trim() || null;
  } else if (data.firstName !== undefined || data.lastName !== undefined) {
    const fullName = [data.firstName?.trim(), data.lastName?.trim()].filter(Boolean).join(' ').trim();
    update.name = fullName || null;
  }
  if (data.email !== undefined) {
    update.email = data.email?.trim() || null;
  }
  if (data.phone !== undefined) {
    update.phone = data.phone?.trim() || null;
  }
  if (data.address !== undefined) {
    update.address = data.address?.trim() || null;
  }
  if (data.postalCode !== undefined) {
    update.postalCode = data.postalCode?.trim() || null;
  }
  if (data.city !== undefined) {
    update.city = data.city?.trim() || null;
  }
  if (data.daycareName !== undefined) {
    update.daycareName = data.daycareName?.trim() || null;
  }
  if (data.availableSpots !== undefined) {
    update.availableSpots =
      typeof data.availableSpots === 'number'
        ? data.availableSpots
        : Number.parseInt(data.availableSpots ?? '0', 10) || 0;
  }
  if (data.childrenCount !== undefined) {
    update.childrenCount =
      typeof data.childrenCount === 'number'
        ? data.childrenCount
        : Number.parseInt(data.childrenCount ?? '0', 10) || 0;
  }
  if (data.age !== undefined) {
    update.age = typeof data.age === 'number' ? data.age : Number.parseInt(data.age ?? '0', 10) || null;
  }
  if (data.hasAvailability !== undefined) {
    update.hasAvailability =
      typeof data.hasAvailability === 'string'
        ? data.hasAvailability.toLowerCase() === 'true'
        : Boolean(data.hasAvailability);
  }
  if (data.bio !== undefined) {
    update.bio = data.bio?.trim() || null;
  }
  if (data.shortDescription !== undefined) {
    update.shortDescription = data.shortDescription?.trim() || null;
  }
  if (data.location !== undefined) {
    update.location = data.location;
  }
  if (data.careTimes !== undefined) {
    update.careTimes = normalizeScheduleEntries(data.careTimes);
  }
  if (data.dailySchedule !== undefined) {
    update.dailySchedule = normalizeScheduleEntries(data.dailySchedule);
  }
  if (data.mealPlan !== undefined) {
    update.mealPlan = data.mealPlan?.trim() || null;
  }
  if (data.roomImages !== undefined) {
    update.roomImages = Array.isArray(data.roomImages) ? data.roomImages.filter(Boolean) : [];
  }
  if (data.username !== undefined) {
    update.username = data.username?.trim() || null;
  }
  if (data.password !== undefined) {
    update.password = data.password;
  }
  if (data.profileImageUrl !== undefined) {
    update.profileImageUrl = data.profileImageUrl;
  }
  if (data.conceptUrl !== undefined) {
    update.conceptUrl = data.conceptUrl;
  }

  return update;
}
