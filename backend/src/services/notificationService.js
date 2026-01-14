import { findUserById } from './usersService.js';
import { sendEmail } from './emailService.js';

function buildDisplayName(user) {
  const parts = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
  return parts || user?.daycareName || user?.name || 'Ein Mitglied von Kleine Welt';
}

export async function notifyRecipientOfMessage({ recipientId, senderId, messageBody, conversationId }) {
  try {
    const [recipient, sender] = await Promise.all([
      findUserById(recipientId),
      findUserById(senderId),
    ]);

    if (!recipient || !recipient.email) {
      return false;
    }

    const senderName = buildDisplayName(sender ?? {});
    const recipientName = buildDisplayName(recipient);
    const preview = (messageBody ?? '').replace(/\s+/g, ' ').trim().slice(0, 180);

    const textPreview = preview.length ? `"${preview}${preview.length === 180 ? '…' : ''}"` : '';

    const text = [
      `Hallo ${recipientName},`,
      '',
      `${senderName} hat dir eine neue Nachricht auf Kleine Welt gesendet.`,
      textPreview ? `\n${textPreview}\n` : '',
      'Du kannst direkt in deinem Familienzentrum antworten: https://app.kleine-welt.local/familienzentrum',
      '',
      'Herzliche Grüße',
      'Dein Kleine Welt Team',
    ]
      .filter(Boolean)
      .join('\n');

    const subject = `Neue Nachricht von ${senderName}`;

    return sendEmail({
      to: recipient.email,
      subject,
      text,
    });
  } catch (error) {
    console.error('Benachrichtigung über neue Nachricht fehlgeschlagen:', error);
    return false;
  }
}
