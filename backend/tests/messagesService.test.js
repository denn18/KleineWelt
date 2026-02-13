import test from 'node:test';
import assert from 'node:assert/strict';
import {
  listConversationsForUser,
  listMessages,
  sendMessage,
  __setMessagesCollectionForTesting,
  __resetMessagesCollectionForTesting,
} from '../src/services/messagesService.js';

function createId(value) {
  return { toString: () => value };
}

test('sendMessage validates required fields', async (t) => {
  t.after(__resetMessagesCollectionForTesting);

  const messagesCollection = {
    insertOne: t.mock.fn(),
    findOne: t.mock.fn(async () => null),
  };

  __setMessagesCollectionForTesting(messagesCollection);

  await assert.rejects(
    () => sendMessage({ conversationId: 'conv', senderId: 'a', recipientId: '', body: 'hi' }),
    (error) => {
      assert.equal(error.status, 400);
      assert.match(error.message, /Missing required message fields/);
      return true;
    },
  );

  assert.equal(messagesCollection.insertOne.mock.callCount(), 0);
});

test('sendMessage stores participants without duplicates', async (t) => {
  t.after(__resetMessagesCollectionForTesting);

  const inserted = [];
  const messagesCollection = {
    findOne: t.mock.fn(async () => null),
    insertOne: t.mock.fn(async (document) => {
      inserted.push(document);
      return { insertedId: createId('msg-1') };
    }),
  };

  __setMessagesCollectionForTesting(messagesCollection);

  const result = await sendMessage({
    conversationId: 'user-1--user-2',
    senderId: 'user-1',
    recipientId: 'user-2',
    body: 'Hallo!',
  });

  assert.equal(result.id, 'msg-1');
  assert.deepEqual(inserted[0].participants, ['user-1', 'user-2']);
  assert.equal(inserted[0].conversationId, 'user-1--user-2');
});

test('listConversationsForUser returns the latest message per conversation ordered by recency', async (t) => {
  t.after(__resetMessagesCollectionForTesting);

  const now = new Date();
  const documents = [
    {
      _id: createId('second'),
      conversationId: 'conv-2',
      participants: ['user-1', 'user-3'],
      createdAt: new Date(now.getTime() - 60_000),
      body: 'Bis später!',
    },
    {
      _id: createId('first'),
      conversationId: 'conv-1',
      participants: ['user-1', 'user-2'],
      createdAt: new Date(now.getTime() - 30_000),
      body: 'Hallo zurück',
    },
  ];

  const aggregateMock = t.mock.fn(() => ({
    toArray: async () => documents,
  }));

  const messagesCollection = {
    aggregate: aggregateMock,
  };

  __setMessagesCollectionForTesting(messagesCollection);

  const result = await listConversationsForUser('user-1');

  assert.deepEqual(result.map((message) => message.id), ['second', 'first']);

  const pipeline = aggregateMock.mock.calls[0].arguments[0];
  assert.equal(pipeline[0].$match.participants, 'user-1');
  assert.equal(pipeline[1].$sort.createdAt, -1);
});

test('listMessages throws 403 when user is not part of existing conversation', async (t) => {
  t.after(__resetMessagesCollectionForTesting);

  const messagesCollection = {
    findOne: t.mock.fn(async (query) => {
      if (query.participants) {
        return null;
      }

      return { _id: createId('x'), conversationId: 'conv-1', participants: ['user-a', 'user-b'] };
    }),
  };

  __setMessagesCollectionForTesting(messagesCollection);

  await assert.rejects(
    () => listMessages({ conversationId: 'conv-1', userId: 'user-c' }),
    (error) => {
      assert.equal(error.status, 403);
      return true;
    },
  );
});
