import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';
import { authenticateUser, __resetAuthServiceCollectionsForTesting, __setAuthServiceCollectionsForTesting } from '../src/services/authService.js';
import {
  FORGOT_PASSWORD_MESSAGE,
  RESET_PASSWORD_INVALID_MESSAGE,
  RESET_PASSWORD_SUCCESS_MESSAGE,
  __resetPasswordResetServiceDependenciesForTesting,
  __setPasswordResetServiceDependenciesForTesting,
  requestPasswordReset,
  resetPassword,
} from '../src/services/passwordResetService.js';

function createId(value) {
  return { toString: () => value };
}

function createCollection(documents = []) {
  return {
    documents,
    findOne: test.mock.fn(async (query) => {
      if (query?.email) {
        if (typeof query.email === 'string') {
          return documents.find((document) => document.email === query.email) ?? null;
        }
        if (query.email.$regex) {
          const regex = new RegExp(query.email.$regex, query.email.$options);
          return documents.find((document) => regex.test(document.email)) ?? null;
        }
      }
      if (query?.$or) {
        return (
          documents.find((document) => query.$or.some((condition) => condition.email === document.email || condition.username === document.username)) ?? null
        );
      }
      return null;
    }),
    find: test.mock.fn(() => ({
      toArray: async () => documents.filter((document) => document.passwordReset?.tokenHash),
    })),
    updateOne: test.mock.fn(async (filter, update) => {
      const document = documents.find((entry) => entry._id === filter._id);
      if (!document) {
        return { matchedCount: 0, modifiedCount: 0 };
      }
      if (update.$set) {
        Object.assign(document, update.$set);
      }
      if (update.$unset) {
        for (const key of Object.keys(update.$unset)) {
          delete document[key];
        }
      }
      return { matchedCount: 1, modifiedCount: 1 };
    }),
  };
}

function setup({ parents = [], caregivers = [], emailSender = test.mock.fn(async () => true) } = {}) {
  const parentsCollection = createCollection(parents);
  const caregiversCollection = createCollection(caregivers);
  __setPasswordResetServiceDependenciesForTesting({ parents: parentsCollection, caregivers: caregiversCollection, emailSender });
  return { parentsCollection, caregiversCollection, emailSender };
}

test('requestPasswordReset responds neutrally when email does not exist', async (t) => {
  t.after(__resetPasswordResetServiceDependenciesForTesting);
  const { emailSender } = setup();

  const result = await requestPasswordReset('unknown@example.com');

  assert.equal(result.message, FORGOT_PASSWORD_MESSAGE);
  assert.equal(emailSender.mock.callCount(), 0);
});

test('requestPasswordReset stores a hashed token with a 30 minute expiry and sends email', async (t) => {
  const originalFrontendUrl = process.env.FRONTEND_URL;
  t.after(() => {
    __resetPasswordResetServiceDependenciesForTesting();
    if (originalFrontendUrl === undefined) {
      delete process.env.FRONTEND_URL;
    } else {
      process.env.FRONTEND_URL = originalFrontendUrl;
    }
  });
  process.env.FRONTEND_URL = 'https://wimmel-welt.de';
  const parent = { _id: createId('parent-1'), email: 'parent@example.com', username: 'parent', password: 'old-secret' };
  const { emailSender } = setup({ parents: [parent] });
  const before = Date.now();

  const result = await requestPasswordReset(' Parent@Example.com ');

  assert.equal(result.message, FORGOT_PASSWORD_MESSAGE);
  assert.ok(parent.passwordReset?.tokenHash);
  assert.notEqual(parent.passwordReset.tokenHash, emailSender.mock.calls[0].arguments[0].text.match(/token=([^\s]+)/)?.[1]);
  assert.ok(parent.passwordReset.tokenHash.startsWith('$2'));
  assert.equal(parent.passwordReset.usedAt, null);
  const expiresInMs = parent.passwordReset.expiresAt.getTime() - before;
  assert.ok(expiresInMs > 29 * 60 * 1000 && expiresInMs <= 31 * 60 * 1000);
  assert.equal(emailSender.mock.callCount(), 1);
  assert.equal(emailSender.mock.calls[0].arguments[0].subject, 'Passwort für Wimmel Welt zurücksetzen');
  assert.match(emailSender.mock.calls[0].arguments[0].text, /https:\/\/wimmel-welt\.de\/passwort-zuruecksetzen\?token=/);
});


