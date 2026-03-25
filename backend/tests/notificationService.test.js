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

  const [{ html, text, subject }] = sendEmailMock.mock.calls[0].arguments;
  assert.match(subject, /Neue Nachricht von/);
  assert.match(text, /Wimmel Welt \(Testsignatur\)/);
  assert.match(html, /Direkt zu deinen Nachrichten/);
});

test('notifyRecipientOfMessage sends email even when conversation already has unread messages', async (t) => {
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

  assert.equal(result, true);
  assert.equal(sendEmailMock.mock.callCount(), 1);
  assert.equal(sendPushMock.mock.callCount(), 1);
});

test('notifyRecipientOfMessage sends email when no push subscription exists (offline fallback)', async (t) => {
  t.after(__resetNotificationMessagesCollectionForTesting);
  t.after(__resetNotificationServiceDependenciesForTesting);

  const sendEmailMock = t.mock.fn(async () => true);
  const sendPushMock = t.mock.fn(async () => false);

  __setNotificationMessagesCollectionForTesting({
    countDocuments: t.mock.fn(async () => 4),
  });
  __setNotificationServiceDependenciesForTesting({
    findUserById: t.mock.fn(async (userId) => ({
      id: userId,
      email: `${userId}@example.com`,
      firstName: userId,
    })),
    sendEmail: sendEmailMock,
    sendWebPushNotification: sendPushMock,
    listPushSubscriptionsForUser: t.mock.fn(async () => []),
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

test('notifyRecipientOfMessage sends email when no push subscription exists (offline fallback)', async (t) => {
  t.after(__resetNotificationMessagesCollectionForTesting);
  t.after(__resetNotificationServiceDependenciesForTesting);

  const sendEmailMock = t.mock.fn(async () => true);
  const sendPushMock = t.mock.fn(async () => false);

  __setNotificationMessagesCollectionForTesting({
    countDocuments: t.mock.fn(async () => 4),
  });
  __setNotificationServiceDependenciesForTesting({
    findUserById: t.mock.fn(async (userId) => ({
      id: userId,
      email: `${userId}@example.com`,
      firstName: userId,
    })),
    sendEmail: sendEmailMock,
    sendWebPushNotification: sendPushMock,
    listPushSubscriptionsForUser: t.mock.fn(async () => []),
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
