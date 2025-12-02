import crypto from 'crypto';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { lookup as lookupMime } from 'mime-types';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getS3Client, setS3ClientForTests } from './s3Client.js';

const MAX_FILE_SIZE_BYTES = Number.parseInt(process.env.FILE_UPLOAD_MAX_BYTES ?? `${25 * 1024 * 1024}`, 10);
const LOCAL_UPLOAD_DIR = process.env.LOCAL_UPLOAD_DIR;
const DEFAULT_STORAGE_MODE = (process.env.FILE_STORAGE_MODE || 's3').toLowerCase();
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);
const ALLOWED_MIME_PREFIXES = ['image/'];

function getBucketName() {
  return process.env.AWS_S3_BUCKET;
}

function getStorageMode() {
  if (DEFAULT_STORAGE_MODE === 'local') {
    return 'local';
  }

  // Default to S3 to avoid silently falling back to local storage when S3 is intended
  return 's3';
}

function assertBucketConfigured(storageMode) {
  if (storageMode === 's3' && !getBucketName()) {
    const error = new Error('S3-Bucket ist nicht konfiguriert. Bitte AWS_S3_BUCKET setzen oder FILE_STORAGE_MODE=local verwenden.');
    error.status = 500;
    throw error;
  }
}

function getLocalUploadDir() {
  if (LOCAL_UPLOAD_DIR) {
    return LOCAL_UPLOAD_DIR;
  }

  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(currentDir, '../../uploads');
}

function buildFileUrl(key) {
  if (!key) return '';
  const encodedKey = encodeURIComponent(key);
  if (getStorageMode() === 'local') {
    return `/uploads/${encodedKey}`;
  }
  return `/api/files/${encodedKey}`;
}

function extractBase64Payload(data) {
  if (!data) {
    return { payload: null, mimeType: null };
  }

  const dataUrlMatch = /^data:([^;,]+);base64,(.*)$/i.exec(data);
  if (dataUrlMatch) {
    return { payload: dataUrlMatch[2], mimeType: dataUrlMatch[1] };
  }

  const payload = data.includes(',') ? data.split(',', 2)[1] : data;
  return { payload, mimeType: null };
}

function resolveFileExtension(originalName = '', fallbackExtension = '') {
  const extensionFromName = originalName.includes('.') ? originalName.substring(originalName.lastIndexOf('.') + 1) : '';
  if (extensionFromName) {
    return extensionFromName.toLowerCase();
  }

  return fallbackExtension.toLowerCase();
}

function resolveMimeType({ mimeTypeFromPayload, originalName, fallbackExtension }) {
  if (mimeTypeFromPayload) {
    return mimeTypeFromPayload.toLowerCase();
  }

  const extension = resolveFileExtension(originalName, fallbackExtension);
  const mimeType = lookupMime(extension || fallbackExtension || '') || 'application/octet-stream';
  return mimeType.toLowerCase();
}

function assertValidMimeType(mimeType) {
  const isAllowedPrefix = ALLOWED_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix));
  const isAllowedType = ALLOWED_MIME_TYPES.has(mimeType);

  if (!isAllowedPrefix && !isAllowedType) {
    const error = new Error('Dateiformat wird nicht unterstützt.');
    error.status = 400;
    throw error;
  }
}

function assertValidSize(buffer) {
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    const error = new Error('Die Datei überschreitet die maximale Größe.');
    error.status = 400;
    throw error;
  }
}

function sanitizeFolder(folder) {
  if (!folder) return '';
  return folder
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join('/');
}

function sanitizeKey(key) {
  const normalized = path.normalize(key).replace(/^(\.\.\\|\.\.\/)+/, '');
  return normalized.replace(/^\/+/, '');
}

function resolveLocalPath(key) {
  const uploadsDir = getLocalUploadDir();
  const sanitizedKey = sanitizeKey(key);
  const absolutePath = path.resolve(uploadsDir, sanitizedKey);
  return { uploadsDir, sanitizedKey, absolutePath };
}

export function normalizeFileReference(input) {
  if (!input) return null;

  if (typeof input === 'string') {
    const extractedKey = extractKey(input);
    const url = extractedKey ? buildFileUrl(extractedKey) : input;
    return { key: extractedKey, url };
  }

  if (typeof input === 'object') {
    const url = input.url || (input.key ? buildFileUrl(input.key) : null) || null;
    return {
      key: input.key ?? null,
      url,
      fileName: input.fileName ?? null,
      mimeType: input.mimeType ?? null,
      size: input.size ?? null,
      uploadedAt: input.uploadedAt ?? null,
    };
  }

  return null;
}

