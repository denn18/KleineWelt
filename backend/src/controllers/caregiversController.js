import {
  createCaregiver,
  findCaregiverById,
  listCaregiverLocations,
  listCaregivers,
  updateCaregiver,
} from '../services/caregiversService.js';
import {
  fileReferencesEqual,
  normalizeFileReference,
  removeStoredFile,
  storeBase64File,
} from '../utils/fileStorage.js';

async function maybeStoreBase64({ value, originalName, folder, fallbackExtension }) {
  if (!value || value === 'null') {
    return null;
  }

  return storeBase64File({ base64: value, originalName, folder, fallbackExtension });
}

function reuseFileReference(value) {
  return normalizeFileReference(value);
}

function deduplicateFileList(list = []) {
  const result = [];

  for (const ref of list) {
    if (!ref) continue;
    if (!result.some((existing) => fileReferencesEqual(existing, ref))) {
      result.push(ref);
    }
  }

  return result;
}

async function buildFileListFromPayload(items, options) {
  const normalized = [];

  for (const item of items) {
    if (typeof item === 'string') {
      const ref = reuseFileReference(item);
      if (ref) {
        normalized.push(ref);
      }
      continue;
    }

    if (item?.dataUrl) {
      const stored = await storeBase64File({
        base64: item.dataUrl,
        originalName: item.fileName,
        folder: options.folder,
        fallbackExtension: options.fallbackExtension,
      });
      if (stored) {
        normalized.push(stored);
      }
      continue;
    }

    const ref = reuseFileReference(item);
    if (ref) {
      normalized.push(ref);
    }
  }

  return deduplicateFileList(normalized);
}

export async function getCaregivers(req, res) {
  try {
    const caregivers = await listCaregivers({
      postalCode: req.query.postalCode,
      city: req.query.city,
      search: req.query.search,
    });
    res.json(caregivers);
  } catch (error) {
    console.error('Failed to load caregivers', error);
    res.status(500).json({ message: 'Konnte Tagespflegepersonen nicht laden.' });
  }
}

export async function getCaregiverLocations(req, res) {
  try {
    const suggestions = await listCaregiverLocations(req.query.q ?? '');
    res.json(suggestions);
  } catch (error) {
    console.error('Failed to load caregiver locations', error);
    res.status(500).json({ message: 'Konnte Orte nicht laden.' });
  }
}

export async function postCaregiver(req, res) {
  try {
    const profileImageUrl = await maybeStoreBase64({
      value: req.body.profileImage,
      originalName: req.body.profileImageName,
      folder: 'caregivers/profile-images',
      fallbackExtension: 'png',
    });

    const logoImageUrl = await maybeStoreBase64({
      value: req.body.logoImage,
      originalName: req.body.logoImageName,
      folder: 'caregivers/logos',
      fallbackExtension: 'png',
    });

    const conceptUrl = await maybeStoreBase64({
      value: req.body.conceptFile,
      originalName: req.body.conceptFileName,
      folder: 'caregivers/concepts',
      fallbackExtension: 'pdf',
    });

    const rawRoomImages = Array.isArray(req.body.roomImages) ? req.body.roomImages : [];
    const storedRoomImages = await buildFileListFromPayload(rawRoomImages, {
      folder: 'caregivers/room-gallery',
      fallbackExtension: 'png',
    });

    const rawCaregiverImages = Array.isArray(req.body.caregiverImages) ? req.body.caregiverImages : [];
    const storedCaregiverImages = await buildFileListFromPayload(rawCaregiverImages, {
      folder: 'caregivers/team-gallery',
      fallbackExtension: 'png',
    });

    const caregiver = await createCaregiver({
      ...req.body,
      profileImageUrl,
      conceptUrl,
      roomImages: storedRoomImages,
      caregiverImages: storedCaregiverImages,
      logoImageUrl,
    });
    res.status(201).json(caregiver);
  } catch (error) {
    console.error('Failed to create caregiver', error);
    const status = error.status || 500;
    res.status(status).json({ message: 'Konnte Profil nicht speichern.' });
  }
}

export async function getCaregiverById(req, res) {
  try {
    const caregiver = await findCaregiverById(req.params.id);
    if (!caregiver) {
      return res.status(404).json({ message: 'Tagespflegeperson wurde nicht gefunden.' });
    }

    res.json(caregiver);
  } catch (error) {
    console.error('Failed to load caregiver', error);
    res.status(500).json({ message: 'Konnte Profil nicht laden.' });
  }
}

