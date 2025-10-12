import test from 'node:test';
import assert from 'node:assert/strict';
import {
  authenticateUser,
  __setAuthServiceCollectionsForTesting,
  __resetAuthServiceCollectionsForTesting,
} from '../src/services/authService.js';

function createId(value) {
  return { toString: () => value };
}

test('authenticateUser returns the parent profile when credentials match a parent', async (t) => {
  t.after(__resetAuthServiceCollectionsForTesting);

  const parentDocument = {
    _id: createId('parent-1'),
    email: 'parent@example.com',
    username: 'parenty',
    password: 'topsecret',
  };

  const parentsCollection = {
    findOne: t.mock.fn(async () => parentDocument),
  };
  const caregiversCollection = {
    findOne: t.mock.fn(async () => null),
  };

  __setAuthServiceCollectionsForTesting({ parents: parentsCollection, caregivers: caregiversCollection });

  const result = await authenticateUser('parent@example.com', 'topsecret');

  assert.equal(result.id, 'parent-1');
  assert.equal(result.email, 'parent@example.com');
  assert.equal(result.role, 'parent');
  assert.equal(parentsCollection.findOne.mock.callCount(), 1);
  assert.equal(caregiversCollection.findOne.mock.callCount(), 0);
});

test('authenticateUser falls back to caregivers when parent password is incorrect', async (t) => {
  t.after(__resetAuthServiceCollectionsForTesting);

  const parentDocument = {
    _id: createId('parent-1'),
    email: 'family@example.com',
    username: 'family',
    password: 'different',
  };
  const caregiverDocument = {
    _id: createId('caregiver-1'),
    email: 'family@example.com',
    username: 'family',
    password: 'care-secret',
  };

  const parentsCollection = {
    findOne: t.mock.fn(async () => parentDocument),
  };
  const caregiversCollection = {
    findOne: t.mock.fn(async () => caregiverDocument),
  };

  __setAuthServiceCollectionsForTesting({ parents: parentsCollection, caregivers: caregiversCollection });

  const result = await authenticateUser('family@example.com', 'care-secret');

  assert.equal(result.id, 'caregiver-1');
  assert.equal(result.role, 'caregiver');
  assert.equal(parentsCollection.findOne.mock.callCount(), 1);
  assert.equal(caregiversCollection.findOne.mock.callCount(), 1);
});

test('authenticateUser throws a 401 error when credentials do not match', async (t) => {
  t.after(__resetAuthServiceCollectionsForTesting);

  const parentsCollection = {
    findOne: t.mock.fn(async () => null),
  };
  const caregiversCollection = {
    findOne: t.mock.fn(async () => null),
  };

  __setAuthServiceCollectionsForTesting({ parents: parentsCollection, caregivers: caregiversCollection });

  await assert.rejects(() => authenticateUser('unknown@example.com', 'nope'), (error) => {
    assert.equal(error.status, 401);
    assert.equal(error.message, 'Ungültige Zugangsdaten.');
    return true;
  });

  assert.equal(parentsCollection.findOne.mock.callCount(), 1);
  assert.equal(caregiversCollection.findOne.mock.callCount(), 1);
});
