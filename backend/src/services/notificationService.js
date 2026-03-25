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
  return parts || user?.daycareName || user?.name || 'Ein Mitglied von Wimmel Welt';
}

function resolveRecipientEmail(user) {
  const profileEmail = `${user?.email ?? ''}`.trim();
  if (profileEmail) {
    return profileEmail;
  }
  return null;
}

function buildMessageEmail({ recipientName, senderName }) {
  const intro = `${senderName} hat dir eine neue Nachricht auf Wimmel Welt gesendet.`;
  const cta = 'Direkt öffnen: https://www.wimmel-welt.de/nachrichten';

  const text = [
    `Hallo ${recipientName},`,
    '',
    intro,
    '',
    'Du hast eine neue Nachricht erhalten.',
    cta,
    '',
    'Herzliche Grüße',
    'Dein Wimmel Welt Team',
    '',
    '--',
    'Wimmel Welt (Testsignatur)',
    'support@wimmel-welt.de',
  ].join('\n');

  const html = [
    `<p>Hallo ${recipientName},</p>`,
    `<p>${intro}</p>`,
    '<p>Du hast eine neue Nachricht erhalten.</p>',
    '<p><a href="https://www.wimmel-welt.de/nachrichten">Direkt zu deinen Nachrichten</a></p>',
    '<p>Herzliche Grüße<br />Dein Wimmel Welt Team</p>',
    '<hr />',
    '<p><strong>Wimmel Welt (Testsignatur)</strong><br /><a href="mailto:support@wimmel-welt.de">support@wimmel-welt.de</a></p>',
  ].join('');

  return { text, html };
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

    // Für den aktuellen Testbetrieb: immer eine E-Mail bei jeder neuen Nachricht senden.
    // Web Push bleibt parallel aktiv.
    const shouldSendEmail = unreadCount >= 1 || !hasPushSubscriptions;

    const [recipient, sender] = await Promise.all([
      dependencies.findUserById(recipientId),
      dependencies.findUserById(senderId),
    ]);

    if (!recipient) {
      return false;
    }

    const senderName = buildDisplayName(sender ?? {});
    const recipientName = buildDisplayName(recipient);
    const recipientEmail = resolveRecipientEmail(recipient);
    const { text, html } = buildMessageEmail({ recipientName, senderName });
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
      shouldSendEmail && recipientEmail
        ? dependencies.sendEmail({
            to: recipientEmail,
            subject,
            text,
            html,
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
