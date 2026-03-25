import test from 'node:test';
import assert from 'node:assert/strict';

import {
  notifyRecipientOfMessage,
  __resetNotificationServiceDependenciesForTesting,
  __resetNotificationMessagesCollectionForTesting,
  __setNotificationServiceDependenciesForTesting,
  __setNotificationMessagesCollectionForTesting,
} from '../src/services/notificationService.js';

test('notifyRecipientOfMessage sends email for first unread message', async (t) => {
  t.after(__resetNotificationMessagesCollectionForTesting);
  t.after(__resetNotificationServiceDependenciesForTesting);

  const sendEmailMock = t.mock.fn(async () => true);
  const sendPushMock = t.mock.fn(async () => true);

  __setNotificationMessagesCollectionForTesting({
    countDocuments: t.mock.fn(async () => 1),
  });
  __setNotificationServiceDependenciesForTesting({
    findUserById: t.mock.fn(async (userId) => ({
      id: userId,
      email: `${userId}@example.com`,
      firstName: userId,
    })),
    sendEmail: sendEmailMock,
    sendWebPushNotification: sendPushMock,
    listPushSubscriptionsForUser: t.mock.fn(async () => [{ endpoint: 'https://push.test' }]),
  });

  const result = await notifyRecipientOfMessage({
    recipientId: 'empfaenger',
    senderId: 'absender',
    conversationId: 'conv-1',
  });

  assert.equal(result, true);
  assert.equal(sendEmailMock.mock.callCount(), 1);
  assert.equal(sendPushMock.mock.callCount(), 1);
});

test('notifyRecipientOfMessage suppresses email when conversation is already unread and push exists', async (t) => {
  t.after(__resetNotificationMessagesCollectionForTesting);
  t.after(__resetNotificationServiceDependenciesForTesting);

  const sendEmailMock = t.mock.fn(async () => true);
  const sendPushMock = t.mock.fn(async () => true);

  __setNotificationMessagesCollectionForTesting({
    countDocuments: t.mock.fn(async () => 3),
  });
  __setNotificationServiceDependenciesForTesting({
    findUserById: t.mock.fn(async (userId) => ({
      id: userId,
      email: `${userId}@example.com`,
      firstName: userId,
    })),
    sendEmail: sendEmailMock,
    sendWebPushNotification: sendPushMock,
    listPushSubscriptionsForUser: t.mock.fn(async () => [{ endpoint: 'https://push.test' }]),
  });

  const result = await notifyRecipientOfMessage({
    recipientId: 'empfaenger',
    senderId: 'absender',
    conversationId: 'conv-1',
  });

  assert.equal(result, false);
  assert.equal(sendEmailMock.mock.callCount(), 0);
  assert.equal(sendPushMock.mock.callCount(), 1);
});
