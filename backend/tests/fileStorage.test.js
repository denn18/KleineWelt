import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storeBase64File, removeStoredFile } from '../src/utils/fileStorage.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = path.resolve(currentDir, '..', 'uploads');

async function fileExists(filePath) {
  try {
    await fs.stat(filePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

test('storeBase64File returns null when no payload is provided', async () => {
  const result = await storeBase64File({ base64: '', folder: 'tests' });
  assert.equal(result, null);
});

test('storeBase64File writes the decoded payload and removeStoredFile cleans it up', async () => {
  const payload = Buffer.from('Hello kleine Welt!').toString('base64');
  const folder = 'tests';

  const url = await storeBase64File({
    base64: payload,
    originalName: 'avatar.png',
    folder,
    fallbackExtension: 'png',
  });

  assert.ok(url.startsWith(`/uploads/${folder}/`));

  const relativePath = url.replace('/uploads/', '');
  const absolutePath = path.join(uploadsRoot, relativePath);

  assert.equal(await fileExists(absolutePath), true);

  await removeStoredFile(url);

  assert.equal(await fileExists(absolutePath), false);

  // cleanup folder to keep repository tidy
  await fs.rm(path.dirname(absolutePath), { recursive: true, force: true });
});

test('removeStoredFile ignores non-upload urls', async () => {
  await removeStoredFile('https://example.com/avatar.png');
  await removeStoredFile('/not-uploads/file.txt');
});
