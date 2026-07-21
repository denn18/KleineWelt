export const CARE_PERMISSION_MAX_BYTES = 10 * 1024 * 1024;
export const CARE_PERMISSION_ALLOWED_MIME_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);
export const VERIFICATION_STATUSES = new Set(['missing', 'pending', 'approved', 'rejected']);

export function normalizeVerificationStatus(status) {
  return VERIFICATION_STATUSES.has(status) ? status : 'missing';
}

export function isCaregiverPubliclyVisible(caregiver = {}) {
  if (caregiver.isPublished === false) return false;
  if (caregiver.isPublished === true) return true;
  return !caregiver.verificationStatus || caregiver.verificationStatus === 'missing';
}

export function sanitizeCarePermission(caregiver) {
  if (!caregiver) return caregiver;
  const copy = { ...caregiver };
  delete copy.carePermissionDocumentUrl;
  delete copy.carePermissionOriginalName;
  delete copy.carePermissionUploadedAt;
  delete copy.verificationNotes;
  return copy;
}

export function assertValidCarePermissionFile(fileRef) {
  if (!fileRef) {
    const error = new Error('Bitte lade deine Pflegeerlaubnis hoch, bevor du dein Profil erstellst.');
    error.status = 400;
    throw error;
  }
  if (fileRef.size > CARE_PERMISSION_MAX_BYTES) {
    const error = new Error('Die Datei ist zu groß. Bitte lade maximal 10 MB hoch.');
    error.status = 400;
    throw error;
  }
  if (!CARE_PERMISSION_ALLOWED_MIME_TYPES.has(fileRef.mimeType)) {
    const error = new Error('Dieses Dateiformat wird nicht unterstützt. Bitte verwende PDF, JPG oder PNG.');
    error.status = 400;
    throw error;
  }
}
