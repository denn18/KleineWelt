import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const uploadsRoot = path.resolve(process.cwd(), 'backend/uploads');

async function ensureDirectory(directory) {
  await fs.mkdir(directory, { recursive: true });
}

function extractBase64Payload(data) {
  if (!data) {
    return null;
  }

  if (data.includes(',')) {
    const [, payload] = data.split(',', 2);
    return payload;
  }

  return data;
}

function resolveFileExtension(originalName = '', fallbackExtension = '') {
  const extensionFromName = originalName.includes('.') ? originalName.substring(originalName.lastIndexOf('.') + 1) : '';
  if (extensionFromName) {
    return extensionFromName.toLowerCase();
  }

  return fallbackExtension.toLowerCase();
}

export async function storeBase64File({ base64, originalName, folder, fallbackExtension }) {
  if (!base64) {
    return null;
  }

  const payload = extractBase64Payload(base64);
  if (!payload) {
    return null;
  }

  const buffer = Buffer.from(payload, 'base64');
  const extension = resolveFileExtension(originalName, fallbackExtension);
  const safeExtension = extension ? `.${extension}` : '';
  const fileName = `${crypto.randomUUID()}${safeExtension}`;
  const directory = path.join(uploadsRoot, folder);

  await ensureDirectory(directory);
  const filePath = path.join(directory, fileName);
  await fs.writeFile(filePath, buffer);

  return `/uploads/${folder}/${fileName}`;
}

export async function removeStoredFile(fileUrl) {
  if (!fileUrl || !fileUrl.startsWith('/uploads/')) {
    return;
  }

  const relativePath = fileUrl.replace('/uploads/', '');
  const filePath = path.join(uploadsRoot, relativePath);

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(`Failed to remove stored file: ${filePath}`, error);
    }
  }
}
