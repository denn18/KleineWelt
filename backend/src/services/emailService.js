import nodemailer from 'nodemailer';

function parseRecipients(recipients) {
  if (!recipients) {
    return [];
  }
  if (Array.isArray(recipients)) {
    return recipients.map((entry) => `${entry}`.trim()).filter((entry) => entry);
  }
  return `${recipients}`
    .split(/[,;\s]+/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function buildTransportConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number.parseInt(process.env.SMTP_PORT ?? '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const username = process.env.SMTP_USER;
  const password = process.env.SMTP_PASS;

  const config = {
    host,
    port,
    secure,
  };

  if (username && password) {
    config.auth = {
      user: username,
      pass: password,
    };
  }

  return {
    config,
    host,
    port,
    secure,
    username,
  };
}

export async function sendEmail({ to, subject, text, html }) {
  const recipients = parseRecipients(to);
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const { config, host, port, secure, username } = buildTransportConfig();

  if (!host || !from || recipients.length === 0) {
    console.warn('E-Mail-Benachrichtigung übersprungen.', {
      reason: 'smtp_not_configured_or_missing_recipient',
      smtpHostConfigured: Boolean(host),
      smtpFromConfigured: Boolean(from),
      smtpAuthConfigured: Boolean(username && process.env.SMTP_PASS),
      recipientCount: recipients.length,
      port,
      secure,
    });
    return false;
  }

  const transporter = nodemailer.createTransport(config);

  try {
    await transporter.sendMail({
      from,
      to: recipients.join(', '),
      subject: (subject ?? '').replace(/\r?\n/g, ' '),
      text: text ?? undefined,
      html: html ?? undefined,
    });

    console.info('E-Mail-Benachrichtigung erfolgreich versendet.', {
      host,
      port,
      secure,
      recipientCount: recipients.length,
    });
    return true;
  } catch (error) {
    console.error('Versand der Benachrichtigungs-E-Mail fehlgeschlagen.', {
      host,
      port,
      secure,
      recipientCount: recipients.length,
      errorMessage: error instanceof Error ? error.message : `${error}`,
    });
    return false;
  }
}
