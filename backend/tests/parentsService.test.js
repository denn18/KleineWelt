import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createParent,
  __setParentsCollectionForTesting,
  __resetParentsCollectionForTesting,
} from '../src/services/parentsService.js';

function createId(value) {
  return { toString: () => value };
}

test('createParent persists a sanitized parent profile', async (t) => {
  t.after(__resetParentsCollectionForTesting);

  const insertedDocuments = [];

  const parentsCollection = {
    findOne: t.mock.fn(async () => null),
    insertOne: t.mock.fn(async (document) => {
      insertedDocuments.push(document);
      return { insertedId: createId('parent-new') };
    }),
  };

  __setParentsCollectionForTesting(parentsCollection);

  const payload = {
    firstName: ' Anna ',
    lastName: ' Muster ',
    email: 'anna@example.com',
    phone: '12345',
    postalCode: '10115',
    username: ' annasmith ',
    password: 'secret',
    children: [
      { name: ' Emma ', age: '4', notes: ' liebt Musik ' },
      { name: ' ', age: '1', notes: '' },
    ],
  };

  const result = await createParent(payload);

  assert.equal(result.id, 'parent-new');
  assert.equal(result.email, 'anna@example.com');
  assert.equal(result.firstName, 'Anna');
  assert.equal(result.children.length, 1);
  assert.equal(insertedDocuments.length, 1);
  assert.equal(parentsCollection.insertOne.mock.callCount(), 1);
});

test('createParent rejects duplicate email or username', async (t) => {
  t.after(__resetParentsCollectionForTesting);

  const parentsCollection = {
    findOne: t.mock.fn(async () => ({ _id: createId('existing') })),
    insertOne: t.mock.fn(),
  };

  __setParentsCollectionForTesting(parentsCollection);

  await assert.rejects(
    () =>
      createParent({
        email: 'existing@example.com',
        phone: '555',
        postalCode: '10115',
        username: 'existing',
        password: 'secret',
      }),
    (error) => {
      assert.equal(error.status, 409);
      assert.match(error.message, /Elternprofil/);
      return true;
    },
  );

  assert.equal(parentsCollection.insertOne.mock.callCount(), 0);
});

test('createParent validates required fields', async (t) => {
  t.after(__resetParentsCollectionForTesting);

  const parentsCollection = {
    findOne: t.mock.fn(),
    insertOne: t.mock.fn(),
  };

  __setParentsCollectionForTesting(parentsCollection);

  await assert.rejects(
    () => createParent({ email: 'missing@example.com' }),
    (error) => {
      assert.equal(error.status, 400);
      assert.match(error.message, /Missing required fields/);
      return true;
    },
  );

  assert.equal(parentsCollection.findOne.mock.callCount(), 0);
  assert.equal(parentsCollection.insertOne.mock.callCount(), 0);
});
