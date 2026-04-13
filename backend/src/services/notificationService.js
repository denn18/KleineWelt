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
  const intro = `Du hast eine neue Nachricht von ${senderName} erhalten. Logge dich ein, um die Nachricht zu lesen und zu antworten.`;

  const text = [
    `Hallo ${recipientName},`,
    '',
    intro,
    '',
    'Herzliche Grüße',
    'Dein Wimmel Welt Team',
    '',
    '--',
    'Wimmel Welt - Kindertagespflegevermittlung',
    'support',
    'E-Mail: info@wimmel-welt.de',
    'Telefon: +49 176 80852142',
    'Web: www.wimmel-welt.de',
  ].join('\n');

  const html = [
    '<div style="margin:0;padding:0;background-color:#f0f4f8;">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f4f8;padding:32px 16px;font-family:Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif;">',
    '<tr>',
    '<td align="center">',
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.12);">',
    '<tr>',
    '<td style="background:linear-gradient(160deg,#1a4a8a 0%,#2d6cb4 30%,#e88ca5 70%,#f5c542 100%);padding:48px 32px 82px;text-align:center;">',
    '<img src="https://www.wimmel-welt.de/ww-weiss.png" alt="Wimmel Welt" width="128" height="128" style="display:block;margin:0 auto 16px;border:0;border-radius:24px;box-shadow:0 8px 24px rgba(0,0,0,0.2);" />',
    '<h1 style="margin:0 0 4px;color:#ffffff;font-size:38px;line-height:1.2;font-weight:800;letter-spacing:-0.5px;">Wimmel Welt</h1>',
    '<p style="margin:0;color:rgba(255,255,255,0.75);font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;">Kindertagespflegevermittlung</p>',
    '</td>',
    '</tr>',
    '<tr>',
    '<td style="padding:0 20px;">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:-48px;background-color:#ffffff;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.06);">',
    '<tr>',
    '<td style="padding:32px 28px;">',
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">',
    '<tr>',
    '<td style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#2d6cb4,#4a8fd4);text-align:center;vertical-align:middle;font-size:16px;line-height:36px;">💬</td>',
    '<td style="padding-left:8px;font-size:13px;font-weight:600;color:#2d6cb4;">Neue Nachricht erhalten</td>',
    '</tr>',
    '</table>',
    `<h2 style="margin:0 0 12px;color:#1a2d42;font-size:20px;line-height:1.3;font-weight:700;letter-spacing:-0.3px;">Hallo ${recipientName} 👋</h2>`,
    `<p style="margin:0 0 24px;color:#5a6b7d;font-size:15px;line-height:1.75;">${intro}</p>`,
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#f0f6ff 0%,#fdf2f4 100%);border-radius:12px;">',
    '<tr>',
    '<td style="padding:16px 20px;">',
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0">',
    '<tr>',
    '<td style="font-size:20px;vertical-align:middle;padding-right:12px;">📨</td>',
    '<td style="font-size:13px;color:#5a6b7d;line-height:1.6;">Du kannst direkt auf die Nachricht antworten, sobald du eingeloggt bist.</td>',
    '</tr>',
    '</table>',
    '</td>',
    '</tr>',
    '</table>',
    '</td>',
    '</tr>',
    '</table>',
    '</td>',
    '</tr>',
    '<tr>',
    '<td style="padding:24px 28px 28px;text-align:center;">',
    '<p style="margin:0 0 20px;color:#8a96a3;font-size:14px;line-height:1.6;">Herzliche Grüße,<br /><strong style="color:#1a2d42;">Dein Wimmel Welt Team</strong></p>',
    '<hr style="border:none;height:1px;background:linear-gradient(90deg,transparent,#e0e7ef,transparent);margin:0 0 16px;" />',
    '<p style="margin:0 0 4px;color:#b0b8c4;font-size:11px;line-height:1.6;">info@wimmel-welt.de · +49 176 80852142</p>',
    '<p style="margin:0;font-size:11px;color:#b0b8c4;"><a href="https://www.wimmel-welt.de" style="color:#2d6cb4;text-decoration:none;font-weight:500;">www.wimmel-welt.de</a></p>',
    '</td>',
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
