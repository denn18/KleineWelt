import { messagesCollection } from '../models/Message.js';
import { removeStoredFile } from '../utils/fileStorage.js';

const IMAGE_MIME_PREFIX = 'image/';
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'heic', 'heif', 'bmp', 'tiff']);

function isImageAttachment(attachment) {
  if (!attachment) {
    return false;
  }
  if (attachment.mimeType?.toLowerCase().startsWith(IMAGE_MIME_PREFIX)) {
    return true;
  }

  const fileName = attachment.fileName || attachment.name || attachment.key || '';
  const extension = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';
  return IMAGE_EXTENSIONS.has(extension);
}

function parseDate(value) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function resolveAttachmentTimestamp(attachment, fallbackDate) {
  return parseDate(attachment?.uploadedAt) ?? parseDate(fallbackDate);
}

export async function cleanupExpiredMessageImages({ retentionDays = 3 } = {}) {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const cursor = messagesCollection().find({ attachments: { $exists: true, $ne: [] } });

  for await (const message of cursor) {
    const attachments = Array.isArray(message.attachments) ? message.attachments : [];
    if (!attachments.length) {
      continue;
    }

    const expiredImages = [];
    const remaining = [];

    for (const attachment of attachments) {
      if (!isImageAttachment(attachment)) {
        remaining.push(attachment);
        continue;
      }

      const timestamp = resolveAttachmentTimestamp(attachment, message.createdAt);
      if (timestamp && timestamp <= cutoff) {
        expiredImages.push(attachment);
      } else {
        remaining.push(attachment);
      }
    }

    if (!expiredImages.length) {
      continue;
    }

    await Promise.all(expiredImages.map((attachment) => removeStoredFile(attachment)));
    await messagesCollection().updateOne(
      { _id: message._id },
      { $set: { attachments: remaining, updatedAt: new Date() } }
    );
  }
}

export function startMessageImageCleanupScheduler({
  intervalMs = 12 * 60 * 60 * 1000,
  retentionDays = 3,
} = {}) {
  const runCleanup = () =>
    cleanupExpiredMessageImages({ retentionDays }).catch((error) => {
      console.error('Failed to cleanup expired message images', error);
    });

  const timer = setInterval(runCleanup, intervalMs);
  setTimeout(runCleanup, 10 * 1000);
  return timer;
}
