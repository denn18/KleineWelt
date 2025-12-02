import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { fetchStoredFile, removeStoredFile, setS3ClientForTests, storeBase64File } from '../src/utils/fileStorage.js';

class FakeS3Client {
  constructor() {
    this.objects = new Map();
  }

  async send(command) {
    if (command instanceof PutObjectCommand) {
      this.objects.set(command.input.Key, {
        bucket: command.input.Bucket,
        key: command.input.Key,
        body: command.input.Body,
        contentType: command.input.ContentType,
      });
      return {};
    }

    if (command instanceof DeleteObjectCommand) {
      this.objects.delete(command.input.Key);
      return {};
    }

    if (command instanceof GetObjectCommand) {
      const object = this.objects.get(command.input.Key);
      if (!object) {
        const error = new Error('Not found');
        error.$metadata = { httpStatusCode: 404 };
        throw error;
      }

      return {
        Body: Readable.from(object.body),
        ContentType: object.contentType,
        ContentLength: object.body?.length ?? 0,
      };
    }

    throw new Error('Unsupported command');
  }
}

function setupFakeS3() {
  process.env.AWS_S3_BUCKET = 'test-bucket';
  const client = new FakeS3Client();
  setS3ClientForTests(client);
  return client;
}

test('storeBase64File returns null when no payload is provided', async () => {
  setupFakeS3();
  const result = await storeBase64File({ base64: '', folder: 'tests' });
  assert.equal(result, null);
});

test('storeBase64File uploads to S3 and removeStoredFile deletes it again', async () => {
  const client = setupFakeS3();
  const payload = Buffer.from('Hello kleine Welt!').toString('base64');
  const folder = 'tests';

  const file = await storeBase64File({
    base64: payload,
    originalName: 'avatar.png',
    folder,
    fallbackExtension: 'png',
  });

  assert.ok(file?.key.includes(`${folder}/`));
  assert.equal(file.mimeType, 'image/png');
  assert.equal(client.objects.has(file.key), true);

  const fetched = await fetchStoredFile(file.key);
  assert.equal(fetched?.contentType, 'image/png');

  await removeStoredFile(file);
  assert.equal(client.objects.has(file.key), false);
});

test('removeStoredFile ignores missing keys', async () => {
  setupFakeS3();
  await removeStoredFile('https://example.com/avatar.png');
  await removeStoredFile('/not-uploads/file.txt');
});
