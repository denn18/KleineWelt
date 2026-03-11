import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/database.js';
import { normalizeFileReference } from '../utils/fileStorage.js';

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

function parseDateInput(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.valueOf()) ? null : value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? null : parsed;
}

function calculateAge(dateValue) {
  if (!dateValue) {
    return null;
  }

  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(date.valueOf())) {
    return null;
  }

  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const hasHadBirthdayThisYear =
    now.getMonth() > date.getMonth() || (now.getMonth() === date.getMonth() && now.getDate() >= date.getDate());
  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

function calculateYearsSince(dateValue) {
  if (!dateValue) {
    return null;
  }

  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(date.valueOf())) {
    return null;
  }

  const now = new Date();
  let years = now.getFullYear() - date.getFullYear();
  const hasReachedAnniversary =
    now.getMonth() > date.getMonth() || (now.getMonth() === date.getMonth() && now.getDate() >= date.getDate());
  if (!hasReachedAnniversary) {
    years -= 1;
  }

  return years >= 0 ? years : null;
}

function normalizeImageArray(input) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((entry) => normalizeFileReference(entry)).filter(Boolean);
}

function normalizeContractDocuments(input) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item) => {
      const name = item?.name?.trim();
      if (!name) {
        return null;
      }
      const fileRef = normalizeFileReference(item?.file ?? item?.fileRef ?? item?.document);
      if (!fileRef) {
        return null;
      }
      return { name, file: fileRef };
    })
    .filter(Boolean);
}

export function serializeCaregiver(document) {
  if (!document) {
    return null;
  }

  const { _id, ...rest } = document;
  if (Object.prototype.hasOwnProperty.call(rest, 'password')) {
    delete rest.password;
  }

  if (rest.birthDate instanceof Date) {
    rest.birthDate = rest.birthDate.toISOString();
  }

  if (rest.caregiverSince instanceof Date) {
    rest.caregiverSince = rest.caregiverSince.toISOString();
  }

  if (rest.birthDate) {
    const calculatedAge = calculateAge(rest.birthDate);
    if (calculatedAge !== null) {
      rest.age = calculatedAge;
    }
  }

  if (rest.caregiverSince) {
    const years = calculateYearsSince(rest.caregiverSince);
    if (years !== null) {
      rest.yearsOfExperience = years;
    }
  }

  rest.profileImageUrl = normalizeFileReference(rest.profileImageUrl);
  rest.logoImageUrl = normalizeFileReference(rest.logoImageUrl);
  rest.conceptUrl = normalizeFileReference(rest.conceptUrl);
  rest.roomImages = Array.isArray(rest.roomImages)
    ? rest.roomImages.map((entry) => normalizeFileReference(entry)).filter(Boolean)
    : [];
  rest.caregiverImages = Array.isArray(rest.caregiverImages)
    ? rest.caregiverImages.map((entry) => normalizeFileReference(entry)).filter(Boolean)
    : [];
  rest.contractDocuments = Array.isArray(rest.contractDocuments)
    ? rest.contractDocuments
        .map((doc) => ({
          name: doc?.name ?? null,
          file: normalizeFileReference(doc?.file),
        }))
        .filter((doc) => doc.name && doc.file)
    : [];

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
  const birthDate = parseDateInput(data.birthDate);
  const caregiverSince = parseDateInput(data.caregiverSince);
  const age = birthDate
    ? calculateAge(birthDate)
    : typeof data.age === 'number'
      ? data.age
      : Number.parseInt(data.age ?? '0', 10) || null;
  const maxChildAge =
    typeof data.maxChildAge === 'number'
      ? data.maxChildAge
      : Number.parseInt(data.maxChildAge ?? '0', 10) || null;
  const careTimes = normalizeScheduleEntries(data.careTimes);
  const dailySchedule = normalizeScheduleEntries(data.dailySchedule);
  const mealPlan = data.mealPlan?.trim() || null;
  const roomImages = normalizeImageArray(data.roomImages);
  const caregiverImages = normalizeImageArray(data.caregiverImages);
  const contractDocuments = normalizeContractDocuments(data.contractDocuments);
  const closedDays = Array.isArray(data.closedDays)
    ? data.closedDays.map((day) => day?.trim()).filter(Boolean)
    : [];

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
    birthDate: birthDate ?? null,
    caregiverSince: caregiverSince ?? null,
    maxChildAge,
    availabilityTiming: data.availabilityTiming?.trim() || 'aktuell',
    bio: data.bio?.trim() || null,
    shortDescription: data.shortDescription?.trim() || null,
    location: data.location ?? null,
    careTimes,
    dailySchedule,
    mealPlan,
    roomImages,
    caregiverImages,
    contractDocuments,
    closedDays,
    username: data.username?.trim() || data.email?.trim(),
    password: data.password,
    profileImageUrl: data.profileImageUrl || null,
    logoImageUrl: data.logoImageUrl || null,
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
  if (data.birthDate !== undefined) {
    const birthDate = parseDateInput(data.birthDate);
    update.birthDate = birthDate;
    update.age = birthDate ? calculateAge(birthDate) : update.age ?? null;
  }
  if (data.caregiverSince !== undefined) {
    update.caregiverSince = parseDateInput(data.caregiverSince);
  }
  if (data.maxChildAge !== undefined) {
    update.maxChildAge =
      typeof data.maxChildAge === 'number'
        ? data.maxChildAge
        : Number.parseInt(data.maxChildAge ?? '0', 10) || null;
  }
  if (data.hasAvailability !== undefined) {
    update.hasAvailability =
      typeof data.hasAvailability === 'string'
        ? data.hasAvailability.toLowerCase() === 'true'
        : Boolean(data.hasAvailability);
  }
  if (data.availabilityTiming !== undefined) {
    update.availabilityTiming = data.availabilityTiming?.trim() || 'aktuell';
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
    update.roomImages = normalizeImageArray(data.roomImages);
  }
  if (data.caregiverImages !== undefined) {
    update.caregiverImages = normalizeImageArray(data.caregiverImages);
  }
  if (data.contractDocuments !== undefined) {
    update.contractDocuments = normalizeContractDocuments(data.contractDocuments);
  }
  if (data.closedDays !== undefined) {
    update.closedDays = Array.isArray(data.closedDays)
      ? data.closedDays.map((day) => day?.trim()).filter(Boolean)
      : [];
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
  if (data.logoImageUrl !== undefined) {
    update.logoImageUrl = data.logoImageUrl;
  }
  if (data.conceptUrl !== undefined) {
    update.conceptUrl = data.conceptUrl;
  }

  return update;
}
