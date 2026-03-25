import { findUserById } from './usersService.js';
import { sendEmail } from './emailService.js';
import { sendWebPushNotification } from './webPushService.js';
import { messagesCollection } from '../models/Message.js';
import { listPushSubscriptionsForUser } from './pushSubscriptionsService.js';

let dependencies = {
  findUserById,
  sendEmail,
  sendWebPushNotification,
  listPushSubscriptionsForUser,
};
let messagesCollectionOverride = null;

function getMessagesCollection() {
  return messagesCollectionOverride ?? messagesCollection();
}

function buildDisplayName(user) {
  const parts = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
  return parts || user?.daycareName || user?.name || 'Ein Mitglied von Kleine Welt';
}

export async function notifyRecipientOfMessage({ recipientId, senderId, conversationId }) {
  try {
    const unreadCount = await getMessagesCollection().countDocuments({
      conversationId,
      participants: recipientId,
      senderId: { $ne: recipientId },
      readBy: { $ne: recipientId },
    });
    const pushSubscriptions = await dependencies.listPushSubscriptionsForUser(recipientId);
    const hasPushSubscriptions = Array.isArray(pushSubscriptions) && pushSubscriptions.length > 0;
    const shouldSendEmail = unreadCount === 1 || !hasPushSubscriptions;

    const [recipient, sender] = await Promise.all([
      dependencies.findUserById(recipientId),
      dependencies.findUserById(senderId),
    ]);

    if (!recipient) {
      return false;
    }

    const senderName = buildDisplayName(sender ?? {});
    const recipientName = buildDisplayName(recipient);

    const text = [
      `Hallo ${recipientName},`,
      '',
      `${senderName} hat dir eine neue Nachricht auf Wimmel Welt gesendet.`,
      '',
      'Du hast eine neue Nachricht erhalten.',
      'Direkt öffnen: https://www.wimmel-welt.de/nachrichten',
      '',
      'Herzliche Grüße',
      'Dein Wimmel Welt Team',
      '',
      '---',
      'Wimmel Welt (Testsignatur)',
      'support@wimmel-welt.de',
    ]
      .filter(Boolean)
      .join('\n');

    const subject = `Neue Nachricht von ${senderName}`;

    const pushPayload = {
      title: 'Neue Nachricht von Wimmel Welt',
      body: `${senderName} hat dir geschrieben.`,
      url: `/nachrichten/${senderId}`,
      icon: '/hero-family.svg',
      badge: '/hero-family.svg',
      tag: `message:${conversationId}`,
    };

    const tasks = [
      shouldSendEmail && recipient.email
        ? dependencies.sendEmail({
            to: recipient.email,
            subject,
            text,
          })
        : Promise.resolve(false),
      dependencies.sendWebPushNotification({
        userId: recipientId,
        payload: pushPayload,
      }),
    ];

    const [emailResult] = await Promise.allSettled(tasks);
    return emailResult.status === 'fulfilled' ? emailResult.value : false;
  } catch (error) {
    console.error('Benachrichtigung über neue Nachricht fehlgeschlagen:', error);
    return false;
  }
}

export function __setNotificationServiceDependenciesForTesting(overrides = {}) {
  dependencies = {
    ...dependencies,
    ...overrides,
  };
}

export function __resetNotificationServiceDependenciesForTesting() {
  dependencies = {
    findUserById,
    sendEmail,
    sendWebPushNotification,
    listPushSubscriptionsForUser,
  };
}

export function __setNotificationMessagesCollectionForTesting(collection) {
  messagesCollectionOverride = collection ?? null;
}

export function __resetNotificationMessagesCollectionForTesting() {
  messagesCollectionOverride = null;
}
