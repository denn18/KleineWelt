import { createParent, findParentById, listParents, updateParent } from '../services/parentsService.js';
import { normalizeFileReference, removeStoredFile, storeBase64File } from '../utils/fileStorage.js';

function parseChildrenPayload(children) {
  if (!children) {
    return [];
  }

  if (typeof children === 'string') {
    try {
      const parsed = JSON.parse(children);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('Failed to parse children payload', error);
      return [];
    }
  }

  return Array.isArray(children) ? children : [];
}

async function maybeStoreBase64({ value, originalName, folder, fallbackExtension }) {
  if (!value || value === 'null') {
    return null;
  }

  return storeBase64File({ base64: value, originalName, folder, fallbackExtension });
}

function reuseFileReference(value) {
  return normalizeFileReference(value);
}

export async function getParents(_req, res) {
  try {
    const parents = await listParents();
    res.json(parents);
  } catch (error) {
    console.error('Failed to load parents', error);
    res.status(500).json({ message: 'Konnte Elternprofile nicht laden.' });
  }
}

export async function postParent(req, res) {
  try {
    const children = parseChildrenPayload(req.body.children);

    const profileImageUrl = await maybeStoreBase64({
      value: req.body.profileImage,
      originalName: req.body.profileImageName,
      folder: 'parents/profile-images',
      fallbackExtension: 'png',
    });

    const parent = await createParent({
      ...req.body,
      children,
      profileImageUrl,
    });
    res.status(201).json(parent);
  } catch (error) {
    console.error('Failed to create parent', error);
    const status = error.status || 500;
    res.status(status).json({ message: 'Konnte Elternprofil nicht speichern.' });
  }
}

export async function getParentById(req, res) {
  try {
    const parent = await findParentById(req.params.id);
    if (!parent) {
      return res.status(404).json({ message: 'Elternprofil wurde nicht gefunden.' });
    }

    res.json(parent);
  } catch (error) {
    console.error('Failed to load parent', error);
    res.status(500).json({ message: 'Konnte Elternprofil nicht laden.' });
  }
}

export async function patchParent(req, res) {
  const parentId = req.params.id;
  try {
    const existing = await findParentById(parentId);
    if (!existing) {
      return res.status(404).json({ message: 'Elternprofil wurde nicht gefunden.' });
    }

    const children = parseChildrenPayload(req.body.children);

    let profileImageUrl = existing.profileImageUrl ? reuseFileReference(existing.profileImageUrl) : null;
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
        folder: 'parents/profile-images',
        fallbackExtension: 'png',
      });
    }

    const parent = await updateParent(parentId, {
      ...req.body,
      children,
      profileImageUrl,
    });

    res.json(parent);
  } catch (error) {
    console.error('Failed to update parent', error);
    res.status(500).json({ message: 'Konnte Elternprofil nicht aktualisieren.' });
  }
}
