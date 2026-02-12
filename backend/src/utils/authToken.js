import crypto from 'crypto';

const DEFAULT_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 7;

function getSecret() {
  return process.env.AUTH_TOKEN_SECRET || process.env.JWT_SECRET || 'dev-insecure-secret-change-me';
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function createSignature(payload) {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

export function createAuthToken(payload, options = {}) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresIn = Number.parseInt(options.expiresIn ?? process.env.AUTH_TOKEN_EXPIRES_IN_SECONDS, 10)
    || DEFAULT_EXPIRES_IN_SECONDS;

  const normalizedPayload = {
    ...payload,
    iat: issuedAt,
    exp: issuedAt + expiresIn,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(normalizedPayload));
  const signature = createSignature(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyAuthToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return null;
  }

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = createSignature(encodedPayload);
  if (signature !== expectedSignature) {
    return null;
  }

  let payload;
  try {
    payload = JSON.parse(base64UrlDecode(encodedPayload));
  } catch (_error) {
    return null;
  }

  if (!payload?.id || !payload?.exp) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) {
    return null;
  }

  return payload;
}
