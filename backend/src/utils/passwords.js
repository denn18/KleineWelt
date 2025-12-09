import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function hashPassword(password) {
  if (!password) {
    return null;
  }
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function hashPasswordIfPresent(document = {}) {
  if (!document || !document.password) {
    return document;
  }

  const hashed = await hashPassword(document.password);
  return { ...document, password: hashed, passwordUpdatedAt: new Date() };
}