test('requestPasswordReset uses the production reset link fallback outside development', async (t) => {
  const originalFrontendUrl = process.env.FRONTEND_URL;
  const originalNodeEnv = process.env.NODE_ENV;
  t.after(() => {
    __resetPasswordResetServiceDependenciesForTesting();
    if (originalFrontendUrl === undefined) {
      delete process.env.FRONTEND_URL;
    } else {
      process.env.FRONTEND_URL = originalFrontendUrl;
    }
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });
  delete process.env.FRONTEND_URL;
  process.env.NODE_ENV = 'production';
  const parent = { _id: createId('parent-local'), email: 'local@example.com', username: 'local', password: 'old-secret' };
  const { emailSender } = setup({ parents: [parent] });

  await requestPasswordReset('local@example.com');

  const email = emailSender.mock.calls[0].arguments[0];
  assert.match(email.text, /https:\/\/wimmel-welt\.de\/passwort-zuruecksetzen\?token=/);
  assert.doesNotMatch(email.text, /localhost/);
  assert.match(email.html, /Passwort zurücksetzen/);
  assert.match(email.html, /background:linear-gradient\(160deg,#1a4a8a 0%,#2d6cb4 30%,#e88ca5 70%,#f5c542 100%\)/);
});

test('resetPassword rejects invalid and expired tokens', async (t) => {
  t.after(__resetPasswordResetServiceDependenciesForTesting);
  const expiredToken = 'expired-token';
  const parent = {
    _id: createId('parent-1'),
    email: 'parent@example.com',
    username: 'parent',
    password: 'old-secret',
    passwordReset: {
      tokenHash: await bcrypt.hash(expiredToken, 10),
      expiresAt: new Date(Date.now() - 1000),
      requestedAt: new Date(Date.now() - 31 * 60 * 1000),
      usedAt: null,
    },
  };
  setup({ parents: [parent] });

  await assert.rejects(() => resetPassword('wrong-token', 'new-secret'), { message: RESET_PASSWORD_INVALID_MESSAGE, status: 400 });
  await assert.rejects(() => resetPassword(expiredToken, 'new-secret'), { message: RESET_PASSWORD_INVALID_MESSAGE, status: 400 });
});

test('resetPassword stores a new hashed password, removes token, and allows login', async (t) => {
  t.after(() => {
    __resetPasswordResetServiceDependenciesForTesting();
    __resetAuthServiceCollectionsForTesting();
  });
  const rawToken = 'valid-token';
  const caregiver = {
    _id: createId('caregiver-1'),
    email: 'care@example.com',
    username: 'caregiver',
    password: await bcrypt.hash('old-secret', 10),
    passwordReset: {
      tokenHash: await bcrypt.hash(rawToken, 10),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      requestedAt: new Date(),
      usedAt: null,
    },
  };
  const { parentsCollection, caregiversCollection } = setup({ caregivers: [caregiver] });
  __setAuthServiceCollectionsForTesting({ parents: parentsCollection, caregivers: caregiversCollection });

  const result = await resetPassword(rawToken, 'new-secret');

  assert.equal(result.message, RESET_PASSWORD_SUCCESS_MESSAGE);
  assert.equal(caregiver.passwordReset, undefined);
  assert.ok(caregiver.passwordUpdatedAt instanceof Date);
  assert.notEqual(caregiver.password, 'new-secret');
  assert.equal(await bcrypt.compare('new-secret', caregiver.password), true);

  const loggedIn = await authenticateUser('care@example.com', 'new-secret');
  assert.equal(loggedIn.role, 'caregiver');
  await assert.rejects(() => resetPassword(rawToken, 'another-secret'), { message: RESET_PASSWORD_INVALID_MESSAGE });
});
