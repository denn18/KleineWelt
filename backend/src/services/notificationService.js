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

  const text = [
    `Hallo ${recipientName},`,
    '',
    intro,
    '',
    'Herzliche Grüße',
    'Dein Wimmel Welt Team',
    '',
    '--',
    'Dennie Scharton - Wimmel Welt',
    'Founder',
    'E-Mail: info@wimmel-welt.de',
    'Telefon: +49 176 80852142',
    'Web: www.wimmel-welt.de',
  ].join('\n');

  const html = [
    '<div style="font-family: Arial, Helvetica, sans-serif; color: #1f2937; line-height: 1.5;">',
    `<p style="margin: 0 0 12px;">Hallo ${recipientName},</p>`,
    `<p style="margin: 0 0 16px;">${intro}</p>`,
    '<p style="margin: 0 0 24px;">Herzliche Grüße<br />Dein Wimmel Welt Team</p>',
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; width: 100%; max-width: 720px; border: 1px solid #d1d5db;">',
    '<tr>',
    '<td style="padding: 16px; border-bottom: 1px solid #d1d5db;">',
    '<div style="font-size: 32px; font-weight: 700; color: #111827;">Dennie Scharton - Wimmel Welt</div>',
    '<div style="display: inline-block; margin-top: 10px; background: #c7d2fe; color: #111827; border-radius: 12px; padding: 10px 16px; font-size: 20px;">Founder</div>',
    '</td>',
    '</tr>',
    '<tr>',
    '<td style="padding: 16px;">',
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; width: 100%;">',
    '<tr>',
    '<td style="padding: 10px; border: 1px dashed #9ca3af;">',
    '<a href="mailto:info@wimmel-welt.de" style="text-decoration: none; color: #111827; font-size: 18px;">✉️ info@wimmel-welt.de</a>',
    '</td>',
    '<td style="padding: 10px; border: 1px dashed #9ca3af;">',
    '<a href="tel:+4917680852142" style="text-decoration: none; color: #111827; font-size: 18px;">📱 +49 176 80852142</a>',
    '</td>',
    '<td rowspan="2" style="padding: 10px; border: 1px dashed #9ca3af; text-align: center; width: 220px;">',
    '<img src="https://www.wimmel-welt.de/hero-family.svg" alt="Wimmel Welt" width="180" height="135" style="display: inline-block; border: 0;" />',
    '</td>',
    '</tr>',
    '<tr>',
    '<td style="padding: 10px; border: 1px dashed #9ca3af;">',
    '<a href="https://www.wimmel-welt.de" style="text-decoration: none; color: #111827; font-size: 18px;">🌐 www.wimmel-welt.de</a>',
    '</td>',
    '<td style="padding: 10px; border: 1px dashed #9ca3af;"></td>',
    '</tr>',
    '</table>',
    '</td>',
    '</tr>',
    '</table>',
    '</div>',
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

    if (!recipientEmail) {
      console.warn('Nachrichten-Benachrichtigung ohne E-Mail-Empfänger übersprungen.', {
        recipientId,
        recipientRole: recipient.role ?? null,
        recipientEmailRaw: recipient.email ?? null,
      });
    }

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