export function fileReferencesEqual(a, b) {
  if (!a || !b) return false;
  if (a.key && b.key) {
    return a.key === b.key;
  }

  return Boolean(a.url && b.url && a.url === b.url);
}

function extractKey(fileRef) {
  if (!fileRef) return null;
  if (typeof fileRef === 'string') {
    const apiPrefix = '/api/files/';
    if (fileRef.startsWith(apiPrefix)) {
      return decodeURIComponent(fileRef.substring(apiPrefix.length));
    }
    if (fileRef.startsWith('/uploads/')) {
      return fileRef.substring('/uploads/'.length);
    }
    return null;
  }

  if (fileRef.key) {
    return fileRef.key;
  }

  if (fileRef.url?.startsWith('/api/files/')) {
    return decodeURIComponent(fileRef.url.substring('/api/files/'.length));
  }

  return null;
}

export async function storeBase64File({ base64, originalName, folder, fallbackExtension }) {
  const bucket = getBucketName();
  const storageMode = getStorageMode();
  assertBucketConfigured(storageMode);

  if (!base64) {
    return null;
  }

  const { payload, mimeType: mimeTypeFromPayload } = extractBase64Payload(base64);
  if (!payload) {
    return null;
  }

  const mimeType = resolveMimeType({ mimeTypeFromPayload, originalName, fallbackExtension });
  assertValidMimeType(mimeType);

  const buffer = Buffer.from(payload, 'base64');
  assertValidSize(buffer);

  const extension = resolveFileExtension(originalName, fallbackExtension);
  const safeExtension = extension ? `.${extension}` : '';
  const fileName = `${crypto.randomUUID()}${safeExtension}`;
  const sanitizedFolder = sanitizeFolder(folder);
  const key = sanitizedFolder ? `${sanitizedFolder}/${fileName}` : fileName;

  if (storageMode === 's3') {
    const s3Client = getS3Client();
    const putCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ContentLength: buffer.length,
    });

    await s3Client.send(putCommand);

    return {
      key,
      url: buildFileUrl(key),
      fileName: originalName || fileName,
      mimeType,
      size: buffer.length,
      uploadedAt: new Date().toISOString(),
    };
  }

  const { absolutePath, sanitizedKey } = resolveLocalPath(key);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, buffer);

  return {
    key: sanitizedKey,
    url: buildFileUrl(sanitizedKey),
    fileName: originalName || fileName,
    mimeType,
    size: buffer.length,
    uploadedAt: new Date().toISOString(),
  };
}

export async function removeStoredFile(fileRef) {
  const bucket = getBucketName();
  const storageMode = getStorageMode();
  assertBucketConfigured(storageMode);

  const key = extractKey(fileRef);
  if (!key) {
    return;
  }

  try {
    if (storageMode === 's3') {
      const s3Client = getS3Client();
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );
    } else {
      const { absolutePath } = resolveLocalPath(key);
      await fs.unlink(absolutePath);
    }
  } catch (error) {
    console.warn(`Failed to remove stored file: ${key}`, error);
  }
}

export async function fetchStoredFile(key) {
  const bucket = getBucketName();
  const storageMode = getStorageMode();
  assertBucketConfigured(storageMode);
  if (!key) {
    return null;
  }

  if (storageMode === 'local') {
    const { absolutePath } = resolveLocalPath(key);
    try {
      const stats = await fs.stat(absolutePath);
      return {
        stream: createReadStream(absolutePath),
        contentType: lookupMime(path.extname(key).slice(1)) || 'application/octet-stream',
        contentLength: stats.size,
        lastModified: stats.mtime,
      };
    } catch (error) {
      if (error?.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  if (!bucket) {
    return null;
  }

  const s3Client = getS3Client();
  try {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    return {
      stream: response.Body,
      contentType: response.ContentType,
      contentLength: response.ContentLength,
      lastModified: response.LastModified,
    };
  } catch (error) {
    if (error?.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw error;
  }
}

export async function createSignedDownloadUrl(key, expiresInSeconds = 900) {
  const bucket = getBucketName();
  const storageMode = getStorageMode();
  assertBucketConfigured(storageMode);
  if (!bucket || !key) {
    return null;
  }

  const s3Client = getS3Client();
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

export { setS3ClientForTests };
