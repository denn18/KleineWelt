import { S3Client } from '@aws-sdk/client-s3';

let client = null;

function createS3Client() {
  const region = process.env.AWS_REGION || 'eu-north-1';
  const endpoint = process.env.AWS_S3_ENDPOINT || undefined;

  return new S3Client({
    region,
    endpoint,
    credentials: process.env.AWS_ACCESS_KEY_ID
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
  });
}

export function getS3Client() {
  if (!client) {
    client = createS3Client();
  }
  return client;
}

export function setS3ClientForTests(mockClient) {
  client = mockClient;
}
