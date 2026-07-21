import { downloadFileByKey } from './filesController.js';
import { caregiversCollection, serializeCaregiver, toObjectId } from '../models/Caregiver.js';
import { normalizeVerificationStatus } from '../utils/caregiverVerification.js';

export async function listCaregiverVerifications(_req, res) {
  const docs = await caregiversCollection().find({}).sort({ carePermissionUploadedAt: -1, createdAt: -1 }).toArray();
  res.json(docs.map(serializeCaregiver));
}

export async function getAdminCaregiver(req, res) {
  const id = toObjectId(req.params.id);
  const doc = id ? await caregiversCollection().findOne({ _id: id }) : null;
  if (!doc) return res.status(404).json({ message: 'Tagespflegeperson wurde nicht gefunden.' });
  return res.json(serializeCaregiver(doc));
}

export async function getCarePermission(req, res) {
  const id = toObjectId(req.params.id);
  const doc = id ? await caregiversCollection().findOne({ _id: id }) : null;
  const key = doc?.carePermissionDocumentUrl?.key;
  if (!doc || !key) return res.status(404).json({ message: 'Pflegeerlaubnis wurde nicht gefunden.' });
  return downloadFileByKey(key, res, doc.carePermissionOriginalName || doc.carePermissionDocumentUrl.fileName);
}

export async function patchCaregiverVerification(req, res) {
  const id = toObjectId(req.params.id);
  const status = normalizeVerificationStatus(req.body?.verificationStatus);
  if (!id || !['approved', 'rejected', 'pending', 'missing'].includes(status)) {
    return res.status(400).json({ message: 'Ungültiger Verifizierungsstatus.' });
  }
  const now = new Date();
  const update = { verificationStatus: status, updatedAt: now };
  if (status === 'approved') {
    update.isPublished = true; update.verifiedAt = now; update.verifiedBy = req.user?.id || null; update.publishedAt = now; update.verificationRejectionReason = null;
  } else if (status === 'rejected') {
    update.isPublished = false; update.verificationRejectionReason = req.body?.verificationRejectionReason || 'Nachweis erneut anfordern'; update.verificationNotes = req.body?.verificationNotes || null;
  }
  const result = await caregiversCollection().findOneAndUpdate({ _id: id }, { $set: update }, { returnDocument: 'after' });
  const doc = result.value || (await caregiversCollection().findOne({ _id: id }));
  if (!doc) return res.status(404).json({ message: 'Tagespflegeperson wurde nicht gefunden.' });
  return res.json(serializeCaregiver(doc));
}
