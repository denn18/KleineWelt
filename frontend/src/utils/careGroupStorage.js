const CARE_GROUP_STORAGE_KEY = 'kleinewelt:caregroup:v1';

function sanitizeGroup(group) {
  if (!group || typeof group !== 'object') {
    return null;
  }

  return {
    caregiverId: group.caregiverId ?? null,
    participantIds: Array.isArray(group.participantIds) ? Array.from(new Set(group.participantIds)) : [],
    daycareName: group.daycareName || 'Kindertagespflegegruppe',
    logoImageUrl: group.logoImageUrl || '',
    messages: Array.isArray(group.messages) ? group.messages : [],
    updatedAt: group.updatedAt || null,
    createdAt: group.createdAt || null,
  };
}

export function readCareGroup() {
  try {
    const raw = localStorage.getItem(CARE_GROUP_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    return sanitizeGroup(JSON.parse(raw));
  } catch (error) {
    console.warn('Betreuungsgruppe konnte nicht aus localStorage gelesen werden', error);
    return null;
  }
}

export function saveCareGroup(nextGroup) {
  const sanitized = sanitizeGroup(nextGroup);
  if (!sanitized) {
    localStorage.removeItem(CARE_GROUP_STORAGE_KEY);
    return null;
  }

  localStorage.setItem(CARE_GROUP_STORAGE_KEY, JSON.stringify(sanitized));
  return sanitized;
}

export function isGroupMember(group, userId) {
  if (!group || !userId) {
    return false;
  }

  return group.caregiverId === userId || group.participantIds.includes(userId);
}