export async function patchCaregiver(req, res) {
  const caregiverId = req.params.id;

  try {
    const existing = await findCaregiverById(caregiverId);
    if (!existing) {
      return res.status(404).json({ message: 'Tagespflegeperson wurde nicht gefunden.' });
    }

    let profileImageUrl = existing.profileImageUrl ? normalizeFileReference(existing.profileImageUrl) : null;
    const removeImage = req.body.profileImage === null || req.body.profileImage === 'null';
    const hasNewImage = typeof req.body.profileImage === 'string' && req.body.profileImage !== 'null';
    if (removeImage) {
      await removeStoredFile(existing.profileImageUrl);
      profileImageUrl = null;
    } else if (hasNewImage) {
      await removeStoredFile(existing.profileImageUrl);
      profileImageUrl = await storeBase64File({
        base64: req.body.profileImage,
        originalName: req.body.profileImageName,
        folder: 'caregivers/profile-images',
        fallbackExtension: 'png',
      });
    }

    let logoImageUrl = existing.logoImageUrl ? normalizeFileReference(existing.logoImageUrl) : null;
    const removeLogo = req.body.logoImage === null || req.body.logoImage === 'null';
    const hasNewLogo = typeof req.body.logoImage === 'string' && req.body.logoImage !== 'null';
    if (removeLogo) {
      await removeStoredFile(existing.logoImageUrl);
      logoImageUrl = null;
    } else if (hasNewLogo) {
      await removeStoredFile(existing.logoImageUrl);
      logoImageUrl = await storeBase64File({
        base64: req.body.logoImage,
        originalName: req.body.logoImageName,
        folder: 'caregivers/logos',
        fallbackExtension: 'png',
      });
    }

    let conceptUrl = existing.conceptUrl ? normalizeFileReference(existing.conceptUrl) : null;
    const removeConcept = req.body.conceptFile === null || req.body.conceptFile === 'null';
    const hasNewConcept = typeof req.body.conceptFile === 'string' && req.body.conceptFile !== 'null';
    if (removeConcept) {
      await removeStoredFile(existing.conceptUrl);
      conceptUrl = null;
    } else if (hasNewConcept) {
      await removeStoredFile(existing.conceptUrl);
      conceptUrl = await storeBase64File({
        base64: req.body.conceptFile,
        originalName: req.body.conceptFileName,
        folder: 'caregivers/concepts',
        fallbackExtension: 'pdf',
      });
    }

    let roomImages = Array.isArray(existing.roomImages)
      ? existing.roomImages.map((image) => normalizeFileReference(image)).filter(Boolean)
      : [];
    if (req.body.roomImages !== undefined) {
      const requestedImages = Array.isArray(req.body.roomImages) ? req.body.roomImages : [];
      const normalizedImages = await buildFileListFromPayload(requestedImages, {
        folder: 'caregivers/room-gallery',
        fallbackExtension: 'png',
      });

      const removedImages = roomImages.filter(
        (existingImage) => !normalizedImages.some((image) => fileReferencesEqual(image, existingImage))
      );
      await Promise.all(removedImages.map((image) => removeStoredFile(image)));
      roomImages = deduplicateFileList(normalizedImages);
    }

    let caregiverImages = Array.isArray(existing.caregiverImages)
      ? existing.caregiverImages.map((image) => normalizeFileReference(image)).filter(Boolean)
      : [];
    if (req.body.caregiverImages !== undefined) {
      const requestedImages = Array.isArray(req.body.caregiverImages) ? req.body.caregiverImages : [];
      const normalizedCaregiverImages = await buildFileListFromPayload(requestedImages, {
        folder: 'caregivers/team-gallery',
        fallbackExtension: 'png',
      });

      const removedImages = caregiverImages.filter(
        (existingImage) => !normalizedCaregiverImages.some((image) => fileReferencesEqual(image, existingImage))
      );
      await Promise.all(removedImages.map((image) => removeStoredFile(image)));
      caregiverImages = deduplicateFileList(normalizedCaregiverImages);
    }

    const caregiver = await updateCaregiver(caregiverId, {
      ...req.body,
      profileImageUrl,
      conceptUrl,
      roomImages,
      caregiverImages,
      logoImageUrl,
    });

    res.json(caregiver);
  } catch (error) {
    console.error('Failed to update caregiver', error);
    res.status(500).json({ message: 'Konnte Profil nicht aktualisieren.' });
  }
}
