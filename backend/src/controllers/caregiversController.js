import {
  createCaregiver,
  findCaregiverById,
  listCaregiverLocations,
  listCaregivers,
  updateCaregiver,
} from '../services/caregiversService.js';
import { removeStoredFile, storeBase64File } from '../utils/fileStorage.js';

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
    const profileImageUrl = await storeBase64File({
      base64: req.body.profileImage && req.body.profileImage !== 'null' ? req.body.profileImage : null,
      originalName: req.body.profileImageName,
      folder: 'caregivers/profile-images',
      fallbackExtension: 'png',
    });

    const conceptUrl = await storeBase64File({
      base64: req.body.conceptFile && req.body.conceptFile !== 'null' ? req.body.conceptFile : null,
      originalName: req.body.conceptFileName,
      folder: 'caregivers/concepts',
      fallbackExtension: 'pdf',
    });

    const rawRoomImages = Array.isArray(req.body.roomImages) ? req.body.roomImages : [];
    const storedRoomImages = await Promise.all(
      rawRoomImages.map(async (image) =>
        storeBase64File({
          base64: image?.dataUrl ?? null,
          originalName: image?.fileName,
          folder: 'caregivers/room-gallery',
          fallbackExtension: 'png',
        })
      )
    );

    const caregiver = await createCaregiver({
      ...req.body,
      profileImageUrl,
      conceptUrl,
      roomImages: storedRoomImages.filter(Boolean),
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

    let profileImageUrl = existing.profileImageUrl;
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

    let conceptUrl = existing.conceptUrl;
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

    let roomImages = existing.roomImages ?? [];
    if (req.body.roomImages !== undefined) {
      const requestedImages = Array.isArray(req.body.roomImages) ? req.body.roomImages : [];
      const normalizedImages = [];

      for (const image of requestedImages) {
        if (typeof image === 'string') {
          normalizedImages.push(image);
        } else if (image?.dataUrl) {
          const storedUrl = await storeBase64File({
            base64: image.dataUrl,
            originalName: image.fileName,
            folder: 'caregivers/room-gallery',
            fallbackExtension: 'png',
          });
          if (storedUrl) {
            normalizedImages.push(storedUrl);
          }
        }
      }

      const removedImages = roomImages.filter((url) => !normalizedImages.includes(url));
      await Promise.all(removedImages.map((url) => removeStoredFile(url)));
      roomImages = normalizedImages;
    }

    const caregiver = await updateCaregiver(caregiverId, {
      ...req.body,
      profileImageUrl,
      conceptUrl,
      roomImages,
    });

    res.json(caregiver);
  } catch (error) {
    console.error('Failed to update caregiver', error);
    res.status(500).json({ message: 'Konnte Profil nicht aktualisieren.' });
  }
}
